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
  caution: {
    type: 'actual' | 'interest';
    amount: number;
    currency: 'USD' | 'CDF';
    deposited: number;
    refunded: number;
    outstandingToCollect: number;
  };
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

export interface ClosedFileProfitRow {
  fileId: string;
  blNumber: string;
  client: string;
  currency: 'USD' | 'CDF';
  profit: number;
  pendingBalancePayment: boolean;
  pendingTransporterPayment: boolean;
  pendingCautionRefund: boolean;
}

export interface ClosedFilesProfitability {
  rows: ClosedFileProfitRow[];
  cumulative: CurrencyTotals;
}

export async function getClosedFilesProfitability(): Promise<ClosedFilesProfitability> {
  const { data } = await api.get<ClosedFilesProfitability>('/finance/closed-files-profitability');
  return data;
}

export interface OpenFileCashRow {
  fileId: string;
  blNumber: string;
  client: string;
  cashBalance: CurrencyTotals;
}

export interface OpenFilesCashSummary {
  rows: OpenFileCashRow[];
  totals: CurrencyTotals;
}

export async function getOpenFilesCashSummary(): Promise<OpenFilesCashSummary> {
  const { data } = await api.get<OpenFilesCashSummary>('/finance/open-files-cash-summary');
  return data;
}

export interface OpenFileAwaitingPaymentRow {
  fileId: string;
  blNumber: string;
  client: string;
  sellingPrice: number;
  currency: 'USD' | 'CDF';
}

export async function getOpenFilesAwaitingPayment(): Promise<OpenFileAwaitingPaymentRow[]> {
  const { data } = await api.get<{ rows: OpenFileAwaitingPaymentRow[] }>('/finance/open-files-awaiting-payment');
  return data.rows;
}
