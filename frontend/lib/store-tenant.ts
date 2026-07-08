/**
 * store-tenant.ts — Enterprise Tenant Context (Zustand)
 *
 * Tracks the user's currently active:
 *   Organization → Workspace → Business Unit → Commerce Account → Channel
 *
 * Persisted to localStorage so context survives page refresh.
 * Synced with the backend via X-Workspace-Id header (set in api-client.ts).
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OrgSummary {
  id: string;
  slug: string;
  display_name: string;
  logo_url?: string | null;
  status: string;
  my_role: string;
}

export interface WorkspaceSummary {
  id: string;
  brand_name: string;
  org_id?: string | null;
  status: string;
}

export interface BUSummary {
  id: string;
  name: string;
  slug: string;
  is_default: boolean;
  currency: string;
  timezone: string;
  account_count?: number;
}

export interface CommerceSummary {
  id: string;
  name: string;
  slug: string;
  bu_id: string;
  is_default: boolean;
  currency: string;
  channel_count?: number;
}

export interface ChannelSummary {
  id: string;
  display_name: string;
  channel_type: string;
  status: string;
  health_status: string;
  last_synced_at?: string | null;
}

// ── Store interface ───────────────────────────────────────────────────────────

interface TenantStore {
  // Lists (populated on load)
  orgs: OrgSummary[];
  workspaces: WorkspaceSummary[];
  businessUnits: BUSummary[];
  commerceAccounts: CommerceSummary[];
  channels: ChannelSummary[];

  // Active selections
  activeOrgId: string | null;
  activeWorkspaceId: string | null;
  activeBUId: string | null;
  activeCommerceAccountId: string | null;
  activeChannelId: string | null;

  // Loading state
  loading: boolean;

  // Actions
  setOrgs: (orgs: OrgSummary[]) => void;
  setWorkspaces: (workspaces: WorkspaceSummary[]) => void;
  setBusinessUnits: (bus: BUSummary[]) => void;
  setCommerceAccounts: (accounts: CommerceSummary[]) => void;
  setChannels: (channels: ChannelSummary[]) => void;

  setActiveOrg: (orgId: string | null) => void;
  setActiveWorkspace: (workspaceId: string | null) => void;
  setActiveBU: (buId: string | null) => void;
  setActiveCommerceAccount: (accountId: string | null) => void;
  setActiveChannel: (channelId: string | null) => void;

  setLoading: (v: boolean) => void;

  // Derived selectors
  activeOrg: () => OrgSummary | null;
  activeWorkspace: () => WorkspaceSummary | null;
  activeBU: () => BUSummary | null;
  activeCommerceAccount: () => CommerceSummary | null;
  activeChannel: () => ChannelSummary | null;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useTenantStore = create<TenantStore>()(
  persist(
    (set, get) => ({
      orgs: [],
      workspaces: [],
      businessUnits: [],
      commerceAccounts: [],
      channels: [],

      activeOrgId: null,
      activeWorkspaceId: null,
      activeBUId: null,
      activeCommerceAccountId: null,
      activeChannelId: null,

      loading: false,

      setOrgs: (orgs) => set({ orgs }),
      setWorkspaces: (workspaces) => set({ workspaces }),
      setBusinessUnits: (businessUnits) => set({ businessUnits }),
      setCommerceAccounts: (commerceAccounts) => set({ commerceAccounts }),
      setChannels: (channels) => set({ channels }),

      setActiveOrg: (activeOrgId) => set({ activeOrgId }),
      setActiveWorkspace: (activeWorkspaceId) => {
        set({ activeWorkspaceId, activeBUId: null, activeCommerceAccountId: null, activeChannelId: null });
      },
      setActiveBU: (activeBUId) => {
        set({ activeBUId, activeCommerceAccountId: null, activeChannelId: null });
      },
      setActiveCommerceAccount: (activeCommerceAccountId) => {
        set({ activeCommerceAccountId, activeChannelId: null });
      },
      setActiveChannel: (activeChannelId) => set({ activeChannelId }),

      setLoading: (loading) => set({ loading }),

      activeOrg: () => {
        const { orgs, activeOrgId } = get();
        return orgs.find((o) => o.id === activeOrgId) ?? null;
      },
      activeWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get();
        return workspaces.find((w) => w.id === activeWorkspaceId) ?? null;
      },
      activeBU: () => {
        const { businessUnits, activeBUId } = get();
        return businessUnits.find((b) => b.id === activeBUId) ?? null;
      },
      activeCommerceAccount: () => {
        const { commerceAccounts, activeCommerceAccountId } = get();
        return commerceAccounts.find((a) => a.id === activeCommerceAccountId) ?? null;
      },
      activeChannel: () => {
        const { channels, activeChannelId } = get();
        return channels.find((c) => c.id === activeChannelId) ?? null;
      },
    }),
    {
      name: "growthos-tenant-context",
      storage: createJSONStorage(() => localStorage),
      // Only persist the active selections and lists (not derived functions)
      partialize: (s) => ({
        activeOrgId: s.activeOrgId,
        activeWorkspaceId: s.activeWorkspaceId,
        activeBUId: s.activeBUId,
        activeCommerceAccountId: s.activeCommerceAccountId,
        activeChannelId: s.activeChannelId,
        orgs: s.orgs,
        workspaces: s.workspaces,
        businessUnits: s.businessUnits,
        commerceAccounts: s.commerceAccounts,
        channels: s.channels,
      }),
    }
  )
);

// ── Convenience selectors ─────────────────────────────────────────────────────

export const useActiveWorkspaceId = () => useTenantStore((s) => s.activeWorkspaceId);
export const useActiveBUId = () => useTenantStore((s) => s.activeBUId);
export const useActiveCommerceAccountId = () => useTenantStore((s) => s.activeCommerceAccountId);
