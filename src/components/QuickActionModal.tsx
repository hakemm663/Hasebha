import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  FileText,
  CreditCard,
  Mic,
  UserPlus,
  X,
  Plus,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ExpenseCategory } from "../types";

export const QuickActionModal: React.FC<{
  onOpenContactImport: () => void;
}> = ({ onOpenContactImport }) => {
  const {
    quickActionOpen,
    setQuickActionOpen,
    setActiveTab,
    language,
    addExpense,
    currency,
  } = useApp();

  const isAr = language === "ar";
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>("Purchases");

  const handleCreateInvoice = () => {
    setQuickActionOpen(false);
    setActiveTab("create");
  };

  const handleOpenAiVoice = () => {
    setQuickActionOpen(false);
    setActiveTab("ai");
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return;

    addExpense({
      title: expenseTitle,
      amount: parseFloat(expenseAmount),
      category: expenseCategory,
      date: new Date().toISOString().split("T")[0],
      currency,
      paymentMethod: "Cash",
    });

    setExpenseTitle("");
    setExpenseAmount("");
    setShowExpenseForm(false);
    setQuickActionOpen(false);
    setActiveTab("invoices");
  };

  return (
    <AnimatePresence>
      {quickActionOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-[#0A0A0A] rounded-3xl p-6 shadow-2xl border border-white/10 text-white font-mono"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">
                  {showExpenseForm
                    ? isAr
                      ? "تسجيل مصروف جديد"
                      : "Record New Expense"
                    : isAr
                    ? "إجراء مالي سريع"
                    : "Quick Financial Action"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowExpenseForm(false);
                  setQuickActionOpen(false);
                }}
                className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {showExpenseForm ? (
              <form onSubmit={handleSaveExpense} className="mt-4 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
                    {isAr ? "وصف المصروف" : "Expense Title"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? "مثال: أدوات مكتبية، إعلانات..." : "e.g. Office Supplies, Facebook Ads"}
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#0F0F0F] border border-white/10 text-xs text-white placeholder:text-white/30 font-sans focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
                      {isAr ? `المبلغ (${currency})` : `Amount (${currency})`}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#0F0F0F] border border-white/10 text-xs text-white placeholder:text-white/30 font-mono focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
                      {isAr ? "التصنيف" : "Category"}
                    </label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#0F0F0F] border border-white/10 text-xs text-white font-sans focus:outline-none focus:border-white/30"
                    >
                      <option value="Purchases" className="bg-[#0F0F0F] text-white">{isAr ? "مشتريات وبضاعة" : "Purchases"}</option>
                      <option value="Marketing" className="bg-[#0F0F0F] text-white">{isAr ? "تسويق وإعلانات" : "Marketing"}</option>
                      <option value="Transport" className="bg-[#0F0F0F] text-white">{isAr ? "شحن ومواصلات" : "Transport"}</option>
                      <option value="Utilities" className="bg-[#0F0F0F] text-white">{isAr ? "مرافق وفواتير" : "Utilities"}</option>
                      <option value="Salaries" className="bg-[#0F0F0F] text-white">{isAr ? "رواتب وأجور" : "Salaries"}</option>
                      <option value="Rent" className="bg-[#0F0F0F] text-white">{isAr ? "إيجار" : "Rent"}</option>
                      <option value="Other" className="bg-[#0F0F0F] text-white">{isAr ? "أخرى" : "Other"}</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExpenseForm(false)}
                    className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors"
                  >
                    {isAr ? "رجوع" : "Back"}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-xl shadow-emerald-500/20"
                  >
                    {isAr ? "حفظ المصروف" : "Save Expense"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {/* Create Invoice */}
                <button
                  onClick={handleCreateInvoice}
                  className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5 flex flex-col items-start hover:border-white/20 transition-all text-left rtl:text-right group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs text-white">
                    {isAr ? "فاتورة جديدة" : "New Invoice"}
                  </span>
                  <span className="text-[10px] text-white/40 mt-0.5">
                    {isAr ? "إنشاء ومشاركة رابط أو PDF" : "Share via link or PDF"}
                  </span>
                </button>

                {/* Add Expense */}
                <button
                  onClick={() => setShowExpenseForm(true)}
                  className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5 flex flex-col items-start hover:border-white/20 transition-all text-left rtl:text-right group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-3">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs text-white">
                    {isAr ? "تسجيل مصروف" : "Add Expense"}
                  </span>
                  <span className="text-[10px] text-white/40 mt-0.5">
                    {isAr ? "تتبع التدفق النقدي" : "Manage cash flow"}
                  </span>
                </button>

                {/* Voice AI Assistant */}
                <button
                  onClick={handleOpenAiVoice}
                  className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5 flex flex-col items-start hover:border-emerald-500/30 transition-all text-left rtl:text-right group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs text-white">
                    {isAr ? "محاسب حاسبها AI" : "Hasebha AI"}
                  </span>
                  <span className="text-[10px] text-white/40 mt-0.5">
                    {isAr ? "أمر صوتي لإنشاء الفواتير" : "Voice-to-invoice"}
                  </span>
                </button>

                {/* Import Contact */}
                <button
                  onClick={() => {
                    setQuickActionOpen(false);
                    onOpenContactImport();
                  }}
                  className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5 flex flex-col items-start hover:border-white/20 transition-all text-left rtl:text-right group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/5 text-white/80 border border-white/10 flex items-center justify-center mb-3">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs text-white">
                    {isAr ? "استيراد جهات اتصال" : "Import Contacts"}
                  </span>
                  <span className="text-[10px] text-white/40 mt-0.5">
                    {isAr ? "إضافة عميل من الهاتف" : "From phone contacts"}
                  </span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
