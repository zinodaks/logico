import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface NamedEntity {
  _id: string;
  name: string;
  active: boolean;
}

interface Props {
  title: string;
  queryKey: string;
  api: {
    list: () => Promise<NamedEntity[]>;
    create: (input: { name: string }) => Promise<NamedEntity>;
    update: (id: string, input: { active: boolean }) => Promise<NamedEntity>;
  };
}

export function NamedEntityPage({ title, queryKey, api }: Props) {
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useQuery({ queryKey: [queryKey], queryFn: api.list });
  const [name, setName] = useState('');

  const createMutation = useMutation({
    mutationFn: api.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setName('');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => api.update(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim() });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">{title}</h1>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="px-3 py-2 border border-gray-300 rounded flex-1 max-w-sm"
        />
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-4 py-3 text-gray-400" colSpan={3}>
                  Loading…
                </td>
              </tr>
            )}
            {items?.map((item) => (
              <tr key={item._id} className="border-t border-gray-100">
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2">{item.active ? 'Active' : 'Deactivated'}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    className="text-blue-600 underline"
                    onClick={() =>
                      toggleActiveMutation.mutate({ id: item._id, active: !item.active })
                    }
                  >
                    {item.active ? 'Deactivate' : 'Reactivate'}
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
