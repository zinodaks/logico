import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deletePayment, listPayments } from '../api/payments';
import { DIRECTION_LABELS, PaymentForm } from '../components/PaymentForm';

export default function Payments() {
  const queryClient = useQueryClient();
  const [directionFilter, setDirectionFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const filters: Record<string, string> = {};
  if (directionFilter) filters.direction = directionFilter;

  const { data: payments, isLoading } = useQuery({ queryKey: ['payments', filters], queryFn: () => listPayments(filters) });

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

      <div className="mb-4">
        <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded">
          <option value="">All categories</option>
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
              <th className="px-4 py-2">Category</th>
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
                <td className="px-4 py-2">{p.file?.blNumber ?? '—'}</td>
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
