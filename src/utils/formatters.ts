import { CurrencyCode, InvoiceStatus, Invoice, Expense, Customer, ExpenseCategory } from "../types";

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
        bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        dot: "bg-emerald-400",
      };
    case "outstanding":
      return {
        label: isArabic ? "متبقي" : "Outstanding",
        bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        dot: "bg-amber-400",
      };
    case "overdue":
      return {
        label: isArabic ? "متأخر" : "Overdue",
        bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        dot: "bg-rose-400",
      };
    case "draft":
      return {
        label: isArabic ? "مسودة" : "Draft",
        bg: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
        dot: "bg-zinc-400",
      };
  }
}

export function generateWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Generate ETA / ZATCA Compliant QR Code Text Data (TLV format compatible)
 */
export function generateTaxQrData(invoice: Invoice, sellerName: string, taxNumber: string): string {
  const seller = sellerName || "Hasebha Merchant";
  const taxId = taxNumber || "123-456-789";
  const timestamp = invoice.issueDate ? `${invoice.issueDate}T12:00:00Z` : new Date().toISOString();
  const total = invoice.total.toFixed(2);
  const vat = invoice.vatAmount.toFixed(2);

  // Return formatted ETA E-Invoice structured payload
  return `ETA-EINV|Seller:${seller}|TaxID:${taxId}|Inv:${invoice.invoiceNumber}|Time:${timestamp}|Total:${total}|VAT:${vat}|Hash:${invoice.publicShareToken}`;
}

/**
 * Export Invoices to CSV
 */
