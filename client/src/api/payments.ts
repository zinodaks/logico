import { api } from './client';

export type PaymentDirection =
  | 'client_payment'
  | 'agent_payment'
  | 'transporter_payment'
  | 'generic_expense'
  | 'business_expense'
  | 'caution_deposit'
  | 'caution_refund';

export interface Payment {
  _id: string;
  file?: { _id: string; blNumber: string };
  direction: PaymentDirection;
  amount: number;
  currency: 'USD' | 'CDF';
  paymentType: { _id: string; name: string };
  agent?: { _id: string; name: string };
  transporter?: { _id: string; name: string };
  date: string;
  notes?: string;
}

export interface PaymentInput {
  file?: string;
  direction: PaymentDirection;
  amount: number;
  currency: 'USD' | 'CDF';
  paymentType: string;
  agent?: string;
  transporter?: string;
  date?: string;
  notes?: string;
}

export async function listPayments(filters: Record<string, string> = {}): Promise<Payment[]> {
  const params = new URLSearchParams(filters);
  const { data } = await api.get<{ items: Payment[] }>(`/payments?${params}`);
  return data.items;
}

export async function createPayment(input: PaymentInput): Promise<Payment> {
  const { data } = await api.post<{ item: Payment }>('/payments', input);
  return data.item;
}

export async function deletePayment(id: string): Promise<void> {
  await api.delete(`/payments/${id}`);
}
