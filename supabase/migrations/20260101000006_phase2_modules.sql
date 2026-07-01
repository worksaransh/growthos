-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(200),
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON audit_logs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_workspace ON audit_logs FOR ALL USING (workspace_id = get_workspace_id());

-- Billing subscriptions
CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL DEFAULT 'starter',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  amount INTEGER NOT NULL DEFAULT 499900,
  currency VARCHAR(3) DEFAULT 'INR',
  billing_period VARCHAR(20) DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id VARCHAR(200),
  razorpay_subscription_id VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY billing_workspace ON billing_subscriptions FOR ALL USING (workspace_id = get_workspace_id());

-- Scheduled reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL,
  frequency VARCHAR(20) NOT NULL DEFAULT 'weekly',
  cron_expression VARCHAR(50),
  recipients TEXT[] NOT NULL DEFAULT '{}',
  format VARCHAR(10) DEFAULT 'pdf',
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY scheduled_reports_workspace ON scheduled_reports FOR ALL USING (workspace_id = get_workspace_id());

-- AI chat sessions for specialist modules
ALTER TABLE ai_chat_sessions ADD COLUMN IF NOT EXISTS module VARCHAR(50) DEFAULT 'founder';

-- White label settings
CREATE TABLE IF NOT EXISTS white_label_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  brand_name VARCHAR(200),
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#c0c1ff',
  custom_domain VARCHAR(200),
  email_sender_name VARCHAR(200),
  email_from_address VARCHAR(200),
  remove_branding BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE white_label_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY white_label_workspace ON white_label_settings FOR ALL USING (workspace_id = get_workspace_id());