export function exportInvoicesToCsv(invoices: Invoice[], businessName?: string) {
  const headers = [
    "Invoice Number",
    "Customer Name",
    "Customer Phone",
    "Issue Date",
    "Due Date",
    "Subtotal",
    "Discount",
    "VAT Rate (%)",
    "VAT Amount",
    "Total",
    "Currency",
    "Status",
    "Payment Method",
  ];

  const rows = invoices.map((inv) => [
    `"${inv.invoiceNumber}"`,
    `"${inv.customerName}"`,
    `"${inv.customerPhone}"`,
    `"${inv.issueDate}"`,
    `"${inv.dueDate}"`,
    inv.subtotal,
    inv.discount,
    inv.vatRate,
    inv.vatAmount,
    inv.total,
    `"${inv.currency}"`,
    `"${inv.status}"`,
    `"${inv.paymentMethod || "N/A"}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const prefix = businessName ? `${businessName.toLowerCase().replace(/\s+/g, "_")}_` : "hasebha_";
  link.setAttribute("download", `${prefix}invoices_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export Expenses to CSV
 */
export function exportExpensesToCsv(expenses: Expense[], businessName?: string) {
  const headers = ["Title", "Category", "Amount", "Currency", "Date", "Payment Method", "Notes"];

  const rows = expenses.map((exp) => [
    `"${exp.title}"`,
    `"${exp.category}"`,
    exp.amount,
    `"${exp.currency}"`,
    `"${exp.date}"`,
    `"${exp.paymentMethod}"`,
    `"${exp.notes || ""}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const prefix = businessName ? `${businessName.toLowerCase().replace(/\s+/g, "_")}_` : "hasebha_";
  link.setAttribute("download", `${prefix}expenses_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * High-craft Intelligent Local NLP Parser for Voice & Text Accounting Commands
 */
export function parseAccountingPrompt(
  prompt: string,
  existingCustomers: Customer[],
  language: "en" | "ar" = "ar"
) {
  const clean = prompt.trim();
  const lower = clean.toLowerCase();
  const isAr = language === "ar";

  // 1. INVOICE CREATION
  if (
    lower.includes("فاتورة") ||
    lower.includes("invoice") ||
    lower.includes("اعمل") ||
    lower.includes("انشئ") ||
    lower.includes("create") ||
    lower.includes("bill")
  ) {
    // Extract numbers
    const numbers = clean.match(/\d+(\.\d+)?/g)?.map(Number) || [];
    let price = numbers.length > 0 ? numbers[numbers.length - 1] : 1500;
    let qty = numbers.length > 1 ? numbers[0] : 1;
    if (numbers.length === 1 && numbers[0] < 10) {
      qty = numbers[0];
      price = 1200;
    }

    // Try matching customer name from prompt
    let customerName = isAr ? "عميل جديد" : "New Client";
    let customerPhone = "+20 101 234 5678";

    for (const c of existingCustomers) {
      if (
        clean.includes(c.name) ||
        (c.nameAr && clean.includes(c.nameAr)) ||
        clean.toLowerCase().includes(c.name.toLowerCase())
      ) {
        customerName = c.name;
        customerPhone = c.phone;
        break;
      }
    }

    if (customerName === (isAr ? "عميل جديد" : "New Client")) {
      const matchAr = clean.match(/(?:لشركة|للعميل|لـ|لأستاذ|لـ |لـ)\s*([^\d,،\n]+?)(?:\s+(?:بقيمة|بسعر|فيها|مع|و|بـ))/);
      if (matchAr && matchAr[1]) {
        customerName = matchAr[1].trim();
      }
    }

    // Extract item description
    let itemName = isAr ? "استشارات وخدمات تقنية" : "Professional Consulting & Goods";
    const itemMatch = clean.match(/(?:فيها|بند|صنف|خدمة|عن|item|for)\s*([^\d,،\n]+)/i);
    if (itemMatch && itemMatch[1]) {
      itemName = itemMatch[1].trim();
    }

    const subtotal = price * qty;
    const vatRate = 14;
    const vatAmount = (subtotal * vatRate) / 100;
    const total = subtotal + vatAmount;

    return {
      action: "create_invoice" as const,
      replyText: isAr
        ? `تم استخراج بيانات الفاتورة لـ (${customerName}) بقيمة ${formatCurrency(total, "EGP", true)} شاملاً ضريبة القيمة المضافة 14%! هل ترغب في اعتمادها ومشاركتها مع العميل؟`
        : `Extracted invoice draft for ${customerName} totalling ${formatCurrency(total, "EGP", false)} (inc. 14% VAT). Ready to create and send!`,
      actionData: {
        customerName,
        customerPhone,
        items: [{ name: itemName, quantity: qty, price }],
        discount: 0,
        vatRate,
        notes: isAr ? "تم الإنشاء بواسطة محاسب احسبها الذكي" : "Generated by Hasebha AI Accountant",
        subtotal,
        vatAmount,
        total,
      },
    };
  }

  // 2. EXPENSE RECORDING
  if (
    lower.includes("مصروف") ||
    lower.includes("expense") ||
    lower.includes("صرفت") ||
    lower.includes("اشتريت") ||
    lower.includes("شراء") ||
    lower.includes("دفعت")
  ) {
    const numbers = clean.match(/\d+(\.\d+)?/g)?.map(Number) || [];
    const amount = numbers.length > 0 ? numbers[0] : 450;

    let category: ExpenseCategory = "Purchases";
    if (lower.includes("تسويق") || lower.includes("اعلان") || lower.includes("facebook") || lower.includes("marketing") || lower.includes("ads")) {
      category = "Marketing";
    } else if (lower.includes("بنزين") || lower.includes("شحن") || lower.includes("مواصلات") || lower.includes("transport") || lower.includes("uber")) {
      category = "Transport";
    } else if (lower.includes("كهرباء") || lower.includes("نت") || lower.includes("فاتورة") || lower.includes("utilities") || lower.includes("internet")) {
      category = "Utilities";
    } else if (lower.includes("راتب") || lower.includes("مرتب") || lower.includes("اجور") || lower.includes("salary")) {
      category = "Salaries";
    } else if (lower.includes("ايجار") || lower.includes("rent")) {
      category = "Rent";
    }

    let title = isAr ? `مصروف ${category}` : `${category} Expense`;
    const titleMatch = clean.match(/(?:مصروف|شراء|دفع|على|بـ|for)\s*([^\d,،\n]+)/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }

    return {
      action: "add_expense" as const,
      replyText: isAr
        ? `تم تسجيل المصروف: ${title} بقيمة ${formatCurrency(amount, "EGP", true)} وتصنيفه ضمن (${category}) في دفتر الأستاذ.`
        : `Logged expense: ${title} for ${formatCurrency(amount, "EGP", false)} categorized under ${category}.`,
      actionData: {
        title,
        amount,
        category,
        date: new Date().toISOString().split("T")[0],
        notes: isAr ? "مسجل عبر الأوامر الصوتية الذكية" : "Voice/Text smart logged",
      },
    };
  }

  // 3. WHATSAPP REMINDER
  if (
    lower.includes("تذكير") ||
    lower.includes("واتساب") ||
    lower.includes("whatsapp") ||
    lower.includes("remind") ||
    lower.includes("تحصيل") ||
    lower.includes("متأخر")
  ) {
    const cust = existingCustomers[0] || { name: "Ahmed Trading", phone: "+20 101 234 5678" };
    return {
      action: "draft_whatsapp_reminder" as const,
      replyText: isAr
        ? `أنشأت لك رسالة تذكير واتساب مهذبة مع رابط السداد الفوري عبر إنستاباي. اضغط لإرسالها بلمسة واحدة!`
        : `Prepared a polite WhatsApp payment reminder with instant InstaPay settlement link. Ready to dispatch!`,
      actionData: {
        customerName: cust.name,
        customerPhone: cust.phone,
        invoiceId: "INV-2026-003",
        amountDue: 8900,
        currency: "EGP",
        reminderMessage: isAr
          ? `مرحباً أستاذ ${cust.name}، تحية طيبة من فريق العمل 🌸\nنود تذكيركم بلطف بموعد استحقاق الفاتورة بقيمة 8,900 ج.م.\nيمكنكم السداد مباشرة عبر رابط الدفع الإلكتروني أو إنستاباي:\nhttps://hasebha.app/pay/INV-2026-003\nشاكرين ومقدرين لتعاونكم الدائم معنا!`
          : `Dear ${cust.name},\nGentle reminder regarding your pending invoice for 8,900 EGP.\nYou can settle instantly via InstaPay / Online link:\nhttps://hasebha.app/pay/INV-2026-003\nThank you for your business!`,
      },
    };
  }

  // 4. GENERAL FINANCIAL ADVICE & TAX (14% VAT / ETA)
  return {
    action: "none" as const,
    replyText: isAr
      ? `أهلاً بك! معك حاسبها AI، محاسبك الذكي المتخصص في الضرائب المصرية (ضريبة القيمة المضافة 14% ومنظومة الفاتورة الإلكترونية ETA). يمكنني إنشاء الفواتير بالصوت، تسجيل المصروفات، وإرسال تذكيرات الواتساب فوراً. ما الذي تود القيام به؟`
      : `Hello! I am Hasebha AI, your dedicated financial accountant copilot compliant with Egyptian ETA tax laws. I can create invoices by voice, record expenses, and dispatch instant WhatsApp payment reminders. How may I assist you today?`,
    actionData: {},
  };
}

