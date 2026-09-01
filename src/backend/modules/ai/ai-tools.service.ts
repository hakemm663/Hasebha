import { InvoicesService } from '../invoices/invoices.service';
import { CustomersService } from '../customers/customers.service';
import { ExpensesService } from '../expenses/expenses.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { PaymentsService } from '../payments/payments.service';

export interface ToolExecutionResult {
  toolName: string;
  status: 'SUCCESS' | 'ERROR' | 'REQUIRES_CONFIRMATION';
  data?: any;
  message?: string;
  messageAr?: string;
}

export class AiToolsService {
  private invoicesService = new InvoicesService();
  private customersService = new CustomersService();
  private expensesService = new ExpensesService();
  private analyticsService = new AnalyticsService();
  private paymentsService = new PaymentsService();

  /**
   * Execute controlled tool with strict business_id boundary
   */
  async executeTool(
    toolName: string,
    args: any,
    businessId: string,
    userId?: string
  ): Promise<ToolExecutionResult> {
    try {
      switch (toolName) {
        case 'create_invoice': {
          let customerId = args.customerId;
          // If customerName provided instead of ID, find or auto-create customer
          if (!customerId && args.customerName) {
            const searchRes = await this.customersService.listCustomers(businessId, {
              search: args.customerName,
              limit: 1,
            });
            if (searchRes.items.length > 0) {
              customerId = searchRes.items[0].id;
            } else {
              const newCust = await this.customersService.createCustomer(businessId, {
                name: args.customerName,
                phone: args.customerPhone || '',
                notes: 'Auto-created via AI Agent',
              });
              customerId = newCust.id;
            }
          }

          if (!customerId) {
            return {
              toolName,
              status: 'ERROR',
              message: 'Customer is required to generate invoice.',
              messageAr: 'يجب تحديد اسم العميل لإنشاء الفاتورة.',
            };
          }

          const items = Array.isArray(args.items) && args.items.length > 0
            ? args.items.map((it: any) => ({
                description: it.name || it.description || 'Service/Product',
                quantity: Number(it.quantity) || 1,
                unitPrice: Number(it.price || it.unitPrice) || 0,
                discount: Number(it.discount) || 0,
              }))
            : [
                {
                  description: args.description || 'Service',
                  quantity: 1,
                  unitPrice: Number(args.amount || args.price) || 0,
                  discount: 0,
                },
              ];

          const invoice = await this.invoicesService.createInvoice(businessId, {
            customerId,
            items,
            discount: Number(args.discount) || 0,
            vatRate: args.vatRate !== undefined ? Number(args.vatRate) : 14,
            dueDate: args.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
            notes: args.notes || 'Created via Hasebha AI Copilot',
          });

          return {
            toolName,
            status: 'SUCCESS',
            data: invoice,
            message: `Invoice #${invoice.invoiceNumber} created for ${invoice.customerName} with total ${invoice.total.toLocaleString()} ${invoice.currency}.`,
            messageAr: `تم إنشاء الفاتورة #${invoice.invoiceNumber} للعميل ${invoice.customerName} بإجمالي ${invoice.total.toLocaleString()} ${invoice.currency}.`,
          };
        }

        case 'list_invoices': {
          const res = await this.invoicesService.listInvoices(businessId, {
            status: args.status,
            customerId: args.customerId,
            limit: args.limit || 20,
          });
          return {
            toolName,
            status: 'SUCCESS',
            data: res.items,
          };
        }

        case 'get_invoice': {
          const inv = await this.invoicesService.getInvoiceById(businessId, args.invoiceId);
          return {
            toolName,
            status: 'SUCCESS',
            data: inv,
          };
        }

        case 'get_overdue_invoices': {
          const res = await this.invoicesService.listInvoices(businessId, { status: 'OVERDUE' });
          return {
            toolName,
            status: 'SUCCESS',
            data: res.items,
            message: `Found ${res.items.length} overdue invoices.`,
            messageAr: `تم العثور على ${res.items.length} فواتير متأخرة السداد.`,
          };
        }

        case 'get_outstanding_invoices': {
          const res = await this.invoicesService.listInvoices(businessId, { status: 'SENT' });
          return {
            toolName,
            status: 'SUCCESS',
            data: res.items,
            message: `Found ${res.items.length} outstanding invoices awaiting collection.`,
            messageAr: `تم العثور على ${res.items.length} فواتير قيد التحصيل.`,
          };
        }

        case 'create_customer': {
          const cust = await this.customersService.createCustomer(businessId, {
            name: args.name,
            nameAr: args.nameAr,
            phone: args.phone,
            email: args.email,
            company: args.company,
            address: args.address,
            notes: args.notes,
          });
          return {
            toolName,
            status: 'SUCCESS',
            data: cust,
            message: `Customer ${cust.name} added successfully with code ${cust.code}.`,
            messageAr: `تم إضافة العميل ${cust.name} بنجاح برمز ${cust.code}.`,
          };
        }

        case 'get_customer': {
          const cust = await this.customersService.getCustomerById(businessId, args.customerId);
          return {
            toolName,
            status: 'SUCCESS',
            data: cust,
          };
        }

        case 'record_payment': {
          const updatedInv = await this.invoicesService.recordPayment(
            businessId,
            args.invoiceId,
            {
              amount: Number(args.amount),
              paymentMethod: args.paymentMethod || 'InstaPay',
              reference: args.reference,
              notes: args.notes,
            },
            userId
          );
          return {
            toolName,
            status: 'SUCCESS',
            data: updatedInv,
            message: `Recorded payment of ${Number(args.amount).toLocaleString()} for Invoice #${updatedInv.invoiceNumber}. New status: ${updatedInv.status}.`,
            messageAr: `تم تسجيل سداد مبلغ ${Number(args.amount).toLocaleString()} للفاتورة #${updatedInv.invoiceNumber}. الحالة الحالية: ${updatedInv.status}.`,
          };
        }

        case 'send_payment_reminder': {
          const inv = await this.invoicesService.getInvoiceById(businessId, args.invoiceId);
          const reminderText = `مرحباً ${inv.customerName}، تذكير ودي بشأن الفاتورة #${inv.invoiceNumber} بقيمة ${inv.outstandingBalance.toLocaleString()} ${inv.currency} المستحقة بتاريخ ${inv.dueDate}. رابط السداد والاطلاع: https://hasebha.app/i/${inv.shareToken}`;

          return {
            toolName,
            status: 'SUCCESS',
            data: {
              invoiceId: inv.id,
              customerName: inv.customerName,
              customerPhone: inv.customerPhone,
              reminderText,
              channel: args.channel || 'whatsapp',
            },
            message: `Payment reminder prepared for ${inv.customerName}.`,
            messageAr: `تم تجهيز رسالة التذكير بالسداد للعميل ${inv.customerName}.`,
          };
        }

        case 'create_expense': {
          const expense = await this.expensesService.createExpense(businessId, {
            title: args.title || 'Expense logged via AI',
            amount: Number(args.amount) || 0,
            category: args.category || 'Purchases',
            expenseDate: args.date || args.expenseDate,
            paymentMethod: args.paymentMethod || 'Cash',
            notes: args.notes,
          });
          return {
            toolName,
            status: 'SUCCESS',
            data: expense,
            message: `Expense "${expense.title}" of ${expense.amount.toLocaleString()} ${expense.currency} recorded.`,
            messageAr: `تم تسجيل المصروف "${expense.title}" بقيمة ${expense.amount.toLocaleString()} ${expense.currency}.`,
          };
        }

        case 'list_expenses': {
          const res = await this.expensesService.listExpenses(businessId, {
            category: args.category,
            limit: args.limit || 20,
          });
          return {
            toolName,
            status: 'SUCCESS',
            data: res.items,
          };
        }

        case 'update_customer': {
          const updatedCust = await this.customersService.updateCustomer(businessId, args.customerId, {
            phone: args.phone,
            email: args.email,
            address: args.address,
            notes: args.notes,
          });
          return {
            toolName,
            status: 'SUCCESS',
            data: updatedCust,
            message: `Customer ${updatedCust.name} updated successfully.`,
            messageAr: `تم تحديث بيانات العميل ${updatedCust.name} بنجاح.`,
          };
        }

        case 'get_business_summary':
        case 'get_revenue_analysis':
        case 'get_cashflow_analysis': {
          const summary = await this.analyticsService.getBusinessSummary(businessId);
          return {
            toolName,
            status: 'SUCCESS',
            data: summary,
          };
        }

        case 'get_expense_analysis': {
          const expAnalytics = await this.expensesService.getExpenseAnalytics(businessId);
          return {
            toolName,
            status: 'SUCCESS',
            data: expAnalytics,
          };
        }

        default:
          return {
            toolName,
            status: 'ERROR',
            message: `Unknown tool: ${toolName}`,
            messageAr: `أداة غير معروفة: ${toolName}`,
          };
      }
    } catch (err: any) {
      return {
        toolName,
        status: 'ERROR',
        message: err.message || 'Tool execution failed',
        messageAr: 'فشل تنفيذ الإجراء',
      };
    }
  }
}
