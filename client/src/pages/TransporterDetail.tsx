import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTransporterStatement, transporterStatementUrl, transportersApi } from '../api/transporters';

function formatTotals(totals: Record<string, number>): string {
  const parts = Object.entries(totals)
    .filter(([, amount]) => amount !== 0)
    .map(([currency, amount]) => `${amount.toFixed(2)} ${currency}`);
  return parts.length > 0 ? parts.join(', ') : '0.00';
}

export default function TransporterDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: transporter, isLoading: loadingTransporter } = useQuery({
    queryKey: ['transporters', id],
    queryFn: () => transportersApi.getOne(id!),
    enabled: !!id,
  });

  const { data: statement, isLoading: loadingStatement } = useQuery({
    queryKey: ['transporter-statement', id],
    queryFn: () => getTransporterStatement(id!),
    enabled: !!id,
  });

  if (loadingTransporter || !transporter) return <p className="text-gray-400">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">{transporter.name}</h1>
      <p className="text-gray-500 mb-6">
        {transporter.fixedTransportCost.toFixed(2)} {transporter.currency}/container ·{' '}
        {transporter.active ? 'Active' : 'Deactivated'}
      </p>

      <div className="flex gap-3 mb-6">
        <a href={transporterStatementUrl(transporter._id, 'pdf')} className="text-blue-600 underline text-sm">
          Export PDF
        </a>
        <a href={transporterStatementUrl(transporter._id, 'xlsx')} className="text-blue-600 underline text-sm">
          Export Excel
        </a>
      </div>

      <h2 className="text-lg font-medium text-gray-700 mb-3">Statement</h2>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">Client</th>
              <th className="px-4 py-2">BL Number</th>
              <th className="px-4 py-2 text-right">Cost</th>
              <th className="px-4 py-2 text-right">Paid</th>
              <th className="px-4 py-2 text-right">Balance Owed</th>
            </tr>
          </thead>
          <tbody>
            {loadingStatement && (
              <tr>
                <td className="px-4 py-3 text-gray-400" colSpan={5}>
                  Loading…
                </td>
              </tr>
            )}
            {!loadingStatement && statement?.rows.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-gray-400" colSpan={5}>
                  No files assigned to this transporter yet.
                </td>
              </tr>
            )}
            {statement?.rows.map((row, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-4 py-2">{row.client}</td>
                <td className="px-4 py-2">{row.blNumber}</td>
                <td className="px-4 py-2 text-right">
                  {row.cost.toFixed(2)} {row.currency}
                </td>
                <td className="px-4 py-2 text-right">
                  {row.paid.toFixed(2)} {row.currency}
                </td>
                <td className="px-4 py-2 text-right">
                  {row.balanceOwed.toFixed(2)} {row.currency}
                </td>
              </tr>
            ))}
          </tbody>
          {statement && statement.rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-300 font-medium">
                <td className="px-4 py-2" colSpan={2}>
                  Totals
                </td>
                <td className="px-4 py-2 text-right">{formatTotals(statement.totals.cost)}</td>
                <td className="px-4 py-2 text-right">{formatTotals(statement.totals.paid)}</td>
                <td className="px-4 py-2 text-right">{formatTotals(statement.totals.balanceOwed)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
