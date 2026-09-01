export type CurrencyCode = "EGP" | "USD" | "SAR" | "AED" | "EUR";

export type InvoiceStatus = "paid" | "outstanding" | "overdue" | "draft";

export interface InvoiceItem {
  id: string;
  name: string;
  nameAr?: string;
  quantity: number;
  price: number;
  discount?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerNameAr?: string;
  customerPhone: string;
  customerEmail?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  vatRate: number; // e.g. 14 for Egyptian VAT
  vatAmount: number;
  total: number;
  currency: CurrencyCode;
  status: InvoiceStatus;
  notes?: string;
  paymentTerms: string; // e.g. "Due in 15 days"
  paidAt?: string;
  paymentMethod?: "InstaPay" | "Vodafone Cash" | "Bank Transfer" | "Credit Card" | "Cash";
  publicShareToken: string;
}

export type ExpenseCategory = 
  | "Purchases" 
  | "Marketing" 
  | "Transport" 
  | "Utilities" 
  | "Salaries" 
  | "Rent" 
  | "Other";

export interface Expense {
  id: string;
  title: string;
  titleAr?: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  currency: CurrencyCode;
  notes?: string;
  receiptUrl?: string;
  receiptStoragePath?: string;
  receiptSignedUrl?: string;
  paymentMethod: string;
}

export interface Customer {
  id: string;
  code: string; // e.g. CUST-0016
  name: string;
  nameAr?: string;
  phone: string;
  email?: string;
  company?: string;
  address?: string;
  totalInvoiced: number;
  outstandingBalance: number;
  currency: CurrencyCode;
  avatarColor?: string;
  createdAt: string;
}

export interface ContactImportItem {
  id: string;
  name: string;
  phone: string;
  company?: string;
  email?: string;
}

export type AiActionType = 
  | "none" 
  | "create_invoice" 
  | "request_missing_info" 
  | "draft_whatsapp_reminder" 
  | "add_expense" 
  | "financial_insight";

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  action?: AiActionType;
  actionData?: any;
  actionStatus?: "pending" | "executed" | "dismissed";
  isVoiceInput?: boolean;
}

export interface FinancialAnalysisData {
  healthScore: number;
  healthStatus: string;
  executiveSummary: string;
  keyStrengths: string[];
  actionableRecommendations: string[];
  cashFlowForecast: {
    month: string;
    projectedRevenue: number;
    projectedExpenses: number;
    projectedNet: number;
  }[];
}

export interface BusinessProfile {
  id?: string;
  businessName: string;
  businessNameAr: string;
  ownerName: string;
  ownerNameAr: string;
  taxNumber: string;
  commercialRegister: string;
  phone: string;
  email: string;
  address: string;
  defaultCurrency: CurrencyCode;
  defaultVatRate: number;
  subscriptionTier?: "free" | "pro" | "business";
  subscriptionStatus?: "active" | "trialing" | "past_due" | "canceled";
  subscriptionRenewalDate?: string;
  paymentMethodSaved?: {
    cardBrand?: string;
    last4?: string;
    expiryDate?: string;
    type: "card" | "instapay" | "wallet";
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    iban: string;
    instaPayHandle: string;
    vodafoneCashNumber: string;
  };
}

export type NotificationType =
  | "payment_received"
  | "invoice_viewed"
  | "overdue_alert"
  | "tax_deadline"
  | "ai_recommendation"
  | "system";

export interface AppNotification {
  id: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  type: NotificationType;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  relatedId?: string;
}

export interface AiChatSession {
  id: string;
  title: string;
  titleAr: string;
  createdAt: string;
  updatedAt?: string;
  messagesCount?: number;
  messages?: AiChatMessage[];
}


