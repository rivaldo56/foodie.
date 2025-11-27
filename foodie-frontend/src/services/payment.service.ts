import { apiRequest, ApiResponse } from '../lib/api';

export interface PaymentResponse {
    success: boolean;
    payment_id?: number;
    mpesa_payment_id?: number;
    checkout_request_id?: string;
    message?: string;
    error?: string;
}

export interface PaymentStatusResponse {
    success: boolean;
    status?: 'completed' | 'failed' | 'cancelled' | 'pending';
    receipt_number?: string;
    message?: string;
    error?: string;
}

export const paymentService = {
    async initiateMpesaPayment(bookingId: number, phoneNumber: string): Promise<ApiResponse<PaymentResponse>> {
        return apiRequest({
            url: '/payments/mpesa/pay/',
            method: 'POST',
            data: {
                booking_id: bookingId,
                phone_number: phoneNumber,
            },
        }, true);
    },

    async checkPaymentStatus(mpesaPaymentId: number): Promise<ApiResponse<PaymentStatusResponse>> {
        return apiRequest({
            url: `/payments/mpesa/status/${mpesaPaymentId}/`,
            method: 'GET',
        }, true);
    }
};

export const {
    initiateMpesaPayment,
    checkPaymentStatus
} = paymentService;
