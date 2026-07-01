-- Run this FIRST in Supabase SQL Editor
-- Extensions & ENUMs

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE workspace_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE platform_type AS ENUM ('shopify', 'meta', 'google');
CREATE TYPE integration_status AS ENUM ('pending', 'syncing', 'active', 'error', 'auth_error', 'disconnected');
CREATE TYPE sync_type AS ENUM ('initial', 'delta', 'manual', 'token_refresh');
CREATE TYPE sync_status AS ENUM ('running', 'success', 'failed', 'partial', 'skipped');

-- Core tables
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