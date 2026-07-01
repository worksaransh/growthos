-- ─── GrowthOS Complete Schema — Phase 10 ──────────────────────────────────
-- All tables required for production enterprise SaaS

-- ── Tasks & Project Management ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done','cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
    assigned_to UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    due_date DATE,
    tags TEXT[] DEFAULT '{}',
    related_type VARCHAR(50), -- 'order','product','campaign','customer'
    related_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'task','order','product','campaign','customer'
    entity_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    mentions UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── File Management ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    original_name VARCHAR(500),
    mime_type VARCHAR(200),
    size_bytes BIGINT DEFAULT 0,
    storage_path TEXT NOT NULL,
    storage_bucket VARCHAR(100) DEFAULT 'growthos-files',
    public_url TEXT,
    entity_type VARCHAR(50), -- 'product','campaign','report','creative'
    entity_id UUID,
    uploaded_by UUID REFERENCES auth.users(id),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Knowledge Base ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'article' CHECK (content_type IN ('article','faq','sop','playbook','note')),
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    embedding VECTOR(1536), -- pgvector for AI search
    is_public BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI Prompt Library ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prompt_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    prompt_text TEXT NOT NULL,
    module VARCHAR(50) NOT NULL, -- 'founder','ads','seo','product','finance','automation'
    category VARCHAR(100),
    variables JSONB DEFAULT '[]', -- [{name, description, default}]
    is_favorite BOOLEAN DEFAULT FALSE,
    use_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Automation Workflows ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS automation_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(300) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','active','paused','archived')),
    trigger_type VARCHAR(100) NOT NULL, -- 'roas_below','cart_abandoned','inventory_low','order_created','rto_high','new_customer'
    trigger_config JSONB DEFAULT '{}',
    nodes JSONB DEFAULT '[]', -- workflow node graph
    edges JSONB DEFAULT '[]',
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMPTZ,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running','completed','failed','cancelled')),
    trigger_data JSONB DEFAULT '{}',
    result JSONB DEFAULT '{}',
    error TEXT,
    duration_ms INTEGER,
    nodes_executed INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ── Funnels ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS funnels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    steps JSONB DEFAULT '[]', -- [{name, event, url_pattern, conversion_rate}]
    total_visitors INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    revenue_attributed DECIMAL(14,2) DEFAULT 0,
    date_from DATE,
    date_to DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Warehouses & Inventory ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(10) DEFAULT 'IN',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(300) NOT NULL,
    email VARCHAR(300),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    gst_number VARCHAR(20),
    payment_terms INTEGER DEFAULT 30, -- days
    currency VARCHAR(10) DEFAULT 'INR',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    po_number VARCHAR(50) UNIQUE,
    supplier_id UUID REFERENCES suppliers(id),
    warehouse_id UUID REFERENCES warehouses(id),
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft','sent','confirmed','shipped','received','cancelled')),
    items JSONB DEFAULT '[]', -- [{product_id, variant_id, quantity, unit_cost, total}]
    subtotal DECIMAL(14,2) DEFAULT 0,
    tax DECIMAL(14,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(14,2) DEFAULT 0,
    expected_delivery DATE,
    received_at TIMESTAMPTZ,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Feature Flags ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    flag_key VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
    config JSONB DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, flag_key)
);

-- ── Marketplace Apps / Plugins ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS installed_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    app_id VARCHAR(100) NOT NULL,
    app_name VARCHAR(200) NOT NULL,
    app_version VARCHAR(20),
    category VARCHAR(50),
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, app_id)
);

-- ── Support Tickets ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    ticket_number VARCHAR(30) UNIQUE,
    subject VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting','resolved','closed')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
    category VARCHAR(100),
    assigned_to UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    customer_email VARCHAR(300),
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Activity Timeline ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    event_type VARCHAR(100) NOT NULL, -- 'order_created','campaign_paused','customer_tagged','workflow_triggered'
    entity_type VARCHAR(50),
    entity_id UUID,
    entity_name VARCHAR(300),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI Agent Sessions ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    module VARCHAR(50) NOT NULL, -- 'founder','ads','seo','finance','automation'
    system_prompt TEXT,
    memory JSONB DEFAULT '{}',
    model VARCHAR(100) DEFAULT 'claude-3-5-haiku-20241022',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2048,
    is_active BOOLEAN DEFAULT TRUE,
    total_conversations INTEGER DEFAULT 0,
    total_tokens_used BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Billing Enhancements ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE,
    amount DECIMAL(12,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled')),
    due_date DATE,
    paid_at TIMESTAMPTZ,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(workspace_id, assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(workspace_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_files_workspace ON files(workspace_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_kb_workspace ON knowledge_base(workspace_id, category, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_module ON prompt_library(workspace_id, module, is_favorite);
CREATE INDEX IF NOT EXISTS idx_workflows_workspace ON automation_workflows(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_executions_workflow ON workflow_executions(workspace_id, workflow_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_workspace ON activity_timeline(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_timeline(workspace_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets ON support_tickets(workspace_id, status, priority);

-- ── RLS Policies ──────────────────────────────────────────────────────────

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'tasks','comments','files','knowledge_base','prompt_library',
        'automation_workflows','workflow_executions','funnels','warehouses',
        'suppliers','purchase_orders','feature_flags','installed_apps',
        'support_tickets','activity_timeline','ai_agents','invoices'
    ])
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %I',
            tbl || '_workspace_policy', tbl
        );
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR ALL USING (workspace_id = get_workspace_id())',
            tbl || '_workspace_policy', tbl
        );
    END LOOP;
END $$;

-- ── Default Feature Flags ─────────────────────────────────────────────────

-- (These will be inserted when a workspace is created, via trigger or seed)
-- Example flags: ai_specialist, whatsapp_automation, advanced_reports, white_label

-- ── Trigger: auto-generate ticket numbers ────────────────────────────────

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number := 'TKT-' || LPAD(nextval('ticket_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS ticket_seq START 1000;

DROP TRIGGER IF EXISTS set_ticket_number ON support_tickets;
CREATE TRIGGER set_ticket_number
    BEFORE INSERT ON support_tickets
    FOR EACH ROW WHEN (NEW.ticket_number IS NULL)
    EXECUTE FUNCTION generate_ticket_number();

-- ── Trigger: activity timeline auto-log ──────────────────────────────────

CREATE OR REPLACE FUNCTION log_order_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activity_timeline (workspace_id, event_type, entity_type, entity_id, entity_name, description)
        VALUES (NEW.workspace_id, 'order_created', 'order', NEW.id, NEW.order_number,
                'New order #' || NEW.order_number || ' for ₹' || NEW.total_price::TEXT);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS order_activity_log ON shopify_orders;
CREATE TRIGGER order_activity_log
    AFTER INSERT ON shopify_orders
    FOR EACH ROW EXECUTE FUNCTION log_order_activity();
