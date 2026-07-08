-- ============================================================================
-- GrowthOS Enterprise Multi-Tenant Schema
-- Migration: 20260708000001_enterprise_multi_tenant
--
-- Adds full enterprise hierarchy:
--   Platform → Organizations → Workspaces → Business Units
--   → Commerce Accounts → Channels → OAuth Connections
--
-- ADDITIVE: does not drop or alter existing data columns.
-- Safe to run multiple times (all statements are idempotent).
-- ============================================================================

-- ─── Extensions (idempotent) ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── New ENUMs ────────────────────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE org_status            AS ENUM ('active','suspended','deleted');            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE org_role              AS ENUM ('owner','admin','member','viewer','billing_admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE bu_role               AS ENUM ('owner','admin','manager','analyst','viewer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE channel_type          AS ENUM ('shopify','woocommerce','amazon','meta_ads','google_ads','tiktok_ads','google_analytics','stripe','razorpay','whatsapp','klaviyo','mailchimp','custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE channel_status        AS ENUM ('pending','active','error','suspended','disconnected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE oauth_grant_type      AS ENUM ('authorization_code','client_credentials','api_key','webhook'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE sync_trigger_type     AS ENUM ('initial','scheduled','manual','webhook','token_refresh','error_retry'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE sync_job_status_type  AS ENUM ('queued','running','success','failed','cancelled','partial'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE billing_plan_tier     AS ENUM ('free','starter','growth','scale','enterprise','custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE subscription_status   AS ENUM ('trialing','active','past_due','cancelled','paused','unpaid'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE ai_agent_type         AS ENUM ('founder_ai','ads_ai','seo_ai','product_ai','finance_ai','pricing_ai','automation_ai','decision_ai','forecast_ai'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 0. WORKSPACE MEMBERS ────────────────────────────────────────────────────
-- This table is referenced by useIsAdmin() hook, RLS policies, and admin pages
-- but was never explicitly created in prior migrations. Ensure it exists.

CREATE TABLE IF NOT EXISTS public.workspace_members (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    workspace_id    UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role            TEXT        NOT NULL DEFAULT 'member',  -- owner | super_admin | admin | member | viewer
    status          TEXT        NOT NULL DEFAULT 'active',  -- active | invited | suspended
    permissions     JSONB       NOT NULL DEFAULT '{}'::JSONB,
    invited_by      UUID        NULL REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT workspace_members_pkey PRIMARY KEY (id),
    CONSTRAINT workspace_members_workspace_user_ukey UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id      ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_role         ON public.workspace_members(role);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;
CREATE POLICY "workspace_members_select" ON public.workspace_members
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR workspace_id IN (
            SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "workspace_members_insert" ON public.workspace_members;
CREATE POLICY "workspace_members_insert" ON public.workspace_members
    FOR INSERT TO authenticated
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid() AND role IN ('owner','super_admin','admin')
        )
        OR user_id = auth.uid()  -- allow self-join on workspace creation
    );

DROP POLICY IF EXISTS "workspace_members_update" ON public.workspace_members;
CREATE POLICY "workspace_members_update" ON public.workspace_members
    FOR UPDATE TO authenticated
    USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid() AND role IN ('owner','super_admin','admin')
        )
    );

-- Auto-populate workspace_members from workspaces.user_id for existing workspaces
INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
SELECT id, user_id, 'owner', 'active'
FROM public.workspaces
WHERE user_id IS NOT NULL
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workspace_members_updated_at ON public.workspace_members;
CREATE TRIGGER trg_workspace_members_updated_at
    BEFORE UPDATE ON public.workspace_members
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 1. BILLING PLANS ────────────────────────────────────────────────────────
-- Created before organizations so org.plan_id FK can reference it.

CREATE TABLE IF NOT EXISTS public.billing_plans (
    id                      UUID                NOT NULL DEFAULT gen_random_uuid(),
    name                    TEXT                NOT NULL,
    tier                    billing_plan_tier   NOT NULL DEFAULT 'starter',
    description             TEXT                NULL,
    monthly_price_usd       NUMERIC(10,2)       NOT NULL DEFAULT 0,
    annual_price_usd        NUMERIC(10,2)       NULL,
    max_workspaces          INTEGER             NULL,   -- NULL = unlimited
    max_business_units      INTEGER             NULL,
    max_commerce_accounts   INTEGER             NULL,
    max_channels            INTEGER             NULL,
    max_users               INTEGER             NULL,
    max_api_calls_month     INTEGER             NULL,
    max_ai_queries_month    INTEGER             NULL,
    features                TEXT[]              NOT NULL DEFAULT '{}',
    is_active               BOOLEAN             NOT NULL DEFAULT TRUE,
    is_public               BOOLEAN             NOT NULL DEFAULT TRUE,
    stripe_product_id       TEXT                NULL,
    stripe_price_id_monthly TEXT                NULL,
    stripe_price_id_annual  TEXT                NULL,
    metadata                JSONB               NOT NULL DEFAULT '{}'::JSONB,
    created_at              TIMESTAMPTZ         NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ         NOT NULL DEFAULT now(),
    CONSTRAINT billing_plans_pkey PRIMARY KEY (id)
);

ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_plans_select" ON public.billing_plans;
CREATE POLICY "billing_plans_select" ON public.billing_plans
    FOR SELECT TO authenticated
    USING (is_public = TRUE);

DROP TRIGGER IF EXISTS trg_billing_plans_updated_at ON public.billing_plans;
CREATE TRIGGER trg_billing_plans_updated_at
    BEFORE UPDATE ON public.billing_plans
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed default plans
INSERT INTO public.billing_plans (name, tier, description, monthly_price_usd, annual_price_usd, max_channels, max_users, max_ai_queries_month, features, is_active, is_public)
VALUES
    ('Free',        'free',       'Get started with one store',           0,    0,     1,    2,    50,    ARRAY['basic_analytics','1_integration'],     TRUE,  TRUE),
    ('Starter',     'starter',    'For small D2C brands',                 49,   470,   3,    5,    500,   ARRAY['analytics','3_integrations','founder_ai'], TRUE, TRUE),
    ('Growth',      'growth',     'For scaling brands',                   149,  1430,  10,   15,   2000,  ARRAY['analytics','10_integrations','all_ai','reports'], TRUE, TRUE),
    ('Scale',       'scale',      'For enterprise D2C',                   499,  4790,  50,   50,   10000, ARRAY['all_features','white_label','sso','priority_support'], TRUE, TRUE),
    ('Enterprise',  'enterprise', 'Custom enterprise contract',           0,    0,     NULL, NULL, NULL,  ARRAY['all_features','white_label','sso','custom_integrations','dedicated_csm'], TRUE, FALSE)
ON CONFLICT DO NOTHING;

-- ─── 2. ORGANIZATIONS ────────────────────────────────────────────────────────
-- Top-level container. A user can belong to multiple organizations.
-- An organization owns one or more workspaces.

CREATE TABLE IF NOT EXISTS public.organizations (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    slug            TEXT        NOT NULL,
    display_name    TEXT        NOT NULL,
    logo_url        TEXT        NULL,
    website         TEXT        NULL,
    industry        TEXT        NULL,
    country_code    TEXT        NOT NULL DEFAULT 'IN',
    currency        TEXT        NOT NULL DEFAULT 'INR',
    timezone        TEXT        NOT NULL DEFAULT 'Asia/Kolkata',
    status          org_status  NOT NULL DEFAULT 'active',
    plan_id         UUID        NULL REFERENCES public.billing_plans(id) ON DELETE SET NULL,
    trial_ends_at   TIMESTAMPTZ NULL,
    settings        JSONB       NOT NULL DEFAULT '{}'::JSONB,
    metadata        JSONB       NOT NULL DEFAULT '{}'::JSONB,
    created_by      UUID        NOT NULL REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ NULL,
    CONSTRAINT organizations_pkey PRIMARY KEY (id),
    CONSTRAINT organizations_slug_ukey UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug      ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status    ON public.organizations(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON public.organizations;
CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 3. ORGANIZATION MEMBERS ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.organization_members (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    org_id          UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role            org_role    NOT NULL DEFAULT 'member',
    status          TEXT        NOT NULL DEFAULT 'active',  -- active | invited | suspended
    permissions     JSONB       NOT NULL DEFAULT '{}'::JSONB,
    invited_by      UUID        NULL REFERENCES auth.users(id),
    invited_at      TIMESTAMPTZ NULL,
    accepted_at     TIMESTAMPTZ NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT organization_members_pkey PRIMARY KEY (id),
    CONSTRAINT organization_members_org_user_ukey UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id  ON public.organization_members(org_id);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_organization_members_updated_at ON public.organization_members;
CREATE TRIGGER trg_organization_members_updated_at
    BEFORE UPDATE ON public.organization_members
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 4. ENHANCE WORKSPACES ───────────────────────────────────────────────────
-- Add org_id and extra profile columns. Existing rows remain untouched.

ALTER TABLE public.workspaces
    ADD COLUMN IF NOT EXISTS org_id      UUID NULL REFERENCES public.organizations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS industry    TEXT NULL,
    ADD COLUMN IF NOT EXISTS website     TEXT NULL,
    ADD COLUMN IF NOT EXISTS logo_url    TEXT NULL,
    ADD COLUMN IF NOT EXISTS settings    JSONB NOT NULL DEFAULT '{}'::JSONB,
    ADD COLUMN IF NOT EXISTS metadata    JSONB NOT NULL DEFAULT '{}'::JSONB;

CREATE INDEX IF NOT EXISTS idx_workspaces_org_id ON public.workspaces(org_id) WHERE org_id IS NOT NULL;

-- ─── 5. SUBSCRIPTIONS ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.org_subscriptions (
    id                      UUID                    NOT NULL DEFAULT gen_random_uuid(),
    org_id                  UUID                    NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id                 UUID                    NOT NULL REFERENCES public.billing_plans(id),
    status                  subscription_status     NOT NULL DEFAULT 'trialing',
    billing_cycle           TEXT                    NOT NULL DEFAULT 'monthly',
    current_period_start    TIMESTAMPTZ             NOT NULL DEFAULT now(),
    current_period_end      TIMESTAMPTZ             NOT NULL DEFAULT (now() + INTERVAL '30 days'),
    trial_start             TIMESTAMPTZ             NULL,
    trial_end               TIMESTAMPTZ             NULL,
    cancelled_at            TIMESTAMPTZ             NULL,
    cancellation_reason     TEXT                    NULL,
    stripe_subscription_id  TEXT                    NULL,
    stripe_customer_id      TEXT                    NULL,
    mrr_usd                 NUMERIC(10,2)           NULL,
    metadata                JSONB                   NOT NULL DEFAULT '{}'::JSONB,
    created_at              TIMESTAMPTZ             NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ             NOT NULL DEFAULT now(),
    CONSTRAINT org_subscriptions_pkey PRIMARY KEY (id),
    CONSTRAINT org_subscriptions_stripe_sub_ukey UNIQUE (stripe_subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_org_subscriptions_org_id ON public.org_subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_status ON public.org_subscriptions(status);

ALTER TABLE public.org_subscriptions ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_org_subscriptions_updated_at ON public.org_subscriptions;
CREATE TRIGGER trg_org_subscriptions_updated_at
    BEFORE UPDATE ON public.org_subscriptions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 6. BUSINESS UNITS ───────────────────────────────────────────────────────
-- Subdivision of a workspace. Example: "India D2C", "US D2C", "B2B Wholesale".

CREATE TABLE IF NOT EXISTS public.business_units (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    workspace_id    UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name            TEXT        NOT NULL,
    slug            TEXT        NOT NULL,
    description     TEXT        NULL,
    country_code    TEXT        NOT NULL DEFAULT 'IN',
    currency        TEXT        NOT NULL DEFAULT 'INR',
    timezone        TEXT        NOT NULL DEFAULT 'Asia/Kolkata',
    is_default      BOOLEAN     NOT NULL DEFAULT FALSE,
    settings        JSONB       NOT NULL DEFAULT '{}'::JSONB,
    metadata        JSONB       NOT NULL DEFAULT '{}'::JSONB,
    created_by      UUID        NOT NULL REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ NULL,
    CONSTRAINT business_units_pkey PRIMARY KEY (id),
    CONSTRAINT business_units_workspace_slug_ukey UNIQUE (workspace_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_business_units_workspace_id ON public.business_units(workspace_id) WHERE deleted_at IS NULL;

ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_business_units_updated_at ON public.business_units;
CREATE TRIGGER trg_business_units_updated_at
    BEFORE UPDATE ON public.business_units
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 7. BUSINESS UNIT MEMBERS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.business_unit_members (
    id              UUID    NOT NULL DEFAULT gen_random_uuid(),
    bu_id           UUID    NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
    user_id         UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role            bu_role NOT NULL DEFAULT 'viewer',
    permissions     JSONB   NOT NULL DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT business_unit_members_pkey PRIMARY KEY (id),
    CONSTRAINT business_unit_members_bu_user_ukey UNIQUE (bu_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bu_members_user_id ON public.business_unit_members(user_id);
CREATE INDEX IF NOT EXISTS idx_bu_members_bu_id   ON public.business_unit_members(bu_id);

ALTER TABLE public.business_unit_members ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_bu_members_updated_at ON public.business_unit_members;
CREATE TRIGGER trg_bu_members_updated_at
    BEFORE UPDATE ON public.business_unit_members
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 8. COMMERCE ACCOUNTS ────────────────────────────────────────────────────
-- A commerce account is one "trading entity" within a BU.
-- A BU can have multiple commerce accounts (e.g. separate Shopify stores
-- for different product lines or geographies).

CREATE TABLE IF NOT EXISTS public.commerce_accounts (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    bu_id           UUID        NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
    name            TEXT        NOT NULL,
    slug            TEXT        NOT NULL,
    description     TEXT        NULL,
    country_code    TEXT        NOT NULL DEFAULT 'IN',
    currency        TEXT        NOT NULL DEFAULT 'INR',
    timezone        TEXT        NOT NULL DEFAULT 'Asia/Kolkata',
    is_default      BOOLEAN     NOT NULL DEFAULT FALSE,
    settings        JSONB       NOT NULL DEFAULT '{}'::JSONB,
    metadata        JSONB       NOT NULL DEFAULT '{}'::JSONB,
    created_by      UUID        NOT NULL REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ NULL,
    CONSTRAINT commerce_accounts_pkey PRIMARY KEY (id),
    CONSTRAINT commerce_accounts_bu_slug_ukey UNIQUE (bu_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_commerce_accounts_bu_id ON public.commerce_accounts(bu_id) WHERE deleted_at IS NULL;

ALTER TABLE public.commerce_accounts ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_commerce_accounts_updated_at ON public.commerce_accounts;
CREATE TRIGGER trg_commerce_accounts_updated_at
    BEFORE UPDATE ON public.commerce_accounts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 9. CHANNELS ─────────────────────────────────────────────────────────────
-- Each channel = one connected platform account (one Shopify store, one Meta
-- ad account, one Google Analytics property, etc.).
-- A commerce account can have multiple channels, including multiple of the
-- same type (e.g. two Shopify stores in different regions).

CREATE TABLE IF NOT EXISTS public.channels (
    id                          UUID            NOT NULL DEFAULT gen_random_uuid(),
    commerce_account_id         UUID            NOT NULL REFERENCES public.commerce_accounts(id) ON DELETE CASCADE,
    channel_type                channel_type    NOT NULL,
    status                      channel_status  NOT NULL DEFAULT 'pending',
    display_name                TEXT            NOT NULL,
    -- Platform-side identifiers (never used for auth — use oauth_connections)
    platform_account_id         TEXT            NULL,
    platform_account_name       TEXT            NULL,
    platform_account_url        TEXT            NULL,
    platform_account_currency   TEXT            NULL,
    platform_account_timezone   TEXT            NULL,
    scopes_granted              TEXT[]          NULL,
    -- Health monitoring
    health_status               TEXT            NOT NULL DEFAULT 'unknown',  -- healthy | degraded | down | unknown
    health_checked_at           TIMESTAMPTZ     NULL,
    health_error_message        TEXT            NULL,
    -- Sync state
    last_synced_at              TIMESTAMPTZ     NULL,
    sync_cursor                 TEXT            NULL,
    token_expires_at            TIMESTAMPTZ     NULL,
    -- Config
    settings                    JSONB           NOT NULL DEFAULT '{}'::JSONB,
    metadata                    JSONB           NOT NULL DEFAULT '{}'::JSONB,
    created_by                  UUID            NOT NULL REFERENCES auth.users(id),
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    deleted_at                  TIMESTAMPTZ     NULL,
    CONSTRAINT channels_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_channels_commerce_account_id ON public.channels(commerce_account_id);
CREATE INDEX IF NOT EXISTS idx_channels_type_status         ON public.channels(channel_type, status);
CREATE INDEX IF NOT EXISTS idx_channels_health_checked_at   ON public.channels(health_checked_at);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_channels_updated_at ON public.channels;
CREATE TRIGGER trg_channels_updated_at
    BEFORE UPDATE ON public.channels
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 10. OAUTH CONNECTIONS ───────────────────────────────────────────────────
-- Stores encrypted OAuth credentials per channel.
-- Customer credentials are NEVER stored in environment variables.
-- Encryption key comes from app-level secret injected at query time.

CREATE TABLE IF NOT EXISTS public.oauth_connections (
    id                      UUID                NOT NULL DEFAULT gen_random_uuid(),
    channel_id              UUID                NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    grant_type              oauth_grant_type    NOT NULL DEFAULT 'authorization_code',
    -- Encrypted credential fields (use pgp_sym_encrypt / pgp_sym_decrypt)
    encrypted_client_id     BYTEA               NULL,
    encrypted_client_secret BYTEA               NULL,
    encrypted_access_token  BYTEA               NULL,
    encrypted_refresh_token BYTEA               NULL,
    -- Non-sensitive token metadata
    token_type              TEXT                NULL DEFAULT 'Bearer',
    scopes                  TEXT[]              NULL,
    expires_at              TIMESTAMPTZ         NULL,
    refresh_expires_at      TIMESTAMPTZ         NULL,
    platform_user_id        TEXT                NULL,
    platform_shop           TEXT                NULL,   -- e.g. mystore.myshopify.com
    raw_token_metadata      JSONB               NOT NULL DEFAULT '{}'::JSONB,
    -- Audit
    connected_by            UUID                NOT NULL REFERENCES auth.users(id),
    connected_at            TIMESTAMPTZ         NOT NULL DEFAULT now(),
    last_refreshed_at       TIMESTAMPTZ         NULL,
    refresh_error           TEXT                NULL,
    created_at              TIMESTAMPTZ         NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ         NOT NULL DEFAULT now(),
    CONSTRAINT oauth_connections_pkey PRIMARY KEY (id),
    CONSTRAINT oauth_connections_channel_ukey UNIQUE (channel_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_connections_channel_id ON public.oauth_connections(channel_id);

ALTER TABLE public.oauth_connections ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_oauth_connections_updated_at ON public.oauth_connections;
CREATE TRIGGER trg_oauth_connections_updated_at
    BEFORE UPDATE ON public.oauth_connections
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 11. OAUTH TOKEN HISTORY ─────────────────────────────────────────────────
-- Immutable audit trail of every token event (rotate, revoke, error).

CREATE TABLE IF NOT EXISTS public.oauth_token_history (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
    connection_id       UUID        NOT NULL REFERENCES public.oauth_connections(id) ON DELETE CASCADE,
    event               TEXT        NOT NULL,  -- initial_connect | refresh | revoke | error
    success             BOOLEAN     NOT NULL DEFAULT TRUE,
    error_code          TEXT        NULL,
    error_message       TEXT        NULL,
    previous_expires_at TIMESTAMPTZ NULL,
    new_expires_at      TIMESTAMPTZ NULL,
    triggered_by        UUID        NULL REFERENCES auth.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oauth_token_history_conn_id    ON public.oauth_token_history(connection_id);
CREATE INDEX IF NOT EXISTS idx_oauth_token_history_created_at ON public.oauth_token_history(created_at DESC);

ALTER TABLE public.oauth_token_history ENABLE ROW LEVEL SECURITY;

-- ─── 12. SYNC JOBS ───────────────────────────────────────────────────────────
-- Job queue for the centralized sync engine.

CREATE TABLE IF NOT EXISTS public.sync_jobs (
    id              UUID                    NOT NULL DEFAULT gen_random_uuid(),
    channel_id      UUID                    NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    trigger         sync_trigger_type       NOT NULL DEFAULT 'manual',
    status          sync_job_status_type    NOT NULL DEFAULT 'queued',
    priority        SMALLINT                NOT NULL DEFAULT 5,  -- 1 (highest) .. 10 (lowest)
    data_types      TEXT[]                  NOT NULL DEFAULT '{}',  -- ['orders','products','customers',…]
    date_from       TIMESTAMPTZ             NULL,
    date_to         TIMESTAMPTZ             NULL,
    cursor_start    TEXT                    NULL,
    cursor_end      TEXT                    NULL,
    records_fetched INTEGER                 NOT NULL DEFAULT 0,
    records_saved   INTEGER                 NOT NULL DEFAULT 0,
    records_failed  INTEGER                 NOT NULL DEFAULT 0,
    error_message   TEXT                    NULL,
    error_details   JSONB                   NULL,
    started_at      TIMESTAMPTZ             NULL,
    completed_at    TIMESTAMPTZ             NULL,
    duration_ms     INTEGER                 NULL,
    worker_id       TEXT                    NULL,
    retry_count     SMALLINT                NOT NULL DEFAULT 0,
    max_retries     SMALLINT                NOT NULL DEFAULT 3,
    next_retry_at   TIMESTAMPTZ             NULL,
    scheduled_at    TIMESTAMPTZ             NULL,
    queued_by       UUID                    NULL REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ             NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ             NOT NULL DEFAULT now(),
    CONSTRAINT sync_jobs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_channel_id       ON public.sync_jobs(channel_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status_queued    ON public.sync_jobs(status, scheduled_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_sync_jobs_created_at       ON public.sync_jobs(created_at DESC);

ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_sync_jobs_updated_at ON public.sync_jobs;
CREATE TRIGGER trg_sync_jobs_updated_at
    BEFORE UPDATE ON public.sync_jobs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 13. SYNC HISTORY ────────────────────────────────────────────────────────
-- Long-term compressed audit of completed syncs.

CREATE TABLE IF NOT EXISTS public.sync_history (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    channel_id      UUID        NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    job_id          UUID        NULL REFERENCES public.sync_jobs(id) ON DELETE SET NULL,
    trigger         TEXT        NOT NULL,
    status          TEXT        NOT NULL,
    data_types      TEXT[]      NULL,
    records_synced  INTEGER     NULL,
    duration_ms     INTEGER     NULL,
    error_summary   TEXT        NULL,
    completed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_history_channel_id   ON public.sync_history(channel_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_completed_at ON public.sync_history(completed_at DESC);

ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;

-- ─── 14. WEBHOOKS ────────────────────────────────────────────────────────────
-- Outbound webhooks: notify external systems of GrowthOS events.

CREATE TABLE IF NOT EXISTS public.platform_webhooks (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
    org_id              UUID        NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    workspace_id        UUID        NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name                TEXT        NOT NULL,
    endpoint_url        TEXT        NOT NULL,
    events              TEXT[]      NOT NULL DEFAULT '{}',
    encrypted_secret    BYTEA       NULL,   -- HMAC signing secret (encrypted at rest)
    active              BOOLEAN     NOT NULL DEFAULT TRUE,
    headers             JSONB       NOT NULL DEFAULT '{}'::JSONB,
    retry_count         SMALLINT    NOT NULL DEFAULT 3,
    timeout_ms          INTEGER     NOT NULL DEFAULT 5000,
    last_triggered_at   TIMESTAMPTZ NULL,
    last_error          TEXT        NULL,
    delivery_count      INTEGER     NOT NULL DEFAULT 0,
    failure_count       INTEGER     NOT NULL DEFAULT 0,
    created_by          UUID        NOT NULL REFERENCES auth.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT platform_webhooks_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_platform_webhooks_org_id       ON public.platform_webhooks(org_id)       WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_platform_webhooks_workspace_id ON public.platform_webhooks(workspace_id) WHERE workspace_id IS NOT NULL;

ALTER TABLE public.platform_webhooks ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_platform_webhooks_updated_at ON public.platform_webhooks;
CREATE TRIGGER trg_platform_webhooks_updated_at
    BEFORE UPDATE ON public.platform_webhooks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    webhook_id      UUID        NOT NULL REFERENCES public.platform_webhooks(id) ON DELETE CASCADE,
    event_type      TEXT        NOT NULL,
    payload         JSONB       NOT NULL DEFAULT '{}'::JSONB,
    response_status INTEGER     NULL,
    response_body   TEXT        NULL,
    latency_ms      INTEGER     NULL,
    success         BOOLEAN     NOT NULL DEFAULT FALSE,
    attempt_number  SMALLINT    NOT NULL DEFAULT 1,
    next_retry_at   TIMESTAMPTZ NULL,
    delivered_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id  ON public.webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_delivered_at ON public.webhook_deliveries(delivered_at DESC);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- ─── 15. AI AGENT LOGS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_agent_logs (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    workspace_id        UUID            NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    bu_id               UUID            NULL REFERENCES public.business_units(id) ON DELETE SET NULL,
    commerce_account_id UUID            NULL REFERENCES public.commerce_accounts(id) ON DELETE SET NULL,
    user_id             UUID            NOT NULL REFERENCES auth.users(id),
    agent_type          ai_agent_type   NOT NULL,
    session_id          TEXT            NULL,
    prompt_tokens       INTEGER         NOT NULL DEFAULT 0,
    completion_tokens   INTEGER         NOT NULL DEFAULT 0,
    total_tokens        INTEGER         NOT NULL DEFAULT 0,
    model               TEXT            NULL,
    latency_ms          INTEGER         NULL,
    success             BOOLEAN         NOT NULL DEFAULT TRUE,
    error_code          TEXT            NULL,
    error_message       TEXT            NULL,
    prompt_hash         TEXT            NULL,  -- SHA-256 of prompt; NOT the prompt itself
    context_keys        TEXT[]          NULL,  -- which data sources were queried
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_workspace_id ON public.ai_agent_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_user_id      ON public.ai_agent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_created_at   ON public.ai_agent_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_agent_type   ON public.ai_agent_logs(agent_type);

ALTER TABLE public.ai_agent_logs ENABLE ROW LEVEL SECURITY;

-- ─── 16. AUTOMATION LOGS ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.automation_logs (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    workspace_id    UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    automation_id   UUID        NULL,   -- soft ref to automation_rules.id
    rule_name       TEXT        NULL,
    trigger_event   TEXT        NOT NULL,
    trigger_data    JSONB       NOT NULL DEFAULT '{}'::JSONB,
    actions_run     JSONB       NOT NULL DEFAULT '[]'::JSONB,
    success         BOOLEAN     NOT NULL DEFAULT TRUE,
    error_message   TEXT        NULL,
    duration_ms     INTEGER     NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_workspace_id ON public.automation_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at   ON public.automation_logs(created_at DESC);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- ─── 17. INVITATIONS ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invitations (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    org_id          UUID        NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    workspace_id    UUID        NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    bu_id           UUID        NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
    invitee_email   TEXT        NOT NULL,
    role            TEXT        NOT NULL DEFAULT 'member',
    token           TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
    accepted_at     TIMESTAMPTZ NULL,
    revoked_at      TIMESTAMPTZ NULL,
    invited_by      UUID        NOT NULL REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT invitations_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_invitations_token         ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_email ON public.invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at    ON public.invitations(expires_at);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- ─── 18. ENHANCE EXISTING TABLES ─────────────────────────────────────────────

-- audit_logs: add enterprise context columns
ALTER TABLE IF EXISTS public.audit_logs
    ADD COLUMN IF NOT EXISTS org_id              UUID NULL,
    ADD COLUMN IF NOT EXISTS bu_id               UUID NULL,
    ADD COLUMN IF NOT EXISTS commerce_account_id UUID NULL,
    ADD COLUMN IF NOT EXISTS channel_id          UUID NULL,
    ADD COLUMN IF NOT EXISTS severity            TEXT NOT NULL DEFAULT 'info',
    ADD COLUMN IF NOT EXISTS ip_address          TEXT NULL,
    ADD COLUMN IF NOT EXISTS user_agent          TEXT NULL,
    ADD COLUMN IF NOT EXISTS session_id          TEXT NULL;

-- notifications: add enterprise context + priority
ALTER TABLE IF EXISTS public.notifications
    ADD COLUMN IF NOT EXISTS org_id              UUID NULL,
    ADD COLUMN IF NOT EXISTS channel_id          UUID NULL,
    ADD COLUMN IF NOT EXISTS priority            TEXT NOT NULL DEFAULT 'normal',
    ADD COLUMN IF NOT EXISTS expires_at          TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS action_url          TEXT NULL,
    ADD COLUMN IF NOT EXISTS action_label        TEXT NULL;

-- ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

-- Returns org IDs where the current user is an active member.
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT ARRAY(
        SELECT org_id FROM organization_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
$$;

-- Returns workspace IDs the current user can access.
CREATE OR REPLACE FUNCTION get_user_workspace_ids()
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT ARRAY(
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid()
    )
$$;

-- Returns business unit IDs the current user can access.
CREATE OR REPLACE FUNCTION get_user_bu_ids()
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT ARRAY(
        SELECT bu_id FROM business_unit_members
        WHERE user_id = auth.uid()
    )
$$;

-- Update get_workspace_id() to use the new workspace_members table.
CREATE OR REPLACE FUNCTION get_workspace_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
    LIMIT 1;
$$;

-- ─── RLS POLICIES ────────────────────────────────────────────────────────────

-- ORGANIZATIONS
DROP POLICY IF EXISTS "orgs_select" ON public.organizations;
CREATE POLICY "orgs_select" ON public.organizations
    FOR SELECT TO authenticated
    USING (id = ANY(get_user_org_ids()) OR created_by = auth.uid());

DROP POLICY IF EXISTS "orgs_insert" ON public.organizations;
CREATE POLICY "orgs_insert" ON public.organizations
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "orgs_update" ON public.organizations;
CREATE POLICY "orgs_update" ON public.organizations
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE org_id = organizations.id AND user_id = auth.uid() AND role IN ('owner','admin')
        )
    );

-- ORGANIZATION MEMBERS
DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;
CREATE POLICY "org_members_select" ON public.organization_members
    FOR SELECT TO authenticated
    USING (org_id = ANY(get_user_org_ids()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "org_members_insert" ON public.organization_members;
CREATE POLICY "org_members_insert" ON public.organization_members
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.org_id = organization_members.org_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner','admin')
        )
        OR user_id = auth.uid()  -- allow self-join when creating org
    );

DROP POLICY IF EXISTS "org_members_update" ON public.organization_members;
CREATE POLICY "org_members_update" ON public.organization_members
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.org_id = organization_members.org_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner','admin')
        )
    );

-- ORG SUBSCRIPTIONS
DROP POLICY IF EXISTS "org_subscriptions_select" ON public.org_subscriptions;
CREATE POLICY "org_subscriptions_select" ON public.org_subscriptions
    FOR SELECT TO authenticated
    USING (org_id = ANY(get_user_org_ids()));

DROP POLICY IF EXISTS "org_subscriptions_insert" ON public.org_subscriptions;
CREATE POLICY "org_subscriptions_insert" ON public.org_subscriptions
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE org_id = org_subscriptions.org_id
              AND user_id = auth.uid()
              AND role IN ('owner','billing_admin')
        )
    );

-- BUSINESS UNITS
DROP POLICY IF EXISTS "bu_select" ON public.business_units;
CREATE POLICY "bu_select" ON public.business_units
    FOR SELECT TO authenticated
    USING (workspace_id = ANY(get_user_workspace_ids()) OR id = ANY(get_user_bu_ids()));

DROP POLICY IF EXISTS "bu_insert" ON public.business_units;
CREATE POLICY "bu_insert" ON public.business_units
    FOR INSERT TO authenticated
    WITH CHECK (
        workspace_id = ANY(get_user_workspace_ids()) AND created_by = auth.uid()
    );

DROP POLICY IF EXISTS "bu_update" ON public.business_units;
CREATE POLICY "bu_update" ON public.business_units
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_id = business_units.workspace_id
              AND user_id = auth.uid()
              AND role IN ('owner','super_admin','admin')
        )
    );

-- BUSINESS UNIT MEMBERS
DROP POLICY IF EXISTS "bu_members_select" ON public.business_unit_members;
CREATE POLICY "bu_members_select" ON public.business_unit_members
    FOR SELECT TO authenticated
    USING (bu_id = ANY(get_user_bu_ids()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "bu_members_insert" ON public.business_unit_members;
CREATE POLICY "bu_members_insert" ON public.business_unit_members
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM business_units bu
            JOIN workspace_members wm ON wm.workspace_id = bu.workspace_id
            WHERE bu.id = business_unit_members.bu_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner','super_admin','admin')
        )
    );

-- COMMERCE ACCOUNTS
DROP POLICY IF EXISTS "commerce_accounts_select" ON public.commerce_accounts;
CREATE POLICY "commerce_accounts_select" ON public.commerce_accounts
    FOR SELECT TO authenticated
    USING (
        bu_id = ANY(get_user_bu_ids())
        OR EXISTS (
            SELECT 1 FROM business_units bu
            WHERE bu.id = commerce_accounts.bu_id
              AND bu.workspace_id = ANY(get_user_workspace_ids())
        )
    );

DROP POLICY IF EXISTS "commerce_accounts_insert" ON public.commerce_accounts;
CREATE POLICY "commerce_accounts_insert" ON public.commerce_accounts
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM business_units bu
            JOIN workspace_members wm ON wm.workspace_id = bu.workspace_id
            WHERE bu.id = commerce_accounts.bu_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner','super_admin','admin')
        )
    );

DROP POLICY IF EXISTS "commerce_accounts_update" ON public.commerce_accounts;
CREATE POLICY "commerce_accounts_update" ON public.commerce_accounts
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM business_units bu
            JOIN workspace_members wm ON wm.workspace_id = bu.workspace_id
            WHERE bu.id = commerce_accounts.bu_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner','super_admin','admin')
        )
    );

-- CHANNELS
DROP POLICY IF EXISTS "channels_select" ON public.channels;
CREATE POLICY "channels_select" ON public.channels
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM commerce_accounts ca
            JOIN business_units bu ON bu.id = ca.bu_id
            WHERE ca.id = channels.commerce_account_id
              AND bu.workspace_id = ANY(get_user_workspace_ids())
        )
    );

DROP POLICY IF EXISTS "channels_insert" ON public.channels;
CREATE POLICY "channels_insert" ON public.channels
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM commerce_accounts ca
            JOIN business_units bu ON bu.id = ca.bu_id
            JOIN workspace_members wm ON wm.workspace_id = bu.workspace_id
            WHERE ca.id = channels.commerce_account_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner','super_admin','admin')
        )
    );

DROP POLICY IF EXISTS "channels_update" ON public.channels;
CREATE POLICY "channels_update" ON public.channels
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM commerce_accounts ca
            JOIN business_units bu ON bu.id = ca.bu_id
            JOIN workspace_members wm ON wm.workspace_id = bu.workspace_id
            WHERE ca.id = channels.commerce_account_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner','super_admin','admin')
        )
    );

-- OAUTH CONNECTIONS (restricted to workspace admins and above)
DROP POLICY IF EXISTS "oauth_connections_select" ON public.oauth_connections;
CREATE POLICY "oauth_connections_select" ON public.oauth_connections
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM channels ch
            JOIN commerce_accounts ca ON ca.id = ch.commerce_account_id
            JOIN business_units bu ON bu.id = ca.bu_id
            JOIN workspace_members wm ON wm.workspace_id = bu.workspace_id
            WHERE ch.id = oauth_connections.channel_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner','super_admin','admin')
        )
    );

DROP POLICY IF EXISTS "oauth_connections_insert" ON public.oauth_connections;
CREATE POLICY "oauth_connections_insert" ON public.oauth_connections
    FOR INSERT TO authenticated
    WITH CHECK (
        connected_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM channels ch
            JOIN commerce_accounts ca ON ca.id = ch.commerce_account_id
            JOIN business_units bu ON bu.id = ca.bu_id
            JOIN workspace_members wm ON wm.workspace_id = bu.workspace_id
            WHERE ch.id = oauth_connections.channel_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner','super_admin','admin')
        )
    );

DROP POLICY IF EXISTS "oauth_connections_update" ON public.oauth_connections;
CREATE POLICY "oauth_connections_update" ON public.oauth_connections
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM channels ch
            JOIN commerce_accounts ca ON ca.id = ch.commerce_account_id
            JOIN business_units bu ON bu.id = ca.bu_id
            JOIN workspace_members wm ON wm.workspace_id = bu.workspace_id
            WHERE ch.id = oauth_connections.channel_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner','super_admin','admin')
        )
    );

-- OAUTH TOKEN HISTORY (read-only for admins)
DROP POLICY IF EXISTS "oauth_token_history_select" ON public.oauth_token_history;
CREATE POLICY "oauth_token_history_select" ON public.oauth_token_history
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM oauth_connections oc
            JOIN channels ch ON ch.id = oc.channel_id
            JOIN commerce_accounts ca ON ca.id = ch.commerce_account_id
            JOIN business_units bu ON bu.id = ca.bu_id
            JOIN workspace_members wm ON wm.workspace_id = bu.workspace_id
            WHERE oc.id = oauth_token_history.connection_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner','super_admin','admin')
        )
    );

-- SYNC JOBS
DROP POLICY IF EXISTS "sync_jobs_select" ON public.sync_jobs;
CREATE POLICY "sync_jobs_select" ON public.sync_jobs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM channels ch
            JOIN commerce_accounts ca ON ca.id = ch.commerce_account_id
            JOIN business_units bu ON bu.id = ca.bu_id
            WHERE ch.id = sync_jobs.channel_id
              AND bu.workspace_id = ANY(get_user_workspace_ids())
        )
    );

DROP POLICY IF EXISTS "sync_jobs_insert" ON public.sync_jobs;
CREATE POLICY "sync_jobs_insert" ON public.sync_jobs
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM channels ch
            JOIN commerce_accounts ca ON ca.id = ch.commerce_account_id
            JOIN business_units bu ON bu.id = ca.bu_id
            JOIN workspace_members wm ON wm.workspace_id = bu.workspace_id
            WHERE ch.id = sync_jobs.channel_id
              AND wm.user_id = auth.uid()
        )
    );

