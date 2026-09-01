import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  X,
  Code2,
  Server,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Zap,
  ArrowRight,
  Terminal,
  FileCode,
} from "lucide-react";

export const PaymobArchitectureGuideModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { language } = useApp();
  const isAr = language === "ar";
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const nodeExpressCode = `// server/paymob.ts - Production Paymob Integration for Hasebha SaaS
import express from "express";
import crypto from "crypto";

const router = express.Router();

const PAYMOB_SECRET_KEY = process.env.PAYMOB_SECRET_KEY!;
const PAYMOB_PUBLIC_KEY = process.env.PAYMOB_PUBLIC_KEY!;
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET!;
const PAYMOB_INTEGRATION_ID_CARD = process.env.PAYMOB_INTEGRATION_ID_CARD!; // e.g. 459201
const PAYMOB_INTEGRATION_ID_WALLET = process.env.PAYMOB_INTEGRATION_ID_WALLET!; // e.g. 459202
const PAYMOB_INTEGRATION_ID_INSTAPAY = process.env.PAYMOB_INTEGRATION_ID_INSTAPAY!; // e.g. 459203

/**
 * 1. Create Paymob Intention (Unified Checkout)
 * POST /api/paymob/create-intention
 */
router.post("/api/paymob/create-intention", async (req, res) => {
  try {
    const { amountEgp, customerEmail, customerName, customerPhone, tier, billingCycle } = req.body;

    const amountInCents = Math.round(amountEgp * 100); // Paymob requires amount in cents/piastres

    const intentionPayload = {
      amount: amountInCents,
      currency: "EGP",
      payment_methods: [
        Number(PAYMOB_INTEGRATION_ID_CARD),
        Number(PAYMOB_INTEGRATION_ID_WALLET),
        Number(PAYMOB_INTEGRATION_ID_INSTAPAY),
      ],
      items: [
        {
          name: \`Hasebha SaaS - \${tier.toUpperCase()} Plan (\${billingCycle})\`,
          amount: amountInCents,
          description: "Intelligent Cloud Accounting & AI Copilot",
          quantity: 1,
        },
      ],
      billing_data: {
        first_name: customerName.split(" ")[0] || "Karim",
        last_name: customerName.split(" ")[1] || "Fouad",
        email: customerEmail,
        phone_number: customerPhone || "+201000000000",
        country: "EGY",
      },
      customer: {
        first_name: customerName.split(" ")[0] || "Karim",
        last_name: customerName.split(" ")[1] || "Fouad",
        email: customerEmail,
      },
      special_reference: \`hasebha_sub_\${Date.now()}_\${Math.random().toString(36).substring(2, 7)}\`,
      notification_url: "https://your-domain.com/api/paymob/webhook",
      redirection_url: "https://your-domain.com/dashboard?payment=success",
    };

    const paymobResponse = await fetch("https://accept.paymob.com/v1/intention/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: \`Token \${PAYMOB_SECRET_KEY}\`,
      },
      body: JSON.stringify(intentionPayload),
    });

    const data = await paymobResponse.json();
    
    // Returns client_secret used by Paymob Unified Checkout iframe / mobile SDK
    res.json({
      success: true,
      clientSecret: data.client_secret,
      publicKey: PAYMOB_PUBLIC_KEY,
      paymentUrl: \`https://accept.paymob.com/unifiedcheckout/?publicKey=\${PAYMOB_PUBLIC_KEY}&clientSecret=\${data.client_secret}\`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 2. Secure Paymob Transaction Webhook Listener with HMAC SHA512 Verification
 * POST /api/paymob/webhook
 */
router.post("/api/paymob/webhook", async (req, res) => {
  try {
    const { hmac } = req.query; // Or req.headers["hmac"]
    const data = req.body.obj;

    // Concatenate specified Paymob fields in exact alphabetical order for HMAC calculation
    const concatenatedString = [
      data.amount_cents,
      data.created_at,
      data.currency,
      data.error_occured,
      data.has_parent_transaction,
      data.id,
      data.integration_id,
      data.is_3d_secure,
      data.is_auth,
      data.is_capture,
      data.is_refunded,
      data.is_standalone_payment,
      data.is_voided,
      data.order?.id,
      data.owner,
      data.pending,
      data.source_data?.pan,
      data.source_data?.sub_type,
      data.source_data?.type,
      data.success,
    ].join("");

    const calculatedHmac = crypto
      .createHmac("sha512", PAYMOB_HMAC_SECRET)
      .update(concatenatedString)
      .digest("hex");

    if (calculatedHmac !== hmac) {
      console.error("Paymob HMAC signature verification failed!");
      return res.status(401).json({ error: "Invalid HMAC signature" });
    }

    if (data.success === true) {
      // Settle SaaS subscription in Database (Supabase)
      console.log(\`✅ Payment verified for order \${data.order?.id}. Tokenized card: \${data.token}\`);
      // Update business subscription tier & save card token for auto-renewal
    }

    res.status(200).json({ status: "received" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-3xl bg-[#0C0C0C] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-white font-sans max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rtl:left-5 rtl:right-auto p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
              {isAr ? "دليل الربط التقني والمعماري لـ Paymob" : "PAYMOB SAAS BACKEND ARCHITECTURE"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {isAr ? "لماذا Node.js هو الخيار الأفضل لـ Hasebha؟ وكيفية الربط مع Paymob" : "Why Node.js (TypeScript) is Superior & Paymob Implementation"}
          </h2>
          <p className="text-xs text-white/60 leading-relaxed">
            {isAr
              ? "مقارنة معمارية حاسمة بين Node.js و .NET و PHP مع خطوات الربط الكاملة لبوابة Paymob الموحدة في مصر."
              : "Definitive backend architecture decision for Hasebha SaaS with full Paymob Unified Checkout integration code."}
          </p>
        </div>

        {/* Comparison Section */}
        <div className="my-6 p-5 rounded-2xl bg-[#060606] border border-emerald-500/20 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white font-mono">
              {isAr ? "القرار التقني الموصى به: Node.js (TypeScript with Express)" : "Recommended Choice: Node.js (TypeScript with Express)"}
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <span className="text-emerald-400 font-bold block">1. Node.js (الخيار الأفضل)</span>
              <p className="text-[11px] text-white/70">
                {isAr
                  ? "مشاركة الأنواع (TypeScript) بالكامل مع الويب والموبايل، معالجة فورية للـ Webhooks والـ HMAC بسرعة فائقة واستهلاك ذاكرة قليل جداً."
                  : "End-to-end TypeScript type safety, ultra-fast asynchronous webhook handling, seamless Gemini AI & Supabase SDK integration."}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1 opacity-70">
              <span className="text-white/60 font-bold block">2. .NET (C#)</span>
              <p className="text-[11px] text-white/50">
                {isAr
                  ? "قوي وممتاز للمؤسسات الكبرى ولكنه أثقل في وقت الإقلاع (Cold Starts) ويحتاج تكلفة سيرفرات أعلى واستقلالية لغات."
                  : "Enterprise-grade but heavier cold start latency, higher container footprint, separate language context from frontend."}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1 opacity-70">
              <span className="text-white/60 font-bold block">3. PHP (Laravel)</span>
              <p className="text-[11px] text-white/50">
                {isAr
                  ? "سريع في البدء لكنه synchronous ويحتاج خوادم إضافية (Swoole / Redis) لدعم الـ WebSockets والذكاء الاصطناعي في الوقت الفعلي."
                  : "Synchronous execution model requires external queue workers for streaming AI & real-time webhook listeners."}
              </p>
            </div>
          </div>
        </div>

        {/* 5 Implementation Steps */}
        <div className="space-y-4 font-mono text-xs">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? "خطوات تفعيل بوابة Paymob لمشروعك (Web + Mobile)" : "5 Steps to Activate Paymob in Production"}</span>
          </h4>

          <div className="space-y-2 text-white/70 text-[11px]">
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#060606] border border-white/5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">1</span>
              <span>{isAr ? "أنشئ حساباً على لوحة تحكم Paymob Accept واحصل على API Keys و HMAC Secret." : "Create Paymob Accept merchant account and extract Secret Key, Public Key & HMAC Secret."}</span>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#060606] border border-white/5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">2</span>
              <span>{isAr ? "فعل قنوات الدفع (Cards, Mobile Wallets, InstaPay, Fawry) وانسخ Integration IDs لكل قناة." : "Enable payment integrations (Card, Wallets, InstaPay, Fawry) and note their Integration IDs."}</span>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#060606] border border-white/5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">3</span>
              <span>{isAr ? "استخدم Paymob Intention API لإنشاء جلسة دفع موحدة وإرجاع رابط Unified Checkout للمستخدم." : "Call Paymob Intention API to create payment intent and return client_secret / Unified Checkout URL."}</span>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#060606] border border-white/5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">4</span>
              <span>{isAr ? "أنشئ Webhook Listener للتحقق من توقيع HMAC SHA512 وتحديث حالة الاشتراك في قاعدة البيانات." : "Build secure Webhook endpoint with HMAC SHA512 signature validation to confirm subscription."}</span>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#060606] border border-white/5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">5</span>
              <span>{isAr ? "احفظ Card Token للتجديد التلقائي للاشتراك الشهري أو السنوي للعملاء." : "Store tokenized card credential for automated monthly / annual recurring billing."}</span>
            </div>
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>server/paymob.ts (Node.js + Express)</span>
            </div>
            <button
              onClick={() => copyToClipboard(nodeExpressCode, "code")}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-400 font-mono text-xs transition-colors"
            >
              {copiedSection === "code" ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAr ? "تم النسخ!" : "Copied!"}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isAr ? "نسخ الكود" : "Copy Code"}</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-[#050505] border border-white/10 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-72 leading-relaxed">
            <code>{nodeExpressCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
