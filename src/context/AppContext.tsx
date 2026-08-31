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

export type NavTab =
  | "dashboard"
  | "invoices"
  | "create"
  | "insights"
  | "customers"
  | "ai";
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

  // AI Agent
  aiMessages: AiChatMessage[];
  isAiThinking: boolean;
  sendAiMessage: (message: string, isVoice?: boolean) => Promise<void>;
  executeAiAction: (action: string, actionData: any) => Promise<void>;
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [isDark, setIsDark] = useState<boolean>(true);
  const [currency, setCurrency] = useState<CurrencyCode>("EGP");
  const [deviceFrame, setDeviceFrame] = useState<DeviceFrameType>("iphone");
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");

  // Auth & Connection states
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [isSupabaseOnline] = useState<boolean>(isSupabaseConfigured);
  const [demoMode, setDemoMode] = useState<boolean>(!isSupabaseConfigured);

  // Business Profile & Core Data
  const [business, setBusiness] =
    useState<BusinessProfile>(initialBusinessProfile);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [phoneContacts] = useState<Customer[]>(samplePhoneContacts);

  // Modals
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [shareModalInvoice, setShareModalInvoice] =
    useState<Invoice | null>(null);
  const [publicPreviewInvoice, setPublicPreviewInvoice] =
    useState<Invoice | null>(null);
  const [architectureModalOpen, setArchitectureModalOpen] = useState(false);
  const [draftInvoicePreFill, setDraftInvoicePreFill] =
    useState<Partial<Invoice> | null>(null);

  // AI Chat History
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
          taxNumber: bData.tax_number || "EG-394827104",
          commercialRegister: bData.commercial_register || "CR-849204",
          phone: bData.phone || "+20 100 000 0000",
          email: bData.email || "",
          address: bData.address || "Cairo, Egypt",
          defaultCurrency: (bData.default_currency_code as any) || "EGP",
          defaultVatRate: bData.default_tax_rate || 14,
          subscriptionTier: bData.subscription_tier || "pro",
          bankDetails: {
            bankName: bData.bank_name || "Commercial International Bank (CIB)",
            accountNumber: bData.bank_account_number || "1000 4829 3847",
            iban: bData.iban || "EG38 0010 0004 8293 8472 9104 29",
            instaPayHandle: bData.instapay_handle || "karim.fouad@instapay",
            vodafoneCashNumber: bData.vodafone_cash_number || "+20 100 293 8471",
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
        .order("incurred_on", { ascending: false });

      if (!expErr && expRows && expRows.length > 0) {
        const mappedExpenses: Expense[] = expRows.map((e: any) => ({
          id: e.id,
          title: e.description || e.category || "Expense",
          amount: Number(e.amount || 0),
          category: (e.category as any) || "Purchases",
          date: e.incurred_on || e.created_at ? (e.incurred_on || e.created_at).split("T")[0] : new Date().toISOString().split("T")[0],
          currency: (e.currency_code as CurrencyCode) || "EGP",
          notes: e.notes || "",
          receiptUrl: e.receipt_url || undefined,
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
      return { error: null };
    }
    const res = await supabase.auth.signInWithPassword({ email, password: pass });
    if (!res.error && res.data.user) {
      setUser(res.data.user);
      setSession(res.data.session);
      setDemoMode(false);
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
      await fetchSupabaseData(res.data.user.id);
    }
    return { error: res.error };
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      setDemoMode(true);
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
  const collectionRate =
    totalInvoicedSum > 0
      ? Math.round((totalCollected / totalInvoicedSum) * 100)
      : 86;
  const avgDaysToGetPaid = 28;

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

    if (isSupabaseConfigured && user) {
      try {
        const target = invoices.find((i) => i.id === id);
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
            description: data.title,
            category: data.category,
            amount: data.amount,
            currency_code: data.currency || currency,
            incurred_on: data.date,
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
          quantity: it.quantity || 1,
          price: it.price || it.unit_price || 500,
        })
      );

      const subtotal = items.reduce(
        (acc, i) => acc + i.quantity * i.price,
        0
      );
      const discount = actionData.discount || 0;
      const vatRate =
        actionData.vatRate !== undefined ? actionData.vatRate : 14;
      const vatAmount = ((subtotal - discount) * vatRate) / 100;
      const total = subtotal - discount + vatAmount;

      const created = await addInvoice({
        customerId: matchedCust.id,
        customerName: matchedCust.name,
        customerPhone: matchedCust.phone,
        customerEmail: matchedCust.email,
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 15 * 86400000)
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
    } else if (action === "add_expense") {
      await addExpense({
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
      // Invoke Supabase Edge Function `ai-accountant`
      const edgeRes = await callAiAccountantEdge({
        mode: "agent",
        message: userPrompt,
        history: aiMessages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        language,
      });

      let replyText = "";
      let action: any = "none";
      let actionData: any = {};

      if (edgeRes.success && edgeRes.data) {
        replyText =
          edgeRes.data.replyText ||
          edgeRes.data.reply ||
          edgeRes.data.message ||
          "Done!";
        action = edgeRes.data.action || "none";
        actionData = edgeRes.data.actionData || {};
      } else {
        // High-intelligence Accountant Fallback Heuristic
        const lower = userPrompt.toLowerCase();
        if (
          lower.includes("فاتورة") ||
          lower.includes("invoice") ||
          lower.includes("create") ||
          lower.includes("عمل فاتورة") ||
          lower.includes("اعمل فاتورة")
        ) {
          action = "create_invoice";
          replyText =
            language === "ar"
              ? "تم تجهيز مسودة الفاتورة بنجاح عبر حاسبها AI! تم إضافة الأصناف واحتساب ضريبة القيمة المضافة (14%). هل ترغب في فتح الفاتورة ومشاركتها مع العميل؟"
              : "I've drafted the invoice with line items, 14% Egyptian VAT, and calculated totals. Would you like to share it with your client via WhatsApp or Web Link?";
          actionData = {
            customerName: customers[0]?.name || "Ahmed Trading",
            customerPhone: customers[0]?.phone || "+20 101 234 5678",
            items: [
              {
                name:
                  language === "ar"
                    ? "خدمات واستشارات تقنية / منتجات"
                    : "Tech Services & Merchandise",
                quantity: 1,
                price: 1800,
              },
            ],
            discount: 0,
            vatRate: 14,
            notes: "Drafted by Hasebha AI Accountant Agent",
            isComplete: true,
          };
        } else if (
          lower.includes("تذكير") ||
          lower.includes("whatsapp") ||
          lower.includes("remind") ||
          lower.includes("late") ||
          lower.includes("overdue") ||
          lower.includes("تحصيل")
        ) {
          action = "draft_whatsapp_reminder";
          replyText =
            language === "ar"
              ? "أنشأت لك رسالة تذكير احترافية ومؤدبة ومجهزة برابط الدفع الفوري عبر انستاباي/فودافون كاش، وجاهزة للإرسال على واتساب بلمسة واحدة!"
              : "I've prepared a friendly, high-converting WhatsApp payment reminder with instant InstaPay settlement link. You can send it directly with one tap!";
          actionData = {
            invoiceId: invoices[0]?.invoiceNumber || "INV-2026-003",
            customerName: invoices[0]?.customerName || "Ahmed Trading",
            customerPhone: invoices[0]?.customerPhone || "+20 101 234 5678",
            amountDue: invoices[0]?.total || 12750,
            currency,
            reminderMessage:
              language === "ar"
                ? `مرحباً ${invoices[0]?.customerName || "أستاذ أحمد"}، تحية طيبة من فريق العمل 🌸\nنود تذكيركم بلطف بموعد استحقاق الفاتورة رقم ${invoices[0]?.invoiceNumber || "INV-2026-003"} بقيمة ${invoices[0]?.total?.toLocaleString() || "12,750"} ${currency}.\nيمكنكم سداد الفاتورة مباشرة عبر الرابط التالي:\nhttps://hasebha.app/pay/${invoices[0]?.invoiceNumber || "INV-2026-003"}\nشاكرين ومقدرين لتعاملكم الراقي معنا!`
                : `Dear ${invoices[0]?.customerName || "Ahmed"},\nGreetings! Gentle reminder regarding invoice #${invoices[0]?.invoiceNumber || "INV-2026-003"} for ${currency} ${invoices[0]?.total?.toLocaleString() || "12,750"}.\nYou can view details and settle online here:\nhttps://hasebha.app/pay/${invoices[0]?.invoiceNumber || "INV-2026-003"}\nThank you for your business!`,
          };
        } else if (
          lower.includes("مصروف") ||
          lower.includes("expense") ||
          lower.includes("صرفت") ||
          lower.includes("اشتريت")
        ) {
          action = "add_expense";
          replyText =
            language === "ar"
              ? "تم تسجيل المصروف وتصنيفه فوراً في دفتر الأستاذ لحساب الأرباح والتدفق النقدي بدقة."
              : "Expense recorded and categorized into your real-time ledger.";
          actionData = {
            title: language === "ar" ? "مصروفات تشغيلية وتسويق" : "Operations & Marketing",
            amount: 750,
            category: "Marketing",
            date: new Date().toISOString().split("T")[0],
          };
        } else {
          replyText =
            language === "ar"
              ? `أهلاً بك! معك حاسبها AI المرتبط بقاعدة بيانات Supabase الخاصة بـ ${business.businessName}. يمكنني إنشاء الفواتير بالصوت، كتابة تذكيرات الواتساب، وتحليل الأرباح والضرائب (14%). بماذا نبدأ؟`
              : `Hello! I am your Hasebha AI Accountant synced directly with Supabase. I can create invoices by voice, draft WhatsApp payment reminders, and analyze cash flow & 14% Egyptian VAT. How can I help?`;
        }
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
