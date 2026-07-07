import { api } from './client';

export interface CurrencyTotals {
  USD: number;
  CDF: number;
}

export interface FileProfitability {
  currency: 'USD' | 'CDF';
  sellingPrice: number;
  expenses: CurrencyTotals;
  profit: number;
  realized: boolean;
  collected: CurrencyTotals;
  balanceDue: number;
  transportCost: { amount: number; currency: 'USD' | 'CDF' };
  outstandingTransportCost: number;
  cashBalance: CurrencyTotals;
}

export interface ClientProfitability {
  realized: CurrencyTotals;
  projected: CurrencyTotals;
  fileCount: number;
}

export async function getCashBalance(): Promise<CurrencyTotals> {
  const { data } = await api.get<{ balance: CurrencyTotals }>('/finance/balance');
  return data.balance;
}

export async function getFileProfitability(fileId: string): Promise<FileProfitability> {
  const { data } = await api.get<{ item: FileProfitability }>(`/finance/files/${fileId}/profitability`);
  return data.item;
}

export async function getClientProfitability(clientId: string): Promise<ClientProfitability> {
  const { data } = await api.get<{ item: ClientProfitability }>(`/finance/clients/${clientId}/profitability`);
  return data.item;
}

export interface ActualCautionReportItem {
  file: { _id: string; blNumber: string; client: { _id: string; name: string } };
  cautionAmount: number;
  currency: 'USD' | 'CDF';
  paid: boolean;
  refunded: boolean;
}

export async function getActualCautionsReport(): Promise<ActualCautionReportItem[]> {
  const { data } = await api.get<{ items: ActualCautionReportItem[] }>('/finance/cautions/actual-paid');
  return data.items;
}
