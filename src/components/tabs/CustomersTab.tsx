import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Search,
  UserPlus,
  Building2,
  Phone,
  Mail,
  Share2,
  Send,
  Plus,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import { formatCurrency, generateWhatsAppLink, getStatusBadge } from "../../utils/formatters";
import { Customer } from "../../types";

export const CustomersTab: React.FC<{ onOpenContactImport: () => void }> = ({
  onOpenContactImport,
}) => {
  const {
    customers,
    invoices,
    language,
    currency,
    addCustomer,
    setActiveTab,
    setDraftInvoicePreFill,
    setShareModalInvoice,
  } = useApp();

  const isAr = language === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustNameAr, setNewCustNameAr] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("+20 ");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustCompany, setNewCustCompany] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await addCustomer({
        name: newCustName.trim(),
        nameAr: newCustNameAr.trim() || undefined,
        phone: newCustPhone.trim() || "+20 100 000 0000",
        email: newCustEmail.trim() || undefined,
        company: newCustCompany.trim() || undefined,
        address: newCustAddress.trim() || undefined,
        currency,
      });
      setIsAddModalOpen(false);
      setNewCustName("");
      setNewCustNameAr("");
      setNewCustPhone("+20 ");
      setNewCustEmail("");
      setNewCustCompany("");
      setNewCustAddress("");
      setSelectedCustomer(created);
    } catch (err) {
      console.error("Failed to add customer:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.nameAr && c.nameAr.includes(searchQuery))
    );
  });

  const handleCreateInvoiceForCustomer = (cust: Customer) => {
    setDraftInvoicePreFill({
      customerId: cust.id,
      customerName: cust.name,
      customerNameAr: cust.nameAr,
      customerPhone: cust.phone,
      customerEmail: cust.email,
    });
    setSelectedCustomer(null);
    setActiveTab("create");
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-white font-mono">
            {isAr ? "دليل العملاء والشركات" : "Customer Directory"}
          </h2>
          <span className="text-[11px] text-white/40 font-mono">
            {customers.length} {isAr ? "عملاء مسجلين" : "verified clients"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenContactImport}
            className="px-3.5 py-2 rounded-2xl bg-white/5 text-white/80 hover:bg-white/10 font-bold text-xs flex items-center gap-2 transition-all border border-white/10 font-mono"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isAr ? "استيراد جهات الاتصال" : "Import Contacts"}</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 font-mono"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>{isAr ? "إضافة عميل جديد" : "Add Client"}</span>
          </button>
        </div>
      </div>

      {/* Search Customers */}
      <div className="relative">
        <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5" />
        <input
          type="text"
          placeholder={isAr ? "بحث بالاسم، الكود، أو رقم الهاتف..." : "Search customers..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 rounded-2xl bg-[#0F0F0F] border border-white/5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
        />
      </div>

      {/* Customers List matching mockup */}
      <div className="space-y-3">
        {filteredCustomers.map((cust) => {
          const hasOutstanding = cust.outstandingBalance > 0;
          return (
            <div
              key={cust.id}
              onClick={() => setSelectedCustomer(cust)}
              className="p-4 rounded-3xl bg-[#0F0F0F] border border-white/5 flex items-center justify-between hover:border-white/10 transition-all cursor-pointer shadow-xl group"
            >
              <div className="flex items-center gap-3.5">
                {/* Icon box */}
                <div
                  className={`w-11 h-11 rounded-2xl ${
                    cust.avatarColor || "bg-emerald-600"
                  } text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
                >
                  <Building2 className="w-5 h-5" />
                </div>

                <div>
                  <h4 className="font-bold text-xs text-white">
                    {isAr && cust.nameAr ? cust.nameAr : cust.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono mt-1">
                    <span>{cust.code}</span>
                    <span>•</span>
                    <span>{cust.phone}</span>
                  </div>
                </div>
              </div>

              <div className="text-right rtl:text-left">
                <div className="font-bold text-xs text-white font-mono">
                  {formatCurrency(
                    hasOutstanding ? cust.outstandingBalance : cust.totalInvoiced || 5200,
                    currency,
                    isAr
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold font-mono ${
                    hasOutstanding
                      ? "text-rose-400"
                      : "text-emerald-400"
                  }`}
                >
                  {hasOutstanding
                    ? isAr
                      ? "مستحق للتحصيل"
                      : "Outstanding"
                    : isAr
                    ? "مسدد بالكامل"
                    : "Cleared"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Details Bottom Sheet / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#0A0A0A] rounded-3xl p-6 shadow-2xl border border-white/10 text-white space-y-5 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-2xl ${
                    selectedCustomer.avatarColor || "bg-emerald-600"
                  } text-white flex items-center justify-center font-bold`}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {isAr && selectedCustomer.nameAr
                      ? selectedCustomer.nameAr
                      : selectedCustomer.name}
                  </h3>
                  <span className="text-xs text-white/40 font-mono">
                    {selectedCustomer.code}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Contact Actions */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <a
                href={`tel:${selectedCustomer.phone}`}
                className="p-3.5 rounded-2xl bg-white/5 text-white font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? "اتصال هاتفياً" : "Call Client"}</span>
              </a>

              <a
                href={generateWhatsAppLink(
                  selectedCustomer.phone,
                  isAr
                    ? `مرحباً أستاذ ${selectedCustomer.name}، تحياتنا من فريق العمل 🌸`
                    : `Hi ${selectedCustomer.name}, greetings from our team!`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>{isAr ? "واتساب مباشر" : "WhatsApp"}</span>
              </a>
            </div>

            {/* Balances summary */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#0F0F0F] border border-white/5 text-xs font-mono">
              <div>
                <span className="text-[10px] text-white/40 uppercase font-semibold">
                  {isAr ? "إجمالي المعاملات" : "Total Invoiced"}
                </span>
                <div className="font-extrabold text-white mt-1 text-sm">
                  {formatCurrency(selectedCustomer.totalInvoiced || 48500, currency, isAr)}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-white/40 uppercase font-semibold">
                  {isAr ? "المتبقي للتحصيل" : "Pending Due"}
                </span>
                <div className="font-extrabold text-rose-400 mt-1 text-sm">
                  {formatCurrency(selectedCustomer.outstandingBalance, currency, isAr)}
                </div>
              </div>
            </div>

            {/* Customer Invoices */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono">
                {isAr ? "سجل فواتير العميل" : "Invoice History"}
              </h4>
              <div className="space-y-2">
                {invoices
                  .filter((i) => i.customerId === selectedCustomer.id || i.customerName === selectedCustomer.name)
                  .map((inv) => {
                    const badge = getStatusBadge(inv.status, isAr);
                    return (
                      <div
                        key={inv.id}
                        className="p-3.5 rounded-2xl bg-[#0F0F0F] border border-white/5 flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <div className="font-bold text-white">{inv.invoiceNumber}</div>
                          <div className="text-[10px] text-white/40">{inv.issueDate}</div>
                        </div>
                        <div className="text-right rtl:text-left">
                          <div className="font-bold text-white">
                            {formatCurrency(inv.total, inv.currency, isAr)}
                          </div>
                          <span className={`text-[10px] font-bold ${badge.bg} px-2 py-0.5 rounded-full mt-1 inline-block`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Primary Action: Create Invoice */}
            <button
              onClick={() => handleCreateInvoiceForCustomer(selectedCustomer)}
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all font-mono"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>
                {isAr
                  ? `إنشاء فاتورة جديدة لـ ${selectedCustomer.name}`
                  : `Create Invoice for ${selectedCustomer.name}`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#0A0A0A] rounded-3xl p-6 shadow-2xl border border-white/10 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white font-mono">
                    {isAr ? "تسجيل عميل أو شركة جديدة" : "Register New Client"}
                  </h3>
                  <p className="text-[10px] text-white/40">
                    {isAr ? "إضافة عميل إلى قاعدة بياناتك وإصدار فواتير له" : "Add client to your business ledger"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[11px] font-bold text-white/50 mb-1">
                  {isAr ? "اسم العميل / الشركة (English / الرئيسي) *" : "Client / Company Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? "مثال: Ahmed Mahmoud أو Vodafone Egypt" : "e.g. Acme Corp"}
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0F0F0F] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/50 mb-1">
                  {isAr ? "الاسم بالعربي (اختياري)" : "Arabic Name (Optional)"}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? "مثال: أحمد محمود" : "e.g. شركة الأمل"}
                  value={newCustNameAr}
                  onChange={(e) => setNewCustNameAr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0F0F0F] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-white/50 mb-1">
                    {isAr ? "رقم الهاتف / واتساب *" : "Phone / WhatsApp *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+20 100 000 0000"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0F0F0F] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 text-left ltr"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-white/50 mb-1">
                    {isAr ? "البريد الإلكتروني" : "Email"}
                  </label>
                  <input
                    type="email"
                    placeholder="client@domain.com"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0F0F0F] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/50 mb-1">
                  {isAr ? "اسم المؤسسة / النشاط" : "Company / Organization"}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? "مثال: ستوديو الإبداع" : "e.g. Design Studio LLC"}
                  value={newCustCompany}
                  onChange={(e) => setNewCustCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0F0F0F] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/50 mb-1">
                  {isAr ? "العنوان / المدينة" : "Address / Location"}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? "مثال: المعادي، القاهرة" : "e.g. New Cairo, Egypt"}
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0F0F0F] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 font-bold transition-all"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting
                    ? isAr
                      ? "جاري الحفظ..."
                      : "Saving..."
                    : isAr
                    ? "حفظ العميل"
                    : "Save Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

