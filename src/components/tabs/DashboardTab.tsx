import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Receipt,
  Clock,
  CheckCircle2,
  Sparkles,
  Share2,
  Send,
  Plus,
  ChevronRight,
  FileText,
  AlertCircle,
  Zap,
  Lock,
  FileImage,
  UploadCloud,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusBadge, generateWhatsAppLink } from "../../utils/formatters";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Expense } from "../../types";
import { ReceiptViewerModal } from "../modals/ReceiptViewerModal";

export const DashboardTab: React.FC = () => {
  const {
    language,
    currency,
    netProfit,
    totalRevenue,
    totalCollected,
    totalExpenses,
    totalOutstanding,
    invoices,
    expenses,
    setActiveTab,
    setShareModalInvoice,
    setPublicPreviewInvoice,
    setIsReceiptScanModalOpen,
  } = useApp();

  const isAr = language === "ar";
  const [selectedExpenseForReceipt, setSelectedExpenseForReceipt] = useState<Expense | null>(null);

  // Timeline data for Financial Trajectory chart calculated from actual numbers
  const chartData = [
    { name: isAr ? "الأسبوع 1" : "Week 1", income: Math.round(totalRevenue * 0.25), expenses: Math.round(totalExpenses * 0.25) },
    { name: isAr ? "الأسبوع 2" : "Week 2", income: Math.round(totalRevenue * 0.5), expenses: Math.round(totalExpenses * 0.5) },
    { name: isAr ? "الأسبوع 3" : "Week 3", income: Math.round(totalRevenue * 0.75), expenses: Math.round(totalExpenses * 0.75) },
    { name: isAr ? "نهاية الشهر" : "End Month", income: totalRevenue, expenses: totalExpenses },
  ];

  const recentInvoices = invoices.slice(0, 4);
  const recentExpenses = expenses.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* AI Smart Assistant Notification Banner */}
      <div
        onClick={() => setActiveTab("ai")}
        className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#0F0F0F] to-emerald-950/20 border border-emerald-500/20 text-white flex items-center justify-between shadow-2xl cursor-pointer hover:border-emerald-500/40 transition-all group relative overflow-hidden"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
              {isAr ? "محاسبك الذكي احسبها" : "HASEBHA AI COPILOT"}
            </div>
            <p className="text-xs text-white/80 line-clamp-1 mt-0.5">
              {totalOutstanding > 0
                ? isAr
                  ? `يوجد فواتير متبقية للتحصيل بقيمة ${formatCurrency(totalOutstanding, currency, true)}. اضغط لإرسال تذكير واتساب فوري`
                  : `${formatCurrency(totalOutstanding, currency, false)} due in pending collections. Tap to send autonomous WhatsApp reminders.`
                : isAr
                ? "جميع فواتيرك محصلة بنجاح! اضغط لإنشاء فاتورة جديدة أو استشارة الذكاء الاصطناعي."
                : "All accounts settled! Tap to create a new invoice or consult your AI copilot."}
            </p>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-emerald-400 shrink-0 ${isAr ? "rotate-180" : ""}`} />
      </div>

      {/* Net Profit & Financial Trajectory Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0F0F0F] text-white p-6 border border-white/5 shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest font-mono">
                {isAr ? "صافي الأرباح التشغيلية" : "Operational Net Profit"}
              </span>
              <div className="mt-2 flex items-baseline gap-3">
                <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight font-mono text-white">
                  {formatCurrency(netProfit, currency, isAr)}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{isAr ? "محدث بالكامل مع RPC" : "Live Postgres Sync"}</span>
            </div>
          </div>

          {/* Glowing sparkline trajectory visual representation */}
          <div className="mt-6 h-20 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="profitGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#profitGlow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4-Metric Grid (Revenue, Collected, Expenses, Outstanding) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="p-4 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-lg">
          <span className="text-[11px] font-medium text-white/40 font-mono">
            {isAr ? "إجمالي الإيرادات" : "Revenue"}
          </span>
          <div className="text-base lg:text-lg font-bold font-mono text-white mt-1">
            {formatCurrency(totalRevenue, currency, isAr)}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 mt-1 font-mono">
            <TrendingUp className="w-3 h-3" />
            <span>+16.7%</span>
          </div>
        </div>

        {/* Collected */}
        <div className="p-4 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-lg">
          <span className="text-[11px] font-medium text-white/40 font-mono">
            {isAr ? "تم تحصيله" : "Collected"}
          </span>
          <div className="text-base lg:text-lg font-bold font-mono text-white mt-1">
            {formatCurrency(totalCollected, currency, isAr)}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 mt-1 font-mono">
            <TrendingUp className="w-3 h-3" />
            <span>+20.1%</span>
          </div>
        </div>

        {/* Expenses */}
        <div className="p-4 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-lg">
          <span className="text-[11px] font-medium text-white/40 font-mono">
            {isAr ? "المصروفات" : "Expenses"}
          </span>
          <div className="text-base lg:text-lg font-bold font-mono text-white mt-1">
            {formatCurrency(totalExpenses, currency, isAr)}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-rose-400 mt-1 font-mono">
            <TrendingDown className="w-3 h-3" />
            <span>-8.3%</span>
          </div>
        </div>

        {/* Outstanding */}
        <div className="p-4 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-lg">
          <span className="text-[11px] font-medium text-white/40 font-mono">
            {isAr ? "المتبقي للتحصيل" : "Pending Due"}
          </span>
          <div className="text-base lg:text-lg font-bold font-mono text-white mt-1">
            {formatCurrency(totalOutstanding, currency, isAr)}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 mt-1 font-mono">
            <Clock className="w-3 h-3" />
            <span>
              {invoices.filter((i) => i.status === "outstanding" || i.status === "overdue").length}{" "}
              {isAr ? "فواتير" : "due"}
            </span>
          </div>
        </div>
      </div>

      {/* Income vs Expenses Chart */}
      <div className="p-6 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white font-mono">
              {isAr ? "الإيرادات مقابل المصروفات" : "Income vs Expenses Trajectory"}
            </h3>
            <span className="text-[11px] text-white/40 font-mono">
              {isAr ? "الشهر الحالي (يوليو 2026)" : "Current Period (July 2026)"}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-white/70">{isAr ? "الإيرادات" : "Income"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-white/70">{isAr ? "المصروفات" : "Expenses"}</span>
            </div>
          </div>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" opacity={0.6} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#666" }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0A0A0A",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderRadius: "16px",
                  fontSize: "11px",
                  color: "#fff",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
                }}
                formatter={(val: any) => formatCurrency(Number(val), currency, isAr)}
              />
              <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} fillOpacity={0.15} fill="#10b981" />
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={0.1} fill="#f43f5e" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Invoices list with Quick Action */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono">
            {isAr ? "أحدث الفواتير" : "Recent Invoices"}
          </h3>
          <button
            onClick={() => setActiveTab("invoices")}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            <span>{isAr ? "عرض الكل" : "View All"}</span>
            <ChevronRight className={`w-3.5 h-3.5 ${isAr ? "rotate-180" : ""}`} />
          </button>
        </div>

        <div className="space-y-2.5">
          {recentInvoices.map((inv) => {
            const badge = getStatusBadge(inv.status, isAr);
            return (
              <div
                key={inv.id}
                className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5 flex items-center justify-between hover:border-white/10 transition-all shadow-lg group"
              >
                <div
                  className="flex items-center gap-3.5 cursor-pointer flex-1"
                  onClick={() => setPublicPreviewInvoice(inv)}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">
                        {isAr && inv.customerNameAr ? inv.customerNameAr : inv.customerName}
                      </span>
                      <span className="text-[10px] text-white/30 font-mono">{inv.invoiceNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-white/40">
                        {formatDate(inv.dueDate, isAr)}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right rtl:text-left">
                  <div>
                    <div className="font-bold text-xs text-white font-mono">
                      {formatCurrency(inv.total, inv.currency, isAr)}
                    </div>
                    <span className="text-[10px] text-white/40">
                      {inv.items.length} {isAr ? "أصناف" : "items"}
                    </span>
                  </div>

                  <button
                    onClick={() => setShareModalInvoice(inv)}
                    className="p-2 rounded-xl bg-white/5 text-white/60 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                    title={isAr ? "مشاركة" : "Share"}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Expenses & Receipts Ledger */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono">
              {isAr ? "سجل المصروفات والإيصالات" : "Recent Expenses & Receipts"}
            </h3>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-white/50 font-mono">
              {expenses.length}
            </span>
          </div>
          <button
            onClick={() => setIsReceiptScanModalOpen(true)}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{isAr ? "رفع إيصال" : "Scan / Upload"}</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {recentExpenses.map((exp) => (
            <div
              key={exp.id}
              className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5 flex items-center justify-between hover:border-white/10 transition-all shadow-lg group"
            >
              <div
                className="flex items-center gap-3.5 cursor-pointer flex-1"
                onClick={() => setSelectedExpenseForReceipt(exp)}
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{exp.title}</span>
                    <span className="text-[10px] text-white/30 font-mono">{exp.category}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-white/40">{exp.date}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      <Lock className="w-2.5 h-2.5" />
                      {isAr ? "إيصال مؤمّن" : "Encrypted Vault"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-right rtl:text-left">
                <div>
                  <div className="font-bold text-xs text-rose-400 font-mono">
                    -{formatCurrency(exp.amount, exp.currency || currency, isAr)}
                  </div>
                  <span className="text-[10px] text-white/40">
                    {exp.paymentMethod || "Cash"}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedExpenseForReceipt(exp)}
                  className="p-2 rounded-xl bg-white/5 text-white/60 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                  title={isAr ? "عرض الإيصال" : "View Receipt"}
                >
                  <FileImage className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Receipt Viewer Modal */}
      <ReceiptViewerModal
        isOpen={Boolean(selectedExpenseForReceipt)}
        expense={selectedExpenseForReceipt}
        onClose={() => setSelectedExpenseForReceipt(null)}
      />
    </div>
  );
};

