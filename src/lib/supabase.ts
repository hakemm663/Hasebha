/// <reference types="vite/client" />
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Read Supabase credentials from Vite environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes("your-project") &&
    !supabaseKey.includes("your-anon")
);

// Create single Supabase client instance with auto session persistence
export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://placeholder-hasebha.supabase.co",
  supabaseKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Ensure business profile exists for currently authenticated user via Supabase RPC
 */
export async function ensureBusinessRecord() {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.rpc("ensure_business");
    if (error) {
      console.warn("ensure_business RPC note:", error.message);
      // Fallback: try direct select from businesses table
      const { data: userResp } = await supabase.auth.getUser();
      if (userResp.user) {
        const { data: bData } = await supabase
          .from("businesses")
          .select("*")
          .eq("owner_id", userResp.user.id)
          .maybeSingle();
        return bData;
      }
      return null;
    }
    return data;
  } catch (err) {
    console.warn("ensureBusinessRecord error:", err);
    return null;
  }
}

/**
 * Get dashboard summary from RPC
 */
export async function getDashboardSummaryRPC(
  periodStart?: string,
  periodEnd?: string
) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.rpc("dashboard_summary", {
      period_start: periodStart || null,
      period_end: periodEnd || null,
    });
    if (error) {
      console.warn("dashboard_summary RPC:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("getDashboardSummaryRPC error:", err);
    return null;
  }
}

/**
 * Create invoice using Supabase RPC `create_invoice`
 */
export async function createInvoiceRPC(params: {
  customerId: string;
  currencyCode: string;
  discount: number;
  tax: number;
  notes?: string;
  dueAt?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
  }>;
}) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error("Supabase not configured") };
  }

  try {
    const { data, error } = await supabase.rpc("create_invoice", {
      p_customer_id: params.customerId,
      p_currency_code: params.currencyCode,
      p_discount: params.discount,
      p_tax: params.tax,
      p_notes: params.notes || "",
      p_due_at: params.dueAt || new Date(Date.now() + 15 * 86400000).toISOString(),
      p_items: params.items,
    });

    if (error) {
      console.warn("create_invoice RPC error, attempting table fallback:", error.message);
      // Fallback direct table insert if RPC parameter signature differs
      const { data: userResp } = await supabase.auth.getUser();
      const { data: bData } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", userResp.user?.id)
        .maybeSingle();

      const businessId = bData?.id;
      const subtotal = params.items.reduce(
        (acc, it) => acc + it.quantity * it.unit_price,
        0
      );
      const total = Math.max(0, subtotal - params.discount) + params.tax;

      const { data: invRow, error: invErr } = await supabase
        .from("invoices")
        .insert({
          business_id: businessId,
          customer_id: params.customerId,
          currency_code: params.currencyCode,
          subtotal,
          discount: params.discount,
          tax: params.tax,
          total,
          amount_paid: 0,
          status: "sent",
          notes: params.notes || "",
          due_at: params.dueAt,
        })
        .select()
        .single();

      if (invErr) throw invErr;

      if (params.items.length > 0 && invRow) {
        await supabase.from("invoice_items").insert(
          params.items.map((it, idx) => ({
            invoice_id: invRow.id,
            description: it.description,
            quantity: it.quantity,
            unit_price: it.unit_price,
            line_total: it.quantity * it.unit_price,
            sort_order: idx + 1,
          }))
        );
      }

      return { data: invRow, error: null };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error("createInvoiceRPC error:", err);
    return { data: null, error: err };
  }
}

/**
 * Fetch public invoice by share token (unauthenticated safe RPC or table read)
 */
export async function getPublicInvoiceByToken(shareToken: string) {
  if (!isSupabaseConfigured) return null;
  try {
    // 1. Try public invoice RPC
    const { data: rpcData, error: rpcErr } = await supabase.rpc(
      "get_public_invoice",
      {
        p_share_token: shareToken,
      }
    );

    if (!rpcErr && rpcData) {
      return rpcData;
    }

    // 2. Direct public query on invoices table by share_token
    const { data: invData, error: invErr } = await supabase
      .from("invoices")
      .select("*, invoice_items(*), businesses(*), customers(*)")
      .eq("share_token", shareToken)
      .maybeSingle();

    if (!invErr && invData) {
      return invData;
    }

    return null;
  } catch (err) {
    console.error("getPublicInvoiceByToken error:", err);
    return null;
  }
}

/**
 * Call the AI Accountant Supabase Edge Function with automatic fallback to server AI route
 */
export async function callAiAccountantEdge(payload: {
  mode: "agent" | "analyze" | "reminder";
  message?: string;
  history?: Array<{ role: string; content: string }>;
  language?: "en" | "ar";
  invoiceId?: string;
  customerName?: string;
  amountDue?: number;
  dueDate?: string;
  currency?: string;
}) {
  // 1. If Supabase is fully configured, attempt Edge Function first
  if (isSupabaseConfigured) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const edgeUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/ai-accountant`;

      const response = await fetch(edgeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data, fallback: false };
      }
    } catch (err: any) {
      console.warn("AI Edge function invocation failed, falling back to server route:", err.message);
    }
  }

  // 2. Call server-side AI Accountant route (powered by Groq / Gemini with real API key)
  try {
    const srvRes = await fetch("/api/ai/accountant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: payload.message,
        history: payload.history,
        language: payload.language || "ar",
      }),
    });

    if (srvRes.ok) {
      const srvData = await srvRes.json();
      return { success: true, data: srvData.data, model: srvData.model, fallback: false };
    }
  } catch (err: any) {
    console.warn("Server AI accountant call failed:", err.message);
  }

  return { success: false, fallback: true, error: "AI unreachable" };
}
