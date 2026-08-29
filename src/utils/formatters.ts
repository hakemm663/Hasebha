import { CurrencyCode, InvoiceStatus } from "../types";

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = "EGP",
  isArabic: boolean = false
): string {
  const formattedNumber = new Intl.NumberFormat(isArabic ? "ar-EG" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (isArabic) {
    switch (currency) {
      case "EGP":
        return `${formattedNumber} ج.م`;
      case "SAR":
        return `${formattedNumber} ر.س`;
      case "AED":
        return `${formattedNumber} د.إ`;
      case "USD":
        return `${formattedNumber} $`;
      case "EUR":
        return `${formattedNumber} €`;
      default:
        return `${formattedNumber} ${currency}`;
    }
  } else {
    switch (currency) {
      case "EGP":
        return `EGP ${formattedNumber}`;
      case "SAR":
        return `SAR ${formattedNumber}`;
      case "AED":
        return `AED ${formattedNumber}`;
      case "USD":
        return `$${formattedNumber}`;
      case "EUR":
        return `€${formattedNumber}`;
      default:
        return `${currency} ${formattedNumber}`;
    }
  }
}

export function formatDate(dateString: string, isArabic: boolean = false): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch (e) {
    return dateString;
  }
}

export function getStatusBadge(status: InvoiceStatus, isArabic: boolean = false) {
  switch (status) {
    case "paid":
      return {
        label: isArabic ? "مدفوع" : "Paid",
        bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        dot: "bg-emerald-500",
      };
    case "outstanding":
      return {
        label: isArabic ? "متبقي" : "Outstanding",
        bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        dot: "bg-amber-500",
      };
    case "overdue":
      return {
        label: isArabic ? "متأخر" : "Overdue",
        bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        dot: "bg-rose-500",
      };
    case "draft":
      return {
        label: isArabic ? "مسودة" : "Draft",
        bg: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
        dot: "bg-zinc-400",
      };
  }
}

export function generateWhatsAppLink(phone: string, text: string): string {
  // Clean phone number: remove spaces, dashes, plus sign
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
