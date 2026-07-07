import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getActualCautionsReport } from '../api/finance';

export default function CautionsReport() {
  const { data: items, isLoading } = useQuery({ queryKey: ['cautions-actual'], queryFn: getActualCautionsReport });

  const outstanding = items?.filter((i) => i.paid && !i.refunded) ?? [];
  const settled = items?.filter((i) => i.paid && i.refunded) ?? [];
  const unpaid = items?.filter((i) => !i.paid) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Actual Caution Report</h1>
      <p className="text-gray-500 mb-6">
        Files where the business pays the shipping-line caution deposit directly (as opposed to an agent fronting it
        for an interest fee). Outstanding deposits are cash currently locked at the shipping line, pending refund on
        container return.
      </p>

      {isLoading && <p className="text-gray-400">Loading…</p>}

      <Section title={`Outstanding (${outstanding.length})`} items={outstanding} />
      <Section title={`Settled / Refunded (${settled.length})`} items={settled} />
      <Section title={`Not yet paid (${unpaid.length})`} items={unpaid} />
    </div>
  );
}

function Section({
  title,
  items,
}: {
  title: string;
  items: { file: { _id: string; reference: string; client: { name: string } }; cautionAmount: number; currency: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-8">
      <h2 className="text-lg font-medium text-gray-700 mb-2">{title}</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">Reference</th>
              <th className="px-4 py-2">Client</th>
              <th className="px-4 py-2">Caution Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.file._id} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  <Link to={`/files/${i.file._id}`} className="text-blue-600 underline">
                    {i.file.reference}
                  </Link>
                </td>
                <td className="px-4 py-2">{i.file.client.name}</td>
                <td className="px-4 py-2">
                  {i.cautionAmount.toFixed(2)} {i.currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
