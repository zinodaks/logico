import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProfitTransfer, deleteProfitTransfer, listProfitTransfers } from '../api/profitTransfers';
import { getCashBalance } from '../api/finance';
import { formatDate } from '../lib/formatDate';

export default function ProfitTransfers() {
  const queryClient = useQueryClient();
  const { data: transfers, isLoading } = useQuery({ queryKey: ['profit-transfers'], queryFn: listProfitTransfers });
  const { data: balance } = useQuery({ queryKey: ['finance-balance'], queryFn: getCashBalance });

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'CDF'>('USD');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createProfitTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profit-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['finance-balance'] });
      setAmount('');
      setNotes('');
      setError(null);
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Could not record transfer';
      setError(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfitTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profit-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['finance-balance'] });
    },
  });

  function handleSubmit() {
    setError(null);
    if (!amount || Number(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    createMutation.mutate({ amount: Number(amount), currency, notes: notes || undefined });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Profit Transfers</h1>
      <p className="text-gray-500 mb-6">
        Transfers of profit from the business to your personal account. These reduce the cash balance shown on the
        dashboard (currently {(balance?.USD ?? 0).toFixed(2)} USD / {(balance?.CDF ?? 0).toFixed(2)} CDF).
      </p>

      <div className="bg-white rounded-lg shadow p-6 mb-6 max-w-md space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Amount</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
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
          <label className="block text-sm text-gray-600 mb-1">Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
        </div>
        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {createMutation.isPending ? 'Recording…' : 'Record transfer'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto max-w-2xl">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Notes</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-4 py-3 text-gray-400" colSpan={4}>
                  Loading…
                </td>
              </tr>
            )}
            {transfers?.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-gray-400" colSpan={4}>
                  No transfers recorded yet.
                </td>
              </tr>
            )}
            {transfers?.map((t) => (
              <tr key={t._id} className="border-t border-gray-100">
                <td className="px-4 py-2">{formatDate(t.date)}</td>
                <td className="px-4 py-2">
                  {t.amount.toFixed(2)} {t.currency}
                </td>
                <td className="px-4 py-2">{t.notes}</td>
                <td className="px-4 py-2 text-right">
                  <button className="text-red-600 underline" onClick={() => deleteMutation.mutate(t._id)}>
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
