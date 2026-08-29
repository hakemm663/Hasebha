import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  User,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Send,
  X,
  FileText,
  UserPlus,
  CheckCircle2,
  Percent,
} from "lucide-react";
import { formatCurrency } from "../../utils/formatters";
import { InvoiceItem } from "../../types";

export const CreateInvoiceTab: React.FC<{ onOpenContactImport?: () => void }> = ({
  onOpenContactImport,
}) => {
  const {
    customers,
    business,
    language,
    currency,
    addInvoice,
    setActiveTab,
    setShareModalInvoice,
    draftInvoicePreFill,
    setDraftInvoicePreFill,
  } = useApp();

  const isAr = language === "ar";

  // Form State initialized with realistic default matching mockup
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    draftInvoicePreFill?.customerId || customers[0]?.id || ""
  );
  const [items, setItems] = useState<InvoiceItem[]>(
    draftInvoicePreFill?.items || [
      { id: "item-1", name: "Laptop Stand", quantity: 2, price: 350 },
      { id: "item-2", name: "Wireless Mouse", quantity: 1, price: 450 },
    ]
  );
  const [discount, setDiscount] = useState<number>(draftInvoicePreFill?.discount || 115.0);
  const [vatRate, setVatRate] = useState<number>(draftInvoicePreFill?.vatRate !== undefined ? draftInvoicePreFill.vatRate : 14);
  const [paymentTerms, setPaymentTerms] = useState<string>("Due in 15 days");
  const [notes, setNotes] = useState<string>(
    draftInvoicePreFill?.notes || "Egyptian Tax Authority e-Invoice ready. Thank you for your business!"
  );

  // New item modal
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(100);

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const vatAmount = (discountedSubtotal * vatRate) / 100;
  const total = discountedSubtotal + vatAmount;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        name: newItemName,
        quantity: Number(newItemQty) || 1,
        price: Number(newItemPrice) || 0,
      },
    ]);

    setNewItemName("");
    setNewItemQty(1);
    setNewItemPrice(100);
    setIsAddingItem(false);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setItems(
      items.map((i) => {
        if (i.id === id) {
          const newQty = Math.max(1, i.quantity + delta);
          return { ...i, quantity: newQty };
        }
        return i;
      })
    );
  };

  const handleCreateAndShare = () => {
    const cust = customers.find((c) => c.id === selectedCustomerId) || customers[0];
    if (!cust) return;

    const newInvoice = addInvoice({
      customerId: cust.id,
      customerName: cust.name,
      customerNameAr: cust.nameAr,
      customerPhone: cust.phone,
      customerEmail: cust.email,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
      items: items.length > 0 ? items : [{ id: "i-default", name: "General Services", quantity: 1, price: 500 }],
      subtotal,
      discount,
      vatRate,
      vatAmount,
      total,
      currency,
      status: "outstanding",
      notes,
      paymentTerms,
    });

    // Reset draft prefill
    setDraftInvoicePreFill(null);

    // Open share modal
    setShareModalInvoice(newInvoice);
    setActiveTab("invoices");
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white font-mono">
            {isAr ? "إنشاء فاتورة جديدة" : "New Invoice Generator"}
          </h2>
          <span className="text-[11px] text-white/40 font-mono">
            {isAr ? "مطابقة لمنظومة الفاتورة الإلكترونية والضرائب" : "ETA E-Invoice Tax Compliant"}
          </span>
        </div>
        <button
          onClick={() => setActiveTab("ai")}
          className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-emerald-500/20 transition-all font-mono"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isAr ? "إنشاء ذكي بالصوت" : "AI Voice Fill"}</span>
        </button>
      </div>

      {/* Customer Selector */}
      <div className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono">
            {isAr ? "العميل المستهدف" : "Target Client"}
          </label>
          {onOpenContactImport && (
            <button
              onClick={onOpenContactImport}
              className="text-xs font-semibold text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isAr ? "استيراد من جهات الاتصال" : "Import Phone Contacts"}</span>
            </button>
          )}
        </div>

        <select
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl bg-[#0A0A0A] border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-white/30"
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {isAr && c.nameAr ? c.nameAr : c.name} ({c.code}) - {c.phone}
            </option>
          ))}
        </select>

        {selectedCustomer && (
          <div className="p-3 rounded-2xl bg-[#0A0A0A] border border-white/5 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-white/40">{isAr ? "الهاتف:" : "Phone:"} </span>
              <span className="font-semibold text-white/80">{selectedCustomer.phone}</span>
            </div>
            <div>
              <span className="text-white/40">{isAr ? "المستحق السابق:" : "Prev Due:"} </span>
              <span className="font-bold text-amber-400">{formatCurrency(selectedCustomer.outstandingBalance, currency, isAr)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Items Section */}
      <div className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono">
            {isAr ? "العناصر والأصناف" : "Line Items"}
          </h3>
          <button
            onClick={() => setIsAddingItem(true)}
            className="text-xs font-bold text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors font-mono"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? "+ إضافة صنف" : "+ Add Item"}</span>
          </button>
        </div>

        {/* Items list */}
        <div className="space-y-2.5">
          {items.map((item) => {
            const lineTotal = item.quantity * item.price;
            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#0A0A0A] border border-white/5 flex items-center justify-between shadow-md"
              >
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-white">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-white/40 mt-1.5 font-mono">
                    <span>
                      {formatCurrency(item.price, currency, isAr)}
                    </span>
                    <span>×</span>
                    <div className="flex items-center gap-2 bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10">
                      <button
                        onClick={() => handleUpdateQty(item.id, -1)}
                        className="text-white/40 hover:text-white font-bold px-1"
                      >
                        -
                      </button>
                      <span className="font-bold text-white">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(item.id, 1)}
                        className="text-white/40 hover:text-white font-bold px-1"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right rtl:text-left">
                  <div className="font-bold text-xs text-white font-mono">
                    {formatCurrency(lineTotal, currency, isAr)}
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-white/30 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Item Modal / Inline Form */}
        {isAddingItem && (
          <form
            onSubmit={handleAddItem}
            className="p-4 rounded-2xl bg-[#0A0A0A] border border-emerald-500/30 space-y-3 mt-3 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {isAr ? "إضافة صنف جديد" : "Add Line Item"}
              </span>
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              placeholder={isAr ? "اسم الصنف أو الخدمة..." : "Item or service name..."}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-white/40 mb-1 font-mono">
                  {isAr ? "الكمية" : "Qty"}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-[10px] text-white/40 mb-1 font-mono">
                  {isAr ? `سعر الوحدة (${currency})` : `Unit Price (${currency})`}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg transition-all font-mono"
            >
              {isAr ? "تأكيد إضافة الصنف" : "Confirm Line Item"}
            </button>
          </form>
        )}
      </div>

      {/* Calculations & VAT Summary */}
      <div className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-xl space-y-3 text-xs font-mono">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-white/60">
          <span>{isAr ? "الإجمالي الفرعي" : "Subtotal"}</span>
          <span className="font-bold text-white">
            {formatCurrency(subtotal, currency, isAr)}
          </span>
        </div>

        {/* Discount */}
        <div className="flex items-center justify-between text-white/60">
          <div className="flex items-center gap-2">
            <span>{isAr ? "الخصم" : "Discount"}</span>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 rounded-lg bg-[#0A0A0A] border border-white/10 text-xs font-bold text-rose-400"
            />
          </div>
          <span className="font-bold text-rose-400">
            -{formatCurrency(discount, currency, isAr)}
          </span>
        </div>

        {/* VAT Rate 14% Egyptian Tax */}
        <div className="flex items-center justify-between text-white/60">
          <div className="flex items-center gap-2">
            <span>{isAr ? "ضريبة القيمة المضافة (14% ETA)" : "VAT (14% ETA Tax)"}</span>
          </div>
          <span className="font-bold text-white">
            {formatCurrency(vatAmount, currency, isAr)}
          </span>
        </div>

        {/* Total Highlight */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-sm font-extrabold text-white">
            {isAr ? "الإجمالي النهائي" : "Total Due"}
          </span>
          <span className="text-xl font-black text-emerald-400">
            {formatCurrency(total, currency, isAr)}
          </span>
        </div>
      </div>

      {/* Payment terms & Notes */}
      <div className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-bold text-white/40 uppercase tracking-widest font-mono mb-2">
            {isAr ? "شروط وموعد السداد" : "Payment Terms"}
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            {["Due in 15 days", "Due in 30 days", "Due on receipt"].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setPaymentTerms(term)}
                className={`py-2.5 px-2 rounded-xl font-bold border transition-all text-center ${
                  paymentTerms === term
                    ? "bg-white text-black border-transparent shadow-lg"
                    : "bg-[#0A0A0A] text-white/50 border-white/5 hover:text-white"
                }`}
              >
                {term === "Due in 15 days"
                  ? isAr ? "خلال 15 يوم" : "15 Days"
                  : term === "Due in 30 days"
                  ? isAr ? "خلال 30 يوم" : "30 Days"
                  : isAr ? "عند الاستلام" : "On Receipt"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-white/40 uppercase tracking-widest font-mono mb-2">
            {isAr ? "ملاحظات الدفع وانستاباي" : "Payment Notes & InstaPay details"}
          </label>
          <textarea
            rows={2}
            placeholder={isAr ? "أضف ملاحظات أو تعليمات التحويل البنكي/انستاباي..." : "Add a note for your customer..."}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-[#0A0A0A] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      {/* Primary CTA Button: Create & Share Invoice */}
      <button
        onClick={handleCreateAndShare}
        className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all font-mono"
      >
        <span>{isAr ? "إنشاء ومشاركة الفاتورة فوراً" : "Issue & Share Live Invoice"}</span>
        <Send className="w-4 h-4 rtl:rotate-180" />
      </button>
    </div>
  );
};

