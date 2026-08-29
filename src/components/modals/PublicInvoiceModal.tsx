import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  X,
  CheckCircle2,
  Download,
  CreditCard,
  Building2,
  QrCode,
  ShieldCheck,
  Zap,
  Printer,
  Copy,
  Check,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusBadge } from "../../utils/formatters";
import { generateInvoicePdf } from "../../utils/pdfGenerator";

export const PublicInvoiceModal: React.FC = () => {
  const {
    publicPreviewInvoice,
    setPublicPreviewInvoice,
    business,
    language,
    simulateRealTimePayment,
  } = useApp();

  const isAr = language === "ar";
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "InstaPay" | "Vodafone Cash" | "Credit Card"
  >("InstaPay");
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  if (!publicPreviewInvoice) return null;

  const badge = getStatusBadge(publicPreviewInvoice.status, isAr);
  const isPaid = publicPreviewInvoice.status === "paid";

  const handlePayNow = () => {
    setIsProcessingPay(true);
    setTimeout(() => {
      simulateRealTimePayment(publicPreviewInvoice.id);
      setIsProcessingPay(false);
    }, 1200);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(label);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-xl bg-[#0A0A0A] rounded-3xl shadow-2xl border border-white/10 text-white overflow-hidden my-auto max-h-[92vh] flex flex-col font-mono">
        {/* Top Notification Bar / Web Simulation Banner */}
        <div className="bg-emerald-500 text-black px-5 py-2.5 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            <span>
              {isAr
                ? "صفحة الفاتورة العامة المباشرة (رابط العميل)"
                : "Live Customer Web Invoice Preview"}
            </span>
          </div>
          <button
            onClick={() => setPublicPreviewInvoice(null)}
            className="text-black/70 hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable invoice content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Company Brand & Invoice Meta */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-white/5">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold text-lg flex items-center justify-center shadow-lg">
                  H
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white font-sans">
                    {business.businessName}
                  </h3>
                  <p className="text-[11px] text-white/40">
                    {business.address}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-white/40 font-mono">
                {isAr ? "الرقم الضريبي:" : "Tax ID:"} {business.taxNumber} | {isAr ? "س.ت:" : "CR:"} {business.commercialRegister}
              </div>
            </div>

            <div className="text-left sm:text-right rtl:sm:text-left space-y-1.5 font-mono">
              <div className="text-sm font-bold text-white">
                {publicPreviewInvoice.invoiceNumber}
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </div>
              <div className="text-[11px] text-white/40">
                {isAr ? "تاريخ الإصدار:" : "Date:"} {formatDate(publicPreviewInvoice.issueDate, isAr)}
              </div>
              <div className="text-[11px] text-white/40">
                {isAr ? "تاريخ الاستحقاق:" : "Due:"} {formatDate(publicPreviewInvoice.dueDate, isAr)}
              </div>
            </div>
          </div>

          {/* Client Bill-To */}
          <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">
              {isAr ? "فاتورة إلى / العميل:" : "Billed To:"}
            </span>
            <div className="font-bold text-sm text-white font-sans">
              {publicPreviewInvoice.customerName}
            </div>
            <div className="text-[11px] text-white/40 mt-0.5 font-mono">
              {publicPreviewInvoice.customerPhone} {publicPreviewInvoice.customerEmail ? `• ${publicPreviewInvoice.customerEmail}` : ""}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  <th className="py-2.5">{isAr ? "الصنف" : "Item"}</th>
                  <th className="py-2.5 text-center">{isAr ? "الكمية" : "Qty"}</th>
                  <th className="py-2.5 text-right rtl:text-left">{isAr ? "السعر" : "Price"}</th>
                  <th className="py-2.5 text-right rtl:text-left">{isAr ? "الإجمالي" : "Total"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {publicPreviewInvoice.items.map((item, idx) => (
                  <tr key={idx} className="text-white">
                    <td className="py-3 font-medium font-sans">{item.name}</td>
                    <td className="py-3 text-center text-white/60 font-mono">{item.quantity}</td>
                    <td className="py-3 text-right rtl:text-left font-mono text-white/80">
                      {formatCurrency(item.price, publicPreviewInvoice.currency, isAr)}
                    </td>
                    <td className="py-3 text-right rtl:text-left font-bold font-mono text-white">
                      {formatCurrency(item.quantity * item.price, publicPreviewInvoice.currency, isAr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown & Tax QR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
            {/* Egyptian Tax QR / ZATCA Stamp */}
            <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5 flex items-center gap-3">
              <div className="w-14 h-14 bg-white p-1 rounded-xl shadow-sm shrink-0 flex items-center justify-center">
                <QrCode className="w-12 h-12 text-black" />
              </div>
              <div className="text-[10px] text-white/40 space-y-0.5">
                <div className="font-bold text-white font-sans">
                  {isAr ? "ختم إلكتروني معتمد" : "e-Invoice Verified"}
                </div>
                <p className="font-sans leading-relaxed">
                  {isAr ? "متوافق مع منظومة الفاتورة الإلكترونية المصرية" : "Compliant with Egyptian Tax Authority (ETA)"}
                </p>
              </div>
            </div>

            {/* Calculations Table */}
            <div className="space-y-2 text-right rtl:text-left font-mono">
              <div className="flex justify-between text-white/40">
                <span>{isAr ? "الإجمالي الفرعي:" : "Subtotal:"}</span>
                <span className="font-semibold text-white">
                  {formatCurrency(publicPreviewInvoice.subtotal, publicPreviewInvoice.currency, isAr)}
                </span>
              </div>
              {publicPreviewInvoice.discount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>{isAr ? "الخصم:" : "Discount:"}</span>
                  <span className="font-semibold">
                    -{formatCurrency(publicPreviewInvoice.discount, publicPreviewInvoice.currency, isAr)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-white/40">
                <span>{isAr ? "ضريبة القيمة المضافة (14%):" : "VAT (14% Tax):"}</span>
                <span className="font-semibold text-white">
                  {formatCurrency(publicPreviewInvoice.vatAmount, publicPreviewInvoice.currency, isAr)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/5 text-sm font-extrabold text-white">
                <span>{isAr ? "المبلغ المستحق:" : "Total Due:"}</span>
                <span className="text-emerald-400 text-base">
                  {formatCurrency(publicPreviewInvoice.total, publicPreviewInvoice.currency, isAr)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          {!isPaid ? (
            <div className="p-5 rounded-3xl bg-[#0F0F0F] text-white space-y-4 border border-white/10 shadow-xl font-mono">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-2 text-emerald-400">
                  <Zap className="w-4 h-4" />
                  {isAr ? "خيارات السداد الفوري" : "Instant Payment Methods"}
                </span>
                <span className="text-[10px] text-white/40">
                  {isAr ? "سداد آمن ومشفر" : "Secure 256-bit AES"}
                </span>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "InstaPay", label: "InstaPay انستاباي" },
                  { id: "Vodafone Cash", label: "Vodafone كاش" },
                  { id: "Credit Card", label: "Card كارت بنكي" },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(pm.id as any)}
                    className={`py-2.5 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                      selectedPaymentMethod === pm.id
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40"
                        : "bg-[#050505] text-white/60 border-white/5 hover:border-white/20"
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>

              {/* Account details copy row */}
              <div className="p-3.5 rounded-2xl bg-[#050505] border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-white/40 text-[10px] block">
                    {selectedPaymentMethod === "InstaPay"
                      ? isAr ? "معرف انستاباي الخاص بالتاجر:" : "Merchant InstaPay Handle:"
                      : selectedPaymentMethod === "Vodafone Cash"
                      ? isAr ? "رقم محفظة فودافون كاش:" : "Vodafone Cash Wallet:"
                      : isAr ? "حساب CIB التجاري:" : "Bank Account (CIB):"}
                  </span>
                  <span className="font-bold text-white mt-1 block">
                    {selectedPaymentMethod === "InstaPay"
                      ? business.bankDetails.instaPayHandle
                      : selectedPaymentMethod === "Vodafone Cash"
                      ? business.bankDetails.vodafoneCashNumber
                      : business.bankDetails.accountNumber}
                  </span>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      selectedPaymentMethod === "InstaPay"
                        ? business.bankDetails.instaPayHandle
                        : selectedPaymentMethod === "Vodafone Cash"
                        ? business.bankDetails.vodafoneCashNumber
                        : business.bankDetails.accountNumber,
                      "account"
                    )
                  }
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  {copiedAccount === "account" ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Pay Now Button */}
              <button
                onClick={handlePayNow}
                disabled={isProcessingPay}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all font-mono"
              >
                {isProcessingPay ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>{isAr ? "جاري تأكيد الدفع الفوري..." : "Processing instant settlement..."}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {isAr
                        ? `سداد ${formatCurrency(publicPreviewInvoice.total, publicPreviewInvoice.currency, true)} وتحديث الفاتورة فوراً`
                        : `Pay ${formatCurrency(publicPreviewInvoice.total, publicPreviewInvoice.currency, false)} & Update Ledger`}
                    </span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2 font-mono">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-sm text-emerald-400 font-sans">
                {isAr ? "تم سداد هذه الفاتورة بالكامل بنجاح" : "Invoice Paid in Full"}
              </h4>
              <p className="text-[11px] text-white/60">
                {isAr ? `طريقة الدفع: ${publicPreviewInvoice.paymentMethod || "InstaPay"}` : `Payment settled via ${publicPreviewInvoice.paymentMethod || "InstaPay"}`}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#0F0F0F] border-t border-white/5 flex items-center justify-between gap-3 text-xs font-mono">
          <button
            onClick={() => generateInvoicePdf(publicPreviewInvoice, business, isAr)}
            className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold flex items-center justify-center gap-2 text-white transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? "تحميل PDF" : "Download PDF"}</span>
          </button>
          <button
            onClick={() => setPublicPreviewInvoice(null)}
            className="py-3 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-white transition-colors"
          >
            {isAr ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

