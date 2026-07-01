-- =============================================================================
-- GROWTHOS  PHASE 1 PRODUCTION DATABASE SCHEMA
-- Supabase PostgreSQL Migration
-- Version: 1.0.0
-- Date: 2026-05-29
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE workspace_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE platform_type AS ENUM ('shopify', 'meta', 'google');
CREATE TYPE integration_status AS ENUM ('pending', 'syncing', 'active', 'error', 'auth_error', 'disconnected');
CREATE TYPE sync_type AS ENUM ('initial', 'delta', 'manual', 'token_refresh');
CREATE TYPE sync_status AS ENUM ('running', 'success', 'failed', 'partial', 'skipped');

CREATE TABLE public.workspaces (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    brand_name TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    currency TEXT NOT NULL DEFAULT 'INR',
    status workspace_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT workspaces_pkey PRIMARY KEY (id),
    CONSTRAINT workspaces_user_id_ukey UNIQUE (user_id),
    CONSTRAINT workspaces_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE TABLE public.integrations (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    platform platform_type NOT NULL,
    status integration_status NOT NULL DEFAULT 'pending',
    vault_token_id TEXT NULL,
    platform_account_id TEXT NULL,
    platform_account_name TEXT NULL,
    scopes_granted TEXT[] NULL,
    token_expires_at TIMESTAMPTZ NULL,
    last_synced_at TIMESTAMPTZ NULL,
    sync_cursor TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT integrations_pkey PRIMARY KEY (id),
    CONSTRAINT integrations_workspace_platform_ukey UNIQUE (workspace_id, platform),
    CONSTRAINT integrations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces (id) ON DELETE CASCADE
);

CREATE TABLE public.shopify_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    shopify_order_id TEXT NOT NULL,
    shopify_order_number TEXT NULL,
    order_status TEXT NOT NULL,
    financial_status TEXT NOT NULL,
    fulfillment_status TEXT NULL,
    gross_revenue NUMERIC(15,2) NOT NULL,
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    refund_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    net_revenue NUMERIC(15,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    customer_id TEXT NULL,
    tags TEXT[] NULL,
    order_created_at TIMESTAMPTZ NOT NULL,
    order_updated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT shopify_orders_pkey PRIMARY KEY (id),
    CONSTRAINT shopify_orders_workspace_order_ukey UNIQUE (workspace_id, shopify_order_id),
    CONSTRAINT shopify_orders_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces (id) ON DELETE CASCADE
);

CREATE TABLE public.ad_spend_daily (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    platform platform_type NOT NULL,
    spend_date DATE NOT NULL,
    spend NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    impressions BIGINT NOT NULL DEFAULT 0,
    clicks BIGINT NOT NULL DEFAULT 0,
    conversions BIGINT NOT NULL DEFAULT 0,
    cpc NUMERIC(10,4) NULL,
    ctr NUMERIC(8,6) NULL,
    platform_account_id TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ad_spend_daily_pkey PRIMARY KEY (id),
    CONSTRAINT ad_spend_daily_workspace_platform_date_ukey UNIQUE (workspace_id, platform, spend_date),
    CONSTRAINT ad_spend_daily_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces (id) ON DELETE CASCADE
);

CREATE TABLE public.metrics_cache (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    metric_date DATE NOT NULL,
    gross_revenue NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_discounts NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_refunds NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    net_revenue NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_orders INTEGER NOT NULL DEFAULT 0,
    aov NUMERIC(12,2) NULL,
    meta_spend NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    google_spend NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_ad_spend NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    blended_roas NUMERIC(10,4) NULL,
    meta_roas NUMERIC(10,4) NULL,
    google_roas NUMERIC(10,4) NULL,
    cac NUMERIC(12,2) NULL,
    gross_profit NUMERIC(15,2) NULL,
    mer NUMERIC(10,4) NULL,
    is_complete BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT metrics_cache_pkey PRIMARY KEY (id),
    CONSTRAINT metrics_cache_workspace_date_ukey UNIQUE (workspace_id, metric_date),
    CONSTRAINT metrics_cache_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces (id) ON DELETE CASCADE
);

CREATE TABLE public.sync_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    integration_id UUID NULL,
    platform platform_type NOT NULL,
    sync_type sync_type NOT NULL,
    status sync_status NOT NULL DEFAULT 'running',
    records_fetched INTEGER NULL,
    records_inserted INTEGER NULL,
    records_updated INTEGER NULL,
    error_message TEXT NULL,
    retry_attempt SMALLINT NOT NULL DEFAULT 0,
    duration_ms INTEGER NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ NULL,
    CONSTRAINT sync_logs_pkey PRIMARY KEY (id),
    CONSTRAINT sync_logs_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces (id) ON DELETE CASCADE
);

