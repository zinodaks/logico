import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deletePayment, listPaymentsPage, type PaymentDirection } from '../api/payments';
import { listFiles } from '../api/files';
import { paymentTypesApi, listPaymentTypesByCategory } from '../api/paymentTypes';
import { CREDIT_DIRECTIONS, DIRECTION_LABELS, PaymentForm } from '../components/PaymentForm';

const PAGE_SIZE = 60;
const selectClass = 'w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white';
const labelClass = 'block text-xs font-medium text-gray-500 mb-1';

export default function Payments() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const [directionFilter, setDirectionFilter] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('');
  const [fileFilter, setFileFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [directionFilter, paymentTypeFilter, fileFilter, dateFrom, dateTo]);

  useEffect(() => {
    setPaymentTypeFilter('');
  }, [directionFilter]);

  const filters: Record<string, string> = {};
  if (directionFilter) filters.direction = directionFilter;
  if (paymentTypeFilter) filters.paymentType = paymentTypeFilter;
  if (fileFilter) filters.file = fileFilter;
  if (dateFrom) filters.from = dateFrom;
  if (dateTo) filters.to = dateTo;
  const hasActiveFilters = Object.keys(filters).length > 0;

  function clearFilters() {
    setDirectionFilter('');
    setPaymentTypeFilter('');
    setFileFilter('');
    setDateFrom('');
    setDateTo('');
  }

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['payments', filters, page],
    queryFn: () => listPaymentsPage({ ...filters, page: String(page), limit: String(PAGE_SIZE) }),
  });
  const payments = pageData?.items;
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const { data: files } = useQuery({ queryKey: ['files-all'], queryFn: () => listFiles() });
  const { data: paymentTypes } = useQuery({
    queryKey: ['payment-types', directionFilter || 'all'],
    queryFn: () => (directionFilter ? listPaymentTypesByCategory(directionFilter as PaymentDirection) : paymentTypesApi.list()),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['finance-balance'] });
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Payments</h1>
        <button onClick={() => setShowForm((v) => !v)} className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800">
          {showForm ? 'Cancel' : 'Record payment'}
        </button>
      </div>

      {showForm && <PaymentForm onSuccess={() => setShowForm(false)} />}

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className={labelClass}>Category</label>
            <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)} className={selectClass}>
              <option value="">All categories</option>
              {Object.entries(DIRECTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Payment type</label>
            <select value={paymentTypeFilter} onChange={(e) => setPaymentTypeFilter(e.target.value)} className={selectClass}>
              <option value="">All payment types</option>
              {paymentTypes?.map((pt) => (
                <option key={pt._id} value={pt._id}>
                  {pt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>File</label>
            <select value={fileFilter} onChange={(e) => setFileFilter(e.target.value)} className={selectClass}>
              <option value="">All files</option>
              {files?.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.blNumber} — {f.client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectClass} />
          </div>

          <div>
            <label className={labelClass}>To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectClass} />
          </div>
        </div>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="mt-3 text-sm text-blue-600 underline">
            Clear filters
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">File</th>
              <th className="px-4 py-2">Payment Type</th>
              <th className="px-4 py-2">Notes</th>
              <th className="px-4 py-2 text-right">Receipts (credit)</th>
              <th className="px-4 py-2 text-right">Payments (debit)</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-4 py-3 text-gray-400" colSpan={8}>
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && payments?.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-gray-400" colSpan={8}>
                  No payments match these filters.
                </td>
              </tr>
            )}
            {payments?.map((p) => {
              const isCredit = CREDIT_DIRECTIONS.includes(p.direction);
              return (
                <tr key={p._id} className={`border-t border-gray-100 ${isCredit ? 'bg-gray-200' : ''}`}>
                  <td className="px-4 py-2">{new Date(p.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{DIRECTION_LABELS[p.direction]}</td>
                  <td className="px-4 py-2">{p.file?.blNumber ?? '—'}</td>
                  <td className="px-4 py-2">{p.paymentType?.name}</td>
                  <td className="px-4 py-2">{p.notes}</td>
                  <td className="px-4 py-2 text-right">{isCredit ? `${p.amount.toFixed(2)} ${p.currency}` : ''}</td>
                  <td className="px-4 py-2 text-right">{!isCredit ? `${p.amount.toFixed(2)} ${p.currency}` : ''}</td>
                  <td className="px-4 py-2 text-right">
                    <button className="text-red-600 underline" onClick={() => deleteMutation.mutate(p._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <p>
          {total === 0 ? 'No results' : `Showing page ${page} of ${totalPages} (${total} total)`}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
