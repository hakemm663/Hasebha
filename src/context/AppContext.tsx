import React, { createContext, useContext, useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  AiChatMessage,
  BusinessProfile,
  CurrencyCode,
  Customer,
  Expense,
  FinancialAnalysisData,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
} from "../types";
import {
  initialBusinessProfile,
  initialCustomers,
  initialExpenses,
  initialInvoices,
  samplePhoneContacts,
} from "../data/initialData";

export type NavTab = "dashboard" | "invoices" | "create" | "insights" | "customers" | "ai";
export type DeviceFrameType = "iphone" | "android" | "tablet" | "fullscreen";

interface AppContextType {
  // Localization & Theming
  language: "en" | "ar";
  setLanguage: (lang: "en" | "ar") => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  currency: CurrencyCode;
  setCurrency: (cur: CurrencyCode) => void;
  deviceFrame: DeviceFrameType;
  setDeviceFrame: (frame: DeviceFrameType) => void;

  // Active Navigation
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;

  // Data Store
  business: BusinessProfile;
  setBusiness: React.Dispatch<React.SetStateAction<BusinessProfile>>;
  invoices: Invoice[];
  expenses: Expense[];
  customers: Customer[];
  phoneContacts: Customer[];

  // Actions
  addInvoice: (invoice: Omit<Invoice, "id" | "invoiceNumber" | "publicShareToken">) => Invoice;
  updateInvoiceStatus: (id: string, status: InvoiceStatus, paymentMethod?: string) => void;
  deleteInvoice: (id: string) => void;
  addExpense: (expense: Omit<Expense, "id">) => Expense;
  deleteExpense: (id: string) => void;
  addCustomer: (customer: Omit<Customer, "id" | "code" | "createdAt" | "totalInvoiced" | "outstandingBalance">) => Customer;
  importContacts: (selectedIds: string[]) => void;

  // Metrics (Derived)
  netProfit: number;
  totalRevenue: number;
  totalCollected: number;
  totalExpenses: number;
  totalOutstanding: number;
  collectionRate: number;
  avgDaysToGetPaid: number;

  // AI Agent
  aiMessages: AiChatMessage[];
  isAiThinking: boolean;
  sendAiMessage: (message: string, isVoice?: boolean) => Promise<void>;
  executeAiAction: (action: string, actionData: any) => void;
  clearAiChat: () => void;

  // Modals & UI States
  quickActionOpen: boolean;
  setQuickActionOpen: (open: boolean) => void;
  shareModalInvoice: Invoice | null;
  setShareModalInvoice: (invoice: Invoice | null) => void;
  publicPreviewInvoice: Invoice | null;
  setPublicPreviewInvoice: (invoice: Invoice | null) => void;
  architectureModalOpen: boolean;
  setArchitectureModalOpen: (open: boolean) => void;

  // Real-time simulated payment webhook
  simulateRealTimePayment: (invoiceId: string) => void;

