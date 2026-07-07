import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPayment, deletePayment, listPayments, type PaymentDirection } from '../api/payments';
import { listFiles } from '../api/files';
import { agentsApi } from '../api/agents';
import { transportersApi } from '../api/transporters';
import { paymentTypesApi } from '../api/paymentTypes';

const DIRECTION_LABELS: Record<PaymentDirection, string> = {
  client_payment: 'Client payment (income)',
  agent_payment: 'Agent payment',
  transporter_payment: 'Transporter payment',
  generic_expense: 'Generic file expense',
  business_expense: 'Business expense (no file)',
  caution_deposit: 'Caution deposit paid',
  caution_refund: 'Caution refund received',
};

export default function Payments() {
  const queryClient = useQueryClient();
  const [directionFilter, setDirectionFilter] = useState('');
  const filters: Record<string, string> = {};
  if (directionFilter) filters.direction = directionFilter;

  const { data: payments, isLoading } = useQuery({ queryKey: ['payments', filters], queryFn: () => listPayments(filters) });
  const { data: files } = useQuery({ queryKey: ['files-all'], queryFn: () => listFiles() });
  const { data: agents } = useQuery({ queryKey: ['agents'], queryFn: agentsApi.list });
  const { data: transporters } = useQuery({ queryKey: ['transporters'], queryFn: transportersApi.list });
  const { data: paymentTypes } = useQuery({ queryKey: ['payment-types'], queryFn: paymentTypesApi.list });

  const [showForm, setShowForm] = useState(false);
  const [direction, setDirection] = useState<PaymentDirection>('client_payment');
  const [file, setFile] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'CDF'>('USD');
  const [paymentType, setPaymentType] = useState('');
  const [agent, setAgent] = useState('');
  const [transporter, setTransporter] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['finance-balance'] });
      setAmount('');
      setNotes('');
      setShowForm(false);
      setError(null);
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Could not record payment';
      setError(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['finance-balance'] });
    },
  });

  function handleSubmit() {
    setError(null);
    if (!amount || !paymentType || !currency) {
      setError('Please fill in all required fields');
      return;
    }
    if (direction !== 'business_expense' && !file) {
      setError('A file is required for this payment type');
      return;
    }
    if (direction === 'agent_payment' && !agent) {
      setError('An agent is required for agent payments');
      return;
    }
    if (direction === 'transporter_payment' && !transporter) {
      setError('A transporter is required for transporter payments');
      return;
    }
    createMutation.mutate({
      direction,
      file: direction === 'business_expense' ? undefined : file,
      amount: Number(amount),
      currency,
      paymentType,
      agent: direction === 'agent_payment' ? agent : undefined,
      transporter: direction === 'transporter_payment' ? transporter : undefined,
      notes: notes || undefined,
    });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Payments</h1>
        <button onClick={() => setShowForm((v) => !v)} className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800">
          {showForm ? 'Cancel' : 'Record payment'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 max-w-2xl space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div>
            <label className="block text-sm text-gray-600 mb-1">Type</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as PaymentDirection)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              {Object.entries(DIRECTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {direction !== 'business_expense' && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">File</label>
              <select value={file} onChange={(e) => setFile(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded">
                <option value="">Select a file…</option>
                {files?.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.reference} — {f.client.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {direction === 'agent_payment' && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Agent</label>
              <select value={agent} onChange={(e) => setAgent(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded">
                <option value="">Select an agent…</option>
                {agents?.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {direction === 'transporter_payment' && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Transporter</label>
              <select
                value={transporter}
                onChange={(e) => setTransporter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">Select a transporter…</option>
                {transporters?.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value as 'USD' | 'CDF')} className="w-full px-3 py-2 border border-gray-300 rounded">
                <option value="USD">USD</option>
                <option value="CDF">CDF</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Payment Type</label>
            <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded">
              <option value="">Select a payment type…</option>
              {paymentTypes?.map((pt) => (
                <option key={pt._id} value={pt._id}>
                  {pt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
          </div>

          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Saving…' : 'Save payment'}
          </button>
        </div>
      )}

      <div className="mb-4">
        <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded">
          <option value="">All types</option>
          {Object.entries(DIRECTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">File</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Payment Type</th>
              <th className="px-4 py-2">Notes</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-4 py-3 text-gray-400" colSpan={7}>
                  Loading…
                </td>
              </tr>
            )}
            {payments?.map((p) => (
              <tr key={p._id} className="border-t border-gray-100">
                <td className="px-4 py-2">{new Date(p.date).toLocaleDateString()}</td>
                <td className="px-4 py-2">{DIRECTION_LABELS[p.direction]}</td>
                <td className="px-4 py-2">{p.file?.reference ?? '—'}</td>
                <td className="px-4 py-2">
                  {p.amount.toFixed(2)} {p.currency}
                </td>
                <td className="px-4 py-2">{p.paymentType?.name}</td>
                <td className="px-4 py-2">{p.notes}</td>
                <td className="px-4 py-2 text-right">
                  <button className="text-red-600 underline" onClick={() => deleteMutation.mutate(p._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
