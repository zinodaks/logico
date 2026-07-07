import { api } from './client';

export interface ProfitTransfer {
  _id: string;
  amount: number;
  currency: 'USD' | 'CDF';
  date: string;
  notes?: string;
}

export async function listProfitTransfers(): Promise<ProfitTransfer[]> {
  const { data } = await api.get<{ items: ProfitTransfer[] }>('/profit-transfers');
  return data.items;
}

export async function createProfitTransfer(input: {
  amount: number;
  currency: 'USD' | 'CDF';
  notes?: string;
}): Promise<ProfitTransfer> {
  const { data } = await api.post<{ item: ProfitTransfer }>('/profit-transfers', input);
  return data.item;
}

export async function deleteProfitTransfer(id: string): Promise<void> {
  await api.delete(`/profit-transfers/${id}`);
}
