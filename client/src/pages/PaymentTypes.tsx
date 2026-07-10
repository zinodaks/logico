import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentTypesApi } from '../api/paymentTypes';
import { DIRECTION_LABELS } from '../components/PaymentForm';
import type { PaymentDirection } from '../api/payments';

export default function PaymentTypes() {
  const queryClient = useQueryClient();
  const { data: types, isLoading } = useQuery({ queryKey: ['payment-types', 'all'], queryFn: () => paymentTypesApi.list() });

  const [category, setCategory] = useState<PaymentDirection>('client_payment');
  const [name, setName] = useState('');

  const createMutation = useMutation({
    mutationFn: paymentTypesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-types'] });
      setName('');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => paymentTypesApi.update(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payment-types'] }),
  });

  function handleCreate() {
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), category });
  }

  const byCategory = (Object.keys(DIRECTION_LABELS) as PaymentDirection[]).map((cat) => ({
    category: cat,
    items: types?.filter((t) => t.category === cat) ?? [],
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Payment Types</h1>
      <p className="text-gray-500 mb-6">
        Payment categories are fixed (they drive cash-flow direction); define your own payment types within each
        category.
      </p>

      <div className="bg-white rounded-lg shadow p-6 mb-8 max-w-lg">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Add payment type</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-sm text-gray-600 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PaymentDirection)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              {Object.entries(DIRECTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-sm text-gray-600 mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
          </div>
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {createMutation.isError && (
          <p className="text-sm text-red-600 mt-2">
            {(createMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
              'Could not create payment type'}
          </p>
        )}
      </div>

      {isLoading && <p className="text-gray-400">Loading…</p>}

      <div className="space-y-6">
        {byCategory.map(({ category: cat, items }) => (
          <div key={cat}>
            <h2 className="text-sm font-medium text-gray-600 mb-2">{DIRECTION_LABELS[cat]}</h2>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td className="px-4 py-3 text-gray-400">No payment types defined for this category yet.</td>
                    </tr>
                  )}
                  {items.map((t) => (
                    <tr key={t._id} className="border-t border-gray-100">
                      <td className="px-4 py-2">{t.name}</td>
                      <td className="px-4 py-2">{t.active ? 'Active' : 'Deactivated'}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          className="text-blue-600 underline"
                          onClick={() => toggleActiveMutation.mutate({ id: t._id, active: !t.active })}
                        >
                          {t.active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
