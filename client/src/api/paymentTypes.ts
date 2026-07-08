import { simpleCrudApi } from './simpleCrud';
import type { PaymentDirection } from './payments';

export interface PaymentType {
  _id: string;
  category: PaymentDirection;
  name: string;
  active: boolean;
}

export const paymentTypesApi = simpleCrudApi<PaymentType, { name: string; category: PaymentDirection }>(
  '/payment-types',
);

export async function listPaymentTypesByCategory(category: PaymentDirection): Promise<PaymentType[]> {
  return paymentTypesApi.list({ category });
}
