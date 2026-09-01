/**
 * Hasebha REST API Client
 * Single source of truth connecting Web SaaS UI to NestJS Backend (/api/v1)
 */

const API_BASE_URL = '/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('supabase_auth_token') || '';
  const businessId = localStorage.getItem('hasebha_business_id') || 'demo-business-001';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-business-id': businessId,
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok && json.success === undefined) {
    return {
      success: false,
      error: json.error || `HTTP Error ${response.status}`,
    };
  }

  return json as ApiResponse<T>;
}

export const hasebhaApi = {
  // --- Customers ---
  async listCustomers(params: { search?: string; isArchived?: boolean; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.isArchived !== undefined) query.set('isArchived', String(params.isArchived));
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return request<any>(`/customers?${query.toString()}`);
  },

  async createCustomer(data: { name: string; nameAr?: string; phone?: string; email?: string; company?: string; notes?: string }) {
    return request<any>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCustomer(id: string, data: any) {
    return request<any>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async archiveCustomer(id: string) {
    return request<any>(`/customers/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Invoices ---
  async listInvoices(params: { status?: string; customerId?: string; search?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.customerId) query.set('customerId', params.customerId);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return request<any>(`/invoices?${query.toString()}`);
  },

  async getInvoiceById(id: string) {
    return request<any>(`/invoices/${id}`);
  },

  async createInvoice(data: {
    customerId: string;
    dueDate: string;
    items: Array<{ description: string; quantity: number; unitPrice: number; discount?: number }>;
    discount?: number;
    vatRate?: number;
    notes?: string;
  }) {
    return request<any>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async recordInvoicePayment(invoiceId: string, payment: {
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }) {
    return request<any>(`/invoices/${invoiceId}/payments`, {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  },

  // --- Expenses ---
  async listExpenses(params: { category?: string; startDate?: string; endDate?: string; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.search) query.set('search', params.search);
    return request<any>(`/expenses?${query.toString()}`);
  },

  async createExpense(data: {
    title: string;
    amount: number;
    category: string;
    expenseDate?: string;
    paymentMethod?: string;
    notes?: string;
  }) {
    return request<any>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getExpenseAnalytics() {
    return request<any>('/expenses/analytics/summary');
  },

  async archiveExpense(id: string) {
    return request<any>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  },

  async getExpenseReceiptUploadUrl(id: string, fileName: string, contentType: string, fileSizeBytes?: number) {
    return request<{ signedUrl: string; token: string; storagePath: string; expiresInSeconds: number }>(
      `/expenses/${id}/receipt/upload-url`,
      {
        method: 'POST',
        body: JSON.stringify({ fileName, contentType, fileSizeBytes }),
      }
    );
  },

  async completeExpenseReceiptUpload(id: string, storagePath: string) {
    return request<any>(`/expenses/${id}/receipt/complete`, {
      method: 'POST',
      body: JSON.stringify({ storagePath }),
    });
  },

  async getExpenseReceiptUrl(id: string) {
    return request<{ signedUrl: string; storagePath: string; expenseId: string }>(
      `/expenses/${id}/receipt/url`
    );
  },

  async deleteExpenseReceipt(id: string) {
    return request<any>(`/expenses/${id}/receipt`, {
      method: 'DELETE',
    });
  },

  // --- Analytics ---
  async getBusinessSummary() {
    return request<any>('/analytics/summary');
  },

  // --- AI Agent ---
  async sendAiMessage(params: {
    message: string;
    history?: Array<{ role: string; content: string }>;
    language?: 'ar' | 'en';
    isVoiceInput?: boolean;
    confirmedAction?: { toolName: string; toolArguments: any };
  }) {
    return request<any>('/ai/agent', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async executeAiTool(toolName: string, toolArguments: any) {
    return request<any>('/ai/tools/execute', {
      method: 'POST',
      body: JSON.stringify({ toolName, toolArguments }),
    });
  },

  // --- Notifications ---
  async listNotifications() {
    return request<any[]>('/notifications');
  },

  async markNotificationAsRead(id: string) {
    return request<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },
};

export const api = hasebhaApi;
