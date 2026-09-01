export interface InvoiceItemDto {
  description: string;
  descriptionAr?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface CreateInvoiceDto {
  customerId: string;
  issueDate?: string;
  dueDate: string;
  items: InvoiceItemDto[];
  discount?: number;
  vatRate?: number;
  currency?: string;
  notes?: string;
  paymentTerms?: string;
  status?: 'DRAFT' | 'SENT';
}

export interface UpdateInvoiceDto {
  dueDate?: string;
  notes?: string;
  paymentTerms?: string;
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
}

export interface InvoiceQueryDto {
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'ALL';
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RecordPaymentDto {
  amount: number;
  paymentMethod: 'InstaPay' | 'Vodafone Cash' | 'Bank Transfer' | 'Credit Card' | 'Cash';
  reference?: string;
  notes?: string;
  paymentDate?: string;
}
