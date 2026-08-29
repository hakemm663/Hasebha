import React from "react";
import { useApp, NavTab } from "../context/AppContext";
import {
  LayoutDashboard,
  FileText,
  TrendingDown,
  Users,
  Sparkles,
  PlusCircle,
  Code,
  ShieldCheck,
  Zap,
} from "lucide-react";

export const Sidebar: React.FC<{ onOpenFlutterArch: () => void }> = ({
  onOpenFlutterArch,
}) => {
  const { activeTab, setActiveTab, language, invoices, expenses, setQuickActionOpen } = useApp();
  const isAr = language === "ar";

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
  ];

  return (
    <aside className="w-[260px] bg-[#0A0A0A] border-r rtl:border-r-0 rtl:border-l border-white/5 flex flex-col p-6 shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Logo Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black font-black text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            H
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tighter bg-gradient-to-r from-white via-white/90 to-white/40 bg-clip-text text-transparent">
              HASEBHA
            </h1>
          </div>
        </div>
        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-1.5 font-mono">
          {isAr ? "منظومة الأعمال الذكية" : "Enterprise Suite"}
        </p>
      </div>

      {/* Nav Menu */}
      <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
        <div className="space-y-1.5">
          <p className="text-[10px] text-white/20 uppercase tracking-widest font-semibold ml-2 rtl:mr-2 mb-2">
            {isAr ? "إدارة الأعمال" : "Management"}
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-xs font-medium text-left rtl:text-right group ${
                  isActive
                    ? "bg-white/5 text-white border border-white/10 shadow-sm"
                    : "text-white/40 hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isActive ? (
                    <div className="w-1.5 h-4 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
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

        {/* Developer / Flutter Architecture button */}
        <div className="pt-2 border-t border-white/5 space-y-1">
          <p className="text-[10px] text-white/20 uppercase tracking-widest font-semibold ml-2 rtl:mr-2 mb-1">
            {isAr ? "المطور" : "Architecture"}
          </p>
          <button
            onClick={onOpenFlutterArch}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-white/40 hover:text-cyan-400 hover:bg-cyan-500/5 transition-colors text-xs font-medium"
          >
            <Code className="w-4 h-4 text-cyan-500/60" />
            <span>{isAr ? "معمارية Flutter BLoC" : "Flutter Architecture"}</span>
          </button>
        </div>
      </div>

      {/* Pro Version Bottom Card */}
      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-4 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] text-indigo-300 font-bold uppercase tracking-wider">
              {isAr ? "الإصدار الاحترافي" : "Pro Version"}
            </p>
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            {isAr
              ? "التقارير المالية التنبؤية وضريبة 14% مفعلة تلقائياً."
              : "Advanced automated financial reporting active."}
          </p>
        </div>
      </div>
    </aside>
  );
};
