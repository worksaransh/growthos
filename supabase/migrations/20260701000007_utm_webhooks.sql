-- Add UTM columns to shopify_orders
ALTER TABLE shopify_orders ADD COLUMN IF NOT EXISTS landing_site TEXT;
ALTER TABLE shopify_orders ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
ALTER TABLE shopify_orders ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);
ALTER TABLE shopify_orders ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(200);
ALTER TABLE shopify_orders ADD COLUMN IF NOT EXISTS utm_content VARCHAR(200);
ALTER TABLE shopify_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- UTM attribution summary view
CREATE OR REPLACE VIEW utm_attribution AS
SELECT
    workspace_id,
    COALESCE(utm_source, 'direct') AS source,
    COALESCE(utm_medium, 'none') AS medium,
    COALESCE(utm_campaign, 'none') AS campaign,
    COUNT(*) AS orders,
    SUM(total_price) AS revenue,
    AVG(total_price) AS aov,
    COUNT(DISTINCT customer_email) AS unique_customers
FROM shopify_orders
WHERE financial_status NOT IN ('refunded', 'voided')
GROUP BY workspace_id, utm_source, utm_medium, utm_campaign;

-- Add UTM endpoint to analytics
CREATE INDEX IF NOT EXISTS idx_orders_utm ON shopify_orders(workspace_id, utm_source, utm_medium);
CREATE INDEX IF NOT EXISTS idx_orders_updated ON shopify_orders(workspace_id, updated_at DESC);
