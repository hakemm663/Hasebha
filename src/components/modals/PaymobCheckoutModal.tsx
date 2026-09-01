import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  X,
  CreditCard,
  Zap,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Receipt,
  HelpCircle,
} from "lucide-react";
import { formatCurrency } from "../../utils/formatters";
import confetti from "canvas-confetti";

export const PaymobCheckoutModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  tier: "pro" | "business";
  billingCycle: "monthly" | "annual";
}> = ({ isOpen, onClose, tier, billingCycle }) => {
  const {
    language,
    business,
    updateBusinessProfile,
    setSubscriptionTier,
    addNotification,
  } = useApp();

  const isAr = language === "ar";
  const [paymentMethod, setPaymentMethod] = useState<"card" | "instapay" | "wallet" | "fawry">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [cardHolder, setCardHolder] = useState(business.ownerName || "Karim Fouad");
  const [cardExpiry, setCardExpiry] = useState("08/29");
  const [cardCvv, setCardCvv] = useState("321");
  const [walletPhone, setWalletPhone] = useState(business.bankDetails?.vodafoneCashNumber || "01098765432");

  if (!isOpen) return null;

  const basePrice = tier === "pro" ? 399 : 899;
  const price = billingCycle === "annual" ? Math.round(basePrice * 0.8) * 12 : basePrice;
  const tierName = tier === "pro" ? (isAr ? "الاحترافية (Pro)" : "Pro Plan") : (isAr ? "الشركات (Business)" : "Business Plan");

  const handlePaymobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Simulate Paymob Unified Checkout Intention & Callback
      await new Promise((resolve) => setTimeout(resolve, 1800));

      await setSubscriptionTier(tier);
      await updateBusinessProfile({
        subscriptionTier: tier,
        subscriptionStatus: "active",
        subscriptionRenewalDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
        paymentMethodSaved: {
          cardBrand: paymentMethod === "card" ? "Visa" : paymentMethod === "instapay" ? "InstaPay" : "Vodafone Cash",
          last4: paymentMethod === "card" ? cardNumber.replace(/\s+/g, "").slice(-4) : "8821",
          expiryDate: cardExpiry,
          type: paymentMethod === "card" ? "card" : paymentMethod === "instapay" ? "instapay" : "wallet",
        },
      });

      // Add payment notification
      addNotification({
        title: "Paymob Subscription Activated",
        titleAr: "تم تفعيل اشتراك احسبها بنجاح عبر Paymob",
        message: `Your ${tierName} plan is now active. Transaction ID: PM-${Math.floor(100000 + Math.random() * 900000)}.`,
        messageAr: `تم تفعيل خطة ${tierName} بنجاح. رقم العملية لدى Paymob: PM-${Math.floor(100000 + Math.random() * 900000)}.`,
        type: "payment_received",
      });

      setIsSuccess(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2500);
    } catch (err) {
      console.warn("Paymob checkout error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-xl bg-[#0C0C0C] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-white font-sans max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rtl:left-5 rtl:right-auto p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-8 space-y-4 font-mono">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">
              {isAr ? "تم إتمام الدفع وتفعيل الخطة بنجاح! 🎉" : "Payment Successful & Plan Activated! 🎉"}
            </h3>
            <p className="text-xs text-white/60 max-w-md mx-auto">
              {isAr
                ? `تم خصم ${formatCurrency(price, "EGP", true)} وتفعيل باقة ${tierName} لحسابك. تم ربط وسيلة الدفع لتجديد الاشتراك تلقائياً.`
                : `Charged ${formatCurrency(price, "EGP", false)} for ${tierName}. Payment method securely tokenized for auto-renewal.`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header with Paymob Badge */}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono font-bold">
                  Paymob Unified Gateway (Egypt)
                </span>
                <span className="text-[10px] text-white/40 font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>256-bit Encrypted</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                {isAr ? "إتمام الاشتراك عبر Paymob" : "Complete Subscription with Paymob"}
              </h2>
              <p className="text-xs text-white/60 mt-1">
                {isAr
                  ? `أنت تشترك الآن في باقة ${tierName} (${billingCycle === "annual" ? "اشتراك سنوي مع خصم 20%" : "اشتراك شهري"}).`
                  : `Subscribing to ${tierName} (${billingCycle === "annual" ? "Annual with 20% discount" : "Monthly"}).`}
              </p>
            </div>

            {/* Price Summary Card */}
            <div className="p-4 rounded-2xl bg-[#060606] border border-white/10 flex items-center justify-between font-mono">
              <div>
                <span className="text-[11px] text-white/50 block">
                  {isAr ? "المبلغ الإجمالي المستحق:" : "Total Amount Due:"}
                </span>
                <span className="text-lg font-black text-emerald-400">
                  {formatCurrency(price, "EGP", isAr)}
                </span>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold">
                {billingCycle === "annual" ? (isAr ? "فاتورة سنوية" : "Billed Annually") : (isAr ? "فاتورة شهرية" : "Billed Monthly")}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-white/60 block font-mono">
                {isAr ? "اختر وسيلة الدفع من Paymob:" : "Select Payment Channel:"}
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === "card"
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold shadow-lg shadow-emerald-500/10"
                      : "bg-[#060606] border-white/5 text-white/60 hover:bg-white/5"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-[11px] font-mono">{isAr ? "البطاقات البنكية" : "Credit Card"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("instapay")}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === "instapay"
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold shadow-lg shadow-emerald-500/10"
                      : "bg-[#060606] border-white/5 text-white/60 hover:bg-white/5"
                  }`}
                >
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] font-mono">InstaPay (انستاباي)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("wallet")}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === "wallet"
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold shadow-lg shadow-emerald-500/10"
                      : "bg-[#060606] border-white/5 text-white/60 hover:bg-white/5"
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-rose-400" />
                  <span className="text-[11px] font-mono">{isAr ? "فودافون كاش" : "Vodafone Cash"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("fawry")}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === "fawry"
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold shadow-lg shadow-emerald-500/10"
                      : "bg-[#060606] border-white/5 text-white/60 hover:bg-white/5"
                  }`}
                >
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] font-mono">{isAr ? "أمان / فوري" : "Fawry / Aman"}</span>
                </button>
              </div>
            </div>

            {/* Dynamic Form per Payment Method */}
            <form onSubmit={handlePaymobSubmit} className="space-y-4">
              {paymentMethod === "card" && (
                <div className="space-y-3 p-4 rounded-2xl bg-[#060606] border border-white/5 font-mono text-xs">
                  <div>
                    <label className="text-[10px] text-white/50 block mb-1">
                      {isAr ? "رقم البطاقة (Visa / Mastercard / Meeza)" : "Card Number (Visa / Mastercard / Meeza)"}
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      required
                      className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-white/50 block mb-1">
                        {isAr ? "تاريخ الانتهاء" : "Expiry (MM/YY)"}
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        required
                        className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/50 block mb-1">
                        {isAr ? "رمز التحقق (CVV)" : "CVV"}
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        required
                        className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "instapay" && (
                <div className="p-4 rounded-2xl bg-[#060606] border border-emerald-500/20 font-mono text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Zap className="w-4 h-4" />
                    <span>{isAr ? "السداد الفوري عبر إنستاباي (InstaPay IPA)" : "Instant InstaPay Settlement"}</span>
                  </div>
                  <p className="text-white/60 text-[11px] leading-relaxed">
                    {isAr
                      ? "سيتم تحويلك مباشرة لتأكيد الدفع عبر إنستاباي بدون أي رسوم إضافية وتفعيل حسابك في أجزاء من الثانية."
                      : "Paymob will route the transaction directly to InstaPay for instant 0% transaction fee verification."}
                  </p>
                </div>
              )}

              {paymentMethod === "wallet" && (
                <div className="space-y-3 p-4 rounded-2xl bg-[#060606] border border-white/5 font-mono text-xs">
                  <div>
                    <label className="text-[10px] text-white/50 block mb-1">
                      {isAr ? "رقم المحفظة الإلكترونية (فودافون كاش / أورانج / إتصالات / وي)" : "Mobile Wallet Number"}
                    </label>
                    <input
                      type="text"
                      value={walletPhone}
                      onChange={(e) => setWalletPhone(e.target.value)}
                      required
                      placeholder="010XXXXXXXX"
                      className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-[10px] text-white/40">
                    {isAr
                      ? "ستتلقى إشعاراً على هاتفك لإدخال الرقم السري لمحفظتك وتأكيد الخصم."
                      : "You will receive an OTP prompt on your handset to confirm the transaction with your wallet PIN."}
                  </p>
                </div>
              )}

              {paymentMethod === "fawry" && (
                <div className="p-4 rounded-2xl bg-[#060606] border border-amber-500/20 font-mono text-xs space-y-2">
                  <div className="text-amber-400 font-bold">
                    {isAr ? "كود السداد عبر ماكينات فوري وأمان" : "Fawry / Aman Reference Code"}
                  </div>
                  <div className="p-3 rounded-xl bg-[#0A0A0A] border border-amber-500/30 text-center">
                    <span className="text-lg font-black text-amber-300 tracking-widest">948 291 049</span>
                    <span className="text-[10px] text-white/40 block mt-1">
                      {isAr ? "صالح لمدة 48 ساعة في جميع منافذ فوري" : "Valid for 48 hours across all Egypt outlets"}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all font-mono"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>{isAr ? "جاري معالجة العملية عبر Paymob..." : "Processing Paymob Intention..."}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      {isAr
                        ? `دفع ${formatCurrency(price, "EGP", true)} وتفعيل باقة ${tierName}`
                        : `Pay ${formatCurrency(price, "EGP", false)} & Activate ${tierName}`}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
