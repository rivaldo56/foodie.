import { apiRequest } from '@/lib/api';

interface InitiatePaymentPayload {
  amount: number;
  bookingId: string;
  phoneNumber: string;
}

interface MpesaInitiateResponse {
  transaction_id: string;
  status: string;
  message?: string;
}

interface MpesaStatusResponse {
  transaction_id: string;
  status: 'pending' | 'completed' | 'failed';
  message?: string;
}

const INITIATE_ENDPOINT = '/payments/mpesa/initiate/';
const STATUS_ENDPOINT = '/payments/mpesa/status/';

function toPayload({ amount, bookingId, phoneNumber }: InitiatePaymentPayload) {
  return {
    amount,
    booking_id: bookingId,
    phone_number: phoneNumber,
  };
}

export async function initiatePayment(amount: number, bookingId: string, phoneNumber: string) {
  const response = await apiRequest<MpesaInitiateResponse>({
    url: INITIATE_ENDPOINT,
    method: 'POST',
    data: toPayload({ amount, bookingId, phoneNumber }),
  }, true);

  if (response.error) {
    throw new Error(response.error);
  }

  if (!response.data) {
    throw new Error('Hakuna majibu kutoka kwa seva ya malipo.');
  }

  return response.data;
}

export async function checkPaymentStatus(transactionId: string) {
  const endpoint = `${STATUS_ENDPOINT}${transactionId}/`;
  const response = await apiRequest<MpesaStatusResponse>({
    url: endpoint,
    method: 'GET',
  }, true);

  if (response.error) {
    throw new Error(response.error);
  }

  if (!response.data) {
    throw new Error('Hakuna taarifa ya malipo iliyopatikana.');
  }

  return response.data;
}

export const mpesaApi = {
  initiatePayment,
  checkPaymentStatus,
};
