/**
 * use-tenant.ts — Hook that loads the full tenant hierarchy on mount
 * and keeps the Zustand store in sync.
 *
 * Call this once near the root of the dashboard layout.
 * Individual components can then read from useTenantStore() directly.
 */

"use client";

import { useEffect } from "react";
import { useAuth } from "./use-auth";
import { createClient } from "@/lib/supabase/client";
import {
  useTenantStore,
  OrgSummary,
  WorkspaceSummary,
  BUSummary,
  CommerceSummary,
  ChannelSummary,
} from "@/lib/store-tenant";

export function useTenantLoader() {
  const { user, isLoading } = useAuth();
  const {
    setOrgs,
    setWorkspaces,
    setBusinessUnits,
    setCommerceAccounts,
    setChannels,
    setActiveOrg,
    setActiveWorkspace,
    setActiveBU,
    setActiveCommerceAccount,
    activeWorkspaceId,
    activeBUId,
    setLoading,
  } = useTenantStore();

  useEffect(() => {
    if (isLoading || !user) return;

    const supabase = createClient();
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // 1. Workspaces the user belongs to (via workspace_members)
        const { data: memberRows } = await supabase
          .from("workspace_members")
          .select("workspace_id, role, workspaces(id, brand_name, org_id, status)")
          .eq("user_id", user!.id);

        if (cancelled) return;

        const workspaces: WorkspaceSummary[] = (memberRows ?? [])
          .map((r: any) => r.workspaces)
          .filter(Boolean)
          .map((w: any) => ({
            id: w.id,
            brand_name: w.brand_name,
            org_id: w.org_id,
            status: w.status,
          }));

        setWorkspaces(workspaces);

        // Auto-select first workspace if none active
        const currentWsId = useTenantStore.getState().activeWorkspaceId;
        const wsId = currentWsId && workspaces.find((w) => w.id === currentWsId)
          ? currentWsId
          : workspaces[0]?.id ?? null;

        if (wsId !== currentWsId) setActiveWorkspace(wsId);

        // 2. Orgs (via organization_members)
        const { data: orgRows } = await supabase
          .from("organization_members")
          .select("org_id, role, organizations(id, slug, display_name, logo_url, status)")
          .eq("user_id", user!.id)
          .eq("status", "active");

        if (cancelled) return;

        const orgs: OrgSummary[] = (orgRows ?? []).map((r: any) => ({
          ...(r.organizations ?? {}),
          my_role: r.role,
        })).filter((o: any) => o.id);

        setOrgs(orgs);
        if (orgs.length > 0 && !useTenantStore.getState().activeOrgId) {
          setActiveOrg(orgs[0].id);
        }

        if (!wsId) return;

        // 3. Business Units for active workspace
        const { data: buRows } = await supabase
          .from("business_units")
          .select("id, name, slug, is_default, currency, timezone")
          .eq("workspace_id", wsId)
          .is("deleted_at", null)
          .order("is_default", { ascending: false });

        if (cancelled) return;

        const bus: BUSummary[] = (buRows ?? []).map((b: any) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          is_default: b.is_default,
          currency: b.currency,
          timezone: b.timezone,
        }));

        setBusinessUnits(bus);

        const currentBUId = useTenantStore.getState().activeBUId;
        const buId = currentBUId && bus.find((b) => b.id === currentBUId)
          ? currentBUId
          : bus[0]?.id ?? null;

        if (buId !== currentBUId) setActiveBU(buId);
        if (!buId) return;

        // 4. Commerce Accounts for active BU
        const { data: caRows } = await supabase
          .from("commerce_accounts")
          .select("id, name, slug, bu_id, is_default, currency")
          .eq("bu_id", buId)
          .is("deleted_at", null)
          .order("is_default", { ascending: false });

        if (cancelled) return;

        const accounts: CommerceSummary[] = (caRows ?? []).map((a: any) => ({
          id: a.id,
          name: a.name,
          slug: a.slug,
          bu_id: a.bu_id,
          is_default: a.is_default,
          currency: a.currency,
        }));

        setCommerceAccounts(accounts);

        const currentAccId = useTenantStore.getState().activeCommerceAccountId;
        const accId = currentAccId && accounts.find((a) => a.id === currentAccId)
          ? currentAccId
          : accounts[0]?.id ?? null;

        if (!useTenantStore.getState().activeCommerceAccountId) {
          setActiveCommerceAccount(accId);
        }

        // 5. Channels for active commerce account
        if (accId) {
          const { data: chRows } = await supabase
            .from("channels")
            .select("id, display_name, channel_type, status, health_status, last_synced_at")
            .eq("commerce_account_id", accId)
            .is("deleted_at", null);

          if (cancelled) return;

          const chs: ChannelSummary[] = (chRows ?? []).map((c: any) => ({
            id: c.id,
            display_name: c.display_name,
            channel_type: c.channel_type,
            status: c.status,
            health_status: c.health_status,
            last_synced_at: c.last_synced_at,
          }));

          setChannels(chs);
        }
      } catch {
        // Silently fail — tables may not exist yet in older installs
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user?.id, isLoading]);
}
