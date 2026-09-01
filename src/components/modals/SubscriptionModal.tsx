import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  X,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  CreditCard,
  Smartphone,
  QrCode,
  Copy,
  Check,
  ArrowRight,
  Receipt,
  Clock,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { formatCurrency } from "../../utils/formatters";

export const SubscriptionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const {
    language,
    currency,
    business,
    setSubscriptionTier,
  } = useApp();

  const isAr = language === "ar";
  const [selectedTier, setSelectedTier] = useState<"pro" | "business">("pro");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [paymentMethod, setPaymentMethod] = useState<"instapay" | "vodafone" | "card" | "fawry">("instapay");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpgraded, setIsUpgraded] = useState(false);

  if (!isOpen) return null;

  const currentTier = business.subscriptionTier || "free";

  const prices = {
    pro: {
      monthly: currency === "USD" ? 9 : currency === "SAR" ? 35 : 199,
      annual: currency === "USD" ? 79 : currency === "SAR" ? 299 : 1890,
    },
    business: {
      monthly: currency === "USD" ? 22 : currency === "SAR" ? 85 : 499,
      annual: currency === "USD" ? 199 : currency === "SAR" ? 790 : 4790,
    },
  };

  const amountToPay = prices[selectedTier][billingCycle];

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleProcessUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate backend payment verification & webhook subscription activation
    setTimeout(async () => {
      await setSubscriptionTier(selectedTier);
      setIsProcessing(false);
      setIsUpgraded(true);

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch (e) {}

      setTimeout(() => {
        setIsUpgraded(false);
        onClose();
      }, 2500);
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-[#0D0D0D] rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 text-white relative my-6 font-mono"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rtl:right-auto rtl:left-5 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {isUpgraded ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white">
                {isAr ? "تم تفعيل الاشتراك بنجاح! 🎉" : "Subscription Activated! 🎉"}
              </h3>
              <p className="text-sm text-emerald-400 font-sans max-w-md mx-auto">
                {isAr
                  ? `أصبحت منشأتك (${business.businessName}) الآن على باقة ${selectedTier.toUpperCase()}. تم فتح جميع مميزات الذكاء الاصطناعي والفواتير غير المحدودة.`
                  : `Your business (${business.businessName}) is now on ${selectedTier.toUpperCase()} Plan. Unlimited invoices and AI capabilities are live.`}
              </p>
            </div>
          ) : (
            <div>
              {/* Header Title */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAr ? "ترقية خطة SaaS" : "UPGRADE WORKSPACE"}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {isAr ? "اختر الخطة المناسبة لتنمية أعمالك" : "Supercharge Your Business Cash Flow"}
                </h2>
                <p className="text-xs text-white/50 font-sans mt-1">
                  {isAr
                    ? "فواتير غير محدودة، تحصيل فوري عبر إنستاباي، محاسب AI ذكي، ومطابقة للضرائب المصرية (ETA)."
                    : "Unlimited invoices, 1-tap WhatsApp collections, ETA e-invoicing compliance, and AI copilot."}
                </p>

                {/* Billing cycle switch */}
                <div className="inline-flex items-center p-1 rounded-2xl bg-[#141414] border border-white/10 mt-4">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      billingCycle === "monthly"
                        ? "bg-emerald-500 text-black shadow-md"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {isAr ? "اشتراك شهري" : "Monthly"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("annual")}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      billingCycle === "annual"
                        ? "bg-emerald-500 text-black shadow-md"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <span>{isAr ? "اشتراك سنوي" : "Annual"}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-black text-[9px] font-extrabold">
                      {isAr ? "وفر 20%" : "20% OFF"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Tiers Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* PRO PLAN */}
                <div
                  onClick={() => setSelectedTier("pro")}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer relative ${
                    selectedTier === "pro"
                      ? "bg-gradient-to-b from-emerald-950/40 to-[#121212] border-emerald-500 shadow-xl shadow-emerald-950/30 ring-1 ring-emerald-500"
                      : "bg-[#141414] border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase">
                      {isAr ? "الخطة الاحترافية (Pro)" : "Pro Plan"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      {isAr ? "الأكثر طلباً" : "Popular"}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-2xl font-black text-white">
                      {formatCurrency(prices.pro[billingCycle], currency, isAr)}
                    </span>
                    <span className="text-xs text-white/40">
                      /{billingCycle === "monthly" ? (isAr ? "شهر" : "mo") : (isAr ? "سنة" : "yr")}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-white/70 font-sans mt-3 border-t border-white/5 pt-3">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{isAr ? "عدد فواتير ومصروفات غير محدود" : "Unlimited Invoices & Expenses"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{isAr ? "محاسب AI صوتي وكتابي ذكي" : "AI Voice & Text Accountant"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{isAr ? "روابط سداد إنستاباي وفودافون كاش" : "InstaPay & Wallet Deep-Links"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{isAr ? "باركود الفاتورة الضريبية (ETA QR)" : "ETA Electronic QR Codes"}</span>
                    </li>
                  </ul>
                </div>

                {/* BUSINESS PLAN */}
                <div
                  onClick={() => setSelectedTier("business")}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer relative ${
                    selectedTier === "business"
                      ? "bg-gradient-to-b from-cyan-950/40 to-[#121212] border-cyan-500 shadow-xl shadow-cyan-950/30 ring-1 ring-cyan-500"
                      : "bg-[#141414] border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-400 uppercase">
                      {isAr ? "خطة الشركات (Enterprise)" : "Business Plan"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                      {isAr ? "شاملة" : "Advanced"}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-2xl font-black text-white">
                      {formatCurrency(prices.business[billingCycle], currency, isAr)}
                    </span>
                    <span className="text-xs text-white/40">
                      /{billingCycle === "monthly" ? (isAr ? "شهر" : "mo") : (isAr ? "سنة" : "yr")}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-white/70 font-sans mt-3 border-t border-white/5 pt-3">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{isAr ? "كل مميزات باقة Pro" : "Everything in Pro"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{isAr ? "تصدير الفواتير لمنظومة الضرائب المصرية" : "ETA Egyptian XML/JSON Tax Export"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{isAr ? "تعدد العملات والشركات" : "Multi-Currency & Multi-Entity"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{isAr ? "دعم فني مالي مباشر 24/7" : "24/7 Dedicated Tax Advisory"}</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
                  {isAr ? "اختر طريقة السداد المحلية أو الدولية" : "Select Payment Gateway"}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("instapay")}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === "instapay"
                        ? "bg-purple-950/40 border-purple-500 text-purple-300 ring-1 ring-purple-500"
                        : "bg-[#141414] border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-purple-400" />
                    <span className="text-[11px] font-bold">InstaPay (إنستاباي)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("vodafone")}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === "vodafone"
                        ? "bg-rose-950/40 border-rose-500 text-rose-300 ring-1 ring-rose-500"
                        : "bg-[#141414] border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-rose-400" />
                    <span className="text-[11px] font-bold">Vodafone Cash (فودافون)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === "card"
                        ? "bg-emerald-950/40 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500"
                        : "bg-[#141414] border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    <span className="text-[11px] font-bold">Credit Card (فيزا / كارت)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("fawry")}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === "fawry"
                        ? "bg-amber-950/40 border-amber-500 text-amber-300 ring-1 ring-amber-500"
                        : "bg-[#141414] border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    <Receipt className="w-5 h-5 text-amber-400" />
                    <span className="text-[11px] font-bold">Fawry Pay (فوري)</span>
                  </button>
                </div>

                {/* Gateway Detail Sub-forms */}
                <form onSubmit={handleProcessUpgrade} className="space-y-4 pt-2">
                  {paymentMethod === "instapay" && (
                    <div className="p-4 rounded-2xl bg-[#141414] border border-purple-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/60">
                          {isAr ? "عنوان الدفع اللحظي (IPA):" : "InstaPay IPA Handle:"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-400 font-mono">
                            hasebha@instapay
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy("hasebha@instapay", "ipa")}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60"
                          >
                            {copiedField === "ipa" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-white/40 uppercase mb-1">
                          {isAr ? "رقم العملية أو المرجع (Reference No):" : "Transaction Reference Number:"}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={isAr ? "أدخل رقم عملية التحويل من تطبيق إنستاباي" : "e.g. IPN-98421045"}
                          value={referenceId}
                          onChange={(e) => setReferenceId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === "vodafone" && (
                    <div className="p-4 rounded-2xl bg-[#141414] border border-rose-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/60">
                          {isAr ? "رقم محفظة التحويل:" : "Wallet Mobile Number:"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-rose-400 font-mono">
                            01012345678
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy("01012345678", "wallet")}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60"
                          >
                            {copiedField === "wallet" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-white/40 uppercase mb-1">
                          {isAr ? "رقم الهاتف المحول منه أو مرجع الرسالة:" : "Sender Mobile / SMS Reference:"}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="010XXXXXXXX"
                          value={referenceId}
                          onChange={(e) => setReferenceId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === "card" && (
                    <div className="p-4 rounded-2xl bg-[#141414] border border-emerald-500/30 space-y-3">
                      <div>
                        <label className="block text-[10px] text-white/40 uppercase mb-1">
                          {isAr ? "رقم البطاقة الائتمانية" : "Card Number"}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="4111 •••• •••• 4242"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-white/40 uppercase mb-1">
                            {isAr ? "تاريخ الانتهاء" : "Expiry"}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/40 uppercase mb-1">
                            CVC
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="•••"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "fawry" && (
                    <div className="p-4 rounded-2xl bg-[#141414] border border-amber-500/30 text-center space-y-2">
                      <span className="text-xs text-white/60">
                        {isAr ? "كود الدفع المرجعي لخدمة فوري:" : "Fawry Payment Reference Code:"}
                      </span>
                      <div className="text-2xl font-black text-amber-400 font-mono tracking-widest">
                        984 210 592
                      </div>
                      <p className="text-[11px] text-white/40 font-sans">
                        {isAr
                          ? "صالح لمدة 72 ساعة في أي ماكينة فوري أو تطبيق فوري باي."
                          : "Valid for 72 hours across all Fawry POS terminals and FawryPay app."}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <span>{isAr ? "جاري تأكيد السداد وتفعيل الباقة..." : "Verifying Payment & Activating..."}</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {isAr
                            ? `تأكيد الترقية إلى باقة ${selectedTier.toUpperCase()} (${formatCurrency(amountToPay, currency, true)})`
                            : `Upgrade to ${selectedTier.toUpperCase()} (${formatCurrency(amountToPay, currency, false)})`}
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
