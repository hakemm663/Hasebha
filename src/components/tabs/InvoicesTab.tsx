import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  FileText,
  Search,
  Filter,
  Share2,
  Download,
  Send,
  Plus,
  TrendingDown,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  ExternalLink,
  Scan,
  FileSpreadsheet,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  getStatusBadge,
  generateWhatsAppLink,
  exportInvoicesToCsv,
  exportExpensesToCsv,
} from "../../utils/formatters";
import { generateInvoicePdf } from "../../utils/pdfGenerator";
import { InvoiceStatus } from "../../types";

export const InvoicesTab: React.FC = () => {
  const {
    invoices,
    expenses,
    business,
    language,
    currency,
    updateInvoiceStatus,
    setShareModalInvoice,
    setPublicPreviewInvoice,
    setActiveTab,
    setQuickActionOpen,
    setIsReceiptScanModalOpen,
  } = useApp();

  const isAr = language === "ar";
  const [subTab, setSubTab] = useState<"invoices" | "expenses">("invoices");
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchesSearch =
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerNameAr && inv.customerNameAr.includes(searchQuery));
    return matchesStatus && matchesSearch;
  });

  const filteredExpenses = expenses.filter((exp) => {
    return (
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.titleAr && exp.titleAr.includes(searchQuery))
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub-tab Pill Switcher */}
      <div className="p-1 bg-[#0A0A0A] rounded-2xl flex items-center gap-1 border border-white/5">
        <button
          onClick={() => setSubTab("invoices")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 ${
            subTab === "invoices"
              ? "bg-white text-black shadow-lg"
              : "text-white/40 hover:text-white"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{isAr ? "الفواتير والمطالبات" : "Invoices"} ({invoices.length})</span>
        </button>

        <button
          onClick={() => setSubTab("expenses")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 ${
            subTab === "expenses"
              ? "bg-white text-black shadow-lg"
              : "text-white/40 hover:text-white"
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>{isAr ? "سجل المصروفات" : "Expenses"} ({expenses.length})</span>
        </button>
      </div>

      {/* Search Bar & Actions */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5" />
          <input
            type="text"
            placeholder={
              subTab === "invoices"
                ? isAr
                  ? "بحث عن فاتورة أو عميل..."
                  : "Search invoice or client..."
                : isAr
                ? "بحث عن مصروف أو تصنيف..."
                : "Search expense or category..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 rounded-2xl bg-[#0F0F0F] border border-white/5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
          />
        </div>

        {/* CSV Export Button */}
        <button
          onClick={() => {
            if (subTab === "invoices") {
              exportInvoicesToCsv(invoices, business.businessName);
            } else {
              exportExpensesToCsv(expenses, business.businessName);
            }
          }}
          className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
          title={isAr ? "تصدير إلى ملف إكسيل / CSV" : "Export to CSV/Excel"}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">{isAr ? "تصدير CSV" : "Export CSV"}</span>
        </button>

        {/* Scan Receipt Button on Expenses */}
        {subTab === "expenses" && (
          <button
            onClick={() => setIsReceiptScanModalOpen(true)}
            className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
            title={isAr ? "مسح إيصال بالذكاء الاصطناعي (OCR)" : "Smart OCR Receipt Scan"}
          >
            <Scan className="w-4 h-4" />
            <span className="hidden sm:inline">{isAr ? "مسح إيصال (OCR)" : "Scan Receipt"}</span>
          </button>
        )}

        {/* Add New Button */}
        <button
          onClick={() => (subTab === "invoices" ? setActiveTab("create") : setQuickActionOpen(true))}
          className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all shadow-lg shadow-emerald-500/20 shrink-0"
          title={isAr ? "إضافة جديد" : "Add New"}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {subTab === "invoices" ? (
        <>
          {/* Status Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
            {[
              { id: "all", label: isAr ? "الكل" : "All" },
              { id: "outstanding", label: isAr ? "متبقي" : "Outstanding" },
              { id: "overdue", label: isAr ? "متأخر" : "Overdue" },
              { id: "paid", label: isAr ? "مدفوع" : "Paid" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all border ${
                  statusFilter === f.id
                    ? "bg-white text-black border-transparent shadow-sm"
                    : "bg-[#0F0F0F] text-white/50 border-white/5 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Invoices List */}
          <div className="space-y-3">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12 bg-[#0F0F0F] rounded-3xl border border-white/5 p-6">
                <FileText className="w-10 h-10 text-white/20 mx-auto mb-2" />
                <p className="text-xs text-white/40">
                  {isAr ? "لا توجد فواتير مطابقة للبحث" : "No invoices found"}
                </p>
              </div>
            ) : (
              filteredInvoices.map((inv) => {
                const badge = getStatusBadge(inv.status, isAr);
                return (
                  <div
                    key={inv.id}
                    className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-xl space-y-4 hover:border-white/10 transition-all"
                  >
                    {/* Header: Customer & Status */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-white/30">
                          {inv.invoiceNumber}
                        </span>
                        <h4
                          onClick={() => setPublicPreviewInvoice(inv)}
                          className="font-bold text-sm text-white cursor-pointer hover:text-emerald-400 transition-colors mt-0.5"
                        >
                          {isAr && inv.customerNameAr ? inv.customerNameAr : inv.customerName}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-white/40 mt-1 font-mono">
                          <span>{isAr ? "استحقاق:" : "Due:"} {formatDate(inv.dueDate, isAr)}</span>
                          <span>•</span>
                          <span>{inv.items.length} {isAr ? "أصناف" : "items"}</span>
                        </div>
                      </div>

                      <div className="text-right rtl:text-left">
                        <div className="font-extrabold text-sm text-white font-mono">
                          {formatCurrency(inv.total, inv.currency, isAr)}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-1.5 ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Download PDF */}
                        <button
                          onClick={() => generateInvoicePdf(inv, business, isAr)}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                          title={isAr ? "تحميل PDF" : "Download PDF"}
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden sm:inline">PDF</span>
                        </button>

                        {/* Share Web Link */}
                        <button
                          onClick={() => setShareModalInvoice(inv)}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                          title={isAr ? "مشاركة الرابط" : "Share Link"}
                        >
                          <Share2 className="w-3.5 h-3.5 text-white/60" />
                          <span className="hidden sm:inline">{isAr ? "رابط" : "Link"}</span>
                        </button>

                        {/* WhatsApp Direct Reminder */}
                        {inv.status !== "paid" && (
                          <a
                            href={generateWhatsAppLink(
                              inv.customerPhone,
                              isAr
                                ? `مرحباً ${inv.customerName}، تذكير باستحقاق فاتورة ${inv.invoiceNumber} بقيمة ${formatCurrency(inv.total, inv.currency, true)}. رابط الدفع: https://hasebha.app/pay/${inv.invoiceNumber}`
                                : `Hi ${inv.customerName}, gentle reminder regarding invoice ${inv.invoiceNumber} for ${formatCurrency(inv.total, inv.currency, false)}. View & pay: https://hasebha.app/pay/${inv.invoiceNumber}`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                            title={isAr ? "تذكير واتساب" : "WhatsApp Reminder"}
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isAr ? "واتساب" : "WhatsApp"}</span>
                          </a>
                        )}
                      </div>

                      {/* Status Toggle Button */}
                      {inv.status !== "paid" ? (
                        <button
                          onClick={() => updateInvoiceStatus(inv.id, "paid", "InstaPay")}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-sm"
                        >
                          {isAr ? "تم التحصيل ✓" : "Mark Paid ✓"}
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {inv.paymentMethod || "InstaPay"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Expenses List */
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-[#0F0F0F] text-white flex items-center justify-between border border-white/5 shadow-2xl">
            <div>
              <span className="text-[11px] font-semibold text-white/40 uppercase font-mono">
                {isAr ? "إجمالي المصروفات" : "Total Logged Expenses"}
              </span>
              <h3 className="text-2xl font-bold font-mono text-rose-400 mt-1">
                {formatCurrency(
                  expenses.reduce((acc, e) => acc + e.amount, 0),
                  currency,
                  isAr
                )}
              </h3>
            </div>
            <div className="text-right rtl:text-left text-[11px] text-white/40 font-mono">
              <span>{expenses.length} {isAr ? "معاملات مسجلة" : "entries"}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5 flex items-center justify-between shadow-md"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xs">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-white">
                      {isAr && exp.titleAr ? exp.titleAr : exp.title}
                    </h5>
                    <div className="flex items-center gap-2 text-[10px] text-white/40 mt-1 font-mono">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/70 font-medium">
                        {exp.category}
                      </span>
                      <span>{formatDate(exp.date, isAr)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right rtl:text-left">
                  <div className="font-bold text-xs text-rose-400 font-mono">
                    -{formatCurrency(exp.amount, exp.currency, isAr)}
                  </div>
                  <span className="text-[10px] text-white/40">{exp.paymentMethod}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