CREATE TABLE public.sync_throttle (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    platform platform_type NOT NULL,
    last_manual_sync_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT sync_throttle_pkey PRIMARY KEY (id),
    CONSTRAINT sync_throttle_workspace_platform_ukey UNIQUE (workspace_id, platform),
    CONSTRAINT sync_throttle_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces (id) ON DELETE CASCADE
);

CREATE INDEX shopify_orders_workspace_date_idx ON public.shopify_orders (workspace_id, order_created_at DESC);
CREATE INDEX ad_spend_daily_workspace_date_idx ON public.ad_spend_daily (workspace_id, spend_date DESC);
CREATE INDEX metrics_cache_workspace_date_idx ON public.metrics_cache (workspace_id, metric_date DESC);
CREATE INDEX integrations_platform_idx ON public.integrations (platform);
CREATE INDEX integrations_status_idx ON public.integrations (status);
CREATE INDEX sync_logs_workspace_started_idx ON public.sync_logs (workspace_id, started_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS \$\$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
\$\$;

CREATE TRIGGER workspaces_set_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER integrations_set_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER shopify_orders_set_updated_at BEFORE UPDATE ON public.shopify_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER ad_spend_daily_set_updated_at BEFORE UPDATE ON public.ad_spend_daily FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER metrics_cache_set_updated_at BEFORE UPDATE ON public.metrics_cache FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER sync_throttle_set_updated_at BEFORE UPDATE ON public.sync_throttle FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spend_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_throttle ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspaces_select ON public.workspaces FOR SELECT TO authenticated USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY workspaces_insert ON public.workspaces FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY workspaces_update ON public.workspaces FOR UPDATE TO authenticated USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY integrations_select ON public.integrations FOR SELECT TO authenticated USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));
CREATE POLICY integrations_insert ON public.integrations FOR INSERT TO authenticated WITH CHECK (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));
CREATE POLICY integrations_update ON public.integrations FOR UPDATE TO authenticated USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));
CREATE POLICY integrations_delete ON public.integrations FOR DELETE TO authenticated USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));

CREATE POLICY shopify_orders_select ON public.shopify_orders FOR SELECT TO authenticated USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));
CREATE POLICY ad_spend_daily_select ON public.ad_spend_daily FOR SELECT TO authenticated USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));
CREATE POLICY metrics_cache_select ON public.metrics_cache FOR SELECT TO authenticated USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));
CREATE POLICY sync_logs_select ON public.sync_logs FOR SELECT TO authenticated USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));
CREATE POLICY sync_throttle_select ON public.sync_throttle FOR SELECT TO authenticated USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));

GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON public.workspaces TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;


