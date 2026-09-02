import { AiToolsService, ToolExecutionResult } from './ai-tools.service';
import { InvoicesService } from '../invoices/invoices.service';
import { CustomersService } from '../customers/customers.service';
import { ExpensesService } from '../expenses/expenses.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { GoogleGenAI } from '@google/genai';

export interface AiAgentRequest {
  message: string;
  history?: Array<{ role: string; content: string }>;
  language?: 'ar' | 'en';
  isVoiceInput?: boolean;
  confirmedAction?: {
    toolName: string;
    toolArguments: any;
  };
}

export interface AiAgentResponse {
  replyText: string;
  replyTextAr?: string;
  actionRequired: boolean;
  pendingConfirmation?: {
    toolName: string;
    toolArguments: any;
    promptMessage: string;
    promptMessageAr: string;
  };
  toolResult?: ToolExecutionResult;
  model: string;
}

export class AiService {
  private aiToolsService = new AiToolsService();
  private invoicesService = new InvoicesService();
  private customersService = new CustomersService();
  private expensesService = new ExpensesService();
  private analyticsService = new AnalyticsService();

  async processAgentMessage(
    businessId: string,
    req: AiAgentRequest,
    userId?: string
  ): Promise<AiAgentResponse> {
    const language = req.language || 'ar';
    const isAr = language === 'ar';

    // 1. If user sent a confirmed action execution
    if (req.confirmedAction) {
      const toolRes = await this.aiToolsService.executeTool(
        req.confirmedAction.toolName,
        req.confirmedAction.toolArguments,
        businessId,
        userId
      );

      return {
        replyText: isAr
          ? toolRes.messageAr || 'تم تنفيذ العملية بنجاح!'
          : toolRes.message || 'Action executed successfully!',
        actionRequired: false,
        toolResult: toolRes,
        model: 'Hasebha AI Engine',
      };
    }

    const message = req.message.trim();
    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || '';
    
    // Active modern Groq models (deprecated/decommissioned models like mixtral-8x7b-32768, llama-3.1-70b are removed)
    const preferredGroqModel = process.env.GROQ_MODEL || process.env.AI_MODEL || 'llama-3.3-70b-versatile';
    const preferredGeminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    // 2. Fetch live business context to provide real situational awareness to the AI model
    let businessContextSummary = '';
    try {
      const [summary, overdueInvoices, recentCustomers] = await Promise.all([
        this.analyticsService.getBusinessSummary(businessId).catch(() => null),
        this.invoicesService.listInvoices(businessId, { status: 'OVERDUE', limit: 5 }).catch(() => ({ items: [] })),
        this.customersService.listCustomers(businessId, { limit: 5 }).catch(() => ({ items: [] })),
      ]);

      if (summary) {
        businessContextSummary = `
Active Business Financial Snapshot:
- Currency: ${summary.currency || 'EGP'}
- Total Revenue Invoiced: ${summary.totalInvoiced?.toLocaleString() || 0}
- Collected Cash: ${summary.totalCollected?.toLocaleString() || 0}
- Total Outstanding Balance: ${summary.outstandingBalance?.toLocaleString() || 0}
- Total Expenses: ${summary.totalExpenses?.toLocaleString() || 0}
- Net Profit: ${summary.netIncome?.toLocaleString() || 0}
- Overdue Invoices Count: ${overdueInvoices.items.length}
- Overdue Details: ${overdueInvoices.items.map((i: any) => `#${i.invoiceNumber} for ${i.customerName} (${i.outstandingBalance} ${i.currency})`).join(', ') || 'None'}
- Existing Customers: ${recentCustomers.items.map((c: any) => c.name).join(', ') || 'None'}
`;
      }
    } catch (ctxErr) {
      console.warn('Could not load live business context for AI:', ctxErr);
    }

    // 3. Structured Prompt for Intent & Tool Calling
    const systemPrompt = `You are "Hasebha AI Autonomous Accountant" (محاسب احسبها الذكي), a top-tier financial AI agent for small and medium businesses in Egypt and the MENA region.
You have access to the following backend business tools (DO NOT write SQL, output tool selection JSON only):
1. "create_invoice": arguments: { "customerName": string, "customerPhone"?: string, "items": [{ "name": string, "quantity": number, "price": number }], "discount"?: number, "vatRate"?: number, "dueDate"?: string, "notes"?: string }
2. "list_invoices": arguments: { "status"?: "DRAFT" | "SENT" | "PAID" | "OVERDUE", "limit"?: number }
3. "get_invoice": arguments: { "invoiceId": string }
4. "get_overdue_invoices": arguments: {}
5. "get_outstanding_invoices": arguments: {}
6. "create_customer": arguments: { "name": string, "nameAr"?: string, "phone"?: string, "email"?: string, "company"?: string, "address"?: string, "notes"?: string }
7. "get_customer": arguments: { "customerId": string }
8. "update_customer": arguments: { "customerId": string, "phone"?: string, "email"?: string, "address"?: string, "notes"?: string }
9. "record_payment": arguments: { "invoiceId": string, "amount": number, "paymentMethod": "InstaPay" | "Vodafone Cash" | "Cash" | "Bank Transfer", "reference"?: string, "notes"?: string }
10. "send_payment_reminder": arguments: { "invoiceId": string, "customerName"?: string, "channel"?: "whatsapp" | "email" }
11. "create_expense": arguments: { "title": string, "amount": number, "category": string, "date"?: string, "paymentMethod"?: string, "notes"?: string }
12. "list_expenses": arguments: { "category"?: string, "limit"?: number }
13. "get_business_summary": arguments: {}
14. "get_revenue_analysis": arguments: {}
15. "get_cashflow_analysis": arguments: {}
16. "get_expense_analysis": arguments: {}
17. "none": for general questions, tax advice, greetings.

${businessContextSummary}

Rules:
- NEVER invent fake customer names or fake numbers when user didn't provide them. Extract EXACT names and amounts from the user prompt.
- For sensitive mutating actions (create_invoice, create_customer, update_customer, record_payment, send_payment_reminder, create_expense), specify "requiresConfirmation": true.
- For read-only queries (list_invoices, get_invoice, get_overdue_invoices, get_outstanding_invoices, get_customer, list_expenses, get_business_summary, get_revenue_analysis, get_cashflow_analysis, get_expense_analysis), specify "requiresConfirmation": false.

Respond ONLY with valid JSON matching:
{
  "replyText": "Your direct friendly response to the user in ${isAr ? 'Arabic / Egyptian Business Arabic' : 'English'}",
  "toolName": "create_invoice" | "list_invoices" | "get_invoice" | "get_overdue_invoices" | "get_outstanding_invoices" | "create_customer" | "get_customer" | "update_customer" | "record_payment" | "send_payment_reminder" | "create_expense" | "list_expenses" | "get_business_summary" | "get_revenue_analysis" | "get_cashflow_analysis" | "get_expense_analysis" | "none",
  "toolArguments": {},
  "requiresConfirmation": boolean,
  "confirmationPrompt": "If requiresConfirmation is true, ask the user concisely to confirm in the requested language."
}`;

    let parsedResult: any = null;
    let activeModelUsed = 'Hasebha AI Autonomous Agent';

    // Helper to call Groq completions
    const callGroq = async (modelToUse: string): Promise<any> => {
      const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { role: 'system', content: systemPrompt },
            ...(req.history || []).map((h) => ({
              role: h.role === 'user' ? 'user' : 'assistant',
              content: h.content,
            })),
            { role: 'user', content: message },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      const groqData = await groqResp.json().catch(() => ({}));
      if (!groqResp.ok) {
        const errMsg = groqData.error?.message || `Groq HTTP ${groqResp.status}`;
        throw new Error(errMsg);
      }
      return groqData;
    };

    // 4. Try Groq with active modern models
    if (apiKey && apiKey.startsWith('gsk_')) {
      const groqCandidates = Array.from(
        new Set([
          preferredGroqModel,
          'llama-3.3-70b-versatile',
          'llama-3.1-8b-instant',
          'qwen-2.5-32b',
          'deepseek-r1-distill-llama-70b',
          'gemma2-9b-it',
        ])
      );

      for (const candidate of groqCandidates) {
        try {
          const groqData = await callGroq(candidate);
          const content = groqData.choices?.[0]?.message?.content;
          if (content) {
            parsedResult = JSON.parse(content);
            activeModelUsed = `Groq (${candidate})`;
            break;
          }
        } catch (err: any) {
          console.warn(`Groq candidate ${candidate} error:`, err.message);
          if (
            !err.message?.toLowerCase().includes('model') &&
            !err.message?.toLowerCase().includes('decommissioned') &&
            !err.message?.toLowerCase().includes('not found')
          ) {
            break;
          }
        }
      }
    }

    // 5. Try Google GenAI SDK if Gemini Key available
    if (!parsedResult && process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const geminiResp = await ai.models.generateContent({
          model: preferredGeminiModel,
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUser Input: ${message}` }],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const text = geminiResp.text;
        if (text) {
          parsedResult = JSON.parse(text);
          activeModelUsed = `Gemini (${preferredGeminiModel})`;
        }
      } catch (geminiErr: any) {
        console.warn('Google GenAI SDK call error:', geminiErr.message);
      }
    }

    // 6. High-Precision Context-Aware Local NLP Parser (Zero-Fabrication Guarantee)
    if (!parsedResult) {
      parsedResult = this.parseAccountingPromptLocally(message, isAr);
      activeModelUsed = 'Hasebha Smart Engine';
    }

    // 7. Handle Tool Execution vs. Confirmation
    if (parsedResult.toolName && parsedResult.toolName !== 'none') {
      if (parsedResult.requiresConfirmation) {
        return {
          replyText: parsedResult.replyText,
          replyTextAr: parsedResult.replyText,
          actionRequired: true,
          pendingConfirmation: {
            toolName: parsedResult.toolName,
            toolArguments: parsedResult.toolArguments,
            promptMessage: parsedResult.confirmationPrompt || (isAr ? 'يرجى تأكيد تنفيذ هذا الإجراء.' : 'Please confirm this action.'),
            promptMessageAr: parsedResult.confirmationPrompt || (isAr ? 'يرجى تأكيد تنفيذ هذا الإجراء.' : 'Please confirm this action.'),
          },
          model: activeModelUsed,
        };
      } else {
        // Execute read-only tool immediately against Supabase / PostgreSQL database
        const toolRes = await this.aiToolsService.executeTool(
          parsedResult.toolName,
          parsedResult.toolArguments,
          businessId,
          userId
        );

        // Format live data into natural, human-friendly summary
        const formattedReply = this.formatLiveToolReply(parsedResult.toolName, toolRes, isAr);

        return {
          replyText: formattedReply || parsedResult.replyText,
          replyTextAr: formattedReply || parsedResult.replyText,
          actionRequired: false,
          toolResult: toolRes,
          model: activeModelUsed,
        };
      }
    }

    return {
      replyText: parsedResult.replyText,
      replyTextAr: parsedResult.replyText,
      actionRequired: false,
      model: activeModelUsed,
    };
  }

  /**
   * Deterministic Natural Language Parser for financial intents (Never fabricates mock data)
   */
  private parseAccountingPromptLocally(prompt: string, isAr: boolean): any {
    const text = prompt.trim();
    const lower = text.toLowerCase();

    // 1. Expense Detection: e.g. "Record an expense for office supplies worth 450 EGP" / "سجل مصروف شراء أدوات مكتبية بقيمة 450 جنيه"
    if (
      lower.includes('مصروف') ||
      lower.includes('expense') ||
      lower.includes('صرفت') ||
      lower.includes('دفعنا') ||
      lower.includes('فاتورة كهربا') ||
      lower.includes('إيجار')
    ) {
      // Extract amount
      const amountMatch = text.match(/(\d+[\d,.]*)/);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

      // Extract title/description
      let title = isAr ? 'مصروف عام' : 'General Expense';
      if (lower.includes('office supplies') || text.includes('أدوات مكتبية') || text.includes('مستلزمات مكتبية')) {
        title = isAr ? 'أدوات ومستلزمات مكتبية' : 'Office Supplies';
      } else if (lower.includes('marketing') || lower.includes('ads') || text.includes('تسويق') || text.includes('إعلانات')) {
        title = isAr ? 'إعلانات وتسويق' : 'Marketing & Ads';
      } else if (lower.includes('rent') || text.includes('إيجار')) {
        title = isAr ? 'إيجار المقر' : 'Office Rent';
      } else if (lower.includes('electricity') || lower.includes('utilities') || text.includes('كهرباء') || text.includes('مرافق')) {
        title = isAr ? 'فواتير ومرافق' : 'Utilities';
      } else {
        // Clean out action words
        const cleaned = text
          .replace(/^(سجل|أضف|اضف|قيد|record|add|log)\s+(مصروف|expense)\s*/i, '')
          .replace(/(بقيمة|بمبلغ|worth|for|of)\s*\d+.*$/i, '')
          .trim();
        if (cleaned.length > 2) title = cleaned;
      }

      // Determine category
      let category = 'Supplies';
      if (title.includes('تسويق') || title.includes('Marketing')) category = 'Marketing';
      else if (title.includes('إيجار') || title.includes('Rent')) category = 'Rent';
      else if (title.includes('مرافق') || title.includes('Utilities')) category = 'Utilities';
      else if (title.includes('رواتب') || title.includes('Salaries')) category = 'Salaries';

      if (amount > 0) {
        return {
          replyText: isAr
            ? `استخرجت تفاصيل المصروف: "${title}" بقيمة ${amount.toLocaleString()} ج.م تحت تصنيف (${category}).`
            : `Extracted expense details: "${title}" for ${amount.toLocaleString()} EGP under (${category}).`,
          toolName: 'create_expense',
          toolArguments: {
            title,
            amount,
            category,
            paymentMethod: 'Cash',
          },
          requiresConfirmation: true,
          confirmationPrompt: isAr
            ? `هل ترغب في تسجيل مصروف "${title}" بقيمة ${amount.toLocaleString()} ج.م في سجلك المالي؟`
            : `Would you like to log "${title}" for ${amount.toLocaleString()} EGP in your ledger?`,
        };
      } else {
        return {
          replyText: isAr
            ? `يرجى تحديد المبلغ المراد تسجيله لمصروف "${title}". مثال: "سجل مصروف ${title} بمبلغ 500 جنيه"`
            : `Please specify the amount for "${title}". Example: "Record expense for ${title} worth 500 EGP"`,
          toolName: 'none',
          toolArguments: {},
          requiresConfirmation: false,
        };
      }
    }

    // 2. Overdue Invoices Query: "What invoices are currently overdue?" / "مين عليه فلوس متأخرة؟"
    if (
      lower.includes('متأخر') ||
      lower.includes('overdue') ||
      lower.includes('مين عليه') ||
      lower.includes('مستحقات') ||
      lower.includes('debt') ||
      lower.includes('تحصيل')
    ) {
      return {
        replyText: isAr
          ? 'جاري فحص الفواتير المتأخرة والتحقق من حسابات العملاء...'
          : 'Querying live database for overdue invoices and outstanding debts...',
        toolName: 'get_overdue_invoices',
        toolArguments: {},
        requiresConfirmation: false,
      };
    }

    // 3. Profit / Business Summary Analysis: "Analyze this month's profit" / "حلل أرباح هذا الشهر"
    if (
      lower.includes('أرباح') ||
      lower.includes('profit') ||
      lower.includes('تحليل') ||
      lower.includes('analysis') ||
      lower.includes('إيرادات') ||
      lower.includes('revenue') ||
      lower.includes('ملخص') ||
      lower.includes('summary')
    ) {
      return {
        replyText: isAr
          ? 'جاري استخراج التحليل المالي وصافي الأرباح من قاعدة البيانات...'
          : 'Calculating net profit margins and financial analytics...',
        toolName: 'get_business_summary',
        toolArguments: {},
        requiresConfirmation: false,
      };
    }

    // 4. Create Invoice Extraction (Strict extraction without mock injection)
    if (
      lower.includes('فاتورة') ||
      lower.includes('invoice') ||
      lower.includes('اعمل') ||
      lower.includes('انشئ') ||
      lower.includes('create')
    ) {
      const amountMatch = text.match(/(\d+[\d,.]*)/);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

      // Extract customer name cleanly
      let customerName = '';
      const forMatch = text.match(/(?:لـ|لعميل|لشركة|لـ |ل |for\s+)([\u0621-\u064Aa-zA-Z\s]{2,30}?)(?:\s+(?:بقيمة|بمبلغ|فيها|with|worth|amount|\d))/i);
      if (forMatch && forMatch[1]) {
        customerName = forMatch[1].trim();
      }

      if (amount > 0 && customerName) {
        return {
          replyText: isAr
            ? `استخرجت بيانات الفاتورة للعميل (${customerName}) بقيمة ${amount.toLocaleString()} ج.م شاملة ضريبة القيمة المضافة 14%.`
            : `Drafted invoice for client (${customerName}) for ${amount.toLocaleString()} EGP with 14% VAT.`,
          toolName: 'create_invoice',
          toolArguments: {
            customerName,
            items: [{ name: isAr ? 'خدمات / منتجات' : 'Services / Products', quantity: 1, price: amount }],
            vatRate: 14,
            dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
          },
          requiresConfirmation: true,
          confirmationPrompt: isAr
            ? `جهزت مسودة فاتورة لـ (${customerName}) بمبلغ ${amount.toLocaleString()} ج.م. هل تريد إصدارها وحفظها؟`
            : `Prepared invoice draft for (${customerName}) for ${amount.toLocaleString()} EGP. Issue invoice now?`,
        };
      } else {
        return {
          replyText: isAr
            ? 'لإنشاء الفاتورة، يرجى تزويدي باسم العميل والمبلغ المطلوب (مثال: "اعمل فاتورة لشركة النور بمبلغ 5000 جنيه").'
            : 'To create an invoice, please specify the client name and amount (e.g. "Create invoice for Alpha Corp for 5000 EGP").',
          toolName: 'none',
          toolArguments: {},
          requiresConfirmation: false,
        };
      }
    }

    // 5. Payment Reminder
    if (lower.includes('تذكير') || lower.includes('reminder') || lower.includes('واتساب') || lower.includes('whatsapp')) {
      return {
        replyText: isAr
          ? 'جاري صياغة رسالة تذكير بالسداد بالواتساب...'
          : 'Preparing WhatsApp payment reminder for overdue invoices...',
        toolName: 'get_overdue_invoices',
        toolArguments: {},
        requiresConfirmation: false,
      };
    }

    // 6. Default Helpful Business Accountant Greeting
    return {
      replyText: isAr
        ? 'أهلاً بك! أنا حاسبها AI وكيلك المالي الذكي. يمكنك أن تطلب مني:\n• "اعمل فاتورة لشركة الأمل بمبلغ 5000 جنيه"\n• "سجل مصروف شراء أدوات مكتبية بقيمة 450 جنيه"\n• "ما هي الفواتير المتأخرة ومن هم العملاء المدينين؟"\n• "حلل أرباح هذا الشهر وقارنها بالمصروفات"'
        : 'Welcome! I am Hasebha AI, your autonomous business accountant. You can ask me:\n• "Create invoice for Alpha Corp for 5000 EGP"\n• "Record expense for office supplies worth 450 EGP"\n• "What invoices are currently overdue and need collection?"\n• "Analyze this month\'s profit and revenue trends"',
      toolName: 'none',
      toolArguments: {},
      requiresConfirmation: false,
    };
  }

  /**
   * Formats tool database execution results into conversational responses
   */
  private formatLiveToolReply(toolName: string, result: ToolExecutionResult, isAr: boolean): string {
    if (result.status === 'ERROR') {
      return isAr ? `⚠️ تعذر إتمام العملية: ${result.messageAr || result.message}` : `⚠️ Action failed: ${result.message}`;
    }

    switch (toolName) {
      case 'get_overdue_invoices': {
        const invoices = Array.isArray(result.data) ? result.data : [];
        if (invoices.length === 0) {
          return isAr
            ? '🎉 ممتاز! لا توجد أي فواتير متأخرة السداد في سجلك حالياً. جميع فواتيرك إما مسددة بالكامل أو في موعد استحقاقها.'
            : '🎉 Great news! You have zero overdue invoices right now. All receivables are in good standing.';
        }
        const totalOverdue = invoices.reduce((sum: number, i: any) => sum + (Number(i.outstandingBalance) || Number(i.total) || 0), 0);
        const listText = invoices
          .slice(0, 5)
          .map((i: any) => `• فاتورة #${i.invoiceNumber} للعميل ${i.customerName} بقيمة ${(Number(i.outstandingBalance) || Number(i.total)).toLocaleString()} ${i.currency || 'ج.م'} (استحقاق ${i.dueDate})`)
          .join('\n');

        return isAr
          ? `⚠️ تم العثور على ${invoices.length} فواتير متأخرة السداد بإجمالي ${totalOverdue.toLocaleString()} ج.م:\n\n${listText}\n\nهل ترغب في إرسال تذكير سداد بالواتساب لأحد هؤلاء العملاء؟`
          : `⚠️ Found ${invoices.length} overdue invoices totaling ${totalOverdue.toLocaleString()} EGP:\n\n${listText}\n\nWould you like me to dispatch WhatsApp payment reminders?`;
      }

      case 'get_business_summary': {
        const d = result.data;
        if (!d) return result.message || '';
        return isAr
          ? `📊 الملخص المالي لأعمالك:\n• إجمالي المبيعات المفوترة: ${Number(d.totalInvoiced || 0).toLocaleString()} ${d.currency}\n• النقد المحصل: ${Number(d.totalCollected || 0).toLocaleString()} ${d.currency}\n• المستحقات قيد التحصيل: ${Number(d.outstandingBalance || 0).toLocaleString()} ${d.currency}\n• إجمالي المصروفات: ${Number(d.totalExpenses || 0).toLocaleString()} ${d.currency}\n• صافي الربح: ${Number(d.netIncome || 0).toLocaleString()} ${d.currency} (هامش ${d.profitMargin || 0}%)\n• نسبة التحصيل: ${d.collectionRate || 0}%`
          : `📊 Financial Summary Snapshot:\n• Invoiced Revenue: ${Number(d.totalInvoiced || 0).toLocaleString()} ${d.currency}\n• Collected Cash: ${Number(d.totalCollected || 0).toLocaleString()} ${d.currency}\n• Outstanding Receivables: ${Number(d.outstandingBalance || 0).toLocaleString()} ${d.currency}\n• Total Expenses: ${Number(d.totalExpenses || 0).toLocaleString()} ${d.currency}\n• Net Profit: ${Number(d.netIncome || 0).toLocaleString()} ${d.currency} (${d.profitMargin || 0}% margin)\n• Collection Rate: ${d.collectionRate || 0}%`;
      }

      default:
        return isAr ? result.messageAr || result.message || 'تم إتمام العملية بنجاح.' : result.message || 'Action executed successfully.';
    }
  }
}

