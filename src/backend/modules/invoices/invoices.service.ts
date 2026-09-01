import { getSupabaseAdmin } from '../../common/supabase-admin';
import { CreateInvoiceDto, UpdateInvoiceDto, InvoiceQueryDto, RecordPaymentDto } from './dto/invoice.dto';
import crypto from 'crypto';

export interface InvoiceEntity {
  id: string;
  businessId: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  invoiceNumber: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  issueDate: string;
  dueDate: string;
  subtotal: number;
  discount: number;
  tax: number;
  vatRate: number;
  total: number;
  amountPaid: number;
  outstandingBalance: number;
  currency: string;
  notes?: string;
  paymentTerms: string;
  paidAt?: string;
  paymentMethod?: string;
  shareToken: string;
  items: Array<{
    id: string;
    description: string;
    descriptionAr?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    lineTotal: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export class InvoicesService {
  private supabase = getSupabaseAdmin();

  /**
   * List invoices with dynamic status calculation (overdue checking) and filters
   */
  async listInvoices(businessId: string, query: InvoiceQueryDto = {}) {
    const { status, customerId, search, page = 1, limit = 50 } = query;

    let dbQuery = this.supabase
      .from('invoices')
      .select('*, customers(name, name_ar, phone, email), invoice_items(*)', { count: 'exact' })
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (customerId) {
      dbQuery = dbQuery.eq('customer_id', customerId);
    }

    if (status && status !== 'ALL') {
      dbQuery = dbQuery.eq('status', status);
    }

    if (search) {
      dbQuery = dbQuery.or(`invoice_number.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, count, error } = await dbQuery.range(from, to);

    if (error) {
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const items: InvoiceEntity[] = (data || []).map((row) => {
      const entity = this.mapToEntity(row);
      // Re-evaluate dynamic overdue status if currently SENT and dueDate < today
      if (entity.status === 'SENT' && entity.dueDate < todayStr && entity.amountPaid < entity.total) {
        entity.status = 'OVERDUE';
      }
      return entity;
    });

    return {
      items,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  /**
   * Get single invoice by ID with strict tenant boundary
   */
  async getInvoiceById(businessId: string, invoiceId: string): Promise<InvoiceEntity> {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('*, customers(name, name_ar, phone, email), invoice_items(*)')
      .eq('id', invoiceId)
      .eq('business_id', businessId)
      .single();

    if (error || !data) {
      throw new Error(`Invoice not found or unauthorized access: ${error?.message}`);
    }

    const entity = this.mapToEntity(data);
    const todayStr = new Date().toISOString().split('T')[0];
    if (entity.status === 'SENT' && entity.dueDate < todayStr && entity.amountPaid < entity.total) {
      entity.status = 'OVERDUE';
    }
    return entity;
  }

  /**
   * Create invoice with server-authoritative calculations
   */
  async createInvoice(businessId: string, dto: CreateInvoiceDto): Promise<InvoiceEntity> {
    if (!dto.items || dto.items.length === 0) {
      throw new Error('Invoice must contain at least one line item.');
    }

    // 1. Calculate line items and totals
    let subtotal = 0;
    const computedItems = dto.items.map((item, index) => {
      const quantity = Math.max(0.01, Number(item.quantity) || 1);
      const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
      const itemDiscount = Math.max(0, Number(item.discount) || 0);
      const lineTotal = Math.max(0, quantity * unitPrice - itemDiscount);
      subtotal += lineTotal;
      return {
        description: item.description,
        description_ar: item.descriptionAr || null,
        quantity,
        unit_price: unitPrice,
        discount: itemDiscount,
        line_total: lineTotal,
        sort_order: index + 1,
      };
    });

    const discount = Math.max(0, Number(dto.discount) || 0);
    const taxableAmount = Math.max(0, subtotal - discount);
    const vatRate = dto.vatRate !== undefined ? Number(dto.vatRate) : 14.0; // Default 14% Egyptian VAT
    const tax = Math.round(taxableAmount * (vatRate / 100) * 100) / 100;
    const total = Math.round((taxableAmount + tax) * 100) / 100;

    // 2. Generate unique invoice number
    const currentYear = new Date().getFullYear();
    const { count } = await this.supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId);

    const invoiceNumber = `INV-${currentYear}-${String((count || 0) + 1).padStart(4, '0')}`;
    const shareToken = crypto.randomBytes(16).toString('hex');
    const issueDate = dto.issueDate || new Date().toISOString().split('T')[0];
    const dueDate = dto.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
    const initialStatus = dto.status || 'SENT';

    // 3. Insert Invoice
    const { data: invRow, error: invError } = await this.supabase
      .from('invoices')
      .insert({
        business_id: businessId,
        customer_id: dto.customerId,
        invoice_number: invoiceNumber,
        status: initialStatus,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal,
        discount,
        tax,
        vat_rate: vatRate,
        total,
        amount_paid: 0,
        currency: dto.currency || 'EGP',
        notes: dto.notes || null,
        payment_terms: dto.paymentTerms || 'Due in 15 days',
        share_token: shareToken,
      })
      .select('*, customers(name, name_ar, phone, email)')
      .single();

    if (invError || !invRow) {
      throw new Error(`Failed to create invoice: ${invError?.message}`);
    }

    // 4. Insert Invoice Items
    const itemsToInsert = computedItems.map((it) => ({
      ...it,
      invoice_id: invRow.id,
    }));

    const { data: insertedItems, error: itemsError } = await this.supabase
      .from('invoice_items')
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      console.error('Invoice items insertion note:', itemsError);
    }

    // 5. Update Customer Total Invoiced and Outstanding Balance
    await this.updateCustomerBalances(businessId, dto.customerId);

    return this.mapToEntity({
      ...invRow,
      invoice_items: insertedItems || itemsToInsert,
    });
  }

  /**
   * Record payment and execute state transitions
   */
  async recordPayment(
    businessId: string,
    invoiceId: string,
    dto: RecordPaymentDto,
    userId?: string
  ): Promise<InvoiceEntity> {
    const invoice = await this.getInvoiceById(businessId, invoiceId);

    const paymentAmount = Math.max(0.01, Number(dto.amount));
    const newAmountPaid = invoice.amountPaid + paymentAmount;
    const isFullyPaid = newAmountPaid >= invoice.total;
    const newStatus = isFullyPaid ? 'PAID' : invoice.status;

    // 1. Insert payment record
    const { error: payError } = await this.supabase.from('payments').insert({
      business_id: businessId,
      invoice_id: invoiceId,
      amount: paymentAmount,
      payment_date: dto.paymentDate || new Date().toISOString(),
      payment_method: dto.paymentMethod,
      reference: dto.reference || null,
      notes: dto.notes || null,
      recorded_by: userId || null,
    });

    if (payError) {
      throw new Error(`Failed to record payment: ${payError.message}`);
    }

    // 2. Update invoice status and amount_paid
    const { data: updatedInv, error: updateError } = await this.supabase
      .from('invoices')
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
        paid_at: isFullyPaid ? new Date().toISOString() : invoice.paidAt,
        payment_method: dto.paymentMethod,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .eq('business_id', businessId)
      .select('*, customers(name, name_ar, phone, email), invoice_items(*)')
      .single();

    if (updateError || !updatedInv) {
      throw new Error(`Failed to update invoice payment status: ${updateError?.message}`);
    }

    // 3. Update customer balance
    await this.updateCustomerBalances(businessId, invoice.customerId);

    // 4. Create Notification
    await this.supabase.from('notifications').insert({
      business_id: businessId,
      title: 'Payment Received',
      title_ar: 'تم تحصيل دفعة مالية',
      message: `Payment of ${paymentAmount.toLocaleString()} ${invoice.currency} recorded for Invoice #${invoice.invoiceNumber}.`,
      message_ar: `تم تسجيل سداد مبلغ ${paymentAmount.toLocaleString()} ${invoice.currency} للفاتورة #${invoice.invoiceNumber}.`,
      type: 'payment_received',
      related_id: invoiceId,
    });

    return this.mapToEntity(updatedInv);
  }

  /**
   * Helper to recalculate customer outstanding balance and total invoiced
   */
  private async updateCustomerBalances(businessId: string, customerId: string) {
    try {
      const { data: customerInvoices } = await this.supabase
        .from('invoices')
        .select('total, amount_paid, status')
        .eq('business_id', businessId)
        .eq('customer_id', customerId);

      if (customerInvoices) {
        const totalInvoiced = customerInvoices.reduce((acc, inv) => acc + Number(inv.total || 0), 0);
        const totalPaid = customerInvoices.reduce((acc, inv) => acc + Number(inv.amount_paid || 0), 0);
        const outstandingBalance = Math.max(0, totalInvoiced - totalPaid);

        await this.supabase
          .from('customers')
          .update({
            total_invoiced: totalInvoiced,
            outstanding_balance: outstandingBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('id', customerId)
          .eq('business_id', businessId);
      }
    } catch (err) {
      console.warn('updateCustomerBalances note:', err);
    }
  }

  private mapToEntity(row: any): InvoiceEntity {
    const total = Number(row.total || 0);
    const amountPaid = Number(row.amount_paid || 0);
    return {
      id: row.id,
      businessId: row.business_id,
      customerId: row.customer_id,
      customerName: row.customers?.name || '',
      customerPhone: row.customers?.phone || '',
      customerEmail: row.customers?.email || '',
      invoiceNumber: row.invoice_number,
      status: row.status,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      subtotal: Number(row.subtotal || 0),
      discount: Number(row.discount || 0),
      tax: Number(row.tax || 0),
      vatRate: Number(row.vat_rate || 14),
      total,
      amountPaid,
      outstandingBalance: Math.max(0, total - amountPaid),
      currency: row.currency || 'EGP',
      notes: row.notes || '',
      paymentTerms: row.payment_terms || 'Due in 15 days',
      paidAt: row.paid_at,
      paymentMethod: row.payment_method,
      shareToken: row.share_token,
      items: (row.invoice_items || []).map((it: any) => ({
        id: it.id,
        description: it.description,
        descriptionAr: it.description_ar,
        quantity: Number(it.quantity || 1),
        unitPrice: Number(it.unit_price || 0),
        discount: Number(it.discount || 0),
        lineTotal: Number(it.line_total || 0),
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
