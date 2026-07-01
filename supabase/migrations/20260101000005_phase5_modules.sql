-- ─────────────────────────────────────────────────────────────────────────────
-- GrowthOS Phase 5 — Finance, Operations, AI Chat, Enhanced Analytics
-- ─────────────────────────────────────────────────────────────────────────────

-- ── AI Chat Sessions & Messages ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content    TEXT NOT NULL,
    metadata   JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "workspace_ai_sessions" ON ai_chat_sessions
        USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "workspace_ai_messages" ON ai_chat_messages
        USING (session_id IN (
            SELECT s.id FROM ai_chat_sessions s
            JOIN workspaces w ON w.id = s.workspace_id
            WHERE w.user_id = auth.uid()
        ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_ai_sessions_workspace ON ai_chat_sessions(workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_session   ON ai_chat_messages(session_id, created_at);


-- ── Finance: Expense Tracking ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS finance_expenses (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    date         DATE NOT NULL,
    category     TEXT NOT NULL CHECK (category IN (
        'cogs', 'marketing', 'logistics', 'salaries', 'technology',
        'office', 'returns', 'payment_gateway', 'packaging', 'other'
    )),
    subcategory  TEXT,
    amount       NUMERIC(14,2) NOT NULL,
    description  TEXT,
    vendor       TEXT,
    reference    TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE finance_expenses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "workspace_finance_expenses" ON finance_expenses
        USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_finance_expenses_workspace_date
    ON finance_expenses(workspace_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_expenses_category
    ON finance_expenses(workspace_id, category, date DESC);


-- ── Operations: Returns & RTO Tracking ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS returns_tracking (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    order_id        TEXT NOT NULL,
    shopify_order_id BIGINT,
    return_type     TEXT NOT NULL CHECK (return_type IN ('customer_return', 'rto', 'exchange')),
    status          TEXT NOT NULL DEFAULT 'initiated'
                    CHECK (status IN ('initiated', 'in_transit', 'received', 'refunded', 'restocked', 'closed')),
    reason          TEXT,
    amount          NUMERIC(14,2),
    product_ids     TEXT[],
    courier         TEXT,
    awb_number      TEXT,
    initiated_at    DATE NOT NULL DEFAULT CURRENT_DATE,
    received_at     DATE,
    refunded_at     DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE returns_tracking ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "workspace_returns" ON returns_tracking
        USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_returns_workspace_date
    ON returns_tracking(workspace_id, initiated_at DESC);
CREATE INDEX IF NOT EXISTS idx_returns_type
    ON returns_tracking(workspace_id, return_type, status);


-- ── RFM Segmentation View ─────────────────────────────────────────────────────
-- Recency / Frequency / Monetary segmentation from shopify_orders
CREATE OR REPLACE VIEW rfm_segments AS
WITH rfm_raw AS (
    SELECT
        workspace_id,
        customer_email,
        customer_name,
        MAX(created_at::date)           AS last_order_date,
        COUNT(*)                         AS order_count,
        SUM(total_price)                 AS total_spent,
        CURRENT_DATE - MAX(created_at::date) AS days_since_last_order
    FROM shopify_orders
    WHERE financial_status NOT IN ('refunded', 'voided')
    GROUP BY workspace_id, customer_email, customer_name
),
rfm_scored AS (
    SELECT *,
        CASE
            WHEN days_since_last_order <= 30  THEN 5
            WHEN days_since_last_order <= 60  THEN 4
            WHEN days_since_last_order <= 90  THEN 3
            WHEN days_since_last_order <= 180 THEN 2
            ELSE 1
        END AS r_score,
        CASE
            WHEN order_count >= 10 THEN 5
            WHEN order_count >= 6  THEN 4
            WHEN order_count >= 4  THEN 3
            WHEN order_count >= 2  THEN 2
            ELSE 1
        END AS f_score,
        NTILE(5) OVER (PARTITION BY workspace_id ORDER BY total_spent) AS m_score
    FROM rfm_raw
)
SELECT *,
    CASE
        WHEN r_score >= 4 AND f_score >= 4 THEN 'Champions'
        WHEN r_score >= 3 AND f_score >= 3 THEN 'Loyal Customers'
        WHEN r_score >= 4 AND f_score <= 2 THEN 'Recent Customers'
        WHEN r_score >= 3 AND f_score <= 3 THEN 'Potential Loyalists'
        WHEN r_score = 3 AND f_score = 1   THEN 'Promising'
        WHEN r_score <= 2 AND f_score >= 4 THEN 'At Risk'
        WHEN r_score <= 2 AND f_score >= 2 THEN 'Cannot Lose Them'
        WHEN r_score <= 2 AND f_score = 1  THEN 'Lost'
        ELSE 'Needs Attention'
    END AS segment
FROM rfm_scored;


-- ── Cohort Retention View ─────────────────────────────────────────────────────
CREATE OR REPLACE VIEW cohort_retention AS
WITH first_orders AS (
    SELECT DISTINCT ON (workspace_id, customer_email)
        workspace_id,
        customer_email,
        DATE_TRUNC('month', created_at) AS cohort_month
    FROM shopify_orders
    ORDER BY workspace_id, customer_email, created_at
),
subsequent_orders AS (
    SELECT
        f.workspace_id,
        f.customer_email,
        f.cohort_month,
        DATE_TRUNC('month', o.created_at) AS order_month,
        EXTRACT(EPOCH FROM (DATE_TRUNC('month', o.created_at) - f.cohort_month)) / 2592000 AS month_number
    FROM first_orders f
    JOIN shopify_orders o
        ON o.workspace_id = f.workspace_id
        AND o.customer_email = f.customer_email
)
SELECT
    workspace_id,
    cohort_month,
    month_number::INT AS months_since_first_order,
    COUNT(DISTINCT customer_email) AS retained_customers
FROM subsequent_orders
WHERE month_number >= 0 AND month_number <= 12
GROUP BY workspace_id, cohort_month, month_number;


-- ── Trigger: updated_at for returns & sessions ────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_returns_updated_at ON returns_tracking;
CREATE TRIGGER trg_returns_updated_at
    BEFORE UPDATE ON returns_tracking
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_ai_sessions_updated_at ON ai_chat_sessions;
CREATE TRIGGER trg_ai_sessions_updated_at
    BEFORE UPDATE ON ai_chat_sessions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
