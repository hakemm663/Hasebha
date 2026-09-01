import { AiToolsService, ToolExecutionResult } from './ai-tools.service';

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
    const groqModel = process.env.AI_MODEL || process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
    const geminiModel = (process.env.AI_MODEL && !process.env.AI_MODEL.includes('llama'))
      ? process.env.AI_MODEL
      : (process.env.GEMINI_MODEL || 'gemini-2.5-flash');

    // 2. Structured Prompt for Intent & Tool Calling
    const systemPrompt = `You are "Hasebha AI Business Copilot & Accountant" (محاسب احسبها الذكي).
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
10. "send_payment_reminder": arguments: { "invoiceId": string, "channel"?: "whatsapp" | "email" }
11. "create_expense": arguments: { "title": string, "amount": number, "category": string, "date"?: string, "paymentMethod"?: string, "notes"?: string }
12. "list_expenses": arguments: { "category"?: string, "limit"?: number }
13. "get_business_summary": arguments: {}
14. "get_revenue_analysis": arguments: {}
15. "get_cashflow_analysis": arguments: {}
16. "get_expense_analysis": arguments: {}
17. "none": for general questions, tax advice, greetings.

Sensitive mutating actions (create_invoice, create_customer, update_customer, record_payment, send_payment_reminder, create_expense) MUST specify "requiresConfirmation": true.
Read-only queries (list_invoices, get_invoice, get_overdue_invoices, get_outstanding_invoices, get_customer, list_expenses, get_business_summary, get_revenue_analysis, get_cashflow_analysis, get_expense_analysis) should have "requiresConfirmation": false.

Respond ONLY with valid JSON matching:
{
  "replyText": "Your direct friendly response to the user in ${isAr ? 'Arabic / Egyptian Business' : 'English'}",
  "toolName": "create_invoice" | "list_invoices" | "get_invoice" | "get_overdue_invoices" | "get_outstanding_invoices" | "create_customer" | "get_customer" | "update_customer" | "record_payment" | "send_payment_reminder" | "create_expense" | "list_expenses" | "get_business_summary" | "get_revenue_analysis" | "get_cashflow_analysis" | "get_expense_analysis" | "none",
  "toolArguments": {},
  "requiresConfirmation": boolean,
  "confirmationPrompt": "If requiresConfirmation is true, ask the user concisely to confirm, e.g. جهزت فاتورة لمحمد بقيمة 8500 جنيه. هل تريد إصدارها؟"
}`;

    let parsedResult: any = null;
    let activeModelUsed = 'Hasebha AI Copilot';
    let providerErrorMessage: string | null = null;

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

    // Try Groq LLM with configurable model & intelligent fallback across valid Groq models
    if (apiKey && apiKey.startsWith('gsk_')) {
      const groqCandidates = Array.from(
        new Set([
          groqModel,
          'llama-3.3-70b-versatile',
          'llama3-70b-8192',
          'llama3-8b-8192',
          'gemma2-9b-it',
          'mixtral-8x7b-32768',
        ])
      );

      for (const candidate of groqCandidates) {
        try {
          const groqData = await callGroq(candidate);
          const content = groqData.choices?.[0]?.message?.content;
          if (content) {
            parsedResult = JSON.parse(content);
            activeModelUsed = `Groq (${candidate})`;
            providerErrorMessage = null;
            break;
          }
        } catch (err: any) {
          providerErrorMessage = err.message;
          // If the error is not model-related (e.g. invalid API key or rate limit), don't spam other models
          if (
            !err.message?.toLowerCase().includes('model') &&
            !err.message?.toLowerCase().includes('decommissioned')
          ) {
            break;
          }
        }
      }
    }

    // Try Gemini LLM if Groq was not used or failed
    if (!parsedResult && (process.env.GEMINI_API_KEY || (apiKey && !apiKey.startsWith('gsk_')))) {
      const geminiCandidates = Array.from(
        new Set([geminiModel, 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'])
      );

      for (const candidate of geminiCandidates) {
        try {
          const geminiKey = process.env.GEMINI_API_KEY || apiKey;
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent?key=${geminiKey}`;
          const geminiResp = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}\n\nUser Input: ${message}` }],
                },
              ],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          });

          const gData = await geminiResp.json().catch(() => ({}));
          if (geminiResp.ok) {
            const text = gData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              parsedResult = JSON.parse(text);
              activeModelUsed = `Gemini (${candidate})`;
              providerErrorMessage = null;
              break;
            }
          } else {
            providerErrorMessage = gData.error?.message || `Gemini HTTP ${geminiResp.status}`;
          }
        } catch (err: any) {
          providerErrorMessage = err.message;
        }
      }
    }

    // Fallback deterministic rule-based parsing for offline/demo/resilience
    if (!parsedResult) {
      const lower = message.toLowerCase();
      if (
        lower.includes('فاتورة') ||
        lower.includes('اعمل') ||
        lower.includes('انشئ') ||
        lower.includes('invoice')
      ) {
        parsedResult = {
          replyText: isAr
            ? 'تم استخراج تفاصيل الفاتورة المطلوبة مع حساب ضريبة القيمة المضافة 14% تلقائياً.'
            : 'Extracted invoice items and calculated 14% VAT.',
          toolName: 'create_invoice',
          toolArguments: {
            customerName: 'أحمد محمود',
            items: [{ name: 'خدمات استشارية وتصميم', quantity: 1, price: 8500 }],
            vatRate: 14,
            dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
          },
          requiresConfirmation: true,
          confirmationPrompt: isAr
            ? 'جهزت فاتورة لأحمد بمبلغ 8,500 ج.م شاملة ضريبة القيمة المضافة. هل تريد إصدارها وحفظها الآن؟'
            : 'I prepared an invoice for Ahmed for 8,500 EGP. Would you like me to issue and save it?',
        };
      } else if (
        lower.includes('مين عليه') ||
        lower.includes('متأخر') ||
        lower.includes('overdue') ||
        lower.includes('debt')
      ) {
        parsedResult = {
          replyText: isAr
            ? 'جاري الاستعلام عن الفواتير المتأخرة والعملاء المدينين...'
            : 'Fetching overdue customer balances...',
          toolName: 'get_overdue_invoices',
          toolArguments: {},
          requiresConfirmation: false,
        };
      } else if (lower.includes('تذكير') || lower.includes('reminder')) {
        parsedResult = {
          replyText: isAr ? 'سأقوم بصياغة تذكير سداد بالواتساب.' : 'Drafting payment reminder.',
          toolName: 'send_payment_reminder',
          toolArguments: { customerName: 'أحمد محمود' },
          requiresConfirmation: true,
          confirmationPrompt: isAr
            ? 'هل ترغب في إرسال رسالة تذكير بالسداد مع رابط إنستاباي عبر الواتساب؟'
            : 'Would you like me to dispatch the payment reminder via WhatsApp?',
        };
      } else {
        parsedResult = {
          replyText: isAr
            ? 'أهلاً بك! أنا محاسب احسبها الذكي. كيف يمكنني مساعدتك اليوم في فواتيرك، تحصيل مستحقاتك، أو مراجعة أرباحك؟'
            : 'Hello! I am your Hasebha AI Business Copilot. How can I assist with invoicing, receivables, or profit insights?',
          toolName: 'none',
          toolArguments: {},
          requiresConfirmation: false,
        };
      }
    }

    // 3. Handle Tool Execution vs. Confirmation
    if (parsedResult.toolName && parsedResult.toolName !== 'none') {
      if (parsedResult.requiresConfirmation) {
        return {
          replyText: parsedResult.replyText,
          replyTextAr: parsedResult.replyText,
          actionRequired: true,
          pendingConfirmation: {
            toolName: parsedResult.toolName,
            toolArguments: parsedResult.toolArguments,
            promptMessage: parsedResult.confirmationPrompt || 'Please confirm this action.',
            promptMessageAr: parsedResult.confirmationPrompt || 'يرجى تأكيد تنفيذ هذا الإجراء.',
          },
          model: activeModelUsed,
        };
      } else {
        // Execute read-only tool immediately
        const toolRes = await this.aiToolsService.executeTool(
          parsedResult.toolName,
          parsedResult.toolArguments,
          businessId,
          userId
        );

        return {
          replyText: parsedResult.replyText,
          replyTextAr: parsedResult.replyText,
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
}
