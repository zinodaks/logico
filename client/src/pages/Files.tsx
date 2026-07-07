import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listFiles } from '../api/files';

export default function Files() {
  const [status, setStatus] = useState('');
  const [processType, setProcessType] = useState('');

  const filters: Record<string, string> = {};
  if (status) filters.status = status;
  if (processType) filters.processType = processType;

  const { data: files, isLoading } = useQuery({
    queryKey: ['files', filters],
    queryFn: () => listFiles(filters),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Files</h1>
        <Link to="/files/new" className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800">
          New file
        </Link>
      </div>

      <div className="flex gap-4 mb-4">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={processType}
          onChange={(e) => setProcessType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        >
          <option value="">All processes</option>
          <option value="IM4">IM4</option>
          <option value="TR8">TR8</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">Reference</th>
              <th className="px-4 py-2">Client</th>
              <th className="px-4 py-2">BL Number</th>
              <th className="px-4 py-2">Process</th>
              <th className="px-4 py-2">Agent</th>
              <th className="px-4 py-2">Transporter</th>
              <th className="px-4 py-2">Status</th>
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
            {files?.map((f) => (
              <tr key={f._id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link to={`/files/${f._id}`} className="text-blue-600 underline">
                    {f.reference}
                  </Link>
                </td>
                <td className="px-4 py-2">{f.client?.name}</td>
                <td className="px-4 py-2">{f.blNumber}</td>
                <td className="px-4 py-2">{f.processType}</td>
                <td className="px-4 py-2">{f.agent?.name}</td>
                <td className="px-4 py-2">{f.transporter?.name}</td>
                <td className="px-4 py-2 capitalize">{f.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
