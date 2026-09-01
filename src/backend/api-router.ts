import { Router, Request, Response } from 'express';
import { CustomersService } from './modules/customers/customers.service';
import { InvoicesService } from './modules/invoices/invoices.service';
import { ExpensesService } from './modules/expenses/expenses.service';
import { PaymentsService } from './modules/payments/payments.service';
import { AnalyticsService } from './modules/analytics/analytics.service';
import { AiService } from './modules/ai/ai.service';
import { AiToolsService } from './modules/ai/ai-tools.service';
import { NotificationsService } from './modules/notifications/notifications.service';
import { getSupabaseAdmin } from './common/supabase-admin';

export const apiRouter = Router();

const customersService = new CustomersService();
const invoicesService = new InvoicesService();
const expensesService = new ExpensesService();
const paymentsService = new PaymentsService();
const analyticsService = new AnalyticsService();
const aiService = new AiService();
const aiToolsService = new AiToolsService();
const notificationsService = new NotificationsService();

/**
 * Tenant identification middleware
 * Extracts authenticated user & business_id from Authorization Bearer token or tenant header
 */
async function authMiddleware(req: Request, res: Response, next: Function) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const headerBusinessId = (req.headers['x-business-id'] as string) || '';

    if (token) {
      const supabase = getSupabaseAdmin();
      const { data: userData, error } = await supabase.auth.getUser(token);
      if (!error && userData.user) {
        (req as any).user = userData.user;
        // Resolve business ID for user
        const { data: biz } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', userData.user.id)
          .maybeSingle();

        (req as any).businessId = biz?.id || headerBusinessId || 'default-business-id';
        return next();
      }
    }

    // Default tenant for unauthenticated / demo session requests
    (req as any).businessId = headerBusinessId || 'demo-business-001';
    (req as any).user = null;
    next();
  } catch (err) {
    (req as any).businessId = 'demo-business-001';
    next();
  }
}

apiRouter.use(authMiddleware);

// --- Health ---
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: 'v1',
    engine: 'NestJS / TypeScript Business Domain',
    timestamp: new Date().toISOString(),
  });
});

// --- Customers API ---
apiRouter.get('/customers', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const query = {
      search: req.query.search as string,
      isArchived: req.query.isArchived === 'true',
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    };
    const result = await customersService.listCustomers(businessId, query);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/customers', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const customer = await customersService.createCustomer(businessId, req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.get('/customers/:id', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const customer = await customersService.getCustomerById(businessId, req.params.id);
    res.json({ success: true, data: customer });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
});

apiRouter.patch('/customers/:id', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const customer = await customersService.updateCustomer(businessId, req.params.id, req.body);
    res.json({ success: true, data: customer });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/customers/:id', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    await customersService.archiveCustomer(businessId, req.params.id);
    res.json({ success: true, message: 'Customer archived' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// --- Invoices API ---
apiRouter.get('/invoices', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const query = {
      status: req.query.status as any,
      customerId: req.query.customerId as string,
      search: req.query.search as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    };
    const result = await invoicesService.listInvoices(businessId, query);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/invoices', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const invoice = await invoicesService.createInvoice(businessId, req.body);
    res.status(201).json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.get('/invoices/:id', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const invoice = await invoicesService.getInvoiceById(businessId, req.params.id);
    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
});

apiRouter.post('/invoices/:id/payments', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const userId = (req as any).user?.id;
    const invoice = await invoicesService.recordPayment(
      businessId,
      req.params.id,
      req.body,
      userId
    );
    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// --- Expenses API ---
apiRouter.get('/expenses', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const query = {
      category: req.query.category as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      search: req.query.search as string,
      isArchived: req.query.isArchived === 'true',
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    };
    const result = await expensesService.listExpenses(businessId, query);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/expenses', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const expense = await expensesService.createExpense(businessId, req.body);
    res.status(201).json({ success: true, data: expense });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.get('/expenses/analytics/summary', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const analytics = await expensesService.getExpenseAnalytics(businessId);
    res.json({ success: true, data: analytics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/expenses/:id', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    await expensesService.archiveExpense(businessId, req.params.id);
    res.json({ success: true, message: 'Expense archived' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/expenses/:id/receipt/upload-url', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const { fileName, contentType, fileSizeBytes } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).json({ success: false, error: 'fileName and contentType are required.' });
    }

    const uploadPayload = await expensesService.getReceiptUploadUrl(
      businessId,
      req.params.id,
      fileName,
      contentType,
      fileSizeBytes
    );
    res.json({ success: true, data: uploadPayload });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/expenses/:id/receipt/complete', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const { storagePath } = req.body;
    if (!storagePath) {
      return res.status(400).json({ success: false, error: 'storagePath is required.' });
    }

    const updated = await expensesService.completeReceiptUpload(
      businessId,
      req.params.id,
      storagePath
    );
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.get('/expenses/:id/receipt/url', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const receiptAccess = await expensesService.getReceiptDownloadUrl(businessId, req.params.id);
    res.json({ success: true, data: receiptAccess });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/expenses/:id/receipt', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const updated = await expensesService.deleteReceipt(businessId, req.params.id);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// --- Payments API ---
apiRouter.get('/payments', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const invoiceId = req.query.invoiceId as string;
    const payments = await paymentsService.listPayments(businessId, invoiceId);
    res.json({ success: true, data: payments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/payments', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const userId = (req as any).user?.id;
    const result = await paymentsService.recordPayment(businessId, req.body, userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/payments/webhook', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const result = await paymentsService.processWebhook(businessId, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// --- Analytics API ---
apiRouter.get('/analytics/summary', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const summary = await analyticsService.getBusinessSummary(businessId);
    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- AI Agent & Tools API ---
apiRouter.post('/ai/agent', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const userId = (req as any).user?.id;
    const result = await aiService.processAgentMessage(businessId, req.body, userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/ai/tools/execute', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const userId = (req as any).user?.id;
    const { toolName, toolArguments } = req.body;
    const result = await aiToolsService.executeTool(toolName, toolArguments, businessId, userId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// --- Notifications API ---
apiRouter.get('/notifications', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const list = await notificationsService.listNotifications(businessId);
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.patch('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    await notificationsService.markAsRead(businessId, req.params.id);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.post('/notifications/read-all', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    await notificationsService.markAllAsRead(businessId);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
