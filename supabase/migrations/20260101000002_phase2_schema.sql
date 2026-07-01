-- =============================================================================
-- GrowthOS Phase 2 Schema
-- Run after growthos_phase1_schema.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extend existing shopify_orders table
-- ---------------------------------------------------------------------------
ALTER TABLE public.shopify_orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.shopify_orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.shopify_orders ADD COLUMN IF NOT EXISTS rto_status TEXT DEFAULT 'normal'; -- 'normal', 'rto', 'rto_initiated'
ALTER TABLE public.shopify_orders ADD COLUMN IF NOT EXISTS source_channel TEXT; -- 'meta', 'google', 'organic', 'direct'
ALTER TABLE public.shopify_orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.shopify_orders ADD COLUMN IF NOT EXISTS payment_gateway TEXT;

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    shopify_customer_id TEXT NOT NULL,
    email TEXT,
    name TEXT,
    phone TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'IN',
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    avg_order_value NUMERIC(12,2),
    first_order_at TIMESTAMPTZ,
    last_order_at TIMESTAMPTZ,
    ltv NUMERIC(15,2) DEFAULT 0,
    segment TEXT DEFAULT 'one_time', -- 'vip', 'loyal', 'one_time', 'dormant', 'at_risk'
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT customers_pkey PRIMARY KEY (id),
    CONSTRAINT customers_workspace_shopify_ukey UNIQUE (workspace_id, shopify_customer_id),
    CONSTRAINT customers_workspace_id_fkey FOREIGN KEY (workspace_id)
        REFERENCES public.workspaces (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS customers_workspace_id_idx ON public.customers (workspace_id);
CREATE INDEX IF NOT EXISTS customers_segment_idx ON public.customers (workspace_id, segment);
CREATE INDEX IF NOT EXISTS customers_last_order_at_idx ON public.customers (workspace_id, last_order_at DESC);

CREATE TRIGGER set_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_workspace_isolation" ON public.customers
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- Shopify Products
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shopify_products (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    shopify_product_id TEXT NOT NULL,
    title TEXT NOT NULL,
    vendor TEXT,
    product_type TEXT,
    status TEXT DEFAULT 'active',
    tags TEXT[],
    total_sold INTEGER DEFAULT 0,
    total_revenue NUMERIC(15,2) DEFAULT 0,
    total_refunds INTEGER DEFAULT 0,
    refund_rate NUMERIC(6,4) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT shopify_products_pkey PRIMARY KEY (id),
    CONSTRAINT shopify_products_workspace_product_ukey UNIQUE (workspace_id, shopify_product_id),
    CONSTRAINT shopify_products_workspace_id_fkey FOREIGN KEY (workspace_id)
        REFERENCES public.workspaces (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS shopify_products_workspace_id_idx ON public.shopify_products (workspace_id);
CREATE INDEX IF NOT EXISTS shopify_products_status_idx ON public.shopify_products (workspace_id, status);

CREATE TRIGGER set_shopify_products_updated_at
    BEFORE UPDATE ON public.shopify_products
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.shopify_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shopify_products_workspace_isolation" ON public.shopify_products
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- Shopify Order Items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shopify_order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    order_id UUID NOT NULL,
    shopify_product_id TEXT,
    shopify_variant_id TEXT,
    title TEXT,
    sku TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(12,2) NOT NULL,
    cost_per_item NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT shopify_order_items_pkey PRIMARY KEY (id),
    CONSTRAINT shopify_order_items_order_id_fkey FOREIGN KEY (order_id)
        REFERENCES public.shopify_orders (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS shopify_order_items_workspace_id_idx ON public.shopify_order_items (workspace_id);
CREATE INDEX IF NOT EXISTS shopify_order_items_order_id_idx ON public.shopify_order_items (order_id);
CREATE INDEX IF NOT EXISTS shopify_order_items_product_id_idx ON public.shopify_order_items (workspace_id, shopify_product_id);

ALTER TABLE public.shopify_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shopify_order_items_workspace_isolation" ON public.shopify_order_items
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- Ad Campaigns (campaign-level granularity)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    platform platform_type NOT NULL,
    platform_account_id TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    campaign_name TEXT,
    adset_id TEXT,
    adset_name TEXT,
    ad_id TEXT,
    ad_name TEXT,
    status TEXT DEFAULT 'active',
    objective TEXT,
    spend_date DATE NOT NULL,
    spend NUMERIC(15,2) DEFAULT 0,
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    conversions BIGINT DEFAULT 0,
    cpc NUMERIC(10,4),
    ctr NUMERIC(8,6),
    cpm NUMERIC(10,4),
    frequency NUMERIC(8,4),
    reach BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ad_campaigns_pkey PRIMARY KEY (id),
    CONSTRAINT ad_campaigns_workspace_platform_campaign_date_ukey
        UNIQUE (workspace_id, platform, campaign_id, adset_id, ad_id, spend_date),
    CONSTRAINT ad_campaigns_workspace_id_fkey FOREIGN KEY (workspace_id)
        REFERENCES public.workspaces (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ad_campaigns_workspace_id_idx ON public.ad_campaigns (workspace_id);
CREATE INDEX IF NOT EXISTS ad_campaigns_platform_idx ON public.ad_campaigns (workspace_id, platform);
CREATE INDEX IF NOT EXISTS ad_campaigns_spend_date_idx ON public.ad_campaigns (workspace_id, spend_date DESC);

CREATE TRIGGER set_ad_campaigns_updated_at
    BEFORE UPDATE ON public.ad_campaigns
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_campaigns_workspace_isolation" ON public.ad_campaigns
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- Profit Config
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profit_config (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL UNIQUE,
    cogs_pct NUMERIC(6,4) DEFAULT 0.35,
    shipping_cost_per_order NUMERIC(10,2) DEFAULT 60,
    packaging_cost_per_order NUMERIC(10,2) DEFAULT 15,
    payment_gateway_pct NUMERIC(6,4) DEFAULT 0.02,
    return_processing_cost NUMERIC(10,2) DEFAULT 80,
    tax_pct NUMERIC(6,4) DEFAULT 0.18,
    additional_opex_monthly NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT profit_config_pkey PRIMARY KEY (id),
    CONSTRAINT profit_config_workspace_id_fkey FOREIGN KEY (workspace_id)
        REFERENCES public.workspaces (id) ON DELETE CASCADE
);

CREATE TRIGGER set_profit_config_updated_at
    BEFORE UPDATE ON public.profit_config
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profit_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profit_config_workspace_isolation" ON public.profit_config
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    type TEXT NOT NULL,        -- 'alert', 'info', 'success', 'warning'
    category TEXT NOT NULL,    -- 'ads', 'revenue', 'orders', 'sync', 'system'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_workspace_id_fkey FOREIGN KEY (workspace_id)
        REFERENCES public.workspaces (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS notifications_workspace_id_idx ON public.notifications (workspace_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications (workspace_id, is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications (workspace_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_workspace_isolation" ON public.notifications
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- Automation Rules
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automation_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    trigger_type TEXT NOT NULL,  -- 'roas_below', 'roas_above', 'spend_above', 'cac_above', 'revenue_below', 'schedule'
    trigger_config JSONB NOT NULL,
    action_type TEXT NOT NULL,   -- 'pause_campaign', 'increase_budget', 'decrease_budget', 'send_notification', 'send_email'
    action_config JSONB NOT NULL,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT automation_rules_pkey PRIMARY KEY (id),
    CONSTRAINT automation_rules_workspace_id_fkey FOREIGN KEY (workspace_id)
        REFERENCES public.workspaces (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS automation_rules_workspace_id_idx ON public.automation_rules (workspace_id);
CREATE INDEX IF NOT EXISTS automation_rules_is_active_idx ON public.automation_rules (workspace_id, is_active);

CREATE TRIGGER set_automation_rules_updated_at
    BEFORE UPDATE ON public.automation_rules
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_rules_workspace_isolation" ON public.automation_rules
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- CRM Leads
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    source TEXT,              -- 'website', 'ads', 'referral', 'manual'
    status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'proposal', 'won', 'lost'
    pipeline_stage TEXT DEFAULT 'lead',
    deal_value NUMERIC(15,2) DEFAULT 0,
    assigned_to TEXT,
    notes TEXT,
    tags TEXT[],
    last_contacted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT crm_leads_pkey PRIMARY KEY (id),
    CONSTRAINT crm_leads_workspace_id_fkey FOREIGN KEY (workspace_id)
        REFERENCES public.workspaces (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS crm_leads_workspace_id_idx ON public.crm_leads (workspace_id);
CREATE INDEX IF NOT EXISTS crm_leads_status_idx ON public.crm_leads (workspace_id, status);
CREATE INDEX IF NOT EXISTS crm_leads_pipeline_stage_idx ON public.crm_leads (workspace_id, pipeline_stage);

CREATE TRIGGER set_crm_leads_updated_at
    BEFORE UPDATE ON public.crm_leads
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_leads_workspace_isolation" ON public.crm_leads
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- Forecast Results
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.forecast_results (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    forecast_date DATE NOT NULL,
    horizon_days INTEGER NOT NULL,
    metric TEXT NOT NULL,       -- 'revenue', 'profit', 'orders', 'ad_spend'
    predicted_value NUMERIC(15,2) NOT NULL,
    lower_bound NUMERIC(15,2),
    upper_bound NUMERIC(15,2),
    confidence_score NUMERIC(5,4),
    scenario TEXT DEFAULT 'expected', -- 'expected', 'best', 'worst'
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT forecast_results_pkey PRIMARY KEY (id),
    CONSTRAINT forecast_results_workspace_id_fkey FOREIGN KEY (workspace_id)
        REFERENCES public.workspaces (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS forecast_results_workspace_id_idx ON public.forecast_results (workspace_id);
CREATE INDEX IF NOT EXISTS forecast_results_metric_idx ON public.forecast_results (workspace_id, metric, forecast_date DESC);

ALTER TABLE public.forecast_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forecast_results_workspace_isolation" ON public.forecast_results
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- Audit Logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    user_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    metadata JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
    CONSTRAINT audit_logs_workspace_id_fkey FOREIGN KEY (workspace_id)
        REFERENCES public.workspaces (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS audit_logs_workspace_id_idx ON public.audit_logs (workspace_id);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON public.audit_logs (workspace_id, user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs (workspace_id, created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_workspace_isolation" ON public.audit_logs
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- Team Members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    user_id UUID,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer', -- 'owner', 'admin', 'member', 'viewer'
    status TEXT NOT NULL DEFAULT 'invited', -- 'invited', 'active', 'deactivated'
    invited_by UUID,
    invite_token TEXT,
    invite_expires_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT team_members_pkey PRIMARY KEY (id),
    CONSTRAINT team_members_workspace_email_ukey UNIQUE (workspace_id, email),
    CONSTRAINT team_members_workspace_id_fkey FOREIGN KEY (workspace_id)
        REFERENCES public.workspaces (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS team_members_workspace_id_idx ON public.team_members (workspace_id);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON public.team_members (user_id);
CREATE INDEX IF NOT EXISTS team_members_invite_token_idx ON public.team_members (invite_token);

CREATE TRIGGER set_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_members_workspace_isolation" ON public.team_members
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- NOTE: To support team workspaces (multiple users per workspace), run:
-- ALTER TABLE public.workspaces DROP CONSTRAINT IF EXISTS workspaces_user_id_ukey;
-- This requires careful migration planning.
-- ---------------------------------------------------------------------------
