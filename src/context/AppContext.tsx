import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import confetti from "canvas-confetti";
import { User, Session } from "@supabase/supabase-js";
import {
  AiChatMessage,
  AiChatSession,
  AppNotification,
  BusinessProfile,
  CurrencyCode,
  Customer,
  Expense,
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
import {
  supabase,
  isSupabaseConfigured,
  ensureBusinessRecord,
  createInvoiceRPC,
  callAiAccountantEdge,
} from "../lib/supabase";
import { api } from "../lib/api";
import { parseAccountingPrompt } from "../utils/formatters";

export type NavTab =
  | "dashboard"
  | "invoices"
  | "create"
  | "insights"
  | "customers"
  | "ai"
  | "notifications"
  | "settings";
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

  // Active Navigation & Landing Page Control
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  showLandingPage: boolean;
  setShowLandingPage: (show: boolean) => void;

  // Supabase Auth & Session State
  user: User | null;
  session: Session | null;
  isSupabaseOnline: boolean;
  isLoadingAuth: boolean;
  isDataLoading: boolean;
  demoMode: boolean;
  setDemoMode: (demo: boolean) => void;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
  signUpWithEmail: (
    email: string,
    pass: string,
    businessName?: string
  ) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setSubscriptionTier: (tier: "free" | "pro" | "business") => Promise<void>;
  updateBusinessProfile: (
    updates: Partial<BusinessProfile>
  ) => Promise<{ success: boolean; error?: any }>;

  // Data Store
  business: BusinessProfile;
  setBusiness: React.Dispatch<React.SetStateAction<BusinessProfile>>;
  invoices: Invoice[];
  expenses: Expense[];
  customers: Customer[];
  phoneContacts: Customer[];

  // Refresh
  refreshData: () => Promise<void>;

  // Actions
  addInvoice: (
    invoice: Omit<Invoice, "id" | "invoiceNumber" | "publicShareToken">
  ) => Promise<Invoice>;
  updateInvoiceStatus: (
    id: string,
    status: InvoiceStatus,
    paymentMethod?: string
  ) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, "id">) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  uploadExpenseReceipt: (
    expenseId: string,
    file: File
  ) => Promise<{ success: boolean; storagePath?: string; signedUrl?: string; error?: string }>;
  getExpenseReceiptUrl: (expenseId: string) => Promise<string | null>;
  deleteExpenseReceipt: (expenseId: string) => Promise<boolean>;
  addCustomer: (
    customer: Omit<
      Customer,
      "id" | "code" | "createdAt" | "totalInvoiced" | "outstandingBalance"
    >
  ) => Promise<Customer>;
  importContacts: (selectedIds: string[]) => Promise<void>;

  // Metrics (Derived)
  netProfit: number;
  totalRevenue: number;
  totalCollected: number;
  totalExpenses: number;
  totalOutstanding: number;
  collectionRate: number;
  avgDaysToGetPaid: number;

  // Notifications System
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  addNotification: (
    notif: Omit<AppNotification, "id" | "timestamp" | "isRead">
  ) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;

  // AI Agent & Multi-Session Chat
  aiMessages: AiChatMessage[];
  aiSessions: AiChatSession[];
  currentSessionId: string;
  isAiThinking: boolean;
  sendAiMessage: (message: string, isVoice?: boolean) => Promise<void>;
  executeAiAction: (action: string, actionData: any) => Promise<void>;
  clearAiChat: () => void;
  createNewAiSession: () => void;
  switchAiSession: (sessionId: string) => void;
  deleteAiSession: (sessionId: string) => void;

  // Modals & UI States
  quickActionOpen: boolean;
  setQuickActionOpen: (open: boolean) => void;
  shareModalInvoice: Invoice | null;
  setShareModalInvoice: (invoice: Invoice | null) => void;
  publicPreviewInvoice: Invoice | null;
  setPublicPreviewInvoice: (invoice: Invoice | null) => void;
  architectureModalOpen: boolean;
  setArchitectureModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isSubscriptionModalOpen: boolean;
  setIsSubscriptionModalOpen: (open: boolean) => void;
  isReceiptScanModalOpen: boolean;
  setIsReceiptScanModalOpen: (open: boolean) => void;
  isPaymobModalOpen: boolean;
  setIsPaymobModalOpen: (open: boolean) => void;
  isPaymobGuideModalOpen: boolean;
  setIsPaymobGuideModalOpen: (open: boolean) => void;

  // Real-time simulated payment webhook
  simulateRealTimePayment: (invoiceId: string) => void;

  // Pre-fill invoice creation state
  draftInvoicePreFill: Partial<Invoice> | null;
  setDraftInvoicePreFill: (data: Partial<Invoice> | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [isDark, setIsDark] = useState<boolean>(true);
  const [currency, setCurrency] = useState<CurrencyCode>("EGP");
  const [deviceFrame, setDeviceFrame] = useState<DeviceFrameType>("iphone");
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);

  // Auth & Connection states
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [isSupabaseOnline] = useState<boolean>(isSupabaseConfigured);
  const [demoMode, setDemoMode] = useState<boolean>(false);

  // Business Profile & Core Data
  const [business, setBusiness] =
    useState<BusinessProfile>(initialBusinessProfile);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [phoneContacts] = useState<Customer[]>(samplePhoneContacts);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: "notif-1",
      title: "InstaPay Payment Collected",
      titleAr: "تم تحصيل دفعة فورية عبر إنستاباي",
      message: "Ahmed Trading settled invoice #INV-2026-001 (18,240 EGP).",
      messageAr: "قام العميل أحمد للبرمجيات بسداد الفاتورة #INV-2026-001 (18,240 ج.م).",
      type: "payment_received",
      timestamp: "Just now",
      isRead: false,
      relatedId: "inv-1",
    },
    {
      id: "notif-2",
      title: "Client Viewed Invoice",
      titleAr: "العميل شاهد رابط الفاتورة",
      message: "Cairo Design Studio opened invoice #INV-2026-003 online.",
      messageAr: "فتح استوديو القاهرة للتصميم رابط الفاتورة #INV-2026-003 للاطلاع.",
      type: "invoice_viewed",
      timestamp: "2 hours ago",
      isRead: false,
      relatedId: "inv-3",
    },
    {
      id: "notif-3",
      title: "ETA VAT Return Deadline",
      titleAr: "تذكير موعد إقرار ضريبة القيمة المضافة",
      message: "Egyptian Tax Authority VAT return filing due in 5 days.",
      messageAr: "موعد تقديم الإقرار الضريبي لضريبة القيمة المضافة (14%) يستحق خلال 5 أيام.",
      type: "tax_deadline",
      timestamp: "Yesterday",
      isRead: true,
    },
    {
      id: "notif-4",
      title: "AI Cash Flow Opportunity",
      titleAr: "فرصة ذكية لتحسين التدفق النقدي",
      message: "Hasebha AI identified 2 overdue invoices ready for 1-click WhatsApp collection.",
      messageAr: "اكتشف الذكاء الاصطناعي فاتورتين متأخرتين جاهزتين للتذكير المباشر بواتساب.",
      type: "ai_recommendation",
      timestamp: "2 days ago",
      isRead: true,
    },
  ]);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  const addNotification = (
    notif: Omit<AppNotification, "id" | "timestamp" | "isRead">
  ) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: "Just now",
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Modals
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [shareModalInvoice, setShareModalInvoice] =
    useState<Invoice | null>(null);
  const [publicPreviewInvoice, setPublicPreviewInvoice] =
    useState<Invoice | null>(null);
  const [architectureModalOpen, setArchitectureModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isReceiptScanModalOpen, setIsReceiptScanModalOpen] = useState(false);
  const [isPaymobModalOpen, setIsPaymobModalOpen] = useState(false);
  const [isPaymobGuideModalOpen, setIsPaymobGuideModalOpen] = useState(false);
  const [draftInvoicePreFill, setDraftInvoicePreFill] =
    useState<Partial<Invoice> | null>(null);

  // AI Chat Sessions
  const [currentSessionId, setCurrentSessionId] = useState<string>("session-1");
  const [aiSessions, setAiSessions] = useState<AiChatSession[]>([
    {
      id: "session-1",
      title: "Cash Flow & Invoicing Assistant",
      titleAr: "مساعد التدفقات النقدية والفواتير",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      messagesCount: 1,
    },
  ]);

  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([
    {
      id: "welcome-ai",
      role: "assistant",
      content:
        language === "ar"
          ? "مرحباً يا كريم! 👋 أنا حاسبها AI، محاسبك الذكي المتخصص. يمكنني إنشاء الفواتير بالصوت، متابعة التحصيل، وإرسال تذكيرات الواتساب فوراً. كيف أساعدك اليوم؟"
          : "Good morning, Karim! 👋 I am Hasebha AI, your dedicated accountant agent. I can create invoices by voice, draft WhatsApp payment reminders, and analyze your cash flow. What would you like to do?",
      timestamp: "09:41 AM",
      action: "none",
    },
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const createNewAiSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: AiChatSession = {
      id: newId,
      title: language === "ar" ? `جلسة جديدة #${aiSessions.length + 1}` : `New Analysis Session #${aiSessions.length + 1}`,
      titleAr: `جلسة تحليل جديدة #${aiSessions.length + 1}`,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      messagesCount: 1,
    };
    setAiSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setAiMessages([
      {
        id: `welcome-${newId}`,
        role: "assistant",
        content:
          language === "ar"
            ? "بدأنا جلسة جديدة! أنا جاهز لتنفيذ أي عملية محاسبية أو تحليل للأرباح والضرائب."
            : "Started a new accounting session! Ready to generate invoices, log expenses, or project cash flow.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        action: "none",
      },
    ]);
  };

  const switchAiSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const deleteAiSession = (sessionId: string) => {
    if (aiSessions.length <= 1) return;
    setAiSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remaining = aiSessions.filter((s) => s.id !== sessionId);
      if (remaining.length > 0) {
        setCurrentSessionId(remaining[0].id);
      }
    }
  };

  // Sync RTL / LTR on html document element
  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  // Load Real Supabase Data
  const fetchSupabaseData = useCallback(async (currentUserId: string) => {
    if (!isSupabaseConfigured) return;
    setIsDataLoading(true);
    try {
      // 1. Ensure business profile
      const bData = await ensureBusinessRecord();
      if (bData) {
        setBusiness({
          id: bData.id,
          businessName: bData.business_name || bData.name || "My Business",
          businessNameAr: bData.business_name_ar || bData.business_name || "مؤسستي التجارية",
          ownerName: bData.owner_name || "Business Owner",
          ownerNameAr: bData.owner_name_ar || "صاحب العمل",
          taxNumber: bData.tax_number || "",
          commercialRegister: bData.commercial_register || "",
          phone: bData.phone || "+20 100 000 0000",
          email: bData.email || "",
          address: bData.address || "Cairo, Egypt",
          defaultCurrency: (bData.default_currency_code as any) || "EGP",
          defaultVatRate: bData.default_tax_rate ?? 14,
          subscriptionTier: bData.subscription_tier || "pro",
          bankDetails: {
            bankName: bData.bank_name || "",
            accountNumber: bData.bank_account_number || "",
            iban: bData.iban || "",
            instaPayHandle: bData.instapay_handle || "",
            vodafoneCashNumber: bData.vodafone_cash_number || "",
          },
        });
        if (bData.default_currency_code) {
          setCurrency(bData.default_currency_code as CurrencyCode);
        }
      }

      // 2. Fetch Customers
      const { data: custRows, error: custErr } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (!custErr && custRows && custRows.length > 0) {
        const mappedCustomers: Customer[] = custRows.map((c: any) => ({
          id: c.id,
          code: c.customer_code || `CUST-${c.id.substring(0, 4).toUpperCase()}`,
          name: c.name || "Unnamed Customer",
          nameAr: c.name_ar,
          phone: c.phone || "",
          email: c.email || undefined,
          company: c.company || undefined,
          address: c.address || undefined,
          totalInvoiced: Number(c.total_invoiced || 0),
          outstandingBalance: Number(c.outstanding_balance || 0),
          currency: (c.currency_code as CurrencyCode) || "EGP",
          avatarColor: "bg-emerald-600",
          createdAt: c.created_at ? c.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
        }));
        setCustomers(mappedCustomers);
      }

      // 3. Fetch Invoices with Items
      const { data: invRows, error: invErr } = await supabase
        .from("invoices")
        .select(`
          *,
          invoice_items(*),
          customers(name, phone, email)
        `)
        .order("created_at", { ascending: false });

      if (!invErr && invRows && invRows.length > 0) {
        const mappedInvoices: Invoice[] = invRows.map((inv: any) => {
          const items: InvoiceItem[] = (inv.invoice_items || []).map((it: any) => ({
            id: it.id,
            name: it.description || it.name || "Item",
            quantity: Number(it.quantity || 1),
            price: Number(it.unit_price || it.price || 0),
          }));

          let status: InvoiceStatus = "outstanding";
          if (inv.status === "paid" || inv.amount_paid >= inv.total) {
            status = "paid";
          } else if (inv.status === "overdue" || (inv.due_at && new Date(inv.due_at) < new Date())) {
            status = "overdue";
          } else if (inv.status === "draft") {
            status = "draft";
          }

          return {
            id: inv.id,
            invoiceNumber: inv.invoice_number || `INV-${inv.id.substring(0, 6).toUpperCase()}`,
            customerId: inv.customer_id,
            customerName: inv.customers?.name || "Client",
            customerPhone: inv.customers?.phone || "",
            customerEmail: inv.customers?.email || "",
            issueDate: inv.created_at ? inv.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
            dueDate: inv.due_at ? inv.due_at.split("T")[0] : new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
            items: items.length > 0 ? items : [{ id: "it-1", name: "Services", quantity: 1, price: inv.total || 1000 }],
            subtotal: Number(inv.subtotal || inv.total || 0),
            discount: Number(inv.discount || 0),
            vatRate: Number(inv.tax_rate || 14),
            vatAmount: Number(inv.tax || 0),
            total: Number(inv.total || 0),
            currency: (inv.currency_code as CurrencyCode) || "EGP",
            status,
            notes: inv.notes || "",
            paymentTerms: "Due in 15 days",
            paidAt: inv.paid_at || undefined,
            paymentMethod: inv.payment_method || "InstaPay",
            publicShareToken: inv.share_token || inv.id,
          };
        });
        setInvoices(mappedInvoices);
      }

      // 4. Fetch Expenses
      const { data: expRows, error: expErr } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });

      if (!expErr && expRows && expRows.length > 0) {
        const mappedExpenses: Expense[] = expRows.map((e: any) => ({
          id: e.id,
          title: e.title || e.description || e.category_name || "Expense",
          amount: Number(e.amount || 0),
          category: (e.category_name || e.category as any) || "Purchases",
          date: e.expense_date || e.created_at ? (e.expense_date || e.created_at).split("T")[0] : new Date().toISOString().split("T")[0],
          currency: (e.currency || e.currency_code as CurrencyCode) || "EGP",
          notes: e.notes || "",
          receiptUrl: e.receipt_url || undefined,
          receiptStoragePath: e.receipt_storage_path || undefined,
          paymentMethod: e.payment_method || "Cash",
        }));
        setExpenses(mappedExpenses);
      }

      // 5. Fetch Chat Messages
      const { data: chatRows, error: chatErr } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(30);

      if (!chatErr && chatRows && chatRows.length > 0) {
        const mappedChat: AiChatMessage[] = chatRows.map((m: any) => ({
          id: m.id,
          role: m.sender === "user" ? "user" : "assistant",
          content: m.content || "",
          timestamp: m.created_at
            ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "09:41 AM",
          action: m.action || "none",
          actionData: m.action_data || {},
        }));
        setAiMessages(mappedChat);
      }
    } catch (err) {
      console.error("Error fetching Supabase data:", err);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  // Set up Supabase Auth state listener and Realtime subscriptions
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoadingAuth(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoadingAuth(false);
      if (session?.user) {
        fetchSupabaseData(session.user.id);
      }
    }).catch(() => {
      if (isMounted) setIsLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchSupabaseData(session.user.id);
      }
    });

    // Realtime listener for incoming payments or updates from mobile app
    const invoiceChannel = supabase
      .channel("public:invoices")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices" },
        () => {
          supabase.auth.getUser().then(({ data }) => {
            if (data.user && isMounted) {
              fetchSupabaseData(data.user.id);
            }
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      supabase.removeChannel(invoiceChannel);
    };
  }, [fetchSupabaseData]);

  // Auth Methods
  const signInWithEmail = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      setDemoMode(true);
      setShowLandingPage(false);
      setActiveTab("dashboard");
      return { error: null };
    }
    const res = await supabase.auth.signInWithPassword({ email, password: pass });
    if (!res.error && res.data.user) {
      setUser(res.data.user);
      setSession(res.data.session);
      setDemoMode(false);
      setShowLandingPage(false);
      setActiveTab("dashboard");
      await fetchSupabaseData(res.data.user.id);
    }
    return { error: res.error };
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    businessName?: string
  ) => {
    if (!isSupabaseConfigured) {
      setDemoMode(true);
      setShowLandingPage(false);
      setActiveTab("dashboard");
      return { error: null };
    }
    const res = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          business_name: businessName || "My Business",
        },
      },
    });
    if (!res.error && res.data.user) {
      setUser(res.data.user);
      setSession(res.data.session);
      setDemoMode(false);
      setShowLandingPage(false);
      setActiveTab("dashboard");
      await fetchSupabaseData(res.data.user.id);
    }
    return { error: res.error };
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      setDemoMode(true);
      setShowLandingPage(false);
      setActiveTab("dashboard");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setDemoMode(false);
    setShowLandingPage(true);
    setActiveTab("dashboard");
  };

  const setSubscriptionTier = async (tier: "free" | "pro" | "business") => {
    setBusiness((prev) => ({ ...prev, subscriptionTier: tier }));
    if (isSupabaseConfigured && business.id) {
      try {
        await supabase
          .from("businesses")
          .update({ subscription_tier: tier })
          .eq("id", business.id);
      } catch (err) {
        console.warn("Failed to update subscription tier:", err);
      }
    }
  };

  // Update Business Profile with Supabase Persistence
  const updateBusinessProfile = async (
    updates: Partial<BusinessProfile>
  ): Promise<{ success: boolean; error?: any }> => {
    setBusiness((prev) => {
      const mergedBankDetails = {
        ...prev.bankDetails,
        ...(updates.bankDetails || {}),
      };
      return {
        ...prev,
        ...updates,
        bankDetails: mergedBankDetails,
      };
    });

    if (updates.defaultCurrency) {
      setCurrency(updates.defaultCurrency);
    }

    if (isSupabaseConfigured && business.id) {
      try {
        const dbUpdates: Record<string, any> = {};
        if (updates.businessName !== undefined) dbUpdates.business_name = updates.businessName;
        if (updates.businessNameAr !== undefined) dbUpdates.business_name_ar = updates.businessNameAr;
        if (updates.ownerName !== undefined) dbUpdates.owner_name = updates.ownerName;
        if (updates.ownerNameAr !== undefined) dbUpdates.owner_name_ar = updates.ownerNameAr;
        if (updates.taxNumber !== undefined) dbUpdates.tax_number = updates.taxNumber;
        if (updates.commercialRegister !== undefined) dbUpdates.commercial_register = updates.commercialRegister;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.address !== undefined) dbUpdates.address = updates.address;
        if (updates.defaultCurrency !== undefined) dbUpdates.default_currency_code = updates.defaultCurrency;
        if (updates.defaultVatRate !== undefined) dbUpdates.default_tax_rate = updates.defaultVatRate;
        if (updates.bankDetails?.bankName !== undefined) dbUpdates.bank_name = updates.bankDetails.bankName;
        if (updates.bankDetails?.accountNumber !== undefined) dbUpdates.bank_account_number = updates.bankDetails.accountNumber;
        if (updates.bankDetails?.iban !== undefined) dbUpdates.iban = updates.bankDetails.iban;
        if (updates.bankDetails?.instaPayHandle !== undefined) dbUpdates.instapay_handle = updates.bankDetails.instaPayHandle;
        if (updates.bankDetails?.vodafoneCashNumber !== undefined) dbUpdates.vodafone_cash_number = updates.bankDetails.vodafoneCashNumber;

        const { error } = await supabase
          .from("businesses")
          .update(dbUpdates)
          .eq("id", business.id);

        if (error) {
          console.warn("Error updating businesses table:", error.message);
          return { success: false, error };
        }
        return { success: true };
      } catch (err: any) {
        console.warn("Exception updating business profile:", err);
        return { success: false, error: err };
      }
    }

    return { success: true };
  };

  // Derived Financial Calculations matching dashboard_summary() RPC
  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalCollected = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((acc, inv) => acc + inv.total, 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const totalOutstanding = invoices
    .filter((inv) => inv.status === "outstanding" || inv.status === "overdue")
    .reduce((acc, inv) => acc + inv.total, 0);
  const netProfit = totalCollected - totalExpenses;

  const totalInvoicedSum = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const collectionRate =
    totalInvoicedSum > 0
      ? Math.round((totalCollected / totalInvoicedSum) * 100)
      : 0;

  // Average days to get paid calculated dynamically from settled invoices
  const paidInvoices = invoices.filter((inv) => inv.status === "paid" && inv.paidAt && inv.issueDate);
  const avgDaysToGetPaid =
    paidInvoices.length > 0
      ? Math.round(
          paidInvoices.reduce((acc, inv) => {
            const issue = new Date(inv.issueDate).getTime();
            const paid = new Date(inv.paidAt!).getTime();
            const diffDays = Math.max(1, Math.round((paid - issue) / (1000 * 3600 * 24)));
            return acc + diffDays;
          }, 0) / paidInvoices.length
        )
      : 0;

  // Add Invoice (Supabase RPC create_invoice with local sync)
  const addInvoice = async (
    data: Omit<Invoice, "id" | "invoiceNumber" | "publicShareToken">
  ): Promise<Invoice> => {
    const newSeq = invoices.length + 1;
    const invNumber = `INV-2026-${String(newSeq).padStart(3, "0")}`;
    const publicShareToken = `hasebha-${Math.random().toString(36).substring(2, 9)}`;

    let createdId = `inv-${Date.now()}`;

    if (isSupabaseConfigured && user) {
      try {
        const { data: rpcRes, error } = await createInvoiceRPC({
          customerId: data.customerId,
          currencyCode: data.currency || currency,
          discount: data.discount || 0,
          tax: data.vatAmount || 0,
          notes: data.notes,
          dueAt: data.dueDate,
          items: data.items.map((it) => ({
            description: it.name,
            quantity: it.quantity,
            unit_price: it.price,
          })),
        });

        if (!error && rpcRes) {
          createdId = rpcRes.id || createdId;
        }
      } catch (e) {
        console.warn("createInvoiceRPC exception:", e);
      }
    }

    const newInvoice: Invoice = {
      ...data,
      id: createdId,
      invoiceNumber: invNumber,
      publicShareToken,
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
              data.status === "paid"
                ? c.outstandingBalance
                : c.outstandingBalance + data.total,
          };
        }
        return c;
      })
    );

    return newInvoice;
  };

  // Update Invoice Status
  const updateInvoiceStatus = async (
    id: string,
    status: InvoiceStatus,
    paymentMethod?: string
  ) => {
    const isPaid = status === "paid";
    const target = invoices.find((i) => i.id === id);

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === id) {
          return {
            ...inv,
            status,
            paidAt: isPaid ? new Date().toISOString() : undefined,
            paymentMethod:
              (paymentMethod as any) || inv.paymentMethod || "InstaPay",
          };
        }
        return inv;
      })
    );

    if (isPaid && target) {
      // Reduce customer outstanding balance
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === target.customerId) {
            return {
              ...c,
              outstandingBalance: Math.max(0, c.outstandingBalance - target.total),
            };
          }
          return c;
        })
      );

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {}

      // Add instant notification
      addNotification({
        title: "Payment Collected",
        titleAr: "تم تحصيل وسداد الفاتورة بنجاح",
        message: `Invoice #${target.invoiceNumber} (${target.total.toLocaleString()} ${target.currency}) was marked as collected via ${paymentMethod || "InstaPay"}.`,
        messageAr: `تم تسجيل سداد الفاتورة #${target.invoiceNumber} بقيمة (${target.total.toLocaleString()} ${target.currency}) عبر ${paymentMethod || "إنستاباي"}.`,
        type: "payment_received",
        relatedId: id,
      });
    }

    if (isSupabaseConfigured && user) {
      try {
        await supabase
          .from("invoices")
          .update({
            status,
            amount_paid: isPaid ? (target ? target.total : 0) : 0,
            paid_at: isPaid ? new Date().toISOString() : null,
            payment_method: paymentMethod || "InstaPay",
          })
          .eq("id", id);
      } catch (err) {
        console.warn("Supabase invoice update status failed:", err);
      }
    }
  };

  const deleteInvoice = async (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    if (isSupabaseConfigured && user) {
      try {
        await supabase.from("invoices").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase invoice delete failed:", err);
      }
    }
  };

  // Add Expense
  const addExpense = async (data: Omit<Expense, "id">): Promise<Expense> => {
    let createdId = `exp-${Date.now()}`;
    if (isSupabaseConfigured && user) {
      try {
        const { data: inserted, error } = await supabase
          .from("expenses")
          .insert({
            business_id: business.id,
            title: data.title,
            category_name: data.category,
            amount: data.amount,
            currency: data.currency || currency,
            expense_date: data.date,
            payment_method: data.paymentMethod || "Cash",
            notes: data.notes || "",
          })
          .select()
          .single();

        if (!error && inserted) {
          createdId = inserted.id;
        }
      } catch (err) {
        console.warn("Supabase expense insert failed:", err);
      }
    }

    const newExpense: Expense = {
      ...data,
      id: createdId,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  };

  const deleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (isSupabaseConfigured && user) {
      try {
        await supabase.from("expenses").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase expense delete failed:", err);
      }
    }
  };

  // Upload and attach receipt to expense
  const uploadExpenseReceipt = async (
    expenseId: string,
    file: File
  ): Promise<{ success: boolean; storagePath?: string; signedUrl?: string; error?: string }> => {
    // 1. Client-side MIME type & size verification
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return {
        success: false,
        error: "Only JPG, PNG, and WEBP receipt image formats are supported.",
      };
    }
    if (file.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: "Receipt image size exceeds the 10MB maximum limit.",
      };
    }

    try {
      // 2. Request tenant-scoped signed upload URL from backend
      const urlRes = await api.getExpenseReceiptUploadUrl(
        expenseId,
        file.name,
        file.type,
        file.size
      );

      if (!urlRes.success || !urlRes.data) {
        throw new Error(urlRes.error || "Failed to initialize receipt upload authorization.");
      }

      const { signedUrl, storagePath } = urlRes.data;

      // 3. Direct upload to private Supabase storage if signed URL returned
      if (signedUrl.startsWith("http")) {
        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error(`Direct storage upload failed (status ${uploadRes.status})`);
        }
      }

      // 4. Persist storage path to backend expense entity
      const completeRes = await api.completeExpenseReceiptUpload(expenseId, storagePath);
      if (!completeRes.success) {
        throw new Error(completeRes.error || "Failed to link receipt record to expense.");
      }

      const signedDownloadUrl = completeRes.data?.receiptSignedUrl;

      // 5. Update local state
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === expenseId
            ? {
                ...e,
                receiptStoragePath: storagePath,
                receiptSignedUrl: signedDownloadUrl,
              }
            : e
        )
      );

      return {
        success: true,
        storagePath,
        signedUrl: signedDownloadUrl,
      };
    } catch (err: any) {
      console.error("Receipt upload error:", err);
      return {
        success: false,
        error: err.message || "Failed to complete receipt upload.",
      };
    }
  };

  // Get secure signed URL for receipt preview/download
  const getExpenseReceiptUrl = async (expenseId: string): Promise<string | null> => {
    try {
      const res = await api.getExpenseReceiptUrl(expenseId);
      if (res.success && res.data?.signedUrl) {
        return res.data.signedUrl;
      }
      return null;
    } catch (err) {
      console.warn("Failed to get receipt URL:", err);
      return null;
    }
  };

  // Delete receipt attachment
  const deleteExpenseReceipt = async (expenseId: string): Promise<boolean> => {
    try {
      const res = await api.deleteExpenseReceipt(expenseId);
      if (res.success) {
        setExpenses((prev) =>
          prev.map((e) =>
            e.id === expenseId
              ? {
                  ...e,
                  receiptStoragePath: undefined,
                  receiptSignedUrl: undefined,
                }
              : e
          )
        );
        return true;
      }
      return false;
    } catch (err) {
      console.warn("Failed to delete receipt:", err);
      return false;
    }
  };

  // Add Customer
  const addCustomer = async (
    data: Omit<
      Customer,
      "id" | "code" | "createdAt" | "totalInvoiced" | "outstandingBalance"
    >
  ): Promise<Customer> => {
    const newSeq = customers.length + 16;
    const code = `CUST-00${newSeq}`;
    let createdId = `cust-${Date.now()}`;

    if (isSupabaseConfigured && user) {
      try {
        const { data: inserted, error } = await supabase
          .from("customers")
          .insert({
            business_id: business.id,
            customer_code: code,
            name: data.name,
            name_ar: data.nameAr,
            phone: data.phone,
            email: data.email,
            company: data.company,
            address: data.address,
            currency_code: data.currency || currency,
          })
          .select()
          .single();

        if (!error && inserted) {
          createdId = inserted.id;
        }
      } catch (err) {
        console.warn("Supabase customer insert failed:", err);
      }
    }

    const newCust: Customer = {
      ...data,
      id: createdId,
      code,
      totalInvoiced: 0,
      outstandingBalance: 0,
      createdAt: new Date().toISOString().split("T")[0],
      avatarColor: "bg-emerald-600",
    };
    setCustomers((prev) => [...prev, newCust]);
    return newCust;
  };

  // Import Contacts from Phonebook
  const importContacts = async (selectedIds: string[]) => {
    const imported = phoneContacts.filter((c) => selectedIds.includes(c.id));
    for (const c of imported) {
      await addCustomer({
        name: c.name,
        nameAr: c.nameAr,
        phone: c.phone,
        email: c.email,
        company: c.company,
        currency: currency,
      });
    }
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
  const executeAiAction = async (action: string, actionData: any) => {
    if (action === "create_invoice") {
      let matchedCust = customers.find(
        (c) =>
          c.name.toLowerCase() ===
          (actionData.customerName || "").toLowerCase()
      );
      if (!matchedCust) {
        matchedCust = await addCustomer({
          name: actionData.customerName || "New Client",
          phone: actionData.customerPhone || "+20 100 000 0000",
          currency: currency,
        });
      }

      const items: InvoiceItem[] = (actionData.items || []).map(
        (it: any, idx: number) => ({
          id: `item-${Date.now()}-${idx}`,
          name: it.name || it.description || "Service / Item",
          quantity: Number(it.quantity) || 1,
          price: Number(it.price) || Number(it.unit_price) || 500,
        })
      );

      const subtotal = items.reduce(
        (acc, i) => acc + i.quantity * i.price,
        0
      );
      const discount = Number(actionData.discount) || 0;
      const vatRate =
        actionData.vatRate !== undefined ? Number(actionData.vatRate) : 14;
      const vatAmount = ((subtotal - discount) * vatRate) / 100;
      const total = subtotal - discount + vatAmount;

      const created = await addInvoice({
        customerId: matchedCust.id,
        customerName: matchedCust.name,
        customerPhone: matchedCust.phone,
        customerEmail: matchedCust.email,
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: actionData.dueDate || new Date(Date.now() + 15 * 86400000)
          .toISOString()
          .split("T")[0],
        items:
          items.length > 0
            ? items
            : [
                {
                  id: "i1",
                  name: "Consulting / Products",
                  quantity: 1,
                  price: 1000,
                },
              ],
        subtotal: subtotal || 1000,
        discount,
        vatRate,
        vatAmount: vatAmount || 140,
        total: total || 1140,
        currency,
        status: "outstanding",
        paymentTerms: "Due in 15 days",
        notes:
          actionData.notes || "Generated automatically by Hasebha AI Agent",
      });

      setShareModalInvoice(created);
    } else if (action === "add_expense" || action === "create_expense") {
      await addExpense({
        title: actionData.title || "Logged Expense",
        amount: Number(actionData.amount) || 100,
        category: actionData.category || "Purchases",
        date: actionData.date || actionData.expenseDate || new Date().toISOString().split("T")[0],
        currency,
        paymentMethod: actionData.paymentMethod || "Cash",
        notes: actionData.notes || "Added via Hasebha AI",
      });
    } else if (action === "record_payment") {
      if (actionData.invoiceId) {
        await updateInvoiceStatus(actionData.invoiceId, "paid", actionData.paymentMethod || "InstaPay");
      }
    } else if (action === "create_customer") {
      await addCustomer({
        name: actionData.name || "New Client",
        nameAr: actionData.nameAr,
        phone: actionData.phone,
        email: actionData.email,
        company: actionData.company,
        address: actionData.address,
        currency: currency,
      });
    }
  };

  const sendAiMessage = async (
    userPrompt: string,
    isVoice: boolean = false
  ) => {
    if (!userPrompt.trim()) return;

    const userMsg: AiChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: userPrompt,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isVoiceInput: isVoice,
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setIsAiThinking(true);

    // Save to Supabase chat_messages table if connected
    if (isSupabaseConfigured && user) {
      try {
        await supabase.from("chat_messages").insert({
          business_id: business.id,
          sender: "user",
          content: userPrompt,
          is_voice: isVoice,
        });
      } catch (err) {
        console.warn("Chat message insert error:", err);
      }
    }

    try {
      let replyText = "";
      let action: any = "none";
      let actionData: any = {};
      let gotResult = false;

      // 1. Try unified NestJS backend AI route /api/v1/ai/agent
      try {
        const v1Res = await fetch("/api/v1/ai/agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-business-id": business?.id || "demo-business-001",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            message: userPrompt,
            history: aiMessages.slice(-6).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            language: language === "ar" ? "ar" : "en",
            isVoiceInput: isVoice,
          }),
        });

        if (v1Res.ok) {
          const resJson = await v1Res.json();
          if (resJson.success && resJson.data) {
            replyText = resJson.data.replyText || "";
            if (resJson.data.pendingConfirmation) {
              action = resJson.data.pendingConfirmation.toolName;
              actionData = resJson.data.pendingConfirmation.toolArguments;
            } else if (resJson.data.toolExecuted) {
              action = "none";
              actionData = resJson.data.toolResult;
              // If invoice or expense was created or modified on backend, refresh state
              if (user) {
                fetchSupabaseData(user.id);
              }
            } else if (resJson.data.action && resJson.data.action !== "none") {
              action = resJson.data.action;
              actionData = resJson.data.actionData || {};
            }
            gotResult = true;
          }
        }
      } catch (v1Err) {
        console.warn("Backend /api/v1/ai/agent route error:", v1Err);
      }

      // 2. Fallback to /api/ai/accountant route if v1 didn't return
      if (!gotResult) {
        try {
          const apiRes = await fetch("/api/ai/accountant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: userPrompt,
              history: aiMessages.slice(-6).map((m) => ({
                role: m.role,
                content: m.content,
              })),
              language,
              businessData: {
                name: business.businessName,
                currency,
                totalOutstanding,
                unpaidCount: invoices.filter((i) => i.status !== "paid").length,
              },
            }),
          });

          if (apiRes.ok) {
            const resJson = await apiRes.json();
            if (resJson.success && resJson.data) {
              replyText = resJson.data.replyText || resJson.data.message || "";
              action = resJson.data.action || "none";
              actionData = resJson.data.actionData || {};
              gotResult = true;
            }
          }
        } catch (apiErr) {
          console.warn("Backend /api/ai/accountant fallback error:", apiErr);
        }
      }

      // 3. Fallback to Supabase Edge Function
      if (!gotResult) {
        const edgeRes = await callAiAccountantEdge({
          mode: "agent",
          message: userPrompt,
          history: aiMessages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          language,
        });

        if (edgeRes.success && edgeRes.data) {
          replyText =
            edgeRes.data.replyText ||
            edgeRes.data.reply ||
            edgeRes.data.message ||
            "Done!";
          action = edgeRes.data.action || "none";
          actionData = edgeRes.data.actionData || {};
          gotResult = true;
        }
      }

      // 4. Ultra-accurate dynamic local NLP parser fallback
      if (!gotResult) {
        const parsed = parseAccountingPrompt(userPrompt, customers, language);
        replyText = parsed.replyText;
        action = parsed.action;
        actionData = parsed.actionData;
      }

      const assistantMsg: AiChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        action,
        actionData,
        actionStatus: "pending",
      };

      setAiMessages((prev) => [...prev, assistantMsg]);

      // Save assistant message to Supabase
      if (isSupabaseConfigured && user) {
        try {
          await supabase.from("chat_messages").insert({
            business_id: business.id,
            sender: "assistant",
            content: replyText,
            action,
            action_data: actionData,
          });
        } catch (err) {
          console.warn("Chat message assistant insert error:", err);
        }
      }
    } catch (err: any) {
      console.error("AI chat failed:", err);
      setAiMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: "assistant",
          content:
            language === "ar"
              ? "عذراً، حدث خطأ أثناء المعالجة. يرجى المحاولة مرة أخرى."
              : "Sorry, could not process request. Please try again.",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
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
        content:
          language === "ar"
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
        showLandingPage,
        setShowLandingPage,
        user,
        session,
        isSupabaseOnline,
        isLoadingAuth,
        isDataLoading,
        demoMode,
        setDemoMode,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        setSubscriptionTier,
        updateBusinessProfile,
        business,
        setBusiness,
        invoices,
        expenses,
        customers,
        phoneContacts,
        refreshData: () => (user ? fetchSupabaseData(user.id) : Promise.resolve()),
        addInvoice,
        updateInvoiceStatus,
        deleteInvoice,
        addExpense,
        deleteExpense,
        uploadExpenseReceipt,
        getExpenseReceiptUrl,
        deleteExpenseReceipt,
        addCustomer,
        importContacts,
        netProfit,
        totalRevenue,
        totalCollected,
        totalExpenses,
        totalOutstanding,
        collectionRate,
        avgDaysToGetPaid,
        notifications,
        unreadNotificationsCount,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        aiMessages,
        aiSessions,
        currentSessionId,
        isAiThinking,
        sendAiMessage,
        executeAiAction,
        clearAiChat,
        createNewAiSession,
        switchAiSession,
        deleteAiSession,
        quickActionOpen,
        setQuickActionOpen,
        shareModalInvoice,
        setShareModalInvoice,
        publicPreviewInvoice,
        setPublicPreviewInvoice,
        architectureModalOpen,
        setArchitectureModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isSubscriptionModalOpen,
        setIsSubscriptionModalOpen,
        isReceiptScanModalOpen,
        setIsReceiptScanModalOpen,
        isPaymobModalOpen,
        setIsPaymobModalOpen,
        isPaymobGuideModalOpen,
        setIsPaymobGuideModalOpen,
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
