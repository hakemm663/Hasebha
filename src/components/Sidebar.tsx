import React, { useState } from "react";
import { useApp, NavTab } from "../context/AppContext";
import {
  LayoutDashboard,
  FileText,
  TrendingDown,
  Users,
  Sparkles,
  PlusCircle,
  Smartphone,
  Building2,
  LogOut,
  Settings,
  Bell,
  CreditCard,
} from "lucide-react";

export const Sidebar: React.FC<{
  onOpenMobileApp: () => void;
  onOpenLanding?: () => void;
  onCloseMobileNav?: () => void;
}> = ({ onOpenMobileApp, onOpenLanding, onCloseMobileNav }) => {
  const {
    activeTab,
    setActiveTab,
    language,
    invoices,
    business,
    user,
    demoMode,
    signOut,
    isSupabaseOnline,
    unreadNotificationsCount,
    setIsAuthModalOpen,
    setIsPaymobModalOpen,
  } = useApp();
  const isAr = language === "ar";

  const currentTier = business.subscriptionTier || "pro";

  const navItems = [
    {
      id: "dashboard" as NavTab,
      label: isAr ? "مركز التحليل والرئيسية" : "Analysis Center",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "invoices" as NavTab,
      label: isAr ? "الفواتير والمطالبات" : "Invoices",
      icon: FileText,
      badge: invoices.length > 0 ? invoices.length : null,
    },
    {
      id: "create" as NavTab,
      label: isAr ? "إنشاء فاتورة جديدة" : "New Invoice",
      icon: PlusCircle,
      badge: null,
    },
    {
      id: "customers" as NavTab,
      label: isAr ? "دليل العملاء" : "Customers",
      icon: Users,
      badge: null,
    },
    {
      id: "insights" as NavTab,
      label: isAr ? "التقارير والمصروفات" : "Insights & Expenses",
      icon: TrendingDown,
      badge: null,
    },
    {
      id: "ai" as NavTab,
      label: isAr ? "محاسب احسبها الذكي" : "AI Accountant Agent",
      icon: Sparkles,
      badge: isAr ? "نشط" : "LIVE",
    },
    {
      id: "notifications" as NavTab,
      label: isAr ? "مركز الإشعارات" : "Notifications",
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : null,
    },
    {
      id: "settings" as NavTab,
      label: isAr ? "إعدادات المنشأة والسداد" : "Business & Payments",
      icon: Settings,
      badge: null,
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    if (onCloseMobileNav) onCloseMobileNav();
  };

  return (
    <aside className="w-[260px] bg-[#0A0A0A] border-r rtl:border-r-0 rtl:border-l border-white/5 flex flex-col p-6 shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Logo Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-black font-black text-base shadow-md">
            H
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white font-mono">
              HASEBHA
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">
                {isSupabaseOnline ? "Cloud Sync Active" : "Live Workspace"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
        <div className="space-y-1.5">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold ml-2 rtl:mr-2 mb-2 font-mono">
            {isAr ? "إدارة الأعمال" : "Management"}
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-xs font-medium text-left rtl:text-right group ${
                  isActive
                    ? "bg-white/10 text-white border border-white/10 shadow-sm"
                    : "text-white/40 hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isActive ? (
                    <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                  ) : (
                    <Icon className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                  )}
                  <span className={isActive ? "font-semibold text-white" : ""}>
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold font-mono ${
                      item.id === "ai"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : item.id === "notifications"
                        ? "bg-emerald-500 text-black font-extrabold"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile App & SaaS Navigation */}
        <div className="pt-2 border-t border-white/5 space-y-1 font-mono">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold ml-2 rtl:mr-2 mb-1">
            {isAr ? "المنظومة والخدمات" : "Ecosystem"}
          </p>
          <button
            onClick={() => {
              onOpenMobileApp();
              if (onCloseMobileNav) onCloseMobileNav();
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl text-white/50 hover:text-emerald-400 hover:bg-emerald-500/5 transition-colors text-xs font-medium group"
          >
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-emerald-500/60 group-hover:text-emerald-400 transition-colors" />
              <span>{isAr ? "تطبيق الموبايل" : "Mobile App"}</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              iOS / Android
            </span>
          </button>
          {onOpenLanding && (
            <button
              onClick={() => {
                onOpenLanding();
                if (onCloseMobileNav) onCloseMobileNav();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.02] transition-colors text-xs font-medium"
            >
              <Sparkles className="w-4 h-4 text-white/30" />
              <span>{isAr ? "بوابات الدفع والأسعار" : "Paymob & Pricing"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Subscription Tier & User Footer Card */}
      <div className="mt-auto pt-4 border-t border-white/5 space-y-3 font-mono">
        {/* Tier Card with Paymob Upgrade Modal Trigger */}
        <div
          onClick={() => setIsPaymobModalOpen(true)}
          className="bg-gradient-to-br from-[#141E18] to-[#0A0A0A] p-3.5 rounded-2xl border border-emerald-500/30 relative cursor-pointer hover:border-emerald-500/60 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase">
                {currentTier} Plan
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 group-hover:text-emerald-300 font-bold underline flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              <span>{isAr ? "Paymob" : "Paymob"}</span>
            </span>
          </div>
          <p className="text-[10px] text-white/40 mt-1 font-sans">
            {isAr ? "فواتير غير محدودة + OCR + تذكيرات" : "Unlimited invoices + OCR + AI Copilot"}
          </p>
        </div>

        {/* User Account / Sign In / Sign Out Row */}
        <div className="flex items-center justify-between text-xs text-white/50 px-1">
          <div
            onClick={() => {
              if (user) {
                setActiveTab("settings");
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            className="truncate max-w-[150px] cursor-pointer hover:text-white transition-colors"
          >
            <span className="text-[11px] text-white/80 block truncate">
              {user?.email || (demoMode ? (isAr ? "الوضع التجريبي" : "Demo Mode") : business.ownerName || "Account")}
            </span>
          </div>
          {user || demoMode ? (
            <button
              onClick={signOut}
              title={isAr ? "تسجيل الخروج" : "Sign Out"}
              className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-400 text-white/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold"
            >
              {isAr ? "دخول" : "Sign In"}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
