import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getCashBalance, getActualCautionsReport } from '../api/finance';
import { listFiles } from '../api/files';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: balance } = useQuery({ queryKey: ['finance-balance'], queryFn: getCashBalance });
  const { data: openFiles } = useQuery({ queryKey: ['files', { status: 'open' }], queryFn: () => listFiles({ status: 'open' }) });
  const { data: cautions } = useQuery({ queryKey: ['cautions-actual'], queryFn: getActualCautionsReport });

  const outstandingCautions = cautions?.filter((c) => c.paid && !c.refunded) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-6">Welcome, {user?.name}.</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Cash balance (USD)</p>
          <p className="text-2xl font-semibold text-gray-800">{(balance?.USD ?? 0).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Cash balance (CDF)</p>
          <p className="text-2xl font-semibold text-gray-800">{(balance?.CDF ?? 0).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Open files</p>
          <p className="text-2xl font-semibold text-gray-800">{openFiles?.length ?? 0}</p>
        </div>
      </div>

      {outstandingCautions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded px-4 py-3">
          <p className="font-medium mb-1">{outstandingCautions.length} outstanding actual caution deposit(s)</p>
          <p className="text-sm">Cash currently locked at shipping lines, pending refund on container return.</p>
        </div>
      )}
    </div>
  );
}
