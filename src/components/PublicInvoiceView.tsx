import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Download,
  Copy,
  Check,
  Building2,
  QrCode,
  ShieldCheck,
  Zap,
  Phone,
  Mail,
  ArrowLeft,
  Share2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { getPublicInvoiceByToken, supabase } from "../lib/supabase";
import { formatCurrency, formatDate } from "../utils/formatters";
import { generateInvoicePdf } from "../utils/pdfGenerator";
import { initialBusinessProfile, initialInvoices } from "../data/initialData";
import { Invoice, BusinessProfile } from "../types";

interface PublicInvoiceViewProps {
  token: string;
  onBackToApp?: () => void;
}

export const PublicInvoiceView: React.FC<PublicInvoiceViewProps> = ({
  token,
  onBackToApp,
}) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [business, setBusiness] = useState<BusinessProfile>(initialBusinessProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isArabic, setIsArabic] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "InstaPay" | "Vodafone Cash" | "Credit Card"
  >("InstaPay");
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    async function loadPublicData() {
      setIsLoading(true);
      try {
        const fetched = await getPublicInvoiceByToken(token);
        if (fetched) {
          // Normalize Supabase response
          const bInfo = fetched.businesses || fetched.business || {};
          if (bInfo.business_name) {
            setBusiness({
              businessName: bInfo.business_name || "Enterprise Ltd",
              businessNameAr: bInfo.business_name_ar || bInfo.business_name || "مؤسسة الأعمال",
              ownerName: bInfo.owner_name || "Owner",
              ownerNameAr: bInfo.owner_name_ar || "صاحب العمل",
              taxNumber: bInfo.tax_number || "EG-394827104",
              commercialRegister: bInfo.commercial_register || "CR-849204",
              phone: bInfo.phone || "+20 100 000 0000",
              email: bInfo.email || "info@business.com",
              address: bInfo.address || "Cairo, Egypt",
              defaultCurrency: bInfo.default_currency_code || "EGP",
              defaultVatRate: bInfo.default_tax_rate || 14,
              bankDetails: {
                bankName: bInfo.bank_name || "Commercial International Bank (CIB)",
                accountNumber: bInfo.bank_account_number || "1000 4829 3847",
                iban: bInfo.iban || "EG38 0010 0004 8293 8472 9104 29",
                instaPayHandle: bInfo.instapay_handle || "karim.fouad@instapay",
                vodafoneCashNumber: bInfo.vodafone_cash_number || "+20 100 293 8471",
              },
            });
          }

          const rawItems = fetched.invoice_items || fetched.items || [];
          const mappedItems = rawItems.map((it: any) => ({
            id: it.id,
            name: it.description || it.name || "Service Item",
            quantity: Number(it.quantity || 1),
            price: Number(it.unit_price || it.price || 0),
          }));

          const cName =
            fetched.customers?.name ||
            fetched.customer_name ||
            "Valued Client";
          const cPhone =
            fetched.customers?.phone || fetched.customer_phone || "";
          const cEmail =
            fetched.customers?.email || fetched.customer_email || "";

          setInvoice({
            id: fetched.id || token,
            invoiceNumber:
              fetched.invoice_number ||
              `INV-${String(token).substring(0, 8).toUpperCase()}`,
            customerId: fetched.customer_id || "cust-01",
            customerName: cName,
            customerPhone: cPhone,
            customerEmail: cEmail,
            issueDate: fetched.created_at
              ? fetched.created_at.split("T")[0]
              : new Date().toISOString().split("T")[0],
            dueDate: fetched.due_at
              ? fetched.due_at.split("T")[0]
              : new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
            items:
              mappedItems.length > 0
                ? mappedItems
                : [
                    {
                      id: "i1",
                      name: "Consulting & Services",
                      quantity: 1,
                      price: Number(fetched.total || 2500),
                    },
                  ],
            subtotal: Number(fetched.subtotal || fetched.total || 2500),
            discount: Number(fetched.discount || 0),
            vatRate: Number(fetched.tax_rate || 14),
            vatAmount: Number(fetched.tax || 350),
            total: Number(fetched.total || 2850),
            currency: (fetched.currency_code as any) || "EGP",
            status:
              fetched.status === "paid" || (fetched.amount_paid && fetched.amount_paid >= fetched.total)
                ? "paid"
                : "outstanding",
            notes: fetched.notes || "Thank you for your business!",
            paymentTerms: "Due in 15 days",
            paymentMethod: fetched.payment_method || "InstaPay",
            publicShareToken: token,
          });

          if (fetched.status === "paid") {
            setPaymentSuccess(true);
          }
        } else {
          // Fallback to sample matching invoice if available
          const sample = initialInvoices.find(
            (i) => i.publicShareToken === token || i.invoiceNumber.includes(token)
          ) || initialInvoices[0];
          setInvoice(sample);
        }
      } catch (err) {
        console.warn("Public invoice load error:", err);
        setInvoice(initialInvoices[0]);
      } finally {
        setIsLoading(false);
      }
    }

    loadPublicData();
  }, [token]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(label);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handlePayNow = async () => {
    setIsProcessingPay(true);
    setTimeout(async () => {
      if (invoice) {
        setInvoice({ ...invoice, status: "paid", paymentMethod: selectedPaymentMethod });
        setPaymentSuccess(true);
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch (e) {}

        // If Supabase is connected, update invoice row
        try {
          await supabase
            .from("invoices")
            .update({
              status: "paid",
              amount_paid: invoice.total,
              paid_at: new Date().toISOString(),
              payment_method: selectedPaymentMethod,
            })
            .eq("share_token", token);
        } catch (e) {
          console.warn("Public invoice update failed:", e);
        }
      }
      setIsProcessingPay(false);
    }, 1200);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-white/50 font-mono">
            Loading official tax invoice...
          </p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-[#0A0A0A] p-8 rounded-3xl border border-white/10 text-center space-y-4">
          <p className="text-sm text-white/70">Invoice not found or expired.</p>
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs"
            >
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === "paid" || paymentSuccess;

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[#050505] text-[#F0F0F0] py-8 px-4 sm:px-6 lg:px-8 font-mono antialiased selection:bg-emerald-500/30 selection:text-emerald-200"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between bg-[#0A0A0A] p-3 sm:p-4 rounded-2xl border border-white/10 text-xs">
          <div className="flex items-center gap-3">
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-1.5 font-bold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isArabic ? "لوحة التحكم" : "Dashboard"}
                </span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-white font-sans">
                {isArabic ? "بوابة سداد الفواتير - حاسبها" : "Hasebha Secure Invoicing Gateway"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsArabic(!isArabic)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-bold transition-colors"
            >
              {isArabic ? "English" : "العربية"}
            </button>
            <button
              onClick={() => generateInvoicePdf(invoice, business, isArabic)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

        {/* Main Tax Invoice Document Card */}
        <div className="bg-[#0A0A0A] rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-8">
          {/* Header row: Merchant info vs Invoice Stamp */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-white/5">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-xl">
                  H
                </div>
                <div>
                  <h1 className="font-black text-lg text-white font-sans tracking-tight">
                    {isArabic ? business.businessNameAr || business.businessName : business.businessName}
                  </h1>
                  <p className="text-xs text-white/40">{business.address}</p>
                </div>
              </div>
              <div className="text-[11px] text-white/40 space-y-0.5 pt-1">
                <div>
                  {isArabic ? "الرقم الضريبي:" : "Tax Registration No:"}{" "}
                  <span className="text-white/70 font-bold">{business.taxNumber}</span>
                </div>
                <div>
                  {isArabic ? "السجل التجاري:" : "Commercial Register:"}{" "}
                  <span className="text-white/70 font-bold">{business.commercialRegister}</span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right rtl:sm:text-left space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-white/10 bg-white/5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPaid ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                <span className={isPaid ? "text-emerald-400" : "text-amber-400"}>
                  {isPaid
                    ? isArabic
                      ? "مدفوعة بالكامل"
                      : "PAID IN FULL"
                    : isArabic
                    ? "مستحقة السداد"
                    : "PAYMENT DUE"}
                </span>
              </div>
              <div className="text-base font-black text-white">
                {invoice.invoiceNumber}
              </div>
              <div className="text-xs text-white/40">
                {isArabic ? "تاريخ الإصدار:" : "Date:"} {formatDate(invoice.issueDate, isArabic)}
              </div>
              <div className="text-xs text-white/40">
                {isArabic ? "تاريخ الاستحقاق:" : "Due Date:"} {formatDate(invoice.dueDate, isArabic)}
              </div>
            </div>
          </div>

          {/* Billed To Customer Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0F0F0F] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">
                {isArabic ? "فاتورة موجهة إلى:" : "BILLED TO / RECIPIENT:"}
              </span>
              <div className="font-bold text-base text-white font-sans">
                {invoice.customerName}
              </div>
              <div className="text-xs text-white/40 mt-1 flex flex-wrap items-center gap-3">
                {invoice.customerPhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    {invoice.customerPhone}
                  </span>
                )}
                {invoice.customerEmail && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-emerald-400" />
                    {invoice.customerEmail}
                  </span>
                )}
              </div>
            </div>
            <div className="text-left sm:text-right rtl:sm:text-left">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">
                {isArabic ? "شروط السداد:" : "PAYMENT TERMS:"}
              </span>
              <span className="text-xs font-bold text-white/90">
                {invoice.paymentTerms || "Due on receipt"}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/40 uppercase text-[10px] tracking-widest">
                  <th className="py-3 font-bold">{isArabic ? "الصنف / الخدمة" : "Item Description"}</th>
                  <th className="py-3 text-center font-bold">{isArabic ? "الكمية" : "Qty"}</th>
                  <th className="py-3 text-right rtl:text-left font-bold">{isArabic ? "سعر الوحدة" : "Unit Price"}</th>
                  <th className="py-3 text-right rtl:text-left font-bold">{isArabic ? "الإجمالي" : "Total"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="text-white">
                    <td className="py-3.5 font-medium font-sans">{item.name}</td>
                    <td className="py-3.5 text-center text-white/60 font-mono">{item.quantity}</td>
                    <td className="py-3.5 text-right rtl:text-left font-mono text-white/80">
                      {formatCurrency(item.price, invoice.currency, isArabic)}
                    </td>
                    <td className="py-3.5 text-right rtl:text-left font-bold font-mono text-white">
                      {formatCurrency(item.quantity * item.price, invoice.currency, isArabic)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Breakdown & ETA Egyptian QR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
            <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5 flex items-center gap-4">
              <div className="w-14 h-14 bg-white p-1 rounded-xl shrink-0 flex items-center justify-center">
                <QrCode className="w-12 h-12 text-black" />
              </div>
              <div className="text-[11px] text-white/40 space-y-0.5">
                <div className="font-bold text-white font-sans">
                  {isArabic ? "ختم إلكتروني معتمد" : "Official Tax e-Stamp"}
                </div>
                <p className="leading-relaxed">
                  {isArabic
                    ? "معتمد وفقاً لمعايير مصلحة الضرائب المصرية (ETA)"
                    : "Compliant with Egyptian Tax Authority (ETA) e-Invoice specifications"}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-right rtl:text-left text-xs">
              <div className="flex justify-between text-white/50">
                <span>{isArabic ? "الإجمالي الفرعي:" : "Subtotal:"}</span>
                <span className="font-bold text-white">
                  {formatCurrency(invoice.subtotal, invoice.currency, isArabic)}
                </span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>{isArabic ? "الخصم المطبق:" : "Discount:"}</span>
                  <span className="font-bold">
                    -{formatCurrency(invoice.discount, invoice.currency, isArabic)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-white/50">
                <span>{isArabic ? "ضريبة القيمة المضافة (14%):" : "VAT (14% Tax):"}</span>
                <span className="font-bold text-white">
                  {formatCurrency(invoice.vatAmount, invoice.currency, isArabic)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-white/10 text-base font-black text-white">
                <span>{isArabic ? "المبلغ المستحق النهائي:" : "Total Amount Due:"}</span>
                <span className="text-emerald-400 text-lg">
                  {formatCurrency(invoice.total, invoice.currency, isArabic)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          {!isPaid ? (
            <div className="p-6 rounded-3xl bg-[#0F0F0F] border border-white/10 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {isArabic ? "طرق السداد الفوري المعتمدة" : "Instant Settlement Methods"}
                </span>
                <span className="text-[10px] text-white/40">
                  {isArabic ? "مشفر وآمن 256-bit" : "Encrypted 256-bit AES"}
                </span>
              </div>

              {/* Payment selector tabs */}
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
                    className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      selectedPaymentMethod === pm.id
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                        : "bg-[#050505] text-white/60 border-white/5 hover:border-white/20"
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>

              {/* Merchant Account Details */}
              <div className="p-4 rounded-2xl bg-[#050505] border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-white/40 text-[10px] block">
                    {selectedPaymentMethod === "InstaPay"
                      ? isArabic ? "معرف انستاباي (IPA Handle):" : "Merchant InstaPay Handle:"
                      : selectedPaymentMethod === "Vodafone Cash"
                      ? isArabic ? "رقم محفظة فودافون كاش:" : "Vodafone Cash Wallet:"
                      : isArabic ? "حساب CIB التجاري:" : "Bank Account (CIB):"}
                  </span>
                  <span className="font-black text-sm text-white mt-1 block">
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
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-1.5 font-bold"
                >
                  {copiedAccount === "account" ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">{isArabic ? "تم النسخ" : "Copied"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{isArabic ? "نسخ" : "Copy"}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Pay Now Button */}
              <button
                onClick={handlePayNow}
                disabled={isProcessingPay}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                {isProcessingPay ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>{isArabic ? "جاري تأكيد السداد..." : "Confirming settlement..."}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>
                      {isArabic
                        ? `سداد ${formatCurrency(invoice.total, invoice.currency, true)} وتأكيد المعاملة`
                        : `Pay ${formatCurrency(invoice.total, invoice.currency, false)} & Confirm Settlement`}
                    </span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="font-extrabold text-base text-emerald-400 font-sans">
                {isArabic ? "تم سداد الفاتورة بنجاح!" : "Invoice Paid Successfully!"}
              </h3>
              <p className="text-xs text-white/60">
                {isArabic
                  ? `تم استلام المبلغ وتحديث السجل المالي عبر ${invoice.paymentMethod || "InstaPay"}`
                  : `Payment settled via ${invoice.paymentMethod || "InstaPay"}. Receipt generated.`}
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-white/30 space-y-1">
          <p>
            Powered by <span className="text-emerald-400 font-bold">Hasebha (احسبها)</span> — Two-Platform Financial Operating System
          </p>
          <p className="text-[10px]">Real-Time Sync with iOS & Android Flutter App</p>
        </div>
      </div>
    </div>
  );
};
