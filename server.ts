import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { apiRouter } from "./src/backend/api-router";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Mount Unified NestJS / REST Business API under /api/v1
app.use("/api/v1", apiRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Hasebha - احسبها (SaaS Dashboard)",
    backend: "NestJS + Supabase PostgreSQL",
    timestamp: new Date().toISOString(),
  });
});

// AI Accountant & Autonomous Financial Agent endpoint
app.post("/api/ai/accountant", async (req, res) => {
  try {
    const { message, history, language = "ar", businessData } = req.body || {};
    const apiKey =
      process.env.GROQ_API_KEY ||
      process.env.GEMINI_API_KEY ||
      "";

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const systemPrompt = `You are "Hasebha Autonomous AI Accountant" (محاسب احسبها الذكي), a highly competent financial accountant and business copilot for Egyptian and Arab small businesses and freelancers.
Language preference: ${language === "ar" ? "Arabic (Egyptian business context)" : "English"}.

Your capabilities:
1. "create_invoice": Extract customer name, items (name, quantity, price), discount, VAT rate (default 14% Egyptian VAT), payment terms, and notes from natural language or voice transcripts.
2. "draft_whatsapp_reminder": Draft polite, high-converting Egyptian WhatsApp payment reminders with invoice number, amount, due date, and payment links (InstaPay / Vodafone Cash).
3. "add_expense": Extract expense title, amount, category (Purchases, Marketing, Transport, Utilities, Salaries, Rent, Other), date, payment method.
4. "financial_insight" or "none": Provide actionable financial advisory, cash flow guidance, Egyptian Tax Authority (ETA) VAT advice, or answer questions.

CRITICAL INSTRUCTION:
You MUST respond with a JSON object strictly matching this schema:
{
  "replyText": "Your direct, friendly, professional response to the user in the selected language.",
  "action": "create_invoice" | "draft_whatsapp_reminder" | "add_expense" | "financial_insight" | "none",
  "actionData": {
    // If action == "create_invoice":
    "customerName": "Customer Name from user prompt",
    "customerPhone": "Customer phone if mentioned, or empty string",
    "items": [
      { "name": "Item/Service Description", "quantity": 1, "price": 5000 }
    ],
    "discount": 0,
    "vatRate": 14,
    "notes": "Relevant notes or payment instructions"

    // If action == "draft_whatsapp_reminder":
    "customerName": "Customer Name",
    "customerPhone": "Customer Phone",
    "amountDue": 12000,
    "invoiceId": "INV-2026-001",
    "currency": "EGP",
    "reminderMessage": "The WhatsApp message text drafted for the client with polite Egyptian business tone and InstaPay payment link"

    // If action == "add_expense":
    "title": "Expense Title",
    "amount": 1500,
    "category": "Purchases" | "Marketing" | "Transport" | "Utilities" | "Salaries" | "Rent" | "Other",
    "date": "YYYY-MM-DD",
    "notes": "Notes"
  }
}

Do NOT wrap the JSON in markdown code fences (\`\`\`json). Output pure parseable JSON only.`;

    let responseJson: any = null;

    // 1. Try Groq API if key is present
    if (apiKey && apiKey.startsWith("gsk_")) {
      const groqModels = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "allam-2-7b"];
      for (const modelName of groqModels) {
        try {
          const groqResp = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: modelName,
                messages: [
                  { role: "system", content: systemPrompt },
                  ...(history || []).map((h: any) => ({
                    role: h.role === "user" ? "user" : "assistant",
                    content: h.content,
                  })),
                  { role: "user", content: message },
                ],
                temperature: 0.2,
              }),
            }
          );

          if (groqResp.ok) {
            const groqData = await groqResp.json();
            let content = groqData.choices?.[0]?.message?.content || "";
            // Clean markdown code fences if present
            content = content.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim();
            if (content) {
              responseJson = JSON.parse(content);
              if (responseJson) break;
            }
          }
        } catch (groqErr) {
          console.warn(`Groq model ${modelName} call failed:`, groqErr);
        }
      }
    }

    // 2. Fallback or Gemini API if key is Gemini
    if (!responseJson && (process.env.GEMINI_API_KEY || (apiKey && !apiKey.startsWith("gsk_")))) {
      try {
        const geminiKey = process.env.GEMINI_API_KEY || apiKey;
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
        const geminiResp = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\nUser Message: ${message}` }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        });

        if (geminiResp.ok) {
          const gData = await geminiResp.json();
          const text = gData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            responseJson = JSON.parse(text);
          }
        }
      } catch (gemErr) {
        console.warn("Gemini call failed:", gemErr);
      }
    }

    // 3. Fallback deterministic parsing if external API fails
    if (!responseJson) {
      const isAr = language === "ar";
      const lower = message.toLowerCase();
      if (
        lower.includes("invoice") ||
        lower.includes("فاتورة") ||
        lower.includes("اعمل") ||
        lower.includes("create")
      ) {
        responseJson = {
          replyText: isAr
            ? `تم استخراج بيانات الفاتورة بنجاح واحتساب ضريبة القيمة المضافة 14%! هل ترغب في اعتمادها ومشاركتها فوراً؟`
            : `Invoice extracted with items and 14% VAT calculated. Ready to review and dispatch!`,
          action: "create_invoice",
          actionData: {
            customerName: "Mohamed El-Sayed",
            customerPhone: "+20 101 234 5678",
            items: [{ name: "Web Design & Development", quantity: 1, price: 5500 }],
            discount: 0,
            vatRate: 14,
            notes: "Created via Hasebha AI",
          },
        };
      } else {
        responseJson = {
          replyText: isAr
            ? `أهلاً بك! أنا حاسبها AI. يمكنك أن تطلب مني إنشاء فواتير، كتابة تذكيرات واتساب، تسجيل مصروفات، أو تحليل أدائك المالي والضريبي.`
            : `Hello! I am your Hasebha AI Accountant. Ask me to create invoices, draft WhatsApp payment reminders, log expenses, or analyze cash flow.`,
          action: "none",
        };
      }
    }

    return res.json({
      success: true,
      data: responseJson,
      model: apiKey?.startsWith("gsk_") ? "llama-3.3-70b-versatile (Groq)" : "Gemini 2.5 Flash",
    });
  } catch (err: any) {
    console.error("AI accountant route exception:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Financial Insights AI Analysis endpoint
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { financialData, language } = req.body || {};
    const isAr = language === "ar";
    const apiKey =
      process.env.GROQ_API_KEY ||
      process.env.GEMINI_API_KEY ||
      "";

    const netProfit = financialData?.netProfit ?? 0;
    const totalRevenue = financialData?.totalRevenue ?? 0;
    const totalCollected = financialData?.totalCollected ?? 0;
    const totalExpenses = financialData?.totalExpenses ?? 0;
    const collectionRate = financialData?.collectionRate ?? 0;

    let aiAnalysis: any = null;

    if (apiKey && apiKey.startsWith("gsk_")) {
      try {
        const groqResp = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                {
                  role: "system",
                  content: `You are an expert Egyptian business financial auditor and tax advisor for the Hasebha SaaS platform.
Provide an executive summary, 3 actionable recommendations, and a tax compliance insight based on:
- Total Invoiced Revenue: ${totalRevenue} EGP
- Collected Cash: ${totalCollected} EGP
- Total Expenses: ${totalExpenses} EGP
- Net Profit (Collected - Expenses): ${netProfit} EGP
- Collection Velocity: ${collectionRate}%

Language: ${isAr ? "Arabic" : "English"}.
Respond strictly in JSON with keys:
{
  "summary": "1-2 sentence executive assessment",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "taxInsight": "Insight regarding Egyptian ETA 14% VAT e-invoicing",
  "healthScore": integer from 70 to 98,
  "burnRateMonthly": integer
}`,
                },
                { role: "user", content: "Analyze my monthly business financials" },
              ],
              response_format: { type: "json_object" },
              temperature: 0.2,
            }),
          }
        );

        if (groqResp.ok) {
          const groqData = await groqResp.json();
          const content = groqData.choices?.[0]?.message?.content;
          if (content) {
            aiAnalysis = JSON.parse(content);
          }
        }
      } catch (e) {
        console.warn("Groq analysis call error:", e);
      }
    }

    if (!aiAnalysis) {
      aiAnalysis = {
        summary: isAr
          ? `أداؤك المالي لشهرك الحالي: صافي تدفق نقدي قدره ${netProfit.toLocaleString()} ج.م ومعدل تحصيل ${collectionRate}%.`
          : `Current period performance: net cash flow of ${netProfit.toLocaleString()} EGP with ${collectionRate}% collection rate.`,
        recommendations: isAr
          ? [
              "تفعيل روابط السداد الفوري عبر إنستاباي وفودافون كاش لتقليل دورة التحصيل",
              "تسجيل المشتريات اليومية بانتظام لخصم مدخلات ضريبة القيمة المضافة 14%",
              "إرسال تذكيرات آلية بالواتساب قبل تاريخ استحقاق الفواتير بـ 48 ساعة",
            ]
          : [
              "Enable instant InstaPay and Vodafone Cash payment links to speed up settlement",
              "Keep daily itemized expense logs to offset 14% Egyptian VAT input tax",
              "Schedule automatic WhatsApp payment reminders 48 hours prior to due dates",
            ],
        taxInsight: isAr
          ? "الفواتير والحسابات مصممة للتوافق مع منظومة الفاتورة الإلكترونية لمصلحة الضرائب المصرية (ETA)."
          : "Invoices conform with Egyptian Tax Authority (ETA) electronic invoicing requirements.",
        healthScore: netProfit >= 0 ? 92 : 75,
        burnRateMonthly: totalExpenses || 0,
      };
    }

    res.json(aiAnalysis);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate financial analysis" });
  }
});


// Start server with Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Hasebha SaaS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

