import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPayment, type PaymentDirection } from '../api/payments';
import { listFiles } from '../api/files';
import { agentsApi } from '../api/agents';
import { transportersApi } from '../api/transporters';
import { listPaymentTypesByCategory } from '../api/paymentTypes';

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

/** Directions that represent money coming in (receipts), for credit/debit ledger displays. */
export const CREDIT_DIRECTIONS: PaymentDirection[] = ['client_payment', 'caution_refund'];

export const DIRECTION_LABELS: Record<PaymentDirection, string> = {
  client_payment: 'Client payment (income)',
  agent_payment: 'Agent payment',
  transporter_payment: 'Transporter payment',
  generic_expense: 'Generic file expense',
  business_expense: 'Business expense (no file)',
  caution_deposit: 'Caution deposit paid',
  caution_refund: 'Caution refund received',
};

interface Props {
  /** When set, the payment is locked to this file and the file selector is hidden. */
  lockedFileId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentForm({ lockedFileId, onSuccess, onCancel }: Props) {
  const queryClient = useQueryClient();
  const { data: files } = useQuery({ queryKey: ['files-all'], queryFn: () => listFiles(), enabled: !lockedFileId });
  const { data: agents } = useQuery({ queryKey: ['agents'], queryFn: agentsApi.list });
  const { data: transporters } = useQuery({ queryKey: ['transporters'], queryFn: transportersApi.list });
  const directionOptions = Object.entries(DIRECTION_LABELS).filter(
    ([value]) => !lockedFileId || value !== 'business_expense',
  );

  const [direction, setDirection] = useState<PaymentDirection>('client_payment');
  const [file, setFile] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'CDF'>('USD');
  const [paymentType, setPaymentType] = useState('');
  const [agent, setAgent] = useState('');
  const [transporter, setTransporter] = useState('');
  const [date, setDate] = useState(todayIsoDate());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: paymentTypes } = useQuery({
    queryKey: ['payment-types', direction],
    queryFn: () => listPaymentTypesByCategory(direction),
  });

  useEffect(() => {
    setPaymentType('');
  }, [direction]);

  const createMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['finance-balance'] });
      if (lockedFileId) {
        queryClient.invalidateQueries({ queryKey: ['files', lockedFileId] });
        queryClient.invalidateQueries({ queryKey: ['file-profitability', lockedFileId] });
      }
      setAmount('');
      setNotes('');
      setDate(todayIsoDate());
      setError(null);
      onSuccess?.();
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Could not record payment';
      setError(message);
    },
  });

  function handleSubmit() {
    setError(null);
    const targetFile = lockedFileId ?? file;
    if (!amount || !paymentType || !currency) {
      setError('Please fill in all required fields');
      return;
    }
    if (direction !== 'business_expense' && !targetFile) {
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
      file: direction === 'business_expense' ? undefined : targetFile,
      amount: Number(amount),
      currency,
      paymentType,
      agent: direction === 'agent_payment' ? agent : undefined,
      transporter: direction === 'transporter_payment' ? transporter : undefined,
      date: date ? new Date(date).toISOString() : undefined,
      notes: notes || undefined,
    });
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6 max-w-2xl space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <label className="block text-sm text-gray-600 mb-1">Category</label>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value as PaymentDirection)}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        >
          {directionOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {!lockedFileId && direction !== 'business_expense' && (
        <div>
          <label className="block text-sm text-gray-600 mb-1">File</label>
          <select value={file} onChange={(e) => setFile(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded">
            <option value="">Select a file…</option>
            {files?.map((f) => (
              <option key={f._id} value={f._id}>
                {f.blNumber} — {f.client.name}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        {paymentTypes?.length === 0 && (
          <p className="text-xs text-gray-400 mt-1">
            No payment types defined for this category yet — add one on the Payment Types page.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {createMutation.isPending ? 'Saving…' : 'Save payment'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-gray-500 underline">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
