import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import {
  X,
  Download,
  Trash2,
  UploadCloud,
  Lock,
  RefreshCw,
  FileImage,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Expense } from "../../types";
import { formatCurrency } from "../../utils/formatters";

export const ReceiptViewerModal: React.FC<{
  isOpen: boolean;
  expense: Expense | null;
  onClose: () => void;
}> = ({ isOpen, expense, onClose }) => {
  const {
    language,
    currency,
    getExpenseReceiptUrl,
    uploadExpenseReceipt,
    deleteExpenseReceipt,
    addNotification,
  } = useApp();
  const isAr = language === "ar";

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !expense) {
      setSignedUrl(null);
      setErrorMessage(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    // If pre-cached signed URL exists, use it
    if (expense.receiptSignedUrl) {
      setSignedUrl(expense.receiptSignedUrl);
      setIsLoading(false);
      return;
    }

    // Otherwise, fetch fresh tenant-scoped signed download URL
    if (expense.receiptStoragePath || expense.id) {
      getExpenseReceiptUrl(expense.id)
        .then((url) => {
          if (isMounted) {
            if (url) {
              setSignedUrl(url);
            } else if (expense.receiptUrl) {
              setSignedUrl(expense.receiptUrl);
            } else {
              setErrorMessage(
                isAr
                  ? "لا يوجد إيصال مرفق بهذا المصروف."
                  : "No receipt attachment found for this expense."
              );
            }
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            if (expense.receiptUrl) {
              setSignedUrl(expense.receiptUrl);
            } else {
              setErrorMessage(err.message || "Failed to load receipt.");
            }
            setIsLoading(false);
          }
        });
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, expense?.id, expense?.receiptStoragePath, expense?.receiptSignedUrl]);

  if (!isOpen || !expense) return null;

  const handleDownload = async () => {
    if (!signedUrl) return;
    try {
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `receipt-${expense.id}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(signedUrl, "_blank");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setErrorMessage(
        isAr
          ? "صيغة غير مدعومة. يرجى اختيار ملف JPG أو PNG أو WEBP."
          : "Unsupported format. Please select JPG, PNG, or WEBP."
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(
        isAr
          ? "حجم الصورة يتجاوز الحد الأقصى 10 ميجابايت."
          : "Image size exceeds 10MB limit."
      );
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    const result = await uploadExpenseReceipt(expense.id, file);
    if (result.success && result.signedUrl) {
      setSignedUrl(result.signedUrl);
      addNotification({
        title: "Receipt Replaced",
        titleAr: "تم استبدال الإيصال بنجاح",
        message: `Updated receipt for "${expense.title}" was securely stored.`,
        messageAr: `تم تحديث وحفظ الإيصال الجديد للمصروف "${expense.title}".`,
        type: "system_info",
      });
    } else {
      setErrorMessage(result.error || "Failed to replace receipt.");
    }
    setIsUploading(false);
  };

  const handleDelete = async () => {
    if (window.confirm(isAr ? "هل أنت متأكد من حذف مرفق الإيصال؟" : "Are you sure you want to delete this receipt?")) {
      setIsLoading(true);
      await deleteExpenseReceipt(expense.id);
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl bg-[#0D0D0D] rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/10 text-white relative font-mono"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rtl:right-auto rtl:left-5 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
              <FileImage className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{expense.title}</h3>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Lock className="w-2.5 h-2.5" />
                  {isAr ? "إيصال مؤمّن" : "Encrypted Vault"}
                </span>
              </div>
              <p className="text-xs text-white/60 font-sans mt-0.5">
                {expense.date} • {formatCurrency(expense.amount, expense.currency || currency, isAr)} ({expense.category})
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 font-sans">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Receipt Image Viewer */}
          <div className="relative rounded-2xl overflow-hidden bg-black/80 border border-white/10 min-h-64 flex items-center justify-center p-2 mb-5">
            {isLoading || isUploading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
                <p className="text-xs text-white/70 font-mono">
                  {isUploading
                    ? isAr
                      ? "جاري تشفير ورفع الإيصال الجديد..."
                      : "Encrypting and uploading new receipt..."
                    : isAr
                    ? "جاري استرداد الرابط المؤقت الموقّع..."
                    : "Fetching secure temporary download URL..."}
                </p>
              </div>
            ) : signedUrl ? (
              <img
                src={signedUrl}
                alt="Receipt Attachment"
                className="max-h-96 w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            ) : (
              <div className="py-12 text-center text-white/40 space-y-2">
                <FileImage className="w-12 h-12 mx-auto text-white/20" />
                <p className="text-xs">{isAr ? "لم يتم العثور على صورة الإيصال" : "No receipt image attached"}</p>
              </div>
            )}
          </div>

          {/* Security & Tenant Metadata */}
          <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/5 text-[11px] text-white/60 space-y-1.5 mb-5 font-mono">
            <div className="flex items-center justify-between text-white/40 text-[10px] uppercase tracking-wider">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                {isAr ? "حماية الخصوصية والعزل" : "Tenant Isolation & Privacy"}
              </span>
              <span>Supabase Storage</span>
            </div>
            <div className="truncate text-white/70">
              <span className="text-white/40">{isAr ? "مسار التخزين الخاص: " : "Storage Path: "}</span>
              {expense.receiptStoragePath || `businesses/.../expenses/${expense.id}/receipt.jpg`}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={handleDelete}
              disabled={isLoading || isUploading}
              className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
              title={isAr ? "حذف الإيصال" : "Delete Receipt"}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 flex-1 justify-end">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading}
                className="py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-colors flex items-center gap-2 border border-white/10"
              >
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? "استبدال الإيصال" : "Replace Receipt"}</span>
              </button>

              {signedUrl && (
                <button
                  onClick={handleDownload}
                  disabled={isLoading || isUploading}
                  className="py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all shadow-lg flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? "تحميل الإيصال" : "Download"}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