-- SYNC HISTORY
DROP POLICY IF EXISTS "sync_history_select" ON public.sync_history;
CREATE POLICY "sync_history_select" ON public.sync_history
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM channels ch
            JOIN commerce_accounts ca ON ca.id = ch.commerce_account_id
            JOIN business_units bu ON bu.id = ca.bu_id
            WHERE ch.id = sync_history.channel_id
              AND bu.workspace_id = ANY(get_user_workspace_ids())
        )
    );

-- PLATFORM WEBHOOKS
DROP POLICY IF EXISTS "platform_webhooks_select" ON public.platform_webhooks;
CREATE POLICY "platform_webhooks_select" ON public.platform_webhooks
    FOR SELECT TO authenticated
    USING (
        (org_id IS NOT NULL AND org_id = ANY(get_user_org_ids()))
        OR (workspace_id IS NOT NULL AND workspace_id = ANY(get_user_workspace_ids()))
    );

DROP POLICY IF EXISTS "platform_webhooks_insert" ON public.platform_webhooks;
CREATE POLICY "platform_webhooks_insert" ON public.platform_webhooks
    FOR INSERT TO authenticated
    WITH CHECK (
        created_by = auth.uid()
        AND (
            (org_id IS NOT NULL AND org_id = ANY(get_user_org_ids()))
            OR (workspace_id IS NOT NULL AND workspace_id = ANY(get_user_workspace_ids()))
        )
    );

