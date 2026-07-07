import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getFile, toggleFileStep, updateFileStatus } from '../api/files';
import { listPayments } from '../api/payments';
import { getFileProfitability } from '../api/finance';

type Tab = 'overview' | 'checklist' | 'payments' | 'profitability';

export default function FileDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');

  const { data: file, isLoading } = useQuery({
    queryKey: ['files', id],
    queryFn: () => getFile(id!),
    enabled: !!id,
  });

  const toggleStepMutation = useMutation({
    mutationFn: (stepIndex: number) => toggleFileStep(id!, stepIndex),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files', id] }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: 'open' | 'closed') => updateFileStatus(id!, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files', id] }),
  });

  const { data: filePayments } = useQuery({
    queryKey: ['payments', { file: id }],
    queryFn: () => listPayments({ file: id! }),
    enabled: !!id && tab === 'payments',
  });

  const { data: profitability } = useQuery({
    queryKey: ['file-profitability', id],
    queryFn: () => getFileProfitability(id!),
    enabled: !!id && tab === 'profitability',
  });

  if (isLoading || !file) return <p className="text-gray-400">Loading…</p>;

  const allStepsComplete = file.steps.length > 0 && file.steps.every((s) => s.completed);

  return (
    <div>
      <div className="flex justify-between items-start mb-2">
        <h1 className="text-2xl font-semibold text-gray-800">{file.reference}</h1>
        <div className="flex items-center gap-3">
          <span className={`text-sm capitalize ${file.status === 'open' ? 'text-green-600' : 'text-gray-500'}`}>
            {file.status}
          </span>
          <button
            onClick={() => statusMutation.mutate(file.status === 'open' ? 'closed' : 'open')}
            className="text-blue-600 underline text-sm"
          >
            Mark as {file.status === 'open' ? 'complete' : 'reopened'}
          </button>
        </div>
      </div>
      <p className="text-gray-500 mb-6">
        {file.client.name} · {file.processType} · BL {file.blNumber}
      </p>

      {allStepsComplete && file.status === 'open' && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded px-4 py-2 mb-6">
          All checklist steps are complete. Consider marking this file as complete.
        </div>
      )}

      <div className="flex gap-4 border-b border-gray-200 mb-6">
        {(['overview', 'checklist', 'payments', 'profitability'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-1 capitalize ${tab === t ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Shipping Line</dt>
              <dd>{file.shippingLine}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Nature of Goods</dt>
              <dd>{file.natureOfGoods}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Containers</dt>
              <dd>{file.containers.map((c) => `${c.quantity}x ${c.type}'`).join(', ')}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Agent</dt>
              <dd>{file.agent.name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Transporter</dt>
              <dd>
                {file.transporter.name} ({file.transportCost.amount.toFixed(2)} {file.transportCost.currency})
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Selling Price</dt>
              <dd>
                {file.sellingPrice.amount.toFixed(2)} {file.sellingPrice.currency}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Caution</dt>
              <dd className="capitalize">
                {file.caution.type} — {file.caution.amount.toFixed(2)} {file.caution.currency}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {tab === 'checklist' && (
        <div className="bg-white rounded-lg shadow p-6 max-w-lg">
          {file.steps.length === 0 && <p className="text-gray-400">No steps defined for {file.processType}.</p>}
          <ol className="space-y-3">
            {file.steps.map((step, index) => (
              <li key={index} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={step.completed}
                  onChange={() => toggleStepMutation.mutate(index)}
                  className="w-4 h-4"
                />
                <span className={step.completed ? 'line-through text-gray-400' : ''}>{step.name}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {tab === 'payments' && (
        <div className="bg-white rounded-lg shadow overflow-hidden max-w-3xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left text-gray-600">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Payment Type</th>
                <th className="px-4 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filePayments?.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-gray-400" colSpan={5}>
                    No payments recorded for this file yet.
                  </td>
                </tr>
              )}
              {filePayments?.map((p) => (
                <tr key={p._id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{new Date(p.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2 capitalize">{p.direction.replace('_', ' ')}</td>
                  <td className="px-4 py-2">
                    {p.amount.toFixed(2)} {p.currency}
                  </td>
                  <td className="px-4 py-2">{p.paymentType?.name}</td>
                  <td className="px-4 py-2">{p.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'profitability' && profitability && (
        <div className="bg-white rounded-lg shadow p-6 max-w-xl">
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`text-xs px-2 py-0.5 rounded ${profitability.realized ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
            >
              {profitability.realized ? 'Realized' : 'Projected'}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Selling Price</dt>
              <dd>
                {profitability.sellingPrice.toFixed(2)} {profitability.currency}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Expenses</dt>
              <dd>
                {(profitability.expenses[profitability.currency] ?? 0).toFixed(2)} {profitability.currency}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Profit</dt>
              <dd className={profitability.profit >= 0 ? 'text-green-700' : 'text-red-700'}>
                {profitability.profit.toFixed(2)} {profitability.currency}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Balance due from client</dt>
              <dd>
                {profitability.balanceDue.toFixed(2)} {profitability.currency}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Outstanding transport cost</dt>
              <dd>
                {profitability.outstandingTransportCost.toFixed(2)} {profitability.transportCost.currency}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
