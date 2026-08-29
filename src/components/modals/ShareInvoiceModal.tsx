import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Share2,
  Copy,
  Check,
  Download,
  ExternalLink,
  Send,
  X,
  QrCode,
  Globe,
  FileText,
} from "lucide-react";
import { formatCurrency, generateWhatsAppLink } from "../../utils/formatters";
import { generateInvoicePdf } from "../../utils/pdfGenerator";

export const ShareInvoiceModal: React.FC = () => {
  const {
    shareModalInvoice,
    setShareModalInvoice,
    setPublicPreviewInvoice,
    business,
    language,
    currency,
  } = useApp();

  const isAr = language === "ar";
  const [copied, setCopied] = useState(false);

  if (!shareModalInvoice) return null;

  const invoiceUrl = `https://hasebha.app/pay/${shareModalInvoice.invoiceNumber}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invoiceUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewPublicPage = () => {
    setPublicPreviewInvoice(shareModalInvoice);
    setShareModalInvoice(null);
  };

  const whatsappMessage = isAr
    ? `مرحباً ${shareModalInvoice.customerName}، إليكم رابط الفاتورة رقم ${shareModalInvoice.invoiceNumber} بقيمة ${formatCurrency(shareModalInvoice.total, shareModalInvoice.currency, true)}:\n${invoiceUrl}\nيمكنكم الاطلاع على التفاصيل والدفع مباشرة عبر الرابط. شكراً لتعاملكم الراقي! 🌸`
    : `Hi ${shareModalInvoice.customerName}, here is your invoice #${shareModalInvoice.invoiceNumber} for ${formatCurrency(shareModalInvoice.total, shareModalInvoice.currency, false)}:\n${invoiceUrl}\nYou can view line items and settle payment online. Thank you!`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-[#0A0A0A] rounded-3xl p-6 shadow-2xl border border-white/10 text-white space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white font-mono">
                {isAr ? "مشاركة الفاتورة" : "Share Invoice"}
              </h3>
              <span className="text-xs text-white/40 font-mono">
                {shareModalInvoice.invoiceNumber}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShareModalInvoice(null)}
            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary Card */}
        <div className="p-4 rounded-2xl bg-[#0F0F0F] border border-white/5 flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-white/40">{isAr ? "المرسل إليه:" : "Billed to:"}</span>
            <div className="font-bold text-white mt-1 text-sm">
              {shareModalInvoice.customerName}
            </div>
          </div>
          <div className="text-right rtl:text-left">
            <span className="text-white/40">{isAr ? "المبلغ الإجمالي:" : "Total Amount:"}</span>
            <div className="font-black text-base text-emerald-400 mt-1">
              {formatCurrency(shareModalInvoice.total, shareModalInvoice.currency, isAr)}
            </div>
          </div>
        </div>

        {/* Web Link Share Row */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest font-mono">
            {isAr ? "رابط صفحة الدفع المباشرة" : "Live Payment Web Link"}
          </label>
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#0F0F0F] border border-white/10">
            <Globe className="w-4 h-4 text-emerald-400 shrink-0 ml-1 rtl:mr-1" />
            <input
              type="text"
              readOnly
              value={invoiceUrl}
              className="w-full bg-transparent text-xs text-white/90 font-mono focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500 hover:text-black text-xs font-bold font-mono transition-colors flex items-center gap-1.5 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ" : "Copy")}</span>
            </button>
          </div>
        </div>

        {/* Sharing Options Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1 font-mono">
          {/* WhatsApp Direct */}
          <a
            href={generateWhatsAppLink(shareModalInvoice.customerPhone, whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{isAr ? "إرسال واتساب" : "WhatsApp"}</span>
          </a>

          {/* Download PDF */}
          <button
            onClick={() => generateInvoicePdf(shareModalInvoice, business, isAr)}
            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-white/10"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? "تحميل PDF" : "Download PDF"}</span>
          </button>
        </div>

        {/* Public Web Page Preview CTA */}
        <button
          onClick={handleViewPublicPage}
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20 font-mono"
        >
          <ExternalLink className="w-4 h-4" />
          <span>{isAr ? "معاينة صفحة الدفع الإلكتروني" : "Preview Public Web Invoice & Pay"}</span>
        </button>
      </div>
    </div>
  );
};