  // Pre-fill invoice creation state
  draftInvoicePreFill: Partial<Invoice> | null;
  setDraftInvoicePreFill: (data: Partial<Invoice> | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [isDark, setIsDark] = useState<boolean>(true);
  const [currency, setCurrency] = useState<CurrencyCode>("EGP");
  const [deviceFrame, setDeviceFrame] = useState<DeviceFrameType>("iphone");
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");

  const [business, setBusiness] = useState<BusinessProfile>(initialBusinessProfile);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [phoneContacts] = useState<Customer[]>(samplePhoneContacts);

  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [shareModalInvoice, setShareModalInvoice] = useState<Invoice | null>(null);
  const [publicPreviewInvoice, setPublicPreviewInvoice] = useState<Invoice | null>(null);
  const [architectureModalOpen, setArchitectureModalOpen] = useState(false);
  const [draftInvoicePreFill, setDraftInvoicePreFill] = useState<Partial<Invoice> | null>(null);

  // AI Chat History
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([
    {
      id: "welcome-ai",
      role: "assistant",
      content: language === "ar"
        ? "مرحباً يا كريم! 👋 أنا حاسبها AI، محاسبك الذكي المتخصص. يمكنني إنشاء الفواتير بالصوت، متابعة التحصيل، وإرسال تذكيرات الواتساب فوراً. كيف أساعدك اليوم؟"
        : "Good morning, Karim! 👋 I am Hasebha AI, your dedicated accountant agent. I can create invoices by voice, draft WhatsApp payment reminders, and analyze your cash flow. What would you like to do?",
      timestamp: "09:41 AM",
      action: "none",
    },
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Sync RTL / LTR on html document element
  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  // Derived Financial Calculations
  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.subtotal, 0);
  const totalCollected = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((acc, inv) => acc + inv.total, 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const totalOutstanding = invoices
    .filter((inv) => inv.status === "outstanding" || inv.status === "overdue")
    .reduce((acc, inv) => acc + inv.total, 0);
  const netProfit = totalCollected - totalExpenses;

  const totalInvoicedSum = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const collectionRate = totalInvoicedSum > 0 ? Math.round((totalCollected / totalInvoicedSum) * 100) : 86;
  const avgDaysToGetPaid = 28;

  // Add Invoice
  const addInvoice = (data: Omit<Invoice, "id" | "invoiceNumber" | "publicShareToken">): Invoice => {
    const newSeq = invoices.length + 1;
    const invNumber = `INV-2026-${String(newSeq).padStart(3, "0")}`;
    const newInvoice: Invoice = {
      ...data,
      id: `inv-${Date.now()}`,
      invoiceNumber: invNumber,
      publicShareToken: `hasebha-${Math.random().toString(36).substring(2, 9)}`,
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // Update customer total invoiced / outstanding
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === data.customerId) {
          return {
            ...c,
            totalInvoiced: c.totalInvoiced + data.total,
            outstandingBalance:
              data.status === "paid" ? c.outstandingBalance : c.outstandingBalance + data.total,
          };
        }
        return c;
      })
    );

    return newInvoice;
  };

