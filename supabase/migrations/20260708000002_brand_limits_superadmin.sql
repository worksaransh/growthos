-- ============================================================
-- GrowthOS  |  Migration 20260708000002
-- Brand limits, upgrade plans, super admin
-- ============================================================

-- ── 1. billing_plans — add max_brands column ──────────────────────────────
ALTER TABLE public.billing_plans
    ADD COLUMN IF NOT EXISTS max_brands INTEGER NOT NULL DEFAULT 1;

-- Update existing seed rows with brand limits
-- Free  = 1 brand, Starter/Pro = 2, Growth = 5, Scale = 10, Enterprise = -1 (unlimited)
UPDATE public.billing_plans SET max_brands = 1  WHERE tier = 'free';
UPDATE public.billing_plans SET max_brands = 2  WHERE tier = 'starter';
UPDATE public.billing_plans SET max_brands = 5  WHERE tier = 'growth';
UPDATE public.billing_plans SET max_brands = 10 WHERE tier = 'scale';
UPDATE public.billing_plans SET max_brands = -1 WHERE tier IN ('enterprise', 'custom');

-- Upsert Pro plan (what "upgrade" means in the UI)
INSERT INTO public.billing_plans (name, tier, description, monthly_price_usd, annual_price_usd,
    max_channels, max_users, max_ai_queries_month, max_brands, features, is_active, is_public)
VALUES (
    'Pro', 'starter',
    'Run 2 brands from one account with full analytics and AI',
    99, 950,
    6, 10, 1000, 2,
    ARRAY['analytics','6_integrations','founder_ai','multi_brand','brand_switcher'],
    TRUE, TRUE
)
ON CONFLICT DO NOTHING;

-- Enterprise plan upsert
INSERT INTO public.billing_plans (name, tier, description, monthly_price_usd, annual_price_usd,
    max_channels, max_users, max_ai_queries_month, max_brands, features, is_active, is_public)
VALUES (
    'Enterprise', 'enterprise',
    'Up to 10 brands per account. Managed by GrowthOS super admin.',
    0, 0,
    -1, -1, -1, 10,
    ARRAY['all_features','white_label','sso','priority_support','multi_brand','dedicated_csm','custom_integrations'],
    TRUE, TRUE
)
ON CONFLICT DO NOTHING;

-- ── 2. platform_admins — GrowthOS super admins (SaaS company staff) ───────
CREATE TABLE IF NOT EXISTS public.platform_admins (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role        TEXT        NOT NULL DEFAULT 'admin'
                            CHECK (role IN ('super_admin', 'admin', 'support', 'billing')),
    granted_by  UUID        NULL REFERENCES auth.users(id),
    notes       TEXT        NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT platform_admins_pkey PRIMARY KEY (id),
    CONSTRAINT platform_admins_user_uniq UNIQUE (user_id)
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Only platform admins can read/write this table
DROP POLICY IF EXISTS "platform_admins_self_read" ON public.platform_admins;
CREATE POLICY "platform_admins_self_read" ON public.platform_admins
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "platform_admins_super_write" ON public.platform_admins;
CREATE POLICY "platform_admins_super_write" ON public.platform_admins
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.platform_admins pa
            WHERE pa.user_id = auth.uid() AND pa.role = 'super_admin'
        )
    );

DROP TRIGGER IF EXISTS trg_platform_admins_updated_at ON public.platform_admins;
CREATE TRIGGER trg_platform_admins_updated_at
    BEFORE UPDATE ON public.platform_admins
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 3. org_brand_allocations — super admin sets per-org brand limits ────────
-- When a super admin grants an org Enterprise access, they set the limit here.
-- Falls back to billing_plans.max_brands if no override.
CREATE TABLE IF NOT EXISTS public.org_brand_allocations (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    org_id          UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    max_brands      INTEGER     NOT NULL DEFAULT 10,
    allocated_by    UUID        NULL REFERENCES auth.users(id),
    notes           TEXT        NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT org_brand_allocations_pkey PRIMARY KEY (id),
    CONSTRAINT org_brand_allocations_org_uniq UNIQUE (org_id)
);

ALTER TABLE public.org_brand_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_brand_alloc_read" ON public.org_brand_allocations;
CREATE POLICY "org_brand_alloc_read" ON public.org_brand_allocations
    FOR SELECT TO authenticated
    USING (
        org_id = ANY(get_user_org_ids())
        OR EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "org_brand_alloc_write" ON public.org_brand_allocations;
CREATE POLICY "org_brand_alloc_write" ON public.org_brand_allocations
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
    );

DROP TRIGGER IF EXISTS trg_org_brand_alloc_updated_at ON public.org_brand_allocations;
CREATE TRIGGER trg_org_brand_alloc_updated_at
    BEFORE UPDATE ON public.org_brand_allocations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 4. Helper: is_platform_admin() ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.platform_admins
        WHERE user_id = auth.uid()
    );
$$;

-- ── 5. Helper: get_org_brand_limit(org_id) ──────────────────────────────────
-- Returns the effective max_brands for an org:
--   1. org_brand_allocations override if exists
--   2. billing_plans.max_brands for the org's subscription
--   3. Falls back to 1 (free tier default)
CREATE OR REPLACE FUNCTION public.get_org_brand_limit(p_org_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        -- override set by super admin
        (SELECT max_brands FROM public.org_brand_allocations WHERE org_id = p_org_id LIMIT 1),
        -- plan limit
        (SELECT bp.max_brands
         FROM public.org_subscriptions os
         JOIN public.billing_plans bp ON bp.id = os.plan_id
         WHERE os.org_id = p_org_id AND os.status IN ('active','trialing')
         ORDER BY os.created_at DESC LIMIT 1),
        -- fallback
        1
    );
$$;

COMMENT ON TABLE public.platform_admins      IS 'GrowthOS SaaS company staff with platform-level access';
COMMENT ON TABLE public.org_brand_allocations IS 'Super-admin overrides for per-org brand (commerce account) limits';
