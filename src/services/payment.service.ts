import { apiClient } from "./api-client";
import type {
  CheckoutPaymentDto,
  PaymentCheckoutResponse,
  PaymentTransaction,
} from "@/types/payment";

export const paymentService = {
  checkout: (dto: CheckoutPaymentDto) =>
    apiClient.post<PaymentCheckoutResponse>("/payments/checkout", dto),

  getStatus: (orderId: number) =>
    apiClient.get<PaymentTransaction[]>(`/payments/status/${orderId}`),

  refund: (transactionId: number) =>
    apiClient.post<PaymentTransaction>("/payments/refund", { transactionId }),
};