-- =============================================================================
-- METRICS RECOMPUTATION PL/PGSQL FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.recompute_metrics_cache(
    p_workspace_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS VOID AS 
DECLARE
    v_date DATE;
    v_timezone TEXT;
BEGIN
    -- Get workspace timezone
    SELECT timezone INTO v_timezone FROM public.workspaces WHERE id = p_workspace_id;
    IF v_timezone IS NULL THEN
        v_timezone := \'Asia/Kolkata\';
    END IF;

    -- Loop through each date in the range
    v_date := p_start_date;
    WHILE v_date <= p_end_date LOOP
        -- Delete existing cache entry for this date and workspace
        DELETE FROM public.metrics_cache 
        WHERE workspace_id = p_workspace_id AND metric_date = v_date;

        -- Insert fresh computation
        INSERT INTO public.metrics_cache (
            workspace_id,
            metric_date,
            gross_revenue,
            total_discounts,
            total_refunds,
            net_revenue,
            total_orders,
            aov,
            meta_spend,
            google_spend,
            total_ad_spend,
            blended_roas,
            cac,
            gross_profit,
            mer,
            is_complete
        )
        SELECT
            p_workspace_id,
            v_date,
            COALESCE(SUM(o.gross_revenue), 0) AS gross_revenue,
            COALESCE(SUM(o.discount_amount), 0) AS total_discounts,
            COALESCE(SUM(o.refund_amount), 0) AS total_refunds,
            COALESCE(SUM(o.net_revenue), 0) AS net_revenue,
            COUNT(o.id)::INTEGER AS total_orders,
            CASE 
                WHEN COUNT(o.id) = 0 THEN 0 
                ELSE COALESCE(SUM(o.net_revenue), 0) / COUNT(o.id) 
            END AS aov,
            COALESCE(MAX(ms.spend), 0) AS meta_spend,
            COALESCE(MAX(gs.spend), 0) AS google_spend,
            (COALESCE(MAX(ms.spend), 0) + COALESCE(MAX(gs.spend), 0)) AS total_ad_spend,
            CASE 
                WHEN (COALESCE(MAX(ms.spend), 0) + COALESCE(MAX(gs.spend), 0)) = 0 THEN 0 
                ELSE COALESCE(SUM(o.net_revenue), 0) / (COALESCE(MAX(ms.spend), 0) + COALESCE(MAX(gs.spend), 0)) 
            END AS blended_roas,
            CASE 
                WHEN COUNT(o.id) = 0 THEN 0 
                ELSE (COALESCE(MAX(ms.spend), 0) + COALESCE(MAX(gs.spend), 0)) / COUNT(o.id) 
            END AS cac,
            COALESCE(SUM(o.net_revenue), 0) - (COALESCE(MAX(ms.spend), 0) + COALESCE(MAX(gs.spend), 0)) AS gross_profit,
            CASE 
                WHEN (COALESCE(MAX(ms.spend), 0) + COALESCE(MAX(gs.spend), 0)) = 0 THEN 0 
                ELSE (COALESCE(SUM(o.net_revenue), 0) - (COALESCE(MAX(ms.spend), 0) + COALESCE(MAX(gs.spend), 0))) / (COALESCE(MAX(ms.spend), 0) + COALESCE(MAX(gs.spend), 0)) 
            END AS mer,
            TRUE AS is_complete
        FROM (SELECT 1) dummy
        LEFT JOIN public.shopify_orders o ON o.workspace_id = p_workspace_id 
            AND (o.order_created_at AT TIME ZONE v_timezone)::DATE = v_date
            AND o.deleted_at IS NULL
        LEFT JOIN public.ad_spend_daily ms ON ms.workspace_id = p_workspace_id 
            AND ms.spend_date = v_date 
            AND ms.platform = \'meta\'
        LEFT JOIN public.ad_spend_daily gs ON gs.workspace_id = p_workspace_id 
            AND gs.spend_date = v_date 
            AND gs.platform = \'google\';

        v_date := v_date + 1;
    END LOOP;
END;
 LANGUAGE plpgsql;

-- =============================================================================
-- SYNC LOGS PURGE PL/PGSQL FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.purge_old_sync_logs() RETURNS INTEGER AS 
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.sync_logs
    WHERE started_at < now() - INTERVAL \'90 days\';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
 LANGUAGE plpgsql;