DROP POLICY IF EXISTS "platform_webhooks_update" ON public.platform_webhooks;
CREATE POLICY "platform_webhooks_update" ON public.platform_webhooks
    FOR UPDATE TO authenticated
    USING (
        (org_id IS NOT NULL AND org_id = ANY(get_user_org_ids()))
        OR (workspace_id IS NOT NULL AND workspace_id = ANY(get_user_workspace_ids()))
    );

-- WEBHOOK DELIVERIES
DROP POLICY IF EXISTS "webhook_deliveries_select" ON public.webhook_deliveries;
CREATE POLICY "webhook_deliveries_select" ON public.webhook_deliveries
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM platform_webhooks wh
            WHERE wh.id = webhook_deliveries.webhook_id
              AND (
                (wh.org_id IS NOT NULL AND wh.org_id = ANY(get_user_org_ids()))
                OR (wh.workspace_id IS NOT NULL AND wh.workspace_id = ANY(get_user_workspace_ids()))
              )
        )
    );

-- AI AGENT LOGS
DROP POLICY IF EXISTS "ai_agent_logs_select" ON public.ai_agent_logs;
CREATE POLICY "ai_agent_logs_select" ON public.ai_agent_logs
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR workspace_id = ANY(get_user_workspace_ids()));

DROP POLICY IF EXISTS "ai_agent_logs_insert" ON public.ai_agent_logs;
CREATE POLICY "ai_agent_logs_insert" ON public.ai_agent_logs
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() AND workspace_id = ANY(get_user_workspace_ids()));

