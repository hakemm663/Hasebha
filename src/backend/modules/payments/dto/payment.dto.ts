export interface CreatePaymentDto {
  invoiceId: string;
  amount: number;
  paymentMethod: 'InstaPay' | 'Vodafone Cash' | 'Bank Transfer' | 'Credit Card' | 'Cash';
  paymentDate?: string;
  reference?: string;
  notes?: string;
}

export interface PaymentWebhookDto {
  provider: 'paymob' | 'stripe' | 'fawry';
  transactionId: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  rawPayload: any;
  signature?: string;
}
