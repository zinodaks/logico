import { NamedEntityPage } from '../components/NamedEntityPage';
import { paymentTypesApi } from '../api/paymentTypes';

export default function PaymentTypes() {
  return <NamedEntityPage title="Payment Types" queryKey="payment-types" api={paymentTypesApi} />;
}
