import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '../api/settings';

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings });

  const [caution20Rate, setCaution20Rate] = useState('');
  const [caution40Rate, setCaution40Rate] = useState('');
  const [cautionCurrency, setCautionCurrency] = useState<'USD' | 'CDF'>('USD');

  useEffect(() => {
    if (settings) {
      setCaution20Rate(String(settings.caution20Rate));
      setCaution40Rate(String(settings.caution40Rate));
      setCautionCurrency(settings.cautionCurrency);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Shipping line caution deposit rates</h2>
        <p className="text-sm text-gray-500 mb-4">
          Per-container deposit rates used to compute the caution amount when a file is created.
        </p>
        <label className="block text-sm text-gray-600 mb-1">20' container rate</label>
        <input
          type="number"
          value={caution20Rate}
          onChange={(e) => setCaution20Rate(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded"
        />
        <label className="block text-sm text-gray-600 mb-1">40' container rate</label>
        <input
          type="number"
          value={caution40Rate}
          onChange={(e) => setCaution40Rate(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded"
        />
        <label className="block text-sm text-gray-600 mb-1">Currency</label>
        <select
          value={cautionCurrency}
          onChange={(e) => setCautionCurrency(e.target.value as 'USD' | 'CDF')}
          className="w-full mb-6 px-3 py-2 border border-gray-300 rounded"
        >
          <option value="USD">USD</option>
          <option value="CDF">CDF</option>
        </select>
        <button
          onClick={() =>
            saveMutation.mutate({
              caution20Rate: Number(caution20Rate),
              caution40Rate: Number(caution40Rate),
              cautionCurrency,
            })
          }
          disabled={saveMutation.isPending}
          className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </button>
        {saveMutation.isSuccess && <span className="ml-3 text-green-600 text-sm">Saved.</span>}
      </div>
    </div>
  );
}
