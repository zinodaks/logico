import { api } from './client';

export interface Settings {
  _id: string;
  caution20Rate: number;
  caution40Rate: number;
  cautionCurrency: 'USD' | 'CDF';
}

export async function getSettings(): Promise<Settings> {
  const { data } = await api.get<{ item: Settings }>('/settings');
  return data.item;
}

export async function updateSettings(input: Partial<Pick<Settings, 'caution20Rate' | 'caution40Rate' | 'cautionCurrency'>>): Promise<Settings> {
  const { data } = await api.put<{ item: Settings }>('/settings', input);
  return data.item;
}
