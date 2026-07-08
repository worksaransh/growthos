"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { AppIcon } from "@/components/shared/app-icon";

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return (
    <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0`} style={{ background: color + "22" }}>
        <AppIcon name={icon} size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-on-surface">{value}</p>
        <p className="text-[11px] text-on-surface-variant uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: color + "22", color }}>
      {label}
    </span>
  );
}

const PLAN_COLORS: Record<string, string> = {
  free:       "#6B7280",
  starter:    "#059669",
  growth:     "#4F67F0",
  scale:      "#7C3AED",
  enterprise: "#D97706",
  custom:     "#DB2777",
};

// ── Grant Plan Modal ──────────────────────────────────────────────────────────

function GrantPlanModal({ org, onClose, onSuccess }: { org: any; onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [plan, setPlan] = useState("Enterprise");
  const [brands, setBrands] = useState(10);
  const [notes, setNotes] = useState("");

  const grantMutation = useMutation({
    mutationFn: () => api.grantPlan(org.id, plan, notes || undefined),
    onSuccess: () => { toast({ type: "success", title: `${plan} plan granted` }); onSuccess(); onClose(); },
    onError: (e: any) => toast({ type: "error", title: "Failed", message: e.message }),
  });

  const allocMutation = useMutation({
    mutationFn: () => api.setBrandAllocation(org.id, brands, notes || undefined),
    onSuccess: () => { toast({ type: "success", title: "Brand limit updated" }); onSuccess(); onClose(); },
    onError: (e: any) => toast({ type: "error", title: "Failed", message: e.message }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-on-surface">Manage: {org.display_name}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-variant/40">
            <AppIcon name="close" size={20} className="text-on-surface-variant" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant">Current plan</span>
            <span className="font-semibold text-on-surface">{org.plan_name || "Free"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant">Brands used / limit</span>
            <span className="font-semibold text-on-surface">{org.brand_count} / {org.effective_brand_limit === -1 ? "∞" : org.effective_brand_limit}</span>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono text-on-surface-variant/50 uppercase tracking-wider mb-1.5">Grant Plan</label>
          <select value={plan} onChange={e => setPlan(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary">
            {["Free", "Starter", "Growth", "Scale", "Enterprise"].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button onClick={() => grantMutation.mutate()} disabled={grantMutation.isPending}
            className="mt-2 w-full py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#494bd6 0%,#c0c1ff 100%)", color: "#0b1326" }}>
            {grantMutation.isPending ? "Granting…" : `Grant ${plan} Plan`}
          </button>
        </div>

        <div className="pt-2 border-t border-outline-variant/20">
          <label className="block text-[10px] font-mono text-on-surface-variant/50 uppercase tracking-wider mb-1.5">
            Override Brand Limit (max accounts)
          </label>
          <div className="flex gap-2">
            <input type="number" min={1} max={100} value={brands} onChange={e => setBrands(Number(e.target.value))}
              className="flex-1 px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary" />
            <button onClick={() => allocMutation.mutate()} disabled={allocMutation.isPending}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-surface-container-high border border-outline-variant/30 text-on-surface hover:border-primary/50 disabled:opacity-60">
              {allocMutation.isPending ? "…" : "Set"}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono text-on-surface-variant/50 uppercase tracking-wider mb-1.5">Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary resize-none" />
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

type Tab = "orgs" | "users" | "admins";

export function SuperAdminPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("orgs");
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [addAdminEmail, setAddAdminEmail] = useState("");
  const [addAdminRole, setAddAdminRole] = useState("admin");

  const overviewQ = useQuery({ queryKey: ["sa-overview"], queryFn: () => api.getSuperAdminOverview() });
  const orgsQ     = useQuery({ queryKey: ["sa-orgs"],     queryFn: () => api.getSuperAdminOrgs() });
  const usersQ    = useQuery({ queryKey: ["sa-users", search], queryFn: () => api.getSuperAdminUsers(50, 0, search || undefined), enabled: tab === "users" });
  const adminsQ   = useQuery({ queryKey: ["sa-admins"],   queryFn: () => api.getSuperAdminAdmins(), enabled: tab === "admins" });

  const addAdminMutation = useMutation({
    mutationFn: () => api.addPlatformAdmin(addAdminEmail, addAdminRole),
    onSuccess: () => { toast({ type: "success", title: "Admin added" }); setAddAdminEmail(""); queryClient.invalidateQueries({ queryKey: ["sa-admins"] }); },
    onError: (e: any) => toast({ type: "error", title: "Failed", message: e.message }),
  });

  const ov = overviewQ.data;

  return (
    <div className="p-6 lg:p-7 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#D9770622" }}>
          <AppIcon name="admin_panel_settings" size={22} style={{ color: "#D97706" }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Super Admin</h2>
          <p className="text-sm text-on-surface-variant">GrowthOS platform management — all tenants, plans, and brand allocations</p>
        </div>
        <div className="ml-auto px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ background: "#D9770622", color: "#D97706" }}>
          Platform Admin
        </div>
      </div>

      {/* Stats */}
      {ov && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard label="Organisations"     value={ov.total_orgs}              icon="business"          color="#4F67F0" />
          <StatCard label="Workspaces"        value={ov.total_workspaces}        icon="folder_open"       color="#7C3AED" />
          <StatCard label="Total Users"       value={ov.total_users}             icon="group"             color="#059669" />
          <StatCard label="Brands"            value={ov.total_brands}            icon="storefront"        color="#D97706" />
          <StatCard label="Active Channels"   value={ov.active_channels}         icon="hub"               color="#0EA5E9" />
          <StatCard label="Subscriptions"     value={ov.active_subscriptions}    icon="credit_card"       color="#DB2777" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-0">
        {(["orgs", "users", "admins"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition-all -mb-px ${
              tab === t ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}>
            {t === "orgs" ? "Organisations" : t === "admins" ? "Platform Admins" : "Users"}
          </button>
        ))}
      </div>

      {/* ── Orgs Tab ─────────────────────────────────────────────────────────── */}
      {tab === "orgs" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant/20">
                  {["Organisation", "Plan", "Brands", "Brand Limit", "Workspaces", "Members", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(orgsQ.data || []).map((org: any, i: number) => (
                  <tr key={org.id} className={`border-b border-outline-variant/10 hover:bg-surface-container/40 transition-colors ${i % 2 === 0 ? "" : "bg-surface-container/20"}`}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-on-surface">{org.display_name}</div>
                      <div className="text-[11px] text-on-surface-variant font-mono">{org.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={org.plan_name || "Free"} color={PLAN_COLORS[org.plan_tier || "free"]} />
                    </td>
                    <td className="px-4 py-3 font-mono text-on-surface">{org.brand_count}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono font-bold ${Number(org.brand_count) >= Number(org.effective_brand_limit) && org.effective_brand_limit !== -1 ? "text-red-400" : "text-on-surface"}`}>
                        {org.effective_brand_limit === -1 ? "∞" : org.effective_brand_limit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface font-mono">{org.workspace_count}</td>
                    <td className="px-4 py-3 text-on-surface font-mono">{org.member_count}</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={org.status}
                        color={org.status === "active" ? "#059669" : org.status === "suspended" ? "#EF4444" : "#6B7280"}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedOrg(org)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-primary/40 text-primary hover:bg-primary/10 transition-all">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orgsQ.isLoading && (
              <div className="py-12 text-center text-on-surface-variant text-sm">Loading…</div>
            )}
          </div>
        </div>
      )}

      {/* ── Users Tab ────────────────────────────────────────────────────────── */}
      {tab === "users" && (
        <div className="space-y-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email or name…"
            className="w-full max-w-sm px-4 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary"
          />
          <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant/20">
                  {["User", "Email", "Workspaces", "Orgs", "Verified", "Last Sign-in", "Platform Admin"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(usersQ.data || []).map((u: any, i: number) => (
                  <tr key={u.id} className={`border-b border-outline-variant/10 hover:bg-surface-container/40 transition-colors ${i % 2 === 0 ? "" : "bg-surface-container/20"}`}>
                    <td className="px-4 py-3 font-medium text-on-surface">{u.full_name || "—"}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-on-surface-variant">{u.email}</td>
                    <td className="px-4 py-3 text-center font-mono text-on-surface">{u.workspace_count}</td>
                    <td className="px-4 py-3 text-center font-mono text-on-surface">{u.org_count}</td>
                    <td className="px-4 py-3">
                      <Badge label={u.email_verified ? "Yes" : "No"} color={u.email_verified ? "#059669" : "#EF4444"} />
                    </td>
                    <td className="px-4 py-3 text-[12px] text-on-surface-variant">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("en-IN") : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      {u.is_platform_admin
                        ? <Badge label="Admin" color="#D97706" />
                        : <span className="text-on-surface-variant/40 text-[11px]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usersQ.isLoading && (
              <div className="py-12 text-center text-on-surface-variant text-sm">Loading…</div>
            )}
          </div>
        </div>
      )}

      {/* ── Platform Admins Tab ────────────────────────────────────────────── */}
      {tab === "admins" && (
        <div className="space-y-5">
          {/* Add admin form */}
          <div className="glass-card rounded-2xl p-5">
            <h4 className="font-semibold text-on-surface mb-4">Add Platform Admin</h4>
            <div className="flex gap-3 flex-wrap">
              <input
                value={addAdminEmail}
                onChange={e => setAddAdminEmail(e.target.value)}
                placeholder="user@email.com"
                className="flex-1 min-w-48 px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary"
              />
              <select value={addAdminRole} onChange={e => setAddAdminRole(e.target.value)}
                className="px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary">
                <option value="admin">Admin</option>
                <option value="support">Support</option>
                <option value="billing">Billing</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <button onClick={() => addAdminMutation.mutate()} disabled={!addAdminEmail || addAdminMutation.isPending}
                className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#494bd6 0%,#c0c1ff 100%)", color: "#0b1326" }}>
                {addAdminMutation.isPending ? "Adding…" : "Add Admin"}
              </button>
            </div>
          </div>

          {/* Admins table */}
          <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant/20">
                  {["Name", "Email", "Role", "Added"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(adminsQ.data || []).map((a: any, i: number) => (
                  <tr key={a.id} className={`border-b border-outline-variant/10 hover:bg-surface-container/40 ${i % 2 === 0 ? "" : "bg-surface-container/20"}`}>
                    <td className="px-4 py-3 font-medium text-on-surface">{a.full_name || "—"}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-on-surface-variant">{a.email}</td>
                    <td className="px-4 py-3">
                      <Badge label={a.role} color={a.role === "super_admin" ? "#D97706" : a.role === "admin" ? "#4F67F0" : "#059669"} />
                    </td>
                    <td className="px-4 py-3 text-[12px] text-on-surface-variant">
                      {new Date(a.created_at).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
                {adminsQ.isLoading && (
                  <tr><td colSpan={4} className="py-12 text-center text-on-surface-variant text-sm">Loading…</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grant Plan Modal */}
      {selectedOrg && (
        <GrantPlanModal
          org={selectedOrg}
          onClose={() => setSelectedOrg(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["sa-orgs"] })}
        />
      )}
    </div>
  );
}
