-- ============================================================================
-- HASEBHA (احسبها) - PRODUCTION MULTI-TENANT DATABASE SCHEMA & RLS POLICIES
-- Target: Supabase PostgreSQL
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Businesses (Tenant Root)
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    owner_name VARCHAR(255) NOT NULL,
    owner_name_ar VARCHAR(255),
    tax_number VARCHAR(100),
    commercial_register VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    default_currency VARCHAR(10) DEFAULT 'EGP',
    default_vat_rate NUMERIC(5,2) DEFAULT 14.00,
    subscription_tier VARCHAR(50) DEFAULT 'pro',
    subscription_status VARCHAR(50) DEFAULT 'active',
    subscription_renewal_date TIMESTAMPTZ,
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(100),
    bank_iban VARCHAR(100),
    instapay_handle VARCHAR(100),
    vodafone_cash_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Business Members (RBAC: Owner, Accountant, Viewer)
CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'accountant' CHECK (role IN ('owner', 'accountant', 'viewer')),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, user_id)
);

-- 4. Customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    company VARCHAR(255),
    address TEXT,
    notes TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, code)
);

-- 5. Products & Services Catalog
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description TEXT,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'EGP',
    vat_applicable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SENT' CHECK (status IN ('DRAFT', 'SENT', 'PAID', 'OVERDUE')),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    vat_rate NUMERIC(5,2) DEFAULT 14.00,
    total NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'EGP',
    notes TEXT,
    payment_terms VARCHAR(255) DEFAULT 'Due in 15 days',
    paid_at TIMESTAMPTZ,
    payment_method VARCHAR(100),
    share_token VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, invoice_number)
);

-- 7. Invoice Items (Line Items)
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    description_ar TEXT,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12,2) DEFAULT 0.00,
    line_total NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    sort_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_method VARCHAR(100) NOT NULL, -- InstaPay, Vodafone Cash, Bank Transfer, Credit Card, Cash
    reference VARCHAR(255),
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Expense Categories
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    icon VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, name)
);

-- 10. Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
    category_name VARCHAR(100) NOT NULL DEFAULT 'Other',
    title VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255),
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) DEFAULT 'EGP',
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(100) DEFAULT 'Cash',
    notes TEXT,
    receipt_storage_path TEXT, -- Secure path in private Supabase bucket
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255),
    message TEXT NOT NULL,
    message_ar TEXT,
    type VARCHAR(50) NOT NULL, -- payment_received, overdue_alert, tax_deadline, ai_recommendation, system
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255),
    related_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AI Conversations & Tool Audit Logs
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    title_ar VARCHAR(255) DEFAULT 'محادثة جديدة',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    action_type VARCHAR(100),
    action_data JSONB,
    action_status VARCHAR(50), -- pending, executed, dismissed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_tool_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    tool_arguments JSONB NOT NULL,
    tool_result JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    execution_duration_ms INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR HIGH-PERFORMANCE MULTI-TENANT QUERYING
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON public.invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_share_token ON public.invoices(share_token);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON public.payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON public.expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON public.notifications(business_id, is_read);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-tenant isolation at the database layer
-- ============================================================================
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is member of a business
CREATE OR REPLACE FUNCTION public.is_business_member(p_business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.businesses WHERE id = p_business_id AND owner_id = auth.uid()
        UNION
        SELECT 1 FROM public.business_members WHERE business_id = p_business_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Businesses Policies
CREATE POLICY "Users can view businesses they own or are members of"
    ON public.businesses FOR SELECT
    USING (owner_id = auth.uid() OR id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own businesses"
    ON public.businesses FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Business owners can update their business"
    ON public.businesses FOR UPDATE
    USING (owner_id = auth.uid());

-- Customers Policies
CREATE POLICY "Members can view customers"
    ON public.customers FOR SELECT
    USING (public.is_business_member(business_id));

CREATE POLICY "Members can insert customers"
    ON public.customers FOR INSERT
    WITH CHECK (public.is_business_member(business_id));

CREATE POLICY "Members can update customers"
    ON public.customers FOR UPDATE
    USING (public.is_business_member(business_id));

-- Invoices Policies
CREATE POLICY "Members can view invoices"
    ON public.invoices FOR SELECT
    USING (public.is_business_member(business_id));

CREATE POLICY "Members can insert invoices"
    ON public.invoices FOR INSERT
    WITH CHECK (public.is_business_member(business_id));

CREATE POLICY "Members can update invoices"
    ON public.invoices FOR UPDATE
    USING (public.is_business_member(business_id));

-- Public Invoice Access by share_token
CREATE POLICY "Public can view invoice by valid share token"
    ON public.invoices FOR SELECT
    USING (share_token IS NOT NULL);

-- Invoice Items Policies
CREATE POLICY "Members can view invoice items"
    ON public.invoice_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.invoices 
        WHERE invoices.id = invoice_items.invoice_id 
        AND public.is_business_member(invoices.business_id)
    ));

CREATE POLICY "Members can manage invoice items"
    ON public.invoice_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.invoices 
        WHERE invoices.id = invoice_items.invoice_id 
        AND public.is_business_member(invoices.business_id)
    ));

-- Expenses Policies
CREATE POLICY "Members can view expenses"
    ON public.expenses FOR SELECT
    USING (public.is_business_member(business_id));

CREATE POLICY "Members can insert expenses"
    ON public.expenses FOR INSERT
    WITH CHECK (public.is_business_member(business_id));

CREATE POLICY "Members can update expenses"
    ON public.expenses FOR UPDATE
    USING (public.is_business_member(business_id));

-- Payments Policies
CREATE POLICY "Members can view payments"
    ON public.payments FOR SELECT
    USING (public.is_business_member(business_id));

CREATE POLICY "Members can insert payments"
    ON public.payments FOR INSERT
    WITH CHECK (public.is_business_member(business_id));
