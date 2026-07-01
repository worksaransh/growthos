-- WhatsApp messages log
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    phone_number VARCHAR(20),
    message_id VARCHAR(100),
    template_name VARCHAR(100),
    status VARCHAR(30) DEFAULT 'sent',
    type VARCHAR(20) DEFAULT 'outbound',
    campaign_id VARCHAR(100),
    revenue_attributed DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wa_messages_workspace ON whatsapp_messages(workspace_id, created_at DESC);
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY wa_messages_workspace ON whatsapp_messages FOR ALL USING (workspace_id = get_workspace_id());

-- Shipments tracking
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    order_id UUID REFERENCES shopify_orders(id),
    shiprocket_order_id VARCHAR(100),
    awb_number VARCHAR(100),
    courier_name VARCHAR(100),
    courier_company_id VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    is_rto BOOLEAN DEFAULT FALSE,
    is_ndr BOOLEAN DEFAULT FALSE,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    expected_delivery TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shipments_workspace ON shipments(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(workspace_id, status);
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY shipments_workspace ON shipments FOR ALL USING (workspace_id = get_workspace_id());

-- RTO analytics view
CREATE OR REPLACE VIEW rto_analytics AS
SELECT
    workspace_id,
    courier_name,
    COUNT(*) AS total_shipments,
    COUNT(CASE WHEN is_rto THEN 1 END) AS rto_count,
    ROUND(COUNT(CASE WHEN is_rto THEN 1 END)::numeric/NULLIF(COUNT(*),0)*100, 1) AS rto_rate,
    COALESCE(SUM(CASE WHEN is_rto THEN shipping_cost ELSE 0 END), 0) AS rto_cost
FROM shipments
GROUP BY workspace_id, courier_name;
