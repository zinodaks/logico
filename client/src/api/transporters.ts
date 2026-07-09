import { api } from './client';
import { simpleCrudApi } from './simpleCrud';

export interface Transporter {
  _id: string;
  name: string;
  fixedTransportCost: number;
  currency: 'USD' | 'CDF';
  active: boolean;
}

export const transportersApi = simpleCrudApi<
  Transporter,
  { name: string; fixedTransportCost: number; currency: 'USD' | 'CDF' }
>('/transporters');

export interface TransporterStatementRow {
  client: string;
  blNumber: string;
  currency: 'USD' | 'CDF';
  cost: number;
  paid: number;
  balanceOwed: number;
}

export interface TransporterStatementData {
  transporter: Transporter;
  rows: TransporterStatementRow[];
  totals: {
    cost: Record<string, number>;
    paid: Record<string, number>;
    balanceOwed: Record<string, number>;
  };
}

export async function getTransporterStatement(id: string): Promise<TransporterStatementData> {
  const { data } = await api.get<TransporterStatementData>(`/transporters/${id}/statement`, {
    params: { format: 'json' },
  });
  return data;
}

export function transporterStatementUrl(id: string, format: 'pdf' | 'xlsx'): string {
  return `/api/transporters/${id}/statement?format=${format}`;
}
