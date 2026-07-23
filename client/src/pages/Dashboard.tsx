import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  getCashBalance,
  getActualCautionsReport,
  getClosedFilesProfitability,
  getOpenFilesCashSummary,
  getOpenFilesAwaitingPayment,
} from '../api/finance';
import { listFiles } from '../api/files';

function maskedAmount(value: number, currency: string, show: boolean) {
  return show ? `${value.toFixed(2)} ${currency}` : `**** ${currency}`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [showProfits, setShowProfits] = useState(false);
  const { data: balance } = useQuery({ queryKey: ['finance-balance'], queryFn: getCashBalance });
  const { data: openFiles } = useQuery({ queryKey: ['files', { status: 'open' }], queryFn: () => listFiles({ status: 'open' }) });
  const { data: cautions } = useQuery({ queryKey: ['cautions-actual'], queryFn: getActualCautionsReport });
  const {
    data: closedProfits,
    isLoading: profitsLoading,
    isError: profitsErrored,
    error: profitsError,
  } = useQuery({ queryKey: ['closed-files-profitability'], queryFn: getClosedFilesProfitability });
  const { data: cashSummary } = useQuery({
    queryKey: ['open-files-cash-summary'],
    queryFn: getOpenFilesCashSummary,
  });
  const { data: awaitingPayment } = useQuery({
    queryKey: ['open-files-awaiting-payment'],
    queryFn: getOpenFilesAwaitingPayment,
  });

  const outstandingCautions = cautions?.filter((c) => c.paid && !c.refunded) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-6">Welcome, {user?.name}.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded px-4 py-3 mb-8">
          <p className="font-medium mb-1">{outstandingCautions.length} outstanding actual caution deposit(s)</p>
          <p className="text-sm">Cash currently locked at shipping lines, pending refund on container return.</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Open Files Awaiting Client Payment
          {awaitingPayment && awaitingPayment.length > 0 && (
            <span className="ml-2 inline-block bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded align-middle">
              {awaitingPayment.length}
            </span>
          )}
        </h2>
        {!awaitingPayment ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : awaitingPayment.length === 0 ? (
          <p className="text-gray-400 text-sm">Every open file has at least one client payment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="bg-gray-100 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-2">BL Number</th>
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2 text-right">Selling price</th>
                </tr>
              </thead>
              <tbody>
                {awaitingPayment.map((row) => (
                  <tr key={row.fileId} className="border-t border-gray-100">
                    <td className="px-4 py-2">{row.blNumber}</td>
                    <td className="px-4 py-2">{row.client}</td>
                    <td className="px-4 py-2 text-right">
                      {row.sellingPrice.toFixed(2)} {row.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Open File Cash Balances</h2>
        {!cashSummary ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : cashSummary.rows.length === 0 ? (
          <p className="text-gray-400 text-sm">No open files.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead className="bg-gray-100 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-2">BL Number</th>
                    <th className="px-4 py-2">Client</th>
                    <th className="px-4 py-2 text-right">USD</th>
                    <th className="px-4 py-2 text-right">CDF</th>
                  </tr>
                </thead>
                <tbody>
                  {cashSummary.rows.map((row) => (
                    <tr key={row.fileId} className="border-t border-gray-100">
                      <td className="px-4 py-2">{row.blNumber}</td>
                      <td className="px-4 py-2">{row.client}</td>
                      <td className="px-4 py-2 text-right">{row.cashBalance.USD.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{row.cashBalance.CDF.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 font-medium">
              <span>Total cash held across open files</span>
              <span>
                {cashSummary.totals.USD.toFixed(2)} USD / {cashSummary.totals.CDF.toFixed(2)} CDF
              </span>
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Profits — Closed Files</h2>
          <button
            onClick={() => setShowProfits((v) => !v)}
            className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300"
          >
            {showProfits ? 'Hide numbers' : 'Show numbers'}
          </button>
        </div>

        {profitsLoading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : profitsErrored ? (
          <p className="text-sm text-red-600">
            Could not load profits:{' '}
            {(profitsError as { response?: { data?: { error?: string } } })?.response?.data?.error ??
              'Unknown error'}
          </p>
        ) : !closedProfits || closedProfits.rows.length === 0 ? (
          <p className="text-gray-400 text-sm">No closed files yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead className="bg-gray-100 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-2">BL Number</th>
                    <th className="px-4 py-2">Client</th>
                    <th className="px-4 py-2">Pending</th>
                    <th className="px-4 py-2 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {closedProfits.rows.map((row) => (
                    <tr key={row.fileId} className="border-t border-gray-100">
                      <td className="px-4 py-2">{row.blNumber}</td>
                      <td className="px-4 py-2">{row.client}</td>
                      <td className="px-4 py-2 space-x-1">
                        {row.pendingBalancePayment && (
                          <span className="inline-block bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded">
                            Balance payment
                          </span>
                        )}
                        {row.pendingTransporterPayment && (
                          <span className="inline-block bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded">
                            Transporter payment
                          </span>
                        )}
                        {row.pendingCautionRefund && (
                          <span className="inline-block bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded">
                            Caution refund
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {maskedAmount(row.profit, row.currency, showProfits)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 font-medium">
              <span>Cumulative profit</span>
              <span>
                {maskedAmount(closedProfits.cumulative.USD, 'USD', showProfits)}
                {' / '}
                {maskedAmount(closedProfits.cumulative.CDF, 'CDF', showProfits)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
