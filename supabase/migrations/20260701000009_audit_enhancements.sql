-- Add missing columns to audit_logs
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS method VARCHAR(10);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS path TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS status_code INTEGER;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource VARCHAR(100);

-- Add role column to team_members
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'member';
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_time ON audit_logs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(workspace_id, user_id, created_at DESC);

-- Rate limit tracking (optional, slowapi handles in memory by default)
CREATE TABLE IF NOT EXISTS rate_limit_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID,
    ip_address VARCHAR(45),
    endpoint VARCHAR(200),
    violation_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
