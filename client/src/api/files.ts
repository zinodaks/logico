import { api } from './client';

export interface Money {
  amount: number;
  currency: 'USD' | 'CDF';
}

export interface Container {
  number: string;
  type: '20' | '40';
}

export interface FileStep {
  name: string;
  order: number;
  completed: boolean;
  completedAt?: string;
}

export interface ShipmentFile {
  _id: string;
  client: { _id: string; name: string };
  blNumber: string;
  containers: Container[];
  shippingLine: string;
  natureOfGoods: string;
  sellingPrice: Money;
  agent: { _id: string; name: string };
  transporter: { _id: string; name: string };
  transportCost: Money;
  processType: 'IM4' | 'TR8';
  steps: FileStep[];
  caution: { type: 'actual' | 'interest'; amount: number; currency: 'USD' | 'CDF' };
  status: 'open' | 'closed';
  createdAt: string;
}

export interface FileInput {
  client: string;
  blNumber: string;
  containers: Container[];
  shippingLine: string;
  natureOfGoods: string;
  sellingPrice: Money;
  agent: string;
  transporter: string;
  processType: 'IM4' | 'TR8';
  cautionType: 'actual' | 'interest';
}

export async function listFiles(filters: Record<string, string> = {}): Promise<ShipmentFile[]> {
  const params = new URLSearchParams(filters);
  const { data } = await api.get<{ items: ShipmentFile[] }>(`/files?${params}`);
  return data.items;
}

export async function getFile(id: string): Promise<ShipmentFile> {
  const { data } = await api.get<{ item: ShipmentFile }>(`/files/${id}`);
  return data.item;
}

export async function createFile(input: FileInput): Promise<ShipmentFile> {
  const { data } = await api.post<{ item: ShipmentFile }>('/files', input);
  return data.item;
}

export async function toggleFileStep(id: string, stepIndex: number): Promise<ShipmentFile> {
  const { data } = await api.patch<{ item: ShipmentFile }>(`/files/${id}/steps/${stepIndex}`);
  return data.item;
}

export async function updateFileStatus(id: string, status: 'open' | 'closed'): Promise<ShipmentFile> {
  const { data } = await api.patch<{ item: ShipmentFile }>(`/files/${id}/status`, { status });
  return data.item;
}

export async function updateFileTransporter(id: string, transporter: string): Promise<ShipmentFile> {
  const { data } = await api.patch<{ item: ShipmentFile }>(`/files/${id}/transporter`, { transporter });
  return data.item;
}

export function fileStatementUrl(id: string, format: 'pdf' | 'xlsx'): string {
  return `/api/files/${id}/statement?format=${format}`;
}
