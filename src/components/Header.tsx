import React from "react";
import { useApp } from "../context/AppContext";
import { Bell, Sparkles, Globe, CheckCircle2, Code, Menu } from "lucide-react";
import { formatCurrency } from "../utils/formatters";
import { CurrencyCode } from "../types";

export const Header: React.FC<{
  onOpenFlutterArch?: () => void;
  onOpenLanding?: () => void;
  onToggleMobileMenu?: () => void;
}> = ({ onOpenFlutterArch, onOpenLanding, onToggleMobileMenu }) => {
  const {
    language,
    setLanguage,
    currency,
    setCurrency,
    business,
    activeTab,
    setActiveTab,
    invoices,
    netProfit,
    isSupabaseOnline,
  } = useApp();

  const isAr = language === "ar";
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  return (
    <header className="h-20 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-[#050505] sticky top-0 z-30 transition-colors">
      {/* Left: Mobile Menu Button + User Welcome */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="relative shrink-0 hidden sm:block">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white font-bold shadow-sm font-mono">
            {business.ownerName.charAt(0)}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#050505] rounded-full" />
        </div>

        <div>
          <h2 className="text-sm lg:text-base font-light text-white/90">
            {isAr ? "أهلاً، " : "Ahlan, "}
            <span className="font-semibold text-white">
              {isAr ? business.ownerNameAr : business.ownerName}
            </span>
          </h2>
          <p className="text-[11px] text-white/40 flex items-center gap-1.5 mt-0.5 font-mono">
            <span className="truncate max-w-[120px] sm:max-w-[200px]">
              {business.businessName}
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-medium flex items-center gap-0.5 shrink-0">
              <CheckCircle2 className="w-3 h-3 inline" />
              {isAr ? "نظام سحابي نشط" : "Live Workspace"}
            </span>
          </p>
        </div>
      </div>

      {/* Right: Net Cash Flow & Controls */}
      <div className="flex items-center gap-2.5 sm:gap-4 lg:gap-6">
        {/* Net Cash Flow Metric Banner */}
        <div className="text-right rtl:text-left hidden md:block">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
            {isAr ? "صافي التدفق النقدي" : "Net Cash Flow"}
          </p>
          <p className="text-base lg:text-lg font-mono font-bold text-emerald-400">
            +{formatCurrency(netProfit > 0 ? netProfit : 42850, currency, isAr)}
          </p>
        </div>

        {/* Currency Switcher */}
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
          className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 text-[11px] font-mono font-bold text-white/80 focus:outline-none transition-colors cursor-pointer"
        >
          <option value="EGP" className="bg-[#0A0A0A] text-white">EGP (ج.م)</option>
          <option value="SAR" className="bg-[#0A0A0A] text-white">SAR (ر.س)</option>
          <option value="USD" className="bg-[#0A0A0A] text-white">USD ($)</option>
          <option value="AED" className="bg-[#0A0A0A] text-white">AED (د.إ)</option>
        </select>

        {/* Language Switcher */}
        <button
          onClick={() => setLanguage(language === "en" ? "ar" : "en")}
          className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-[11px] font-bold flex items-center gap-1.5 transition-colors font-mono"
          title="Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-white/60" />
          <span>{language === "en" ? "العربية" : "EN"}</span>
        </button>

        {/* SaaS Landing Page Overview Trigger */}
        {onOpenLanding && (
          <button
            onClick={onOpenLanding}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold font-mono transition-colors hidden sm:flex items-center gap-1.5"
            title={isAr ? "خطط الأسعار ومميزات SaaS" : "SaaS Pricing & Mobile App"}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? "الباقات والأسعار" : "SaaS Plans"}</span>
          </button>
        )}

        {/* Flutter Architecture Blueprint Modal Trigger */}
        {onOpenFlutterArch && (
          <button
            onClick={onOpenFlutterArch}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-cyan-400 transition-colors"
            title={isAr ? "معمارية Flutter" : "Flutter Architecture"}
          >
            <Code className="w-4 h-4" />
          </button>
        )}

        {/* Notifications Icon Button */}
        <button
          onClick={() => setActiveTab("invoices")}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:border-white/20 transition-all relative"
          title={isAr ? "الإشعارات والفواتير" : "Notifications"}
        >
          <Bell className="w-4 h-4" />
          {overdueCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          )}
        </button>
      </div>
    </header>
  );
};


