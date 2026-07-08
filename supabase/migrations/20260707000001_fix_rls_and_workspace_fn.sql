-- =========================================================
-- Fix: get_workspace_id() helper + case_studies RLS
-- =========================================================

-- Helper function used by RLS policies across multiple tables
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

-- Fix case_studies RLS: drop overly permissive write policy
DROP POLICY IF EXISTS "case_studies_all" ON case_studies;
DROP POLICY IF EXISTS "Anyone can manage case studies" ON case_studies;
DROP POLICY IF EXISTS "Authenticated users can manage case studies" ON case_studies;

-- Read: any authenticated user can read published case studies
DROP POLICY IF EXISTS "case_studies_read" ON case_studies;
CREATE POLICY "case_studies_read" ON case_studies
  FOR SELECT TO authenticated USING (true);

-- Write: only workspace owners / super-admins can insert, update, delete
DROP POLICY IF EXISTS "case_studies_write" ON case_studies;
CREATE POLICY "case_studies_write" ON case_studies
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'super_admin')
    )
  );
