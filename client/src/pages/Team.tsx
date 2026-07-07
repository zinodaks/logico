import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createUser, listUsers, resetUserPassword, setUserActive } from '../api/users';

export default function Team() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: listUsers });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setName('');
      setEmail('');
      setPassword('');
      setFormError(null);
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not create user';
      setFormError(message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setUserActive(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate({ name, email, password });
  }

  function handleResetPassword(id: string) {
    const password = window.prompt('New password (min 8 characters):');
    if (!password) return;
    resetUserPassword(id, password);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Team</h1>

      <div className="bg-white rounded-lg shadow mb-8 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
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
            {users?.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.active ? 'Active' : 'Deactivated'}</td>
                <td className="px-4 py-2 text-right space-x-3">
                  <button
                    className="text-blue-600 underline"
                    onClick={() => handleResetPassword(u.id)}
                  >
                    Reset password
                  </button>
                  <button
                    className="text-blue-600 underline"
                    onClick={() =>
                      toggleActiveMutation.mutate({ id: u.id, active: !u.active })
                    }
                  >
                    {u.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Add team member</h2>
        <form onSubmit={handleCreate}>
          {formError && <p className="mb-4 text-sm text-red-600">{formError}</p>}
          <label className="block text-sm text-gray-600 mb-1">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mb-4 px-3 py-2 border border-gray-300 rounded"
          />
          <label className="block text-sm text-gray-600 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 px-3 py-2 border border-gray-300 rounded"
          />
          <label className="block text-sm text-gray-600 mb-1">Temporary password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-6 px-3 py-2 border border-gray-300 rounded"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Adding…' : 'Add member'}
          </button>
        </form>
      </div>
    </div>
  );
}
