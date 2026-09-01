import React from "react";
import { useApp } from "../../context/AppContext";
import {
  X,
  Smartphone,
  Sparkles,
  Send,
  Camera,
  WifiOff,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Download,
  Apple,
  Play,
  ArrowUpRight,
} from "lucide-react";

export const MobileAppModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { language } = useApp();
  const isAr = language === "ar";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-2xl bg-[#0C0C0C] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto no-scrollbar font-sans">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rtl:left-5 rtl:right-auto p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Pill */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
            {isAr ? "تطبيق الهاتف الذكي" : "NATIVE MOBILE COMPANION"}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
            Flutter 3.x
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          {isAr ? "تطبيق احسبها للهواتف الذكية" : "Hasebha on iOS & Android"}
        </h2>
        <p className="text-xs sm:text-sm text-white/60 mt-1.5 leading-relaxed">
          {isAr
            ? "محاسبك المالي وإدارة الفواتير في جيبك أينما كنت. مزامنة فورية كاملة مع لوحة تحكم الويب وقاعدة بيانات سحابية مشفرة."
            : "Your autonomous financial accountant in your pocket. Real-time bi-directional sync with your web dashboard and encrypted cloud storage."}
        </p>

        {/* 4 Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-6">
          <div className="p-4 rounded-2xl bg-[#060606] border border-white/5 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white font-mono">
              {isAr ? "تذكيرات واتساب آلية بضغطة زر" : "1-Tap WhatsApp Reminders"}
            </h4>
            <p className="text-[11px] text-white/50 leading-normal">
              {isAr
                ? "إرسال رسائل تذكير لطيفة بالعامية المصرية مع رابط السداد المباشر عبر إنستاباي."
                : "Polite automated collection messages sent via WhatsApp with direct InstaPay links."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#060606] border border-white/5 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white font-mono">
              {isAr ? "مسح فواتير الشراء بالكاميرا (OCR)" : "Smart OCR Receipt Scanner"}
            </h4>
            <p className="text-[11px] text-white/50 leading-normal">
              {isAr
                ? "صور إيصالات ومشتريات العمل اليومية، والذكاء الاصطناعي يستخرج المبالغ والتصنيف فوراً."
                : "Snap photos of receipts on the go; AI extracts line items, VAT, and vendor names."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#060606] border border-white/5 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <WifiOff className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white font-mono">
              {isAr ? "يعمل بدون إنترنت (Offline-First)" : "Full Offline Support"}
            </h4>
            <p className="text-[11px] text-white/50 leading-normal">
              {isAr
                ? "سجل الفواتير والمصروفات حتى في حال انقطاع الشبكة، وستتم المزامنة تلقائياً عند الاتصال."
                : "Create invoices and log expenses without connection; auto-syncs when online."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#060606] border border-white/5 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white font-mono">
              {isAr ? "سداد فوري عبر إنستاباي وفودافون كاش" : "Instant InstaPay Deep Links"}
            </h4>
            <p className="text-[11px] text-white/50 leading-normal">
              {isAr
                ? "روابط مباشرة تفتح تطبيق إنستاباي لتحويل المبلغ بضغطة واحدة وتأكيد التحصيل."
                : "Deep links launch the customer's InstaPay app directly with pre-filled amount."}
            </p>
          </div>
        </div>

        {/* Download Buttons / Coming Soon Banner */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#121B14] to-[#0A0A0A] border border-emerald-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
                {isAr ? "الإطلاق الرسمي قريباً" : "OFFICIAL APP STORE RELEASE"}
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">
                {isAr ? "احصل على إشعار عند إتاحة التحميل" : "Be the first to download"}
              </h4>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold">
              {isAr ? "قريباً جداً" : "Coming Soon"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Apple App Store Disabled Button */}
            <button
              disabled
              className="flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 cursor-not-allowed font-mono text-xs opacity-75"
            >
              <Apple className="w-5 h-5 text-white/60" />
              <div className="text-left rtl:text-right">
                <span className="text-[9px] block text-white/40 uppercase">Coming Soon on</span>
                <span className="font-bold text-white/80">App Store (iOS)</span>
              </div>
            </button>

            {/* Google Play Store Disabled Button */}
            <button
              disabled
              className="flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 cursor-not-allowed font-mono text-xs opacity-75"
            >
              <Play className="w-5 h-5 text-white/60 fill-white/20" />
              <div className="text-left rtl:text-right">
                <span className="text-[9px] block text-white/40 uppercase">Coming Soon on</span>
                <span className="font-bold text-white/80">Google Play (Android)</span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 flex items-center justify-between text-[11px] text-white/40 font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? "متطابق 100% مع حساب الويب" : "Unified with Hasebha Web"}</span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-emerald-400 transition-colors underline font-bold"
          >
            {isAr ? "إغلاق ومتابعة الويب" : "Back to Web Dashboard"}
          </button>
        </div>
      </div>
    </div>
  );
};
