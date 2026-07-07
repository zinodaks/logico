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
