"use client";

import { useState } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

type Channel = "email" | "whatsapp" | "slack";
type AlertStatus = "active" | "paused";

interface AlertRule {
  id: string;
  name: string;
  icon: string;
  description: string;
  metric: string;
  threshold: string;
  channels: Channel[];
  status: AlertStatus;
  enabled: boolean;
}

interface HistoryRow {
  time: string;
  rule: string;
  metric: string;
  value: string;
  triggered: boolean;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const INITIAL_ALERTS: AlertRule[] = [
  {
    id: "roas",
    name: "ROAS Alert",
    icon: "campaign",
    description: "Alert when ROAS drops below threshold",
    metric: "ROAS",
    threshold: "2.5x",
    channels: ["email", "whatsapp"],
    status: "active",
    enabled: true,
  },
  {
    id: "spend",
    name: "Daily Spend Cap",
    icon: "account_balance",
    description: "Alert when daily ad spend exceeds limit",
    metric: "Daily Spend",
    threshold: "₹50,000",
    channels: ["email", "whatsapp"],
    status: "active",
    enabled: true,
  },
  {
    id: "inventory",
    name: "Inventory Alert",
    icon: "inventory",
    description: "Alert when product stock drops below units",
    metric: "Stock Level",
    threshold: "10 units",
    channels: ["email"],
    status: "active",
    enabled: true,
  },
  {
    id: "rto",
    name: "RTO Rate Alert",
    icon: "local_shipping",
    description: "Alert when RTO rate exceeds threshold",
    metric: "RTO Rate",
    threshold: "15%",
    channels: ["whatsapp"],
    status: "active",
    enabled: true,
  },
  {
    id: "revenue",
    name: "Revenue Drop",
    icon: "trending_down",
    description: "Alert when daily revenue drops vs. yesterday",
    metric: "Revenue Change",
    threshold: "-20%",
    channels: ["email", "whatsapp"],
    status: "paused",
    enabled: false,
  },
  {
    id: "orders",
    name: "New Order Spike",
    icon: "bolt",
    description: "Alert when orders spike unusually high",
    metric: "Orders/Hour",
    threshold: "50",
    channels: ["email"],
    status: "active",
    enabled: true,
  },
];

const HISTORY_ROWS: HistoryRow[] = [
  { time: "Today 09:14", rule: "ROAS Alert", metric: "ROAS", value: "2.3x", triggered: true },
  { time: "Today 07:02", rule: "Daily Spend Cap", metric: "Daily Spend", value: "₹51,200", triggered: true },
  { time: "Yesterday 22:45", rule: "Inventory Alert", metric: "Stock Level", value: "8 units", triggered: true },
  { time: "Yesterday 18:30", rule: "RTO Rate Alert", metric: "RTO Rate", value: "17.2%", triggered: true },
  { time: "Yesterday 14:10", rule: "ROAS Alert", metric: "ROAS", value: "2.8x", triggered: false },
];

// ── Channel pill ──────────────────────────────────────────────────────────────

const CHANNEL_META: Record<Channel, { label: string; icon: string; color: string }> = {
  email: { label: "Email", icon: "email", color: "#3B9EFF" },
  whatsapp: { label: "WhatsApp", icon: "chat", color: "#00E5A0" },
  slack: { label: "Slack", icon: "hub", color: "#FFAD3B" },
};

function ChannelPill({ channel }: { channel: Channel }) {
  const meta = CHANNEL_META[channel];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono"
      style={{ backgroundColor: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}30` }}
    >
      <AppIcon name={meta.icon} size={10} />
      {meta.label}
    </span>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none"
      style={{ backgroundColor: checked ? "#00E5A0" : "#1E2737" }}
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRule[]>(INITIAL_ALERTS);
  const [channels, setChannels] = useState<Record<Channel, boolean>>({
    email: true,
    whatsapp: true,
    slack: false,
  });
  const [historyOpen, setHistoryOpen] = useState(true);
  const [editingThreshold, setEditingThreshold] = useState<string | null>(null);

  function toggleAlert(id: string) {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, enabled: !a.enabled, status: !a.enabled ? "active" : "paused" }
          : a
      )
    );
  }

  function toggleChannel(ch: Channel) {
    setChannels((prev) => ({ ...prev, [ch]: !prev[ch] }));
  }

  function updateThreshold(id: string, value: string) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, threshold: value } : a)));
  }

  return (
    <div className="p-7 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="font-syne text-base font-bold text-[#F0F4FF]">Alert Configuration</h2>
        <p className="text-xs text-[#48566E] font-mono mt-0.5">
          Set intelligent thresholds and get notified when your key metrics need attention.
        </p>
      </div>

      {/* Notification Channels */}
      <div>
        <h3 className="text-xs font-mono text-[#8A95B0] uppercase tracking-widest mb-3">
          Notification Channels
        </h3>
        <div className="flex gap-3 flex-wrap">
          {(["email", "whatsapp", "slack"] as Channel[]).map((ch) => {
            const meta = CHANNEL_META[ch];
            const active = channels[ch];
            return (
              <Card
                key={ch}
                className="flex-1 min-w-[160px] p-4 flex items-center justify-between gap-3"
                style={{
                  borderColor: active ? `${meta.color}40` : "#1E2737",
                  backgroundColor: active ? `${meta.color}08` : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${meta.color}15` }}
                  >
                    <AppIcon name={meta.icon} size={18} style={{ color: meta.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#F0F4FF]">{meta.label}</p>
                    <p className="text-[10px] text-[#48566E] font-mono">
                      {ch === "email"
                        ? "Get detailed reports"
                        : ch === "whatsapp"
                        ? "Instant mobile alerts"
                        : "Team notifications"}
                    </p>
                    {ch === "slack" && !active && (
                      <button className="text-[10px] text-[#3B9EFF] hover:underline mt-0.5">
                        Connect Slack
                      </button>
                    )}
                  </div>
                </div>
                <Toggle checked={active} onChange={() => toggleChannel(ch)} />
              </Card>
            );
          })}
        </div>
      </div>

      {/* Alert Rules */}
      <div>
        <h3 className="text-xs font-mono text-[#8A95B0] uppercase tracking-widest mb-3">
          Alert Rules
        </h3>
        <div className="flex flex-col gap-2">
          {alerts.map((rule) => (
            <Card
              key={rule.id}
              className="p-4 flex items-center justify-between gap-4"
              style={{
                borderColor: rule.enabled ? "rgba(0,229,160,0.15)" : "#1E2737",
              }}
            >
              {/* Left: icon + info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: rule.enabled ? "rgba(0,229,160,0.1)" : "rgba(255,255,255,0.04)",
                  }}
                >
                  <AppIcon
                    name={rule.icon}
                    size={18}
                    style={{ color: rule.enabled ? "#00E5A0" : "#48566E" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[#F0F4FF]">{rule.name}</span>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono"
                      style={
                        rule.status === "active"
                          ? { backgroundColor: "rgba(0,229,160,0.1)", color: "#00E5A0", border: "1px solid rgba(0,229,160,0.3)" }
                          : { backgroundColor: "rgba(255,173,59,0.1)", color: "#FFAD3B", border: "1px solid rgba(255,173,59,0.3)" }
                      }
                    >
                      {rule.status === "active" ? "Active" : "Paused"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#48566E] font-mono mt-0.5">{rule.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-[#8A95B0] font-mono">
                      Metric: <span className="text-[#F0F4FF]">{rule.metric}</span>
                    </span>
                    <span className="text-[#1E2737]">·</span>
                    {/* Threshold inline edit */}
                    <span className="text-[10px] text-[#8A95B0] font-mono flex items-center gap-1">
                      Threshold:{" "}
                      {editingThreshold === rule.id ? (
                        <input
                          autoFocus
                          className="bg-[#0D111A] border border-[#00E5A0] text-[#F0F4FF] text-[10px] font-mono rounded px-1.5 py-0.5 w-20 focus:outline-none"
                          value={rule.threshold}
                          onChange={(e) => updateThreshold(rule.id, e.target.value)}
                          onBlur={() => setEditingThreshold(null)}
                          onKeyDown={(e) => e.key === "Enter" && setEditingThreshold(null)}
                        />
                      ) : (
                        <button
                          className="text-[#F0F4FF] hover:text-[#00E5A0] transition-colors"
                          onClick={() => setEditingThreshold(rule.id)}
                        >
                          {rule.threshold}
                        </button>
                      )}
                    </span>
                    <span className="text-[#1E2737]">·</span>
                    <div className="flex items-center gap-1">
                      {rule.channels.map((ch) => (
                        <ChannelPill key={ch} channel={ch} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: toggle */}
              <Toggle checked={rule.enabled} onChange={() => toggleAlert(rule.id)} />
            </Card>
          ))}

          {/* Add Alert Rule button */}
          <button
            className="w-full py-3 rounded-xl border border-dashed border-[#1E2737] text-[#8A95B0] hover:border-[#00E5A0] hover:text-[#00E5A0] transition-all text-sm font-mono flex items-center justify-center gap-2 mt-1"
            onClick={() => {}}
          >
            <AppIcon name="add" size={16} />
            Add Alert Rule
          </button>
        </div>
      </div>

      {/* Alert History */}
      <div>
        <button
          className="flex items-center gap-2 text-xs font-mono text-[#8A95B0] uppercase tracking-widest mb-3 hover:text-[#F0F4FF] transition-colors"
          onClick={() => setHistoryOpen((o) => !o)}
        >
          <AppIcon
            name={historyOpen ? "expand_less" : "expand_more"}
            size={16}
          />
          Alert History
          <span className="normal-case text-[10px] text-[#48566E]">(last 10)</span>
        </button>

        {historyOpen && (
          <Card className="overflow-hidden">
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="border-b border-[#1E2737]">
                  {["Time", "Rule", "Metric", "Value", "Triggered"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 text-[#48566E] font-medium uppercase tracking-wider text-[10px]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HISTORY_ROWS.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#1E2737] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-2.5 text-[#48566E]">{row.time}</td>
                    <td className="px-4 py-2.5 text-[#8A95B0]">{row.rule}</td>
                    <td className="px-4 py-2.5 text-[#8A95B0]">{row.metric}</td>
                    <td className="px-4 py-2.5 text-[#F0F4FF] font-medium">{row.value}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={
                          row.triggered
                            ? { backgroundColor: "rgba(255,91,107,0.1)", color: "#FF5B6B", border: "1px solid rgba(255,91,107,0.3)" }
                            : { backgroundColor: "rgba(0,229,160,0.1)", color: "#00E5A0", border: "1px solid rgba(0,229,160,0.3)" }
                        }
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: row.triggered ? "#FF5B6B" : "#00E5A0" }}
                        />
                        {row.triggered ? "Triggered" : "OK"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
