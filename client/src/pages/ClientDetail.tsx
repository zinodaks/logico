import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clientDocumentDownloadUrl,
  clientDocumentsZipUrl,
  clientStatementUrl,
  deleteClientDocument,
  getClient,
  updateClient,
  uploadClientDocument,
} from '../api/clients';
import { listFiles } from '../api/files';
import { getClientProfitability } from '../api/finance';
import { formatDate } from '../lib/formatDate';

type Tab = 'info' | 'documents' | 'files' | 'statement';

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
        {(['info', 'documents', 'files', 'statement'] as Tab[]).map((t) => (
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
          <div className="mb-4 flex items-center gap-4">
            <input ref={fileInputRef} type="file" onChange={handleFileChange} />
            {client.documents.length > 0 && (
              <a href={clientDocumentsZipUrl(client._id)} className="text-blue-600 underline text-sm">
                Download all as .zip
              </a>
            )}
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
                    <td className="px-4 py-2">{formatDate(doc.uploadedAt)}</td>
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

      {tab === 'files' && <ClientFilesTab clientId={client._id} />}

      {tab === 'statement' && (
        <div className="bg-white rounded-lg shadow p-6 max-w-md">
          <p className="text-gray-500 mb-4">Export a statement of this client's files, charges, and balances due.</p>
          <div className="flex gap-3">
            <a
              href={clientStatementUrl(client._id, 'pdf')}
              className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Download PDF
            </a>
            <a
              href={clientStatementUrl(client._id, 'xlsx')}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              Download Excel
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientFilesTab({ clientId }: { clientId: string }) {
  const { data: files } = useQuery({ queryKey: ['files', { client: clientId }], queryFn: () => listFiles({ client: clientId }) });
  const { data: profitability } = useQuery({
    queryKey: ['client-profitability', clientId],
    queryFn: () => getClientProfitability(clientId),
  });

  return (
    <div>
      {profitability && (
        <div className="bg-white rounded-lg shadow p-4 mb-4 flex gap-8 text-sm">
          <div>
            <span className="text-gray-500">Realized profit (USD): </span>
            <span className="font-medium">{profitability.realized.USD.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-500">Projected profit (USD): </span>
            <span className="font-medium">{profitability.projected.USD.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-500">Files: </span>
            <span className="font-medium">{profitability.fileCount}</span>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">BL Number</th>
              <th className="px-4 py-2">Process</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {files?.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-gray-400" colSpan={3}>
                  No files yet.
                </td>
              </tr>
            )}
            {files?.map((f) => (
              <tr key={f._id} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  <Link to={`/files/${f._id}`} className="text-blue-600 underline">
                    {f.blNumber}
                  </Link>
                </td>
                <td className="px-4 py-2">{f.processType}</td>
                <td className="px-4 py-2 capitalize">{f.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
