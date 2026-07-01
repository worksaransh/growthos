-- ─────────────────────────────────────────────────────────────────────────────
-- GrowthOS Phase 4 — API Credentials Table
-- Stores platform API keys per workspace (Shopify, Meta, Google Ads)
-- ─────────────────────────────────────────────────────────────────────────────

-- Table to store API credentials per workspace per platform
CREATE TABLE IF NOT EXISTS api_credentials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    platform        TEXT NOT NULL CHECK (platform IN ('shopify', 'meta', 'google')),

    -- Common fields
    is_active       BOOLEAN NOT NULL DEFAULT true,

    -- Shopify fields
    shopify_store_url     TEXT,
    shopify_api_key       TEXT,
    shopify_api_secret    TEXT,
    shopify_access_token  TEXT,           -- Private app Admin API access token

    -- Meta fields
    meta_app_id           TEXT,
    meta_app_secret       TEXT,
    meta_pixel_id         TEXT,
    meta_ad_account_id    TEXT,           -- e.g. act_123456789

    -- Google Ads fields
    google_client_id      TEXT,
    google_client_secret  TEXT,
    google_developer_token TEXT,
    google_customer_id    TEXT,           -- 10-digit customer/account ID

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (workspace_id, platform)
);

-- RLS
ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "workspace_api_credentials" ON api_credentials
        USING (workspace_id IN (
            SELECT id FROM workspaces WHERE user_id = auth.uid()
        ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_api_credentials_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_api_credentials_updated_at ON api_credentials;
CREATE TRIGGER trg_api_credentials_updated_at
    BEFORE UPDATE ON api_credentials
    FOR EACH ROW EXECUTE FUNCTION set_api_credentials_updated_at();

-- Index for fast workspace lookups
CREATE INDEX IF NOT EXISTS idx_api_credentials_workspace
    ON api_credentials (workspace_id, platform);
