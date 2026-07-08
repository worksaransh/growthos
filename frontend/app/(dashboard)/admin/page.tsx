"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks";
import { useIsAdmin } from "@/lib/hooks/use-admin";
import { createClient } from "@/lib/supabase/client";
import { AppIcon } from "@/components/shared/app-icon";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlatformStats {
  totalWorkspaces: number;
  totalUsers: number;
  activeIntegrations: number;
  caseStudies: number;
  newWorkspacesThisMonth: number;
  newUsersThisMonth: number;
}

interface RecentWorkspace {
  id: string;
  brand_name: string;
  created_at: string;
  owner_email?: string;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon, color,
}: {
  label: string; value: string | number; sub?: string; icon: string; color: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <AppIcon name={icon} size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-on-surface-variant mb-1">{label}</p>
        <p className="text-2xl font-bold text-on-surface">{value}</p>
        {sub && <p className="text-xs text-on-surface-variant mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Quick link card ───────────────────────────────────────────────────────────

function QuickCard({ href, icon, label, desc, count }: {
  href: string; icon: string; label: string; desc: string; count?: number;
}) {
  return (
    <Link href={href} className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:border-primary/30 transition-all group">
      <div className="w-11 h-11 rounded-xl primary-gradient flex items-center justify-center flex-shrink-0">
        <AppIcon name={icon} size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-on-surface text-sm">{label}</p>
          {count !== undefined && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">{count}</span>
          )}
        </div>
        <p className="text-xs text-on-surface-variant mt-0.5">{desc}</p>
      </div>
      <AppIcon name="arrow_forward" size={16} className="text-outline group-hover:text-primary transition-colors flex-shrink-0" />
    </Link>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      try {
        const [
          { count: totalWorkspaces },
          { count: totalUsers },
          { count: activeIntegrations },
          { count: caseStudies },
          { data: recentWs },
        ] = await Promise.all([
          supabase.from("workspaces").select("*", { count: "exact", head: true }),
          supabase.from("workspace_members").select("*", { count: "exact", head: true }),
          supabase.from("integrations").select("*", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("case_studies").select("*", { count: "exact", head: true }),
          supabase.from("workspaces").select("id, brand_name, created_at").order("created_at", { ascending: false }).limit(6),
        ]);

        // Count this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: newWs } = await supabase
          .from("workspaces")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startOfMonth.toISOString());

        const { count: newUsers } = await supabase
          .from("workspace_members")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startOfMonth.toISOString());

        setStats({
          totalWorkspaces: totalWorkspaces ?? 0,
          totalUsers: totalUsers ?? 0,
          activeIntegrations: activeIntegrations ?? 0,
          caseStudies: caseStudies ?? 0,
          newWorkspacesThisMonth: newWs ?? 0,
          newUsersThisMonth: newUsers ?? 0,
        });
        setRecentWorkspaces(recentWs ?? []);
      } catch {
        // show empty state
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const { isAdmin, checking } = useIsAdmin();

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
          <p className="text-on-surface-variant text-sm">Admin access is required to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl primary-gradient flex items-center justify-center">
            <AppIcon name="workspace_premium" size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Admin Dashboard</h2>
            <p className="text-xs text-on-surface-variant">Platform overview — visible only to admins</p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Brands"
          value={loading ? "—" : stats?.totalWorkspaces ?? 0}
          sub={loading ? undefined : `+${stats?.newWorkspacesThisMonth ?? 0} this month`}
          icon="store"
          color="bg-primary"
        />
        <KpiCard
          label="Total Users"
          value={loading ? "—" : stats?.totalUsers ?? 0}
          sub={loading ? undefined : `+${stats?.newUsersThisMonth ?? 0} this month`}
          icon="group"
          color="bg-[#7c3aed]"
        />
        <KpiCard
          label="Active Integrations"
          value={loading ? "—" : stats?.activeIntegrations ?? 0}
          sub="Across all workspaces"
          icon="link"
          color="bg-[#059669]"
        />
        <KpiCard
          label="Case Studies"
          value={loading ? "—" : stats?.caseStudies ?? 0}
          sub="On marketing site"
          icon="verified"
          color="bg-[#d97706]"
        />
      </div>

      {/* Quick Nav */}
      <section>
        <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-4">Admin Sections</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <QuickCard
            href="/admin/users"
            icon="group"
            label="User Management"
            desc="View all users, roles, and workspace memberships"
            count={stats?.totalUsers}
          />
          <QuickCard
            href="/admin/workspaces"
            icon="store"
            label="Workspace Management"
            desc="View and manage all brand workspaces on the platform"
            count={stats?.totalWorkspaces}
          />
          <QuickCard
            href="/admin/case-studies"
            icon="verified"
            label="Case Studies"
            desc="Create, edit, and publish customer success stories"
            count={stats?.caseStudies}
          />
          <QuickCard
            href="/admin/audit-logs"
            icon="audit_logs"
            label="Audit Logs"
            desc="Platform-wide activity trail — logins, changes, errors"
          />
        </div>
      </section>

      {/* Recent Signups */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest">Recent Workspaces</h3>
          <Link href="/admin/workspaces" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        <div className="glass-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-on-surface-variant text-sm">Loading…</div>
          ) : recentWorkspaces.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant text-sm">No workspaces yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-outline uppercase tracking-wider">Brand</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-outline uppercase tracking-wider">Workspace ID</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-outline uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentWorkspaces.map((ws, i) => (
                  <tr key={ws.id} className={`border-b border-outline-variant/10 last:border-0 ${i % 2 === 0 ? "" : "bg-surface-container/30"}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg primary-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {ws.brand_name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                        <span className="font-medium text-on-surface">{ws.brand_name || "Unnamed"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-outline">{ws.id.slice(0, 8)}…</td>
                    <td className="px-5 py-3 text-on-surface-variant">
                      {new Date(ws.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* System info */}
      <section>
        <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-4">System Info</h3>
        <div className="glass-card rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Environment", value: "Development" },
            { label: "Backend", value: "localhost:8000" },
            { label: "Database", value: "Supabase" },
            { label: "Auth", value: "Supabase Auth" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[10px] text-outline uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-sm font-medium text-on-surface">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