  // Update Invoice Status
  const updateInvoiceStatus = (id: string, status: InvoiceStatus, paymentMethod?: string) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === id) {
          const isPaid = status === "paid";
          return {
            ...inv,
            status,
            paidAt: isPaid ? new Date().toISOString() : undefined,
            paymentMethod: paymentMethod as any || inv.paymentMethod || "InstaPay",
          };
        }
        return inv;
      })
    );
  };

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  // Add Expense
  const addExpense = (data: Omit<Expense, "id">): Expense => {
    const newExpense: Expense = {
      ...data,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Add Customer
  const addCustomer = (
    data: Omit<Customer, "id" | "code" | "createdAt" | "totalInvoiced" | "outstandingBalance">
  ): Customer => {
    const newSeq = customers.length + 16;
    const newCust: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      code: `CUST-00${newSeq}`,
      totalInvoiced: 0,
      outstandingBalance: 0,
      createdAt: new Date().toISOString().split("T")[0],
      avatarColor: "bg-emerald-600",
    };
    setCustomers((prev) => [...prev, newCust]);
    return newCust;
  };

  // Import Contacts from Phonebook
  const importContacts = (selectedIds: string[]) => {
    const imported = phoneContacts.filter((c) => selectedIds.includes(c.id));
    setCustomers((prev) => [...prev, ...imported]);
  };

  // Real-time payment simulation
  const simulateRealTimePayment = (invoiceId: string) => {
    updateInvoiceStatus(invoiceId, "paid", "InstaPay");
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}
  };

  // AI Agent execution
  const executeAiAction = (action: string, actionData: any) => {
    if (action === "create_invoice") {
      let matchedCust = customers.find(
        (c) => c.name.toLowerCase() === (actionData.customerName || "").toLowerCase()
      );
      if (!matchedCust) {
        matchedCust = addCustomer({
          name: actionData.customerName || "New Client",
          phone: actionData.customerPhone || "+20 100 000 0000",
          currency: currency,
        });
      }

      const items: InvoiceItem[] = (actionData.items || []).map((it: any, idx: number) => ({
        id: `item-${Date.now()}-${idx}`,
        name: it.name || "Service / Item",
        quantity: it.quantity || 1,
        price: it.price || 500,
      }));

      const subtotal = items.reduce((acc, i) => acc + i.quantity * i.price, 0);
      const discount = actionData.discount || 0;
      const vatRate = actionData.vatRate !== undefined ? actionData.vatRate : 14;
      const vatAmount = ((subtotal - discount) * vatRate) / 100;
      const total = subtotal - discount + vatAmount;

      const created = addInvoice({
        customerId: matchedCust.id,
        customerName: matchedCust.name,
        customerPhone: matchedCust.phone,
        customerEmail: matchedCust.email,
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
        items: items.length > 0 ? items : [{ id: "i1", name: "Consulting / Products", quantity: 1, price: 1000 }],
        subtotal: subtotal || 1000,
        discount,
        vatRate,
        vatAmount: vatAmount || 140,
        total: total || 1140,
        currency,
        status: "outstanding",
        paymentTerms: "Due in 15 days",
        notes: actionData.notes || "Generated automatically by Hasebha AI",
      });

      setShareModalInvoice(created);
    } else if (action === "add_expense") {
      addExpense({
        title: actionData.title || "Voice Logged Expense",
        amount: actionData.amount || 100,
        category: actionData.category || "Purchases",
        date: actionData.date || new Date().toISOString().split("T")[0],
        currency,
        paymentMethod: "Cash",
        notes: actionData.notes || "Added via Hasebha AI",
      });
    }
  };

  const sendAiMessage = async (userPrompt: string, isVoice: boolean = false) => {
    if (!userPrompt.trim()) return;

    const userMsg: AiChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isVoiceInput: isVoice,
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setIsAiThinking(true);

    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userPrompt,
          history: aiMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          currentContext: {
            businessName: business.businessName,
            netProfit,
            totalRevenue,
            totalCollected,
            totalExpenses,
            totalOutstanding,
            overdueInvoicesCount: invoices.filter((i) => i.status === "overdue").length,
            customers: customers.map((c) => ({ name: c.name, balance: c.outstandingBalance, phone: c.phone })),
          },
          language,
        }),
      });

      const data = await res.json();
      const assistantMsg: AiChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.replyText || "Done!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        action: data.action || "none",
        actionData: data.actionData || {},
        actionStatus: "pending",
      };

      setAiMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("AI chat failed:", err);
      setAiMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: "assistant",
          content: language === "ar"
            ? "عذراً، حدث خطأ أثناء الاتصال. يرجى المحاولة مرة أخرى."
            : "Sorry, could not process request right now. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const clearAiChat = () => {
    setAiMessages([
      {
        id: "welcome-ai",
        role: "assistant",
        content: language === "ar"
          ? "مرحباً يا كريم! 👋 أنا حاسبها AI، محاسبك الذكي المتخصص. كيف أساعدك اليوم؟"
          : "Good morning, Karim! 👋 I am Hasebha AI. How can I assist your business today?",
        timestamp: "09:41 AM",
        action: "none",
      },
    ]);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        isDark,
        setIsDark,
        currency,
        setCurrency,
        deviceFrame,
        setDeviceFrame,
        activeTab,
        setActiveTab,
        business,
        setBusiness,
        invoices,
        expenses,
        customers,
        phoneContacts,
        addInvoice,
        updateInvoiceStatus,
        deleteInvoice,
        addExpense,
        deleteExpense,
        addCustomer,
        importContacts,
        netProfit,
        totalRevenue,
        totalCollected,
        totalExpenses,
        totalOutstanding,
        collectionRate,
        avgDaysToGetPaid,
        aiMessages,
        isAiThinking,
        sendAiMessage,
        executeAiAction,
        clearAiChat,
        quickActionOpen,
        setQuickActionOpen,
        shareModalInvoice,
        setShareModalInvoice,
        publicPreviewInvoice,
        setPublicPreviewInvoice,
        architectureModalOpen,
        setArchitectureModalOpen,
        simulateRealTimePayment,
        draftInvoicePreFill,
        setDraftInvoicePreFill,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
