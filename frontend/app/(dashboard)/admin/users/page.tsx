"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks";
import { useIsAdmin } from "@/lib/hooks/use-admin";
import { createClient } from "@/lib/supabase/client";
import { AppIcon } from "@/components/shared/app-icon";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  user_id: string;
  workspace_id: string;
  role: string;
  status: string;
  created_at: string;
  email?: string;
  full_name?: string;
  brand_name?: string;
}

// ── Badge ─────────────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<string, string> = {
  owner:       "bg-primary/10 text-primary",
  super_admin: "bg-[#7c3aed]/10 text-[#a78bfa]",
  admin:       "bg-blue-500/10 text-blue-400",
  member:      "bg-surface-container text-on-surface-variant",
  viewer:      "bg-surface-container text-outline",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${ROLE_STYLES[role] ?? ROLE_STYLES.viewer}`}>
      {role}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-green-400" : "bg-outline/40"}`} />
      <span className={status === "active" ? "text-on-surface-variant" : "text-outline"}>{status}</span>
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { isAdmin, checking } = useIsAdmin();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filtered, setFiltered] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (checking || !isAdmin) return;
    const supabase = createClient();

    async function load() {
      try {
        const { data: members } = await supabase
          .from("workspace_members")
          .select(`
            id, user_id, workspace_id, role, status, created_at,
            workspaces ( brand_name )
          `)
          .order("created_at", { ascending: false })
          .limit(200);

        // Get auth users info from profiles if available, fallback to metadata
        const rows: UserRow[] = (members ?? []).map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          workspace_id: m.workspace_id,
          role: m.role,
          status: m.status,
          created_at: m.created_at,
          brand_name: m.workspaces?.brand_name ?? "—",
          email: m.email ?? "",
          full_name: m.full_name ?? "",
        }));

        setUsers(rows);
        setFiltered(rows);
      } catch {
        // show empty
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isAdmin]);

  useEffect(() => {
    let list = users;
    if (roleFilter !== "all") list = list.filter(u => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.user_id.toLowerCase().includes(q) ||
        u.brand_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [search, roleFilter, users]);

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

  const roles = ["all", "owner", "super_admin", "admin", "member", "viewer"];

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-outline hover:text-on-surface transition-colors">
          <AppIcon name="arrow_forward" size={16} className="rotate-180" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-on-surface">User Management</h2>
          <p className="text-xs text-on-surface-variant">{loading ? "Loading…" : `${filtered.length} of ${users.length} users`}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <AppIcon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            placeholder="Search by brand, email, or role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-sm placeholder:text-outline focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {roles.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                roleFilter === r
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:border-primary/50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-on-surface-variant text-sm">Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <AppIcon name="group" size={32} className="text-outline mx-auto mb-3" />
            <p className="text-on-surface-variant text-sm">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-outline uppercase tracking-wider">User ID</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-outline uppercase tracking-wider">Brand / Workspace</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-outline uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-outline uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-outline uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`border-b border-outline-variant/10 last:border-0 hover:bg-surface-variant/20 transition-colors ${i % 2 === 0 ? "" : "bg-surface-container/20"}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full primary-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(u.brand_name ?? u.user_id).charAt(0).toUpperCase()}
                        </div>
                        <span className="font-mono text-xs text-outline">{u.user_id.slice(0, 12)}…</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium text-on-surface">{u.brand_name || "—"}</td>
                    <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3"><StatusDot status={u.status} /></td>
                    <td className="px-5 py-3 text-on-surface-variant">
                      {new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && users.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Owners", count: users.filter(u => u.role === "owner").length, color: "text-primary" },
            { label: "Admins", count: users.filter(u => u.role === "admin").length, color: "text-blue-400" },
            { label: "Members", count: users.filter(u => u.role === "member").length, color: "text-on-surface-variant" },
            { label: "Active", count: users.filter(u => u.status === "active").length, color: "text-green-400" },
          ].map(item => (
            <div key={item.label} className="glass-card rounded-xl p-4 text-center">
              <p className={`text-xl font-bold ${item.color}`}>{item.count}</p>
              <p className="text-xs text-on-surface-variant mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
