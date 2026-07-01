-- Run this SECOND in Supabase SQL Editor
-- Indexes

CREATE INDEX shopify_orders_workspace_date_idx ON public.shopify_orders (workspace_id, order_created_at DESC);
CREATE INDEX ad_spend_daily_workspace_date_idx ON public.ad_spend_daily (workspace_id, spend_date DESC);
CREATE INDEX metrics_cache_workspace_date_idx ON public.metrics_cache (workspace_id, metric_date DESC);
CREATE INDEX integrations_platform_idx ON public.integrations (platform);
CREATE INDEX integrations_status_idx ON public.integrations (status);
CREATE INDEX sync_logs_workspace_started_idx ON public.sync_logs (workspace_id, started_at DESC);

-- Functions (use single quotes for function body)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS '
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
';

CREATE TRIGGER workspaces_set_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER integrations_set_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER shopify_orders_set_updated_at BEFORE UPDATE ON public.shopify_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER ad_spend_daily_set_updated_at BEFORE UPDATE ON public.ad_spend_daily FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER metrics_cache_set_updated_at BEFORE UPDATE ON public.metrics_cache FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER sync_throttle_set_updated_at BEFORE UPDATE ON public.sync_throttle FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS Policies
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spend_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_throttle ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspaces_select ON public.workspaces FOR SELECT TO authenticated USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY workspaces_insert ON public.workspaces FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY workspaces_update ON public.workspaces FOR UPDATE TO authenticated USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY integrations_select ON public.integrations FOR SELECT TO authenticated USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));
CREATE POLICY integrations_insert ON public.integrations FOR INSERT TO authenticated WITH CHECK (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));
CREATE POLICY integrations_update ON public.integrations FOR UPDATE TO authenticated USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));
CREATE POLICY integrations_delete ON public.integrations FOR DELETE TO authenticated USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));

CREATE POLICY shopify_orders_select ON public.shopify_orders FOR SELECT TO authenticated USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));
CREATE POLICY ad_spend_daily_select ON public.ad_spend_daily FOR SELECT TO authenticated USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));
CREATE POLICY metrics_cache_select ON public.metrics_cache FOR SELECT TO authenticated USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));
CREATE POLICY sync_logs_select ON public.sync_logs FOR SELECT TO authenticated USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));
CREATE POLICY sync_throttle_select ON public.sync_throttle FOR SELECT TO authenticated USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));

GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON public.workspaces TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.integrations;