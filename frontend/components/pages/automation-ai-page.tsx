"use client";

import { useState } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { Sparkline } from "@/components/charts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AutomationCard {
  id: string;
  title: string;
  description: string;
  platform: "META" | "GOOGLE" | "WHATSAPP" | "EMAIL";
  icon: string;
  iconBg: string;
  iconColor: string;
  impact: string;
  impactColor: string;
  sparkData: number[];
  sparkColor: string;
  enabled: boolean;
}

interface Rule {
  name: string;
  trigger: string;
  status: "active" | "paused";
  lastRun: string;
}

// ── Platform badge style map ───────────────────────────────────────────────────

const PLATFORM_BADGE: Record<
  AutomationCard["platform"],
  { bg: string; text: string; border: string }
> = {
  META: {
    bg: "bg-[#c0c1ff]/10",
    text: "text-[#c0c1ff]",
    border: "border-[#c0c1ff]/20",
  },
  GOOGLE: {
    bg: "bg-[#7bd0ff]/10",
    text: "text-[#7bd0ff]",
    border: "border-[#7bd0ff]/20",
  },
  WHATSAPP: {
    bg: "bg-[#4ade80]/10",
    text: "text-[#4ade80]",
    border: "border-[#4ade80]/20",
  },
  EMAIL: {
    bg: "bg-[#fb923c]/10",
    text: "text-[#fb923c]",
    border: "border-[#fb923c]/20",
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-[#2d3449] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8083ff]" />
    </label>
  );
}

function PlatformBadge({
  platform,
}: {
  platform: AutomationCard["platform"];
}) {
  const style = PLATFORM_BADGE[platform];
  return (
    <span
      className={`text-[10px] font-bold px-2 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}
    >
      {platform}
    </span>
  );
}

function AutomationCardItem({
  card,
  onToggle,
}: {
  card: AutomationCard;
  onToggle: () => void;
}) {
  return (
    <div className="glass-card p-6 rounded-2xl transition-all group relative overflow-hidden">
      {/* Header row */}
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${card.iconBg}`}>
          <AppIcon
            name={card.icon}
            size={20}
            style={{ color: card.iconColor }}
          />
        </div>
        <PlatformBadge platform={card.platform} />
      </div>

      {/* Title + description */}
      <h3 className="font-bold text-[#dbe2fd] mb-1 text-sm">{card.title}</h3>
      <p className="text-[#c7c4d7] text-xs mb-5 line-clamp-1">
        {card.description}
      </p>

      {/* Impact + sparkline + toggle */}
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[10px] font-medium text-[#c7c4d7] uppercase tracking-wider">
            Impact
          </span>
          <div
            className="text-lg font-semibold leading-tight mt-0.5"
            style={{ color: card.impactColor }}
          >
            {card.impact}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Recharts sparkline */}
          <div className="w-24 h-10 flex-shrink-0">
            <Sparkline data={card.sparkData} color={card.sparkColor} height={40} />
          </div>

          {/* Per-card toggle */}
          <ToggleSwitch checked={card.enabled} onChange={onToggle} />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AutomationAiPage() {
  // ── Global toggle ────────────────────────────────────────────────────────────
  const [globalEnabled, setGlobalEnabled] = useState(true);

  // ── Automation cards ─────────────────────────────────────────────────────────
  const [automations, setAutomations] = useState<AutomationCard[]>([
    {
      id: "1",
      title: "Auto-Scaling Winning Ads",
      description: "Increases budget by 15% when ROAS > 3.5x",
      platform: "META",
      icon: "trending_up",
      iconBg: "bg-blue-500/10",
      iconColor: "#60a5fa",
      impact: "+12.4% ROAS",
      impactColor: "#c0c1ff",
      sparkData: [35, 20, 30, 18, 22, 10, 15],
      sparkColor: "#8083ff",
      enabled: true,
    },
    {
      id: "2",
      title: "Budget Reallocation",
      description: "Shifts spend toward high-intent PMax clusters",
      platform: "GOOGLE",
      icon: "savings",
      iconBg: "bg-[#7bd0ff]/10",
      iconColor: "#7bd0ff",
      impact: "+8.2% CPA",
      impactColor: "#7bd0ff",
      sparkData: [25, 30, 20, 28, 18, 22, 5],
      sparkColor: "#7bd0ff",
      enabled: true,
    },
    {
      id: "3",
      title: "Cart Abandonment Recovery",
      description: "Sends WhatsApp sequence to abandoned carts",
      platform: "WHATSAPP",
      icon: "shopping_bag",
      iconBg: "bg-[#ddb7ff]/10",
      iconColor: "#ddb7ff",
      impact: "18.2% Recovery Rate",
      impactColor: "#ddb7ff",
      sparkData: [30, 25, 30, 10, 20, 5],
      sparkColor: "#ddb7ff",
      enabled: true,
    },
    {
      id: "4",
      title: "COD Confirmation",
      description: "Confirms cash-on-delivery orders via WhatsApp",
      platform: "WHATSAPP",
      icon: "check_circle",
      iconBg: "bg-[#4ade80]/10",
      iconColor: "#4ade80",
      impact: "−24% RTO Rate",
      impactColor: "#4ade80",
      sparkData: [20, 28, 22, 15, 18, 10],
      sparkColor: "#4ade80",
      enabled: true,
    },
    {
      id: "5",
      title: "Audience Suppression",
      description: "Excludes recent purchasers from acquisition sets",
      platform: "META",
      icon: "alert",
      iconBg: "bg-purple-500/10",
      iconColor: "#a78bfa",
      impact: "−₹18K Wasted Spend",
      impactColor: "#a78bfa",
      sparkData: [15, 25, 20, 28, 22, 8],
      sparkColor: "#a78bfa",
      enabled: false,
    },
    {
      id: "6",
      title: "Win-Back Campaign",
      description: "Re-engages customers inactive for 60+ days",
      platform: "EMAIL",
      icon: "repeat",
      iconBg: "bg-[#fb923c]/10",
      iconColor: "#fb923c",
      impact: "+₹2.1L Revenue",
      impactColor: "#fb923c",
      sparkData: [35, 15, 25, 18, 20, 15],
      sparkColor: "#fb923c",
      enabled: true,
    },
  ]);

  // ── Rule Builder state ───────────────────────────────────────────────────────
  const [trigger, setTrigger] = useState("roas_below");
  const [threshold, setThreshold] = useState("2.5");
  const [action, setAction] = useState("pause_campaign");

  const [rules, setRules] = useState<Rule[]>([
    {
      name: "ROAS Guard",
      trigger: "ROAS < 2x",
      status: "active",
      lastRun: "2h ago",
    },
    {
      name: "Cart Recovery",
      trigger: "Cart abandoned > 1h",
      status: "active",
      lastRun: "14m ago",
    },
    {
      name: "Budget Cap",
      trigger: "Spend > ₹50K/day",
      status: "paused",
      lastRun: "3d ago",
    },
  ]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const triggerLabels: Record<string, string> = {
    roas_below: "ROAS drops below",
    cart_abandoned: "Cart abandoned",
    inventory_low: "Inventory < X units",
    rto_high: "RTO rate > 15%",
  };

  const createRule = () => {
    const newRule: Rule = {
      name: `${triggerLabels[trigger] ?? trigger} ${threshold}`,
      trigger: `${triggerLabels[trigger] ?? trigger} ${threshold}`,
      status: "active",
      lastRun: "Just now",
    };
    setRules((prev) => [newRule, ...prev]);
  };

  const toggleRuleStatus = (idx: number) => {
    setRules((prev) =>
      prev.map((r, i) =>
        i === idx
          ? { ...r, status: r.status === "active" ? "paused" : "active" }
          : r
      )
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 flex flex-col gap-6 page-enter">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-[#dbe2fd] leading-tight">
            Marketing Automation
          </h1>
          <p className="text-[#c7c4d7] text-sm mt-1">
            Manage and optimize your AI-driven marketing workflows.
          </p>
        </div>

        {/* Global Automation toggle card */}
        <div className="glass-card px-5 py-3 rounded-2xl flex items-center gap-4 border-[#8083ff]/20 flex-shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">
            Global Automation
          </span>
          <ToggleSwitch checked={globalEnabled} onChange={setGlobalEnabled} />
          <span
            className={`text-sm font-bold transition-colors ${
              globalEnabled ? "text-[#c0c1ff]" : "text-[#ffb4ab]"
            }`}
          >
            {globalEnabled ? "ON" : "OFF"}
          </span>
        </div>
      </div>

      {/* ── Section 1: Active Automations (3-col grid) ───────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <AppIcon name="bolt" size={20} style={{ color: "#c0c1ff" }} />
          <h2 className="text-xl font-semibold text-[#dbe2fd]">
            Active Automations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {automations.map((card) => (
            <AutomationCardItem
              key={card.id}
              card={card}
              onToggle={() => toggleAutomation(card.id)}
            />
          ))}
        </div>
      </section>

      {/* ── Section 2: AI Rule Builder ────────────────────────────────────────── */}
      <section>
        <div className="glass-card rounded-2xl p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <AppIcon
              name="auto_awesome"
              size={20}
              style={{ color: "#7bd0ff" }}
            />
            <h2 className="text-xl font-semibold text-[#dbe2fd]">
              AI Rule Builder
            </h2>
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#7bd0ff]/10 text-[#7bd0ff] border border-[#7bd0ff]/20">
              Powered by Claude AI
            </span>
          </div>

          {/* Trigger | Condition | Action columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {/* Trigger */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7] block mb-2">
                Trigger
              </label>
              <select
                className="input-base w-full"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
              >
                <option value="roas_below">ROAS drops below</option>
                <option value="cart_abandoned">Cart abandoned</option>
                <option value="inventory_low">Inventory &lt; X units</option>
                <option value="rto_high">RTO rate &gt; 15%</option>
              </select>
            </div>

            {/* Condition / threshold */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7] block mb-2">
                Threshold
              </label>
              <input
                type="text"
                className="input-base w-full"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="e.g. 2.5x"
              />
            </div>

            {/* Action */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7] block mb-2">
                Action
              </label>
              <select
                className="input-base w-full"
                value={action}
                onChange={(e) => setAction(e.target.value)}
              >
                <option value="pause_campaign">Pause campaign</option>
                <option value="increase_budget">Increase budget 20%</option>
                <option value="send_whatsapp">Send WhatsApp</option>
                <option value="alert_email">Alert via email</option>
              </select>
            </div>
          </div>

          {/* Create Rule button */}
          <button
            onClick={createRule}
            className="primary-gradient text-white text-sm font-semibold px-6 py-2.5 rounded-xl mb-6 hover:opacity-90 active:scale-95 transition-all"
          >
            Create Rule
          </button>

          {/* Recent rules table */}
          <div className="border border-[#464554]/30 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#222a3d]/60 border-b border-[#464554]/30">
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">
                    Rule Name
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">
                    Trigger
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">
                    Last Triggered
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#464554]/20">
                {rules.map((rule, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-[#222a3d]/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-[#dbe2fd]">
                      {rule.name}
                    </td>
                    <td className="px-4 py-3 text-[#c7c4d7] text-xs">
                      {rule.trigger}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleRuleStatus(idx)}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-colors ${
                          rule.status === "active"
                            ? "badge-success"
                            : "badge-warning"
                        }`}
                      >
                        {rule.status === "active" ? "Active" : "Paused"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[#c7c4d7] text-xs">
                      {rule.lastRun}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Section 3: Performance Impact (3 stat cards) ─────────────────────── */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Revenue from Automations */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <AppIcon name="payments" size={18} style={{ color: "#4ade80" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">
                Revenue from Automations
              </span>
            </div>
            <div className="text-2xl font-bold text-[#dbe2fd]">₹8.4L</div>
            <div className="flex items-center gap-1 mt-1">
              <AppIcon
                name="trending_up"
                size={14}
                style={{ color: "#4ade80" }}
              />
              <span className="text-xs font-semibold text-[#4ade80]">
                +23% vs last month
              </span>
            </div>
          </div>

          {/* Wasted Spend Prevented */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <AppIcon
                name="money_off"
                size={18}
                style={{ color: "#fb923c" }}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">
                Wasted Spend Prevented
              </span>
            </div>
            <div className="text-2xl font-bold text-[#dbe2fd]">₹1.2L</div>
            <span className="text-xs text-[#c7c4d7] mt-1 block">
              This month
            </span>
          </div>

          {/* Automation Actions Taken */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <AppIcon
                name="automation"
                size={18}
                style={{ color: "#c0c1ff" }}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">
                Automation Actions Taken
              </span>
            </div>
            <div className="text-2xl font-bold text-[#dbe2fd]">1,847</div>
            <span className="text-xs text-[#c7c4d7] mt-1 block">
              This week
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
