import { getSupabaseAdmin } from '../../common/supabase-admin';
import { CreatePaymentDto, PaymentWebhookDto } from './dto/payment.dto';
import { InvoicesService } from '../invoices/invoices.service';

export interface PaymentEntity {
  id: string;
  businessId: string;
  invoiceId: string;
  invoiceNumber?: string;
  customerName?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  recordedBy?: string;
  createdAt: string;
}

export class PaymentsService {
  private supabase = getSupabaseAdmin();
  private invoicesService = new InvoicesService();

  /**
   * List payment history for a business
   */
  async listPayments(businessId: string, invoiceId?: string) {
    let dbQuery = this.supabase
      .from('payments')
      .select('*, invoices(invoice_number, customers(name, name_ar))')
      .eq('business_id', businessId)
      .order('payment_date', { ascending: false });

    if (invoiceId) {
      dbQuery = dbQuery.eq('invoice_id', invoiceId);
    }

    const { data, error } = await dbQuery;

    if (error) {
      throw new Error(`Failed to list payments: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      businessId: row.business_id,
      invoiceId: row.invoice_id,
      invoiceNumber: row.invoices?.invoice_number,
      customerName: row.invoices?.customers?.name,
      amount: Number(row.amount || 0),
      paymentDate: row.payment_date,
      paymentMethod: row.payment_method,
      reference: row.reference || '',
      notes: row.notes || '',
      recordedBy: row.recorded_by,
      createdAt: row.created_at,
    }));
  }

  /**
   * Record a payment against an invoice
   */
  async recordPayment(businessId: string, dto: CreatePaymentDto, userId?: string) {
    return this.invoicesService.recordPayment(
      businessId,
      dto.invoiceId,
      {
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        reference: dto.reference,
        notes: dto.notes,
        paymentDate: dto.paymentDate,
      },
      userId
    );
  }

  /**
   * Process incoming payment provider webhook
   */
  async processWebhook(businessId: string, webhook: PaymentWebhookDto) {
    if (webhook.status !== 'SUCCESS') {
      return { received: true, status: 'ignored_unsuccessful' };
    }

    if (!webhook.invoiceId) {
      return { received: true, status: 'ignored_no_invoice_id' };
    }

    // Map webhook to payment recording
    const updatedInvoice = await this.invoicesService.recordPayment(businessId, webhook.invoiceId, {
      amount: webhook.amount,
      paymentMethod: (webhook.provider === 'paymob' ? 'Credit Card' : 'InstaPay') as any,
      reference: `${webhook.provider.toUpperCase()}-${webhook.transactionId}`,
      notes: `Automated webhook settlement via ${webhook.provider}`,
    });

    return {
      received: true,
      status: 'settled',
      invoiceId: updatedInvoice.id,
      newInvoiceStatus: updatedInvoice.status,
    };
  }
}
