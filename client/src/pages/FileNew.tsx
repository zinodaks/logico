import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFile, type Container } from '../api/files';
import { listClients } from '../api/clients';
import { agentsApi } from '../api/agents';
import { transportersApi } from '../api/transporters';

export default function FileNew() {
  const navigate = useNavigate();
  const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: listClients });
  const { data: agents } = useQuery({ queryKey: ['agents'], queryFn: agentsApi.list });
  const { data: transporters } = useQuery({ queryKey: ['transporters'], queryFn: transportersApi.list });

  const [client, setClient] = useState('');
  const [processType, setProcessType] = useState<'IM4' | 'TR8'>('IM4');
  const [blNumber, setBlNumber] = useState('');
  const [containers, setContainers] = useState<Container[]>([{ number: '', type: '20' }]);
  const [shippingLine, setShippingLine] = useState('');
  const [natureOfGoods, setNatureOfGoods] = useState('');
  const [sellingPriceAmount, setSellingPriceAmount] = useState('');
  const [sellingPriceCurrency, setSellingPriceCurrency] = useState<'USD' | 'CDF'>('USD');
  const [agent, setAgent] = useState('');
  const [transporter, setTransporter] = useState('');
  const [cautionType, setCautionType] = useState<'actual' | 'interest'>('actual');
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createFile,
    onSuccess: (file) => navigate(`/files/${file._id}`),
    onError: (err) => {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Could not create file';
      setError(message);
    },
  });

  function updateContainer(index: number, field: keyof Container, value: string) {
    setContainers((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  function addContainer() {
    setContainers((prev) => [...prev, { number: '', type: '20' }]);
  }

  function removeContainer(index: number) {
    setContainers((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    setError(null);
    if (!client || !agent || !transporter || !blNumber || !shippingLine || !natureOfGoods || !sellingPriceAmount) {
      setError('Please fill in all required fields');
      return;
    }
    if (containers.some((c) => !c.number.trim())) {
      setError('Every container needs a container number');
      return;
    }
    createMutation.mutate({
      client,
      blNumber,
      containers,
      shippingLine,
      natureOfGoods,
      sellingPrice: { amount: Number(sellingPriceAmount), currency: sellingPriceCurrency },
      agent,
      transporter,
      processType,
      cautionType,
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">New File</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-6">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="block text-sm text-gray-600 mb-1">Client</label>
          <select value={client} onChange={(e) => setClient(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded">
            <option value="">Select a client…</option>
            {clients?.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Process</label>
          <div className="flex flex-wrap gap-4">
            {(['IM4', 'TR8'] as const).map((p) => (
              <label key={p} className="flex items-center gap-1">
                <input type="radio" checked={processType === p} onChange={() => setProcessType(p)} />
                {p}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">BL Number</label>
            <input value={blNumber} onChange={(e) => setBlNumber(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Shipping Line</label>
            <input value={shippingLine} onChange={(e) => setShippingLine(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Nature of Goods</label>
          <input value={natureOfGoods} onChange={(e) => setNatureOfGoods(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">Containers</label>
          {containers.map((c, i) => (
            <div key={i} className="flex flex-wrap gap-2 items-center mb-2">
              <input
                placeholder="Container number"
                value={c.number}
                onChange={(e) => updateContainer(i, 'number', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded flex-1"
              />
              <select value={c.type} onChange={(e) => updateContainer(i, 'type', e.target.value)} className="px-3 py-2 border border-gray-300 rounded">
                <option value="20">20'</option>
                <option value="40">40'</option>
              </select>
              {containers.length > 1 && (
                <button type="button" onClick={() => removeContainer(i)} className="text-red-600 underline">
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addContainer} className="text-blue-600 underline text-sm">
            + Add container
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Selling Price</label>
            <input
              type="number"
              value={sellingPriceAmount}
              onChange={(e) => setSellingPriceAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Currency</label>
            <select
              value={sellingPriceCurrency}
              onChange={(e) => setSellingPriceCurrency(e.target.value as 'USD' | 'CDF')}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="USD">USD</option>
              <option value="CDF">CDF</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Agent</label>
            <select value={agent} onChange={(e) => setAgent(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded">
              <option value="">Select an agent…</option>
              {agents?.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Transporter</label>
            <select value={transporter} onChange={(e) => setTransporter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded">
              <option value="">Select a transporter…</option>
              {transporters?.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.fixedTransportCost} {t.currency}/container)
                </option>
              ))}
            </select>
            {transporter && (
              <p className="text-xs text-gray-500 mt-1">
                Transport cost: {transporters?.find((t) => t._id === transporter)?.fixedTransportCost} ×{' '}
                {containers.length} container{containers.length === 1 ? '' : 's'} ={' '}
                {(transporters?.find((t) => t._id === transporter)?.fixedTransportCost ?? 0) * containers.length}{' '}
                {transporters?.find((t) => t._id === transporter)?.currency}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">Caution</label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <label className="flex items-center gap-1">
              <input type="radio" checked={cautionType === 'actual'} onChange={() => setCautionType('actual')} />
              Actual (we pay the shipping line directly)
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" checked={cautionType === 'interest'} onChange={() => setCautionType('interest')} />
              Interest (agent fronts it for a fee)
            </label>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {createMutation.isPending ? 'Creating…' : 'Create file'}
        </button>
      </div>
    </div>
  );
}
