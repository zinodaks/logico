import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transportersApi } from '../api/transporters';

export default function Transporters() {
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useQuery({ queryKey: ['transporters'], queryFn: transportersApi.list });

  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'CDF'>('USD');

  const createMutation = useMutation({
    mutationFn: transportersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transporters'] });
      setName('');
      setCost('');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      transportersApi.update(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transporters'] }),
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !cost) return;
    createMutation.mutate({ name: name.trim(), fixedTransportCost: Number(cost), currency });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Transporters</h1>

      <form onSubmit={handleCreate} className="flex flex-wrap gap-2 mb-6 items-end">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Fixed cost (per container)</label>
          <input
            type="number"
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded w-32"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as 'USD' | 'CDF')}
            className="px-3 py-2 border border-gray-300 rounded"
          >
            <option value="USD">USD</option>
            <option value="CDF">CDF</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Fixed cost (per container)</th>
              <th className="px-4 py-2">Status</th>
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
            {items?.map((t) => (
              <tr key={t._id} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  <Link to={`/transporters/${t._id}`} className="text-blue-600 underline">
                    {t.name}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  {t.fixedTransportCost.toFixed(2)} {t.currency}
                </td>
                <td className="px-4 py-2">{t.active ? 'Active' : 'Deactivated'}</td>
                <td className="px-4 py-2 text-right space-x-3">
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
  );
}
