import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listFiles, type ShipmentFile } from '../api/files';
import { agentsApi } from '../api/agents';

function FilesTable({ files, emptyLabel }: { files: ShipmentFile[]; emptyLabel: string }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full text-sm min-w-[760px]">
        <thead className="bg-gray-100 text-left text-gray-600">
          <tr>
            <th className="px-4 py-2">BL Number</th>
            <th className="px-4 py-2">Client</th>
            <th className="px-4 py-2">Process</th>
            <th className="px-4 py-2">Agent</th>
            <th className="px-4 py-2">Transporter</th>
            <th className="px-4 py-2">Nature of goods</th>
          </tr>
        </thead>
        <tbody>
          {files.length === 0 ? (
            <tr>
              <td className="px-4 py-3 text-gray-400" colSpan={6}>
                {emptyLabel}
              </td>
            </tr>
          ) : (
            files.map((f) => (
              <tr key={f._id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link to={`/files/${f._id}`} className="text-blue-600 underline">
                    {f.blNumber}
                  </Link>
                </td>
                <td className="px-4 py-2">{f.client?.name}</td>
                <td className="px-4 py-2">{f.processType}</td>
                <td className="px-4 py-2">{f.agent?.name}</td>
                <td className="px-4 py-2">{f.transporter?.name}</td>
                <td className="px-4 py-2">{f.natureOfGoods}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function Files() {
  const [processType, setProcessType] = useState('');
  const [agent, setAgent] = useState('');
  const [natureOfGoods, setNatureOfGoods] = useState('');

  const { data: agents } = useQuery({ queryKey: ['agents'], queryFn: () => agentsApi.list() });

  const filters: Record<string, string> = {};
  if (processType) filters.processType = processType;
  if (agent) filters.agent = agent;

  const { data: files, isLoading } = useQuery({
    queryKey: ['files', filters],
    queryFn: () => listFiles(filters),
  });

  // Distinct nature-of-goods values from the loaded files, for the filter dropdown.
  const natureOptions = Array.from(new Set((files ?? []).map((f) => f.natureOfGoods))).sort((a, b) =>
    a.localeCompare(b),
  );

  // The server already orders files by first-entry date; filtering and splitting preserve that order.
  const visibleFiles = natureOfGoods ? (files ?? []).filter((f) => f.natureOfGoods === natureOfGoods) : files ?? [];
  const openFiles = visibleFiles.filter((f) => f.status === 'open');
  const closedFiles = visibleFiles.filter((f) => f.status === 'closed');

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Files</h1>
        <Link to="/files/new" className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800">
          New file
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={processType}
          onChange={(e) => setProcessType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        >
          <option value="">All processes</option>
          <option value="IM4">IM4</option>
          <option value="TR8">TR8</option>
        </select>
        <select value={agent} onChange={(e) => setAgent(e.target.value)} className="px-3 py-2 border border-gray-300 rounded">
          <option value="">All agents</option>
          {agents?.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={natureOfGoods}
          onChange={(e) => setNatureOfGoods(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        >
          <option value="">All goods</option>
          {natureOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Open files</h2>
            <FilesTable files={openFiles} emptyLabel="No open files." />
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Closed files</h2>
            <FilesTable files={closedFiles} emptyLabel="No closed files." />
          </section>
        </div>
      )}
    </div>
  );
}
