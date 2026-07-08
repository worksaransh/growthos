"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks";
import { useIsAdmin } from "@/lib/hooks/use-admin";
import { createClient } from "@/lib/supabase/client";
import { AppIcon } from "@/components/shared/app-icon";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkspaceRow {
  id: string;
  brand_name: string;
  created_at: string;
  member_count?: number;
  integration_count?: number;
  owner_id?: string;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminWorkspacesPage() {
  const { user } = useAuth();
  const { isAdmin, checking } = useIsAdmin();
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [filtered, setFiltered] = useState<WorkspaceRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (checking || !isAdmin) return;
    const supabase = createClient();

    async function load() {
      try {
        const { data: ws } = await supabase
          .from("workspaces")
          .select("id, brand_name, created_at")
          .order("created_at", { ascending: false })
          .limit(200);

        if (!ws) return;

        // Get member counts per workspace
        const wsWithCounts: WorkspaceRow[] = await Promise.all(
          ws.map(async (w) => {
            const [{ count: memberCount }, { count: integrationCount }] = await Promise.all([
              supabase
                .from("workspace_members")
                .select("*", { count: "exact", head: true })
                .eq("workspace_id", w.id),
              supabase
                .from("integrations")
                .select("*", { count: "exact", head: true })
                .eq("workspace_id", w.id)
                .eq("status", "active"),
            ]);
            return {
              ...w,
              member_count: memberCount ?? 0,
              integration_count: integrationCount ?? 0,
            };
          })
        );

        setWorkspaces(wsWithCounts);
        setFiltered(wsWithCounts);
      } catch {
        // show empty
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isAdmin]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(workspaces);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(workspaces.filter(w =>
      w.brand_name?.toLowerCase().includes(q) ||
      w.id.toLowerCase().includes(q)
    ));
  }, [search, workspaces]);

  if (checking) {
    return <div className="flex-1 flex items-center justify-center p-8"><div className="text-on-surface-variant text-sm">Checking access…</div></div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AppIcon name="lock" size={24} className="text-red-400" />
          </div>
          <h3 className="text-on-surface font-bold text-lg mb-2">Access Restricted</h3>
          <p className="text-on-surface-variant text-sm">Admin access is required.</p>
        </div>
      </div>
    );
  }

  const totalMembers = workspaces.reduce((acc, w) => acc + (w.member_count ?? 0), 0);
  const totalIntegrations = workspaces.reduce((acc, w) => acc + (w.integration_count ?? 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-outline hover:text-on-surface transition-colors">
            <AppIcon name="arrow_forward" size={16} className="rotate-180" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Workspace Management</h2>
            <p className="text-xs text-on-surface-variant">
              {loading ? "Loading…" : `${filtered.length} of ${workspaces.length} workspaces`}
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Workspaces", value: workspaces.length, icon: "store", color: "bg-primary" },
            { label: "Total Users", value: totalMembers, icon: "group", color: "bg-[#7c3aed]" },
            { label: "Active Integrations", value: totalIntegrations, icon: "link", color: "bg-[#059669]" },
          ].map(item => (
            <div key={item.label} className="glass-card rounded-2xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                <AppIcon name={item.icon} size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-on-surface">{item.value}</p>
                <p className="text-xs text-on-surface-variant">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <AppIcon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
        <input
          type="text"
          placeholder="Search by brand name or workspace ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-sm placeholder:text-outline focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Workspace grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center glass-card rounded-2xl">
          <AppIcon name="store" size={32} className="text-outline mx-auto mb-3" />
          <p className="text-on-surface-variant text-sm">No workspaces found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ws) => (
            <div key={ws.id} className="glass-card rounded-2xl p-5 hover:border-primary/30 transition-all">
              {/* Brand header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl primary-gradient flex items-center justify-center text-white font-bold flex-shrink-0">
                  {ws.brand_name?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-on-surface truncate">{ws.brand_name || "Unnamed Brand"}</p>
                  <p className="font-mono text-[10px] text-outline mt-0.5">{ws.id.slice(0, 12)}…</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-surface-container rounded-lg p-2.5 text-center">
                  <p className="text-base font-bold text-on-surface">{ws.member_count ?? 0}</p>
                  <p className="text-[10px] text-outline">Users</p>
                </div>
                <div className="bg-surface-container rounded-lg p-2.5 text-center">
                  <p className="text-base font-bold text-on-surface">{ws.integration_count ?? 0}</p>
                  <p className="text-[10px] text-outline">Integrations</p>
                </div>
              </div>

              {/* Date */}
              <p className="text-[11px] text-outline">
                Joined {new Date(ws.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
