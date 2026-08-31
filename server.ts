import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Hasebha - احسبها (SaaS Dashboard)",
    backend: "Supabase",
    timestamp: new Date().toISOString(),
  });
});

// Financial Insights AI Analysis endpoint
app.post("/api/ai/analyze", (req, res) => {
  try {
    const { financialData, language } = req.body || {};
    const isAr = language === "ar";
    const netProfit = financialData?.netProfit || 42850;
    const collectionRate = financialData?.collectionRate || 86;

    res.json({
      summary: isAr
        ? `أداؤك المالي ممتاز هذا الشهر بصافي أرباح قدره ${netProfit.toLocaleString()} ج.م ومعدل تحصيل ${collectionRate}%. نوصي بزيادة وتيرة إرسال تذكيرات الواتساب لتحصيل المبالغ المتأخرة خلال 48 ساعة.`
        : `Your business financial health is strong with net profit of ${netProfit.toLocaleString()} EGP and an ${collectionRate}% collection velocity. We recommend expediting WhatsApp payment reminders for late invoices within 48 hours.`,
      recommendations: isAr
        ? [
            "تفعيل التحصيل عبر إنستاباي وفودافون كاش لتقليل فترة السداد بنسبة 35%",
            "تسجيل المشتريات اليومية بانتظام لخصم ضريبة القيمة المضافة 14%",
            "إعادة التفاوض مع الموردين ذوي الفواتير الأعلى لتوفير 8% شهرياً",
          ]
        : [
            "Enable automated InstaPay & Vodafone Cash links to reduce collection cycles by 35%",
            "Keep daily receipts logged to offset 14% Egyptian VAT tax liability",
            "Negotiate volume discounts with top vendors to save ~8% monthly",
          ],
      taxInsight: isAr
        ? "إقرارات ضريبة القيمة المضافة متوافقة مع منظومة الفاتورة الإلكترونية لمصلحة الضرائب المصرية (ETA)."
        : "VAT reports are fully formatted and compliant with Egyptian Tax Authority (ETA) e-invoice standards.",
      healthScore: 92,
      burnRateMonthly: financialData?.totalExpenses || 34620,
    });
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

