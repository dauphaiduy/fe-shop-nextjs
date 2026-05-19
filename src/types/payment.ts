export type PaymentProvider = "SEPAY" | "MOMO" | "ZALOPAY" | "VNPAY";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED"
  | "REFUNDED";

export interface PaymentTransaction {
  id: number;
  orderId: number;
  provider: PaymentProvider;
  transactionId: string | null;
  amount: string;
  status: PaymentStatus;
  rawRequest?: Record<string, unknown> | null;
  rawResponse?: Record<string, unknown> | null;
  callbackPayload?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutPaymentDto {
  orderId: number;
  provider: PaymentProvider;
  returnUrl?: string;
}

// Actual flat shape returned by POST /payments/checkout
export interface PaymentCheckoutResponse {
  transactionId: number;
  paymentUrl: string;
  qrCode: string;
}
