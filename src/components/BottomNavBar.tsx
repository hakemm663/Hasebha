import React from "react";
import { useApp, NavTab } from "../context/AppContext";
import { Home, Receipt, Plus, Users, BarChart3, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export const BottomNavBar: React.FC = () => {
  const { activeTab, setActiveTab, language, setQuickActionOpen } = useApp();
  const isAr = language === "ar";

  const tabs = [
    {
      id: "dashboard" as NavTab,
      label: isAr ? "الرئيسية" : "Home",
      icon: Home,
    },
    {
      id: "invoices" as NavTab,
      label: isAr ? "الفواتير" : "Invoices",
      icon: Receipt,
    },
    {
      id: "center-plus" as any,
      label: "",
      isFab: true,
    },
    {
      id: "customers" as NavTab,
      label: isAr ? "العملاء" : "Customers",
      icon: Users,
    },
    {
      id: "insights" as NavTab,
      label: isAr ? "التقارير" : "Insights",
      icon: BarChart3,
    },
  ];

  return (
    <div className="sticky bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/5 px-3 py-2 transition-colors">
      <div className="flex items-center justify-around max-w-lg mx-auto relative">
        {tabs.map((tab) => {
          if (tab.isFab) {
            return (
              <div key="fab" className="relative -top-4 flex items-center justify-center">
                <button
                  onClick={() => setQuickActionOpen(true)}
                  className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all focus:outline-none"
                  aria-label="Quick action"
                >
                  <Plus className="w-6 h-6 stroke-[3]" />
                </button>
              </div>
            );
          }

          const Icon = tab.icon!;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as NavTab)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative ${
                isActive
                  ? "text-white font-bold"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110 text-emerald-400" : ""}`} />
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

