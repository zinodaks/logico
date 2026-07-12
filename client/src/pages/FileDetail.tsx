import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fileStatementUrl, getFile, toggleFileStep, updateFileStatus, updateFileTransporter } from '../api/files';
import { listPayments } from '../api/payments';
import { getFileProfitability } from '../api/finance';
import { transportersApi } from '../api/transporters';
import { CREDIT_DIRECTIONS, DIRECTION_LABELS, PaymentForm } from '../components/PaymentForm';
import { formatDate } from '../lib/formatDate';

type Tab = 'overview' | 'checklist' | 'ledger' | 'profitability';

export default function FileDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [changingTransporter, setChangingTransporter] = useState(false);
  const [newTransporter, setNewTransporter] = useState('');

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

  const transporterMutation = useMutation({
    mutationFn: (transporterId: string) => updateFileTransporter(id!, transporterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', id] });
      queryClient.invalidateQueries({ queryKey: ['file-profitability', id] });
      setChangingTransporter(false);
    },
  });

  const { data: transporters } = useQuery({
    queryKey: ['transporters'],
    queryFn: () => transportersApi.list(),
    enabled: changingTransporter,
  });

  const { data: filePayments } = useQuery({
    queryKey: ['payments', { file: id }],
    queryFn: () => listPayments({ file: id!, limit: '1000' }),
    enabled: !!id && tab === 'ledger',
  });

  const { data: profitability } = useQuery({
    queryKey: ['file-profitability', id],
    queryFn: () => getFileProfitability(id!),
    enabled: !!id,
  });

  if (isLoading || !file) return <p className="text-gray-400">Loading…</p>;

  const allStepsComplete = file.steps.length > 0 && file.steps.every((s) => s.completed);

  const ledgerRows = filePayments?.map((p) => ({
    ...p,
    credit: CREDIT_DIRECTIONS.includes(p.direction) ? p.amount : 0,
    debit: CREDIT_DIRECTIONS.includes(p.direction) ? 0 : p.amount,
  }));
  const totalCredit = ledgerRows?.reduce((sum, r) => sum + r.credit, 0) ?? 0;
  const totalDebit = ledgerRows?.reduce((sum, r) => sum + r.debit, 0) ?? 0;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
        <h1 className="text-2xl font-semibold text-gray-800 break-all">{file.blNumber}</h1>
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
      <p className="text-gray-500 mb-2">
        {file.client.name} · {file.processType}
      </p>

      {file.status === 'closed' && profitability && (
        <div className="flex flex-wrap gap-2 mb-4">
          {profitability.balanceDue > 0 && (
            <span className="inline-block bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded">
              Pending balance payment
            </span>
          )}
          {profitability.outstandingTransportCost > 0 && (
            <span className="inline-block bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded">
              Pending transporter payment
            </span>
          )}
          {profitability.caution.type === 'actual' && profitability.caution.outstandingToCollect > 0 && (
            <span className="inline-block bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded">
              Pending caution refund
            </span>
          )}
        </div>
      )}

      {profitability && (
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="bg-white rounded-lg shadow px-4 py-3">
            <p className="text-xs text-gray-500">File cash balance</p>
            <p className="text-lg font-semibold text-gray-800">
              {profitability.cashBalance.USD.toFixed(2)} USD / {profitability.cashBalance.CDF.toFixed(2)} CDF
            </p>
          </div>
          <div className="bg-white rounded-lg shadow px-4 py-3">
            <p className="text-xs text-gray-500">Remaining to collect from client</p>
            <p className="text-lg font-semibold text-gray-800">
              {profitability.balanceDue.toFixed(2)} {profitability.currency}
            </p>
          </div>
          {profitability.caution.type === 'actual' && profitability.caution.outstandingToCollect > 0 && (
            <div className="bg-white rounded-lg shadow px-4 py-3 border-2 border-yellow-300">
              <p className="text-xs text-gray-500">Caution to collect from shipping line</p>
              <p className="text-lg font-semibold text-yellow-700">
                {profitability.caution.outstandingToCollect.toFixed(2)} {profitability.caution.currency}
              </p>
            </div>
          )}
        </div>
      )}

      {allStepsComplete && file.status === 'open' && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded px-4 py-2 mb-6">
          All checklist steps are complete. Consider marking this file as complete.
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-2 border-b border-gray-200 mb-6">
        {(['overview', 'checklist', 'ledger', 'profitability'] as Tab[]).map((t) => (
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
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Shipping Line</dt>
              <dd>{file.shippingLine}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Nature of Goods</dt>
              <dd>{file.natureOfGoods}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500">Containers</dt>
              <dd>{file.containers.map((c) => `${c.number} (${c.type}')`).join(', ')}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Agent</dt>
              <dd>{file.agent.name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Transporter</dt>
              <dd>
                {changingTransporter ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={newTransporter}
                      onChange={(e) => setNewTransporter(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="">Select…</option>
                      {transporters?.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name} ({t.fixedTransportCost} {t.currency}/container × {file.containers.length} ={' '}
                          {t.fixedTransportCost * file.containers.length} {t.currency})
                        </option>
                      ))}
                    </select>
                    <button
                      className="text-blue-600 underline text-xs"
                      onClick={() => newTransporter && transporterMutation.mutate(newTransporter)}
                    >
                      Save
                    </button>
                    <button className="text-gray-500 underline text-xs" onClick={() => setChangingTransporter(false)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    {file.transporter.name} ({file.transportCost.amount.toFixed(2)} {file.transportCost.currency})
                    {file.status === 'open' && (
                      <button
                        className="ml-2 text-blue-600 underline text-xs"
                        onClick={() => setChangingTransporter(true)}
                      >
                        Change
                      </button>
                    )}
                  </>
                )}
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

      {tab === 'ledger' && (
        <div>
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <div className="flex flex-wrap gap-3">
              <a href={fileStatementUrl(file._id, 'pdf')} className="text-blue-600 underline text-sm">
                Export client statement (PDF)
              </a>
              <a href={fileStatementUrl(file._id, 'xlsx')} className="text-blue-600 underline text-sm">
                Export client statement (Excel)
              </a>
            </div>
            <button
              onClick={() => setShowPaymentForm((v) => !v)}
              className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 text-sm"
            >
              {showPaymentForm ? 'Cancel' : 'Record payment'}
            </button>
          </div>

          {showPaymentForm && (
            <PaymentForm
              lockedFileId={file._id}
              defaultAgentId={file.agent._id}
              defaultTransporterId={file.transporter._id}
              onSuccess={() => setShowPaymentForm(false)}
              onCancel={() => setShowPaymentForm(false)}
            />
          )}

          <div className="bg-white rounded-lg shadow overflow-x-auto max-w-3xl">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-100 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Payment Type</th>
                  <th className="px-4 py-2 text-right">Receipts (credit)</th>
                  <th className="px-4 py-2 text-right">Payments (debit)</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows?.length === 0 && (
                  <tr>
                    <td className="px-4 py-3 text-gray-400" colSpan={5}>
                      No payments recorded for this file yet.
                    </td>
                  </tr>
                )}
                {ledgerRows?.map((r) => (
                  <tr key={r._id} className="border-t border-gray-100">
                    <td className="px-4 py-2">{formatDate(r.date)}</td>
                    <td className="px-4 py-2">{DIRECTION_LABELS[r.direction]}</td>
                    <td className="px-4 py-2">{r.paymentType?.name}</td>
                    <td className="px-4 py-2 text-right">{r.credit ? `${r.credit.toFixed(2)} ${r.currency}` : ''}</td>
                    <td className="px-4 py-2 text-right">{r.debit ? `${r.debit.toFixed(2)} ${r.currency}` : ''}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 font-medium">
                  <td className="px-4 py-2" colSpan={3}>
                    Totals
                  </td>
                  <td className="px-4 py-2 text-right">{totalCredit.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{totalDebit.toFixed(2)}</td>
                </tr>
                <tr className="font-medium">
                  <td className="px-4 py-2" colSpan={3}>
                    Balance (credit − debit)
                  </td>
                  <td className="px-4 py-2 text-right" colSpan={2}>
                    {(totalCredit - totalDebit).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {tab === 'profitability' && profitability && (
        <div className="space-y-6 max-w-xl">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`text-xs px-2 py-0.5 rounded ${profitability.realized ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
              >
                {profitability.realized ? 'Realized' : 'Projected'}
              </span>
            </div>
            <dl className="text-sm divide-y divide-gray-100">
              <div className="flex justify-between py-2">
                <dt className="text-gray-500">Selling price</dt>
                <dd>
                  {profitability.sellingPrice.toFixed(2)} {profitability.currency}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-gray-500">Expenses</dt>
                <dd>
                  − {(profitability.expenses[profitability.currency] ?? 0).toFixed(2)} {profitability.currency}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-gray-500">Outstanding transport cost</dt>
                <dd>
                  − {profitability.outstandingTransportCost.toFixed(2)} {profitability.transportCost.currency}
                </dd>
              </div>
              {profitability.caution.type === 'actual' && profitability.caution.deposited > 0 && (
                <>
                  <div className="flex justify-between py-2">
                    <dt className="text-gray-500">Actual caution paid</dt>
                    <dd>
                      − {profitability.caution.deposited.toFixed(2)} {profitability.caution.currency}
                    </dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-gray-500">Caution to be refunded</dt>
                    <dd>
                      + {profitability.caution.deposited.toFixed(2)} {profitability.caution.currency}
                    </dd>
                  </div>
                </>
              )}
              <div className="flex justify-between py-2 font-medium">
                <dt>Profit</dt>
                <dd className={profitability.profit >= 0 ? 'text-green-700' : 'text-red-700'}>
                  {profitability.profit.toFixed(2)} {profitability.currency}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Other figures</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Balance due from client</dt>
                <dd>
                  {profitability.balanceDue.toFixed(2)} {profitability.currency}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">File cash balance</dt>
                <dd>
                  {profitability.cashBalance.USD.toFixed(2)} USD / {profitability.cashBalance.CDF.toFixed(2)} CDF
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Caution</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Type</dt>
                <dd className="capitalize">{profitability.caution.type}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Quoted amount</dt>
                <dd>
                  {profitability.caution.amount.toFixed(2)} {profitability.caution.currency}
                </dd>
              </div>
              {profitability.caution.type === 'actual' && (
                <>
                  <div>
                    <dt className="text-gray-500">Paid to shipping line</dt>
                    <dd>
                      {profitability.caution.deposited.toFixed(2)} {profitability.caution.currency}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Refunded so far</dt>
                    <dd>
                      {profitability.caution.refunded.toFixed(2)} {profitability.caution.currency}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-gray-500">Still to collect from shipping line</dt>
                    <dd
                      className={
                        profitability.caution.outstandingToCollect > 0 ? 'text-yellow-700 font-medium' : 'text-gray-700'
                      }
                    >
                      {profitability.caution.outstandingToCollect.toFixed(2)} {profitability.caution.currency}
                      {profitability.caution.outstandingToCollect > 0 ? ' — pending refund' : ' — settled'}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
