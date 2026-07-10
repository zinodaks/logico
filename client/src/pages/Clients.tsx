import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient, listClients } from '../api/clients';

export default function Clients() {
  const queryClient = useQueryClient();
  const { data: clients, isLoading } = useQuery({ queryKey: ['clients'], queryFn: listClients });

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [rccm, setRccm] = useState('');
  const [identificationNationale, setIdentificationNationale] = useState('');
  const [nif, setNif] = useState('');
  const [showForm, setShowForm] = useState(false);

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setName('');
      setAddress('');
      setRccm('');
      setIdentificationNationale('');
      setNif('');
      setShowForm(false);
    },
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;
    createMutation.mutate({ name, address, rccm, identificationNationale, nif });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Clients</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          {showForm ? 'Cancel' : 'New client'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-6 mb-6 max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Address</label>
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">RCCM</label>
            <input
              value={rccm}
              onChange={(e) => setRccm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Identification Nationale</label>
            <input
              value={identificationNationale}
              onChange={(e) => setIdentificationNationale(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">NIF</label>
            <input
              value={nif}
              onChange={(e) => setNif(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <div className="col-span-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
            >
              Create client
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Address</th>
              <th className="px-4 py-2">RCCM</th>
              <th className="px-4 py-2">Status</th>
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
            {clients?.map((c) => (
              <tr key={c._id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link to={`/clients/${c._id}`} className="text-blue-600 underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-2">{c.address}</td>
                <td className="px-4 py-2">{c.rccm}</td>
                <td className="px-4 py-2">{c.active ? 'Active' : 'Deactivated'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
