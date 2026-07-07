import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clientDocumentDownloadUrl,
  deleteClientDocument,
  getClient,
  updateClient,
  uploadClientDocument,
} from '../api/clients';

type Tab = 'info' | 'documents';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('info');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: client, isLoading } = useQuery({
    queryKey: ['clients', id],
    queryFn: () => getClient(id!),
    enabled: !!id,
  });

  const [form, setForm] = useState<Record<string, string>>({});

  const updateMutation = useMutation({
    mutationFn: (input: Record<string, string>) => updateClient(id!, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients', id] }),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadClientDocument(id!, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients', id] }),
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) => deleteClientDocument(id!, docId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients', id] }),
  });

  if (isLoading || !client) return <p className="text-gray-400">Loading…</p>;

  function startEdit() {
    setForm({
      name: client!.name,
      address: client!.address,
      rccm: client!.rccm ?? '',
      identificationNationale: client!.identificationNationale ?? '',
      nif: client!.nif ?? '',
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">{client.name}</h1>
      <p className="text-gray-500 mb-6">{client.active ? 'Active' : 'Deactivated'}</p>

      <div className="flex gap-4 border-b border-gray-200 mb-6">
        {(['info', 'documents'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-1 capitalize ${
              tab === t ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="bg-white rounded-lg shadow p-6 max-w-xl">
          {Object.keys(form).length === 0 ? (
            <>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Address</dt>
                  <dd>{client.address}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">RCCM</dt>
                  <dd>{client.rccm || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Identification Nationale</dt>
                  <dd>{client.identificationNationale || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">NIF</dt>
                  <dd>{client.nif || '—'}</dd>
                </div>
              </dl>
              <button onClick={startEdit} className="mt-4 text-blue-600 underline text-sm">
                Edit
              </button>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate(form, { onSuccess: () => setForm({}) });
              }}
              className="grid grid-cols-2 gap-4"
            >
              {(['name', 'address', 'rccm', 'identificationNationale', 'nif'] as const).map((field) => (
                <div key={field} className={field === 'name' || field === 'address' ? 'col-span-2' : ''}>
                  <label className="block text-sm text-gray-600 mb-1 capitalize">{field}</label>
                  <input
                    value={form[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              ))}
              <div className="col-span-2 flex gap-2">
                <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800">
                  Save
                </button>
                <button type="button" onClick={() => setForm({})} className="text-gray-500 underline">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {tab === 'documents' && (
        <div>
          <div className="mb-4">
            <input ref={fileInputRef} type="file" onChange={handleFileChange} />
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-2">Filename</th>
                  <th className="px-4 py-2">Size</th>
                  <th className="px-4 py-2">Uploaded</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {client.documents.length === 0 && (
                  <tr>
                    <td className="px-4 py-3 text-gray-400" colSpan={4}>
                      No documents uploaded yet.
                    </td>
                  </tr>
                )}
                {client.documents.map((doc) => (
                  <tr key={doc._id} className="border-t border-gray-100">
                    <td className="px-4 py-2">{doc.filename}</td>
                    <td className="px-4 py-2">{(doc.size / 1024).toFixed(1)} KB</td>
                    <td className="px-4 py-2">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right space-x-3">
                      <a
                        href={clientDocumentDownloadUrl(client._id, doc._id)}
                        className="text-blue-600 underline"
                      >
                        Download
                      </a>
                      <button
                        className="text-red-600 underline"
                        onClick={() => deleteDocMutation.mutate(doc._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