-- AUTOMATION LOGS
DROP POLICY IF EXISTS "automation_logs_select" ON public.automation_logs;
CREATE POLICY "automation_logs_select" ON public.automation_logs
    FOR SELECT TO authenticated
    USING (workspace_id = ANY(get_user_workspace_ids()));

DROP POLICY IF EXISTS "automation_logs_insert" ON public.automation_logs;
CREATE POLICY "automation_logs_insert" ON public.automation_logs
    FOR INSERT TO authenticated
    WITH CHECK (workspace_id = ANY(get_user_workspace_ids()));

-- INVITATIONS
DROP POLICY IF EXISTS "invitations_select" ON public.invitations;
CREATE POLICY "invitations_select" ON public.invitations
    FOR SELECT TO authenticated
    USING (
        invited_by = auth.uid()
        OR (org_id IS NOT NULL AND org_id = ANY(get_user_org_ids()))
        OR (workspace_id IS NOT NULL AND workspace_id = ANY(get_user_workspace_ids()))
    );

DROP POLICY IF EXISTS "invitations_insert" ON public.invitations;
CREATE POLICY "invitations_insert" ON public.invitations
    FOR INSERT TO authenticated
    WITH CHECK (invited_by = auth.uid());

-- ─── DONE ─────────────────────────────────────────────────────────────────────
-- Tables created (17 new):
--   workspace_members         — workspace-level team membership + role
--   billing_plans             — subscription tiers with limits
--   organizations             — top-level multi-tenant container
--   organization_members      — org-level membership + roles
--   org_subscriptions         — org billing subscriptions
--   business_units            — geographic/product-line subdivisions of workspaces
--   business_unit_members     — BU-scoped access control
--   commerce_accounts         — individual trading entities (one store per account)
--   channels                  — connected platform accounts (Shopify, Meta, Google, …)
--   oauth_connections         — encrypted OAuth tokens per channel
--   oauth_token_history       — immutable token rotation audit log
--   sync_jobs                 — sync engine job queue
--   sync_history              — long-term sync audit log
--   platform_webhooks         — outbound webhook configs
--   webhook_deliveries        — webhook delivery receipts
--   ai_agent_logs             — AI usage tracking per workspace/user
--   automation_logs           — automation rule execution history
--   invitations               — multi-level team invitation tokens
--
-- Columns added to existing tables:
--   workspaces     → org_id, industry, website, logo_url, settings, metadata
--   audit_logs     → org_id, bu_id, commerce_account_id, channel_id, severity, ip_address, user_agent, session_id
--   notifications  → org_id, channel_id, priority, expires_at, action_url, action_label
--
-- Functions:
--   get_user_org_ids()         — org IDs for current user
--   get_user_workspace_ids()   — workspace IDs for current user
--   get_user_bu_ids()          — business unit IDs for current user
--   get_workspace_id()         — updated to use workspace_members
--   set_updated_at()           — updated_at trigger
