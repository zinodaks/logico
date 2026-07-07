import { simpleCrudApi } from './simpleCrud';

export interface PaymentType {
  _id: string;
  name: string;
  active: boolean;
}

export const paymentTypesApi = simpleCrudApi<PaymentType, { name: string }>('/payment-types');
