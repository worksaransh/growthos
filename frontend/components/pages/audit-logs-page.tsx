"use client";

import { useState } from "react";

const AUDIT_LOGS = [
  { ts: "2026-06-30 14:32:01", user: "founder@mybrand.co", action: "Login", resource: "/auth/login", ip: "192.168.1.1", status: "Success" },
  { ts: "2026-06-30 14:28:47", user: "founder@mybrand.co", action: "Export CSV", resource: "/reports/export", ip: "192.168.1.1", status: "Success" },
  { ts: "2026-06-30 13:55:12", user: "admin@mybrand.co", action: "Settings Changed", resource: "/settings/workspace", ip: "10.0.0.4", status: "Success" },
  { ts: "2026-06-30 13:41:03", user: "founder@mybrand.co", action: "API Key Created", resource: "/api-keys", ip: "192.168.1.1", status: "Success" },
  { ts: "2026-06-30 13:10:55", user: "unknown@hacker.com", action: "Failed Login", resource: "/auth/login", ip: "45.33.102.7", status: "Failed" },
  { ts: "2026-06-30 12:48:30", user: "admin@mybrand.co", action: "Data Export", resource: "/customers/export", ip: "10.0.0.4", status: "Success" },
  { ts: "2026-06-30 12:20:11", user: "founder@mybrand.co", action: "Team Invite Sent", resource: "/team/invite", ip: "192.168.1.1", status: "Success" },
  { ts: "2026-06-30 11:55:00", user: "admin@mybrand.co", action: "Role Changed", resource: "/team/roles", ip: "192.168.1.5", status: "Success" },
  { ts: "2026-06-30 11:30:42", user: "founder@mybrand.co", action: "Integration Connected", resource: "/integrations/meta", ip: "192.168.1.1", status: "Success" },
  { ts: "2026-06-30 10:58:17", user: "unknown@attacker.net", action: "Failed Login", resource: "/auth/login", ip: "185.220.101.9", status: "Failed" },
  { ts: "2026-06-30 10:22:09", user: "admin@mybrand.co", action: "Report Generated", resource: "/reports/monthly", ip: "10.0.0.4", status: "Success" },
  { ts: "2026-06-30 09:45:33", user: "founder@mybrand.co", action: "API Key Deleted", resource: "/api-keys/key_4821", ip: "192.168.1.1", status: "Success" },
  { ts: "2026-06-30 09:12:05", user: "founder@mybrand.co", action: "Billing Updated", resource: "/billing/plan", ip: "192.168.1.1", status: "Success" },
  { ts: "2026-06-30 08:55:48", user: "admin@mybrand.co", action: "Workspace Settings", resource: "/settings/workspace", ip: "192.168.1.5", status: "Success" },
  { ts: "2026-06-30 08:30:22", user: "admin@mybrand.co", action: "Login", resource: "/auth/login", ip: "10.0.0.4", status: "Success" },
];

const KPI_CHIPS = [
  { label: "Total Events Today", value: "847", color: "text-on-surface" },
  { label: "Critical Actions", value: "12", color: "text-amber-400" },
  { label: "Unique Users", value: "4", color: "text-primary" },
  { label: "Failed Attempts", value: "2", badge: "badge-error" },
];

const ACTION_TYPES = ["All", "Login", "Data Export", "Settings Change", "API Key", "Team"];

export function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const filtered = AUDIT_LOGS.filter((log) => {
    const matchSearch =
      !search ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase());
    const matchAction =
      actionFilter === "All" ||
      log.action.toLowerCase().includes(actionFilter.toLowerCase());
    return matchSearch && matchAction;
  });

  return (
    <div className="p-7 flex flex-col gap-6">
      <div>
        <h2 className="font-syne text-base font-bold text-on-surface">Audit Logs</h2>
        <p className="text-xs text-on-surface-variant font-mono mt-0.5">Complete activity trail for your workspace</p>
      </div>

      {/* KPI chips */}
      <div className="flex flex-wrap gap-3">
        {KPI_CHIPS.map((chip) => (
          <div key={chip.label} className="glass-card px-4 py-3 flex flex-col gap-1 min-w-[160px]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">{chip.label}</div>
            {chip.badge ? (
              <span className={chip.badge}>{chip.value}</span>
            ) : (
              <div className={`font-mono text-lg font-bold ${chip.color}`}>{chip.value}</div>
            )}
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <input
          className="input-base flex-1 min-w-[200px]"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input-base w-auto"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          {ACTION_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input type="date" className="input-base w-auto" defaultValue="2026-06-30" />
      </div>

      {/* Table */}
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-outline-variant">
              {["Timestamp", "User", "Action", "Resource", "IP Address", "Status"].map((h) => (
                <th key={h} className="text-left px-5 py-3 font-mono text-on-surface-variant font-normal uppercase tracking-wider text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((log, i) => (
              <>
                <tr
                  key={i}
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="border-b border-outline-variant last:border-0 hover:bg-surface-container-lowest transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3 font-mono text-on-surface-variant whitespace-nowrap">{log.ts}</td>
                  <td className="px-5 py-3 text-on-surface">{log.user}</td>
                  <td className="px-5 py-3 text-on-surface font-medium">{log.action}</td>
                  <td className="px-5 py-3 font-mono text-on-surface-variant">{log.resource}</td>
                  <td className="px-5 py-3 font-mono text-on-surface-variant">{log.ip}</td>
                  <td className="px-5 py-3">
                    <span className={log.status === "Success" ? "badge-success" : "badge-error"}>{log.status}</span>
                  </td>
                </tr>
                {expanded === i && (
                  <tr key={`exp-${i}`} className="bg-surface-container-lowest">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="font-mono text-xs text-on-surface-variant bg-surface-container rounded-lg p-4">
                        <pre>{JSON.stringify({ timestamp: log.ts, user: log.user, action: log.action, resource: log.resource, ip_address: log.ip, status: log.status, user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/126.0", session_id: `sess_${Math.random().toString(36).slice(2, 10)}`, workspace_id: "ws_mybrand_001" }, null, 2)}</pre>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-on-surface-variant">Showing 1–{filtered.length} of 847 events</span>
        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="text-xs px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors">← Prev</button>
          <span className="text-xs px-4 py-2 font-mono text-on-surface">{page}</span>
          <button onClick={() => setPage((p) => p + 1)} className="text-xs px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors">Next →</button>
        </div>
      </div>
    </div>
  );
}
