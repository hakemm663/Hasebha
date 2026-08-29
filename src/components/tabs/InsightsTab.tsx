import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  RefreshCw,
  PieChart as PieIcon,
  ShieldCheck,
  Zap,
  Target,
  ArrowRight,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { formatCurrency } from "../../utils/formatters";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FinancialAnalysisData } from "../../types";

export const InsightsTab: React.FC = () => {
  const {
    language,
    currency,
    netProfit,
    totalRevenue,
    totalCollected,
    totalExpenses,
    totalOutstanding,
    collectionRate,
    avgDaysToGetPaid,
    expenses,
    invoices,
  } = useApp();

  const isAr = language === "ar";
  const [timeRange, setTimeRange] = useState("this_month");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<FinancialAnalysisData | null>(null);

  // Profit Trend Data matching mockup
  const profitTrendData = [
    { date: isAr ? "1 يوليو" : "1 Jul", profit: 24000 },
    { date: isAr ? "8 يوليو" : "8 Jul", profit: 31000 },
    { date: isAr ? "15 يوليو" : "15 Jul", profit: 36500 },
    { date: isAr ? "22 يوليو" : "22 Jul", profit: 39000 },
    { date: isAr ? "31 يوليو" : "31 Jul", profit: 42850 },
  ];

  // Expenses category breakdown matching mockup
  const categoryData = [
    { name: isAr ? "المشتريات والبضاعة" : "Purchases", value: 45, color: "#10b981", amount: 15580 },
    { name: isAr ? "التسويق والإعلانات" : "Marketing", value: 20, color: "#3b82f6", amount: 6920 },
    { name: isAr ? "النقل والمواصلات" : "Transport", value: 15, color: "#f59e0b", amount: 5190 },
    { name: isAr ? "المرافق والخدمات" : "Utilities", value: 10, color: "#ec4899", amount: 3460 },
    { name: isAr ? "أخرى" : "Other", value: 10, color: "#8b5cf6", amount: 3470 },
  ];

  // Automated Monthly Financial AI Analysis on mount or trigger
  const runAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          financialData: {
            netProfit,
            totalRevenue,
            totalCollected,
            totalExpenses,
            totalOutstanding,
            collectionRate,
            avgDaysToGetPaid,
            topExpenses: categoryData,
            unpaidInvoicesCount: invoices.filter((i) => i.status !== "paid").length,
          },
          language,
        }),
      });
      const data = await res.json();
      setAiReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    runAiAnalysis();
  }, [language]);

  return (
    <div className="space-y-6">
      {/* Top Header & Range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white font-mono">
            {isAr ? "التقارير والتحليل المالي" : "Financial Analytics & P&L"}
          </h2>
          <span className="text-[11px] text-white/40 font-mono">
            {isAr ? "أداء الأرباح والتدفق النقدي الذكي" : "Real-time Profitability & Cash Flow Analysis"}
          </span>
        </div>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3.5 py-2 rounded-2xl bg-[#0F0F0F] border border-white/10 text-xs font-bold text-white font-mono focus:outline-none focus:border-white/30"
        >
          <option value="this_month">{isAr ? "هذا الشهر" : "This Month"}</option>
          <option value="last_quarter">{isAr ? "الربع الأخير" : "Last Quarter"}</option>
          <option value="this_year">{isAr ? "هذا العام" : "This Year"}</option>
        </select>
      </div>

      {/* Profit Trend Card */}
      <div className="p-6 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono">
              {isAr ? "صافي أرباح الفترة" : "Net Period Profit"}
            </span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {formatCurrency(netProfit, currency, isAr)}
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 font-mono">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>▲ +18.4%</span>
          </div>
        </div>

        {/* Responsive Line Chart */}
        <div className="h-44 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={profitTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0A0A0A",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderRadius: "16px",
                  fontSize: "11px",
                  color: "#fff",
                  fontFamily: "monospace",
                }}
                formatter={(val: any) => formatCurrency(Number(val), currency, isAr)}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#050505" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Metric Gauges (Collection Rate & Avg Days to Get Paid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Collection Rate */}
        <div className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-xl flex flex-col items-center text-center">
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono mb-2">
            {isAr ? "معدل التحصيل" : "Collection Rate"}
          </span>

          <div className="relative w-20 h-20 flex items-center justify-center my-2">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/5"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-400"
                strokeDasharray={`${collectionRate}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-base font-black text-white font-mono">
              {collectionRate}%
            </span>
          </div>

          <div className="mt-1 text-xs font-bold text-emerald-400 font-mono">
            {isAr ? "ممتاز! ▲ +6%" : "Optimal! ▲ +6%"}
          </div>
          <span className="text-[10px] text-white/40 font-mono mt-0.5">
            {isAr ? "عن الشهر الماضي" : "vs last month"}
          </span>
        </div>

        {/* Avg. Days to Get Paid */}
        <div className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-xl flex flex-col items-center text-center">
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono mb-2">
            {isAr ? "متوسط أيام السداد" : "Avg. Days to Get Paid"}
          </span>

          <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center my-2">
            <span className="text-xl font-black text-indigo-400 font-mono">
              28 <span className="text-xs font-semibold">{isAr ? "يوم" : "d"}</span>
            </span>
          </div>

          <div className="mt-1 text-xs font-bold text-emerald-400 font-mono">
            {isAr ? "أسرع بـ 4 أيام ▼" : "vs last month -4 days"}
          </div>
          <span className="text-[10px] text-white/40 font-mono mt-0.5">
            {isAr ? "تحسن في سرعة استرداد النقد" : "Accelerated cash recovery"}
          </span>
        </div>
      </div>

      {/* Expenses by Category Donut Chart */}
      <div className="p-6 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono">
              {isAr ? "توزيع المصروفات حسب الفئة" : "Expense Breakdown"}
            </h3>
            <span className="text-[11px] text-white/40 font-mono">
              {isAr ? "هذا الشهر" : "Current Period"}
            </span>
          </div>
          <span className="text-xs font-bold text-white font-mono">
            {formatCurrency(totalExpenses, currency, isAr)}
          </span>
        </div>

        <div className="grid grid-cols-12 gap-4 items-center">
          {/* Donut */}
          <div className="col-span-12 sm:col-span-5 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={56}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0A0A0A",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    fontSize: "11px",
                    color: "#fff",
                    fontFamily: "monospace",
                  }}
                  formatter={(val: any) => `${val}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="col-span-12 sm:col-span-7 space-y-2 text-xs font-mono">
            {categoryData.map((cat, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-white/70 truncate text-[11px]">{cat.name}</span>
                </div>
                <span className="font-bold text-white text-[11px]">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Automated AI Monthly Financial Analysis & Business Notes */}
      <div className="p-6 rounded-3xl bg-[#0F0F0F] border border-emerald-500/20 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
                {isAr ? "تحليل حاسبها الذكي للأعمال" : "Hasebha AI Executive Financial Audit"}
              </h4>
              <span className="text-[10px] text-white/40 font-mono">
                {isAr ? "تشخيص فوري للأعمال والنصائح التنبؤية" : "Instant business health diagnosis & forecasting"}
              </span>
            </div>
          </div>

          <button
            onClick={runAiAnalysis}
            disabled={isAnalyzing}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title={isAr ? "تحديث التحليل" : "Refresh Analysis"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>

        {isAnalyzing ? (
          <div className="py-8 text-center space-y-2">
            <Sparkles className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
            <p className="text-xs text-white/50 font-mono">
              {isAr ? "جاري تدقيق البيانات المالية وحساب مؤشرات السيولة..." : "Analyzing cash flow metrics and generating insights..."}
            </p>
          </div>
        ) : aiReport ? (
          <div className="space-y-4 text-xs font-mono">
            {/* Health Score Pill */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0A0A0A] border border-white/5">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white/80">
                  {isAr ? "مؤشر صحة الأعمال:" : "Financial Health Score:"}
                </span>
              </div>
              <span className="font-black text-emerald-400 text-sm">
                {aiReport.healthScore || 88}/100 ({aiReport.healthStatus || "Strong"})
              </span>
            </div>

            {/* Executive Summary */}
            <p className="text-white/80 leading-relaxed text-xs bg-[#0A0A0A] p-4 rounded-2xl border border-white/5 font-sans">
              {aiReport.executiveSummary}
            </p>

            {/* Recommendations */}
            <div className="space-y-2.5">
              <span className="font-bold text-white/60 text-xs flex items-center gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                {isAr ? "إجراءات مقترحة لزيادة الأرباح والسيولة:" : "Actionable Growth & Cash Flow Recommendations:"}
              </span>
              <div className="space-y-2">
                {aiReport.actionableRecommendations?.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-white/80 bg-[#0A0A0A] p-3 rounded-2xl border border-white/5 font-sans">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-mono">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

