"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { AppIcon } from "@/components/shared/app-icon";

const ICON = ({ name, size = 20, fill = 1 }: { name: string; size?: number; fill?: number }) => (
  <AppIcon name={name} size={size} strokeWidth={fill ? 2.15 : 1.8} />
);

const MOCK_KPIS = [
  { label: "Total VIP Customers",      value: "248",    icon: "workspace_premium", color: "text-primary",        prefix: "" },
  { label: "VIP Revenue Contribution", value: "41.2%",  icon: "pie_chart",         color: "text-success-accent", prefix: "" },
  { label: "Avg VIP LTV",              value: "84.2K",  icon: "savings",           color: "text-on-surface",     prefix: "Rs" },
  { label: "VIP Repeat Rate",          value: "88.4%",  icon: "repeat",            color: "text-tertiary",       prefix: "" },
];

const MOCK_VIPS = [
  { name: "Priya M.",     orders: 22, spend: 184200, ltvScore: 98, lastOrder: "2 days ago",  segment: "Platinum", location: "Mumbai" },
  { name: "Rahul K.",     orders: 18, spend: 142800, ltvScore: 94, lastOrder: "5 days ago",  segment: "Platinum", location: "Delhi" },
  { name: "Aisha B.",     orders: 16, spend: 128400, ltvScore: 91, lastOrder: "1 week ago",  segment: "Platinum", location: "Bangalore" },
  { name: "Vikram S.",    orders: 14, spend: 108200, ltvScore: 88, lastOrder: "3 days ago",  segment: "Gold",     location: "Mumbai" },
  { name: "Neha J.",      orders: 12, spend: 94800,  ltvScore: 84, lastOrder: "4 days ago",  segment: "Gold",     location: "Hyderabad" },
  { name: "Arjun T.",     orders: 11, spend: 88200,  ltvScore: 81, lastOrder: "6 days ago",  segment: "Gold",     location: "Chennai" },
  { name: "Deepika R.",   orders: 10, spend: 76400,  ltvScore: 78, lastOrder: "1 week ago",  segment: "Gold",     location: "Pune" },
  { name: "Siddharth P.", orders: 9,  spend: 68100,  ltvScore: 74, lastOrder: "10 days ago", segment: "Silver",   location: "Ahmedabad" },
  { name: "Meera N.",     orders: 9,  spend: 64200,  ltvScore: 72, lastOrder: "8 days ago",  segment: "Silver",   location: "Jaipur" },
  { name: "Kabir G.",     orders: 8,  spend: 58800,  ltvScore: 69, lastOrder: "12 days ago", segment: "Silver",   location: "Kolkata" },
];

const SEGMENT_BADGE: Record<string, string> = {
  Platinum: "badge-primary",
  Gold:     "badge-warning",
  Silver:   "badge-secondary",
};

const RETENTION_ACTIONS = [
  { title: "Send exclusive 15% loyalty discount",    icon: "local_offer",  desc: "Targets all Platinum & Gold VIPs" },
  { title: "Early access to new collection drop",    icon: "new_releases", desc: "24h before public launch" },
  { title: "Personal WhatsApp message from founder", icon: "chat",         desc: "Top 20 VIPs by LTV score" },
];

function fmtSpend(v: number) {
  if (v >= 100000) return `Rs${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `Rs${(v / 1000).toFixed(0)}K`;
  return `Rs${v}`;
}

export function VipCustomersPage() {
  const [appliedActions, setAppliedActions] = useState<Set<number>>(new Set());

  useQuery({
    queryKey: ["vip-customers"],
    queryFn: () => api.get("/customers/vip"),
    enabled: false,
  });

  const toggleAction = (i: number) =>
    setAppliedActions(prev => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });

  return (
    <div className="p-4 lg:p-7 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <span className="badge-info text-[10px] px-2 py-0.5 flex items-center gap-1">
          <ICON name="science" size={12} /> Demo Data
        </span>
        <span className="text-[11px] text-on-surface-variant font-mono">VIP customer management and intelligence</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {MOCK_KPIS.map((k, i) => (
          <div key={i} className="glass-card p-4 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <ICON name={k.icon} size={16} />
              <span className="text-[10px] font-mono uppercase tracking-wider">{k.label}</span>
            </div>
            <div className={`font-mono text-xl font-medium ${k.color}`}>{k.prefix}{k.value}</div>
          </div>
        ))}
      </div>

      <div className="glass-card p-4 flex items-center gap-3">
        <ICON name="workspace_premium" size={20} />
        <div>
          <span className="text-xs font-medium text-on-surface">VIP Definition: </span>
          <span className="text-xs text-on-surface-variant">Top 10% by LTV + 2+ orders in last 90 days</span>
        </div>
        <span className="ml-auto badge-info text-[10px] px-2 py-0.5">Auto-updated daily</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-outline-variant">
            <h3 className="text-sm font-bold text-on-surface">VIP Customer Table</h3>
            <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">Top customers by lifetime value score</p>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[2fr_0.7fr_1fr_0.8fr_1fr_0.8fr_1fr] px-5 py-3 border-b border-outline-variant gap-2">
                {["Customer", "Orders", "Total Spend", "LTV Score", "Last Order", "Segment", "Action"].map(h => (
                  <span key={h} className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">{h}</span>
                ))}
              </div>
              {MOCK_VIPS.map((c, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[2fr_0.7fr_1fr_0.8fr_1fr_0.8fr_1fr] px-5 py-3 gap-2 hover:bg-surface-container-high/30 transition-colors border-b border-outline-variant last:border-0 items-center"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] text-on-surface-variant flex-shrink-0">
                      {c.name[0]}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs text-on-surface block truncate">{c.name}</span>
                      <span className="text-[10px] text-on-surface-variant font-mono">{c.location}</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-on-surface-variant">{c.orders}</span>
                  <span className="font-mono text-xs text-on-surface">{fmtSpend(c.spend)}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-10 h-1.5 rounded-full bg-surface-container-high">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${c.ltvScore}%` }} />
                    </div>
                    <span className="font-mono text-[10px] text-primary">{c.ltvScore}</span>
                  </div>
                  <span className="font-mono text-[10px] text-on-surface-variant">{c.lastOrder}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${SEGMENT_BADGE[c.segment] ?? "badge-secondary"}`}>
                    {c.segment}
                  </span>
                  <div className="flex gap-1">
                    <button className="text-[10px] font-mono px-2 py-1 rounded border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors">
                      Profile
                    </button>
                    <button className="text-[10px] font-mono px-2 py-1 rounded border border-primary/25 text-primary hover:bg-primary/10 transition-colors">
                      Offer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="glass-card-high p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <ICON name="insights" size={16} />
              VIP Insights
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { label: "Top Purchased Category", value: "Ethnic Wear",     icon: "category" },
                { label: "Preferred Channel",       value: "WhatsApp + Meta", icon: "share" },
                { label: "Avg Order Frequency",     value: "Every 18 days",  icon: "event_repeat" },
                { label: "Avg Session Duration",    value: "8.4 minutes",    icon: "timer" },
              ].map((ins, i) => (
                <div key={i} className="flex items-center gap-2 py-2 border-b border-outline-variant last:border-0">
                  <ICON name={ins.icon} size={14} />
                  <div className="flex-1">
                    <span className="text-[10px] text-on-surface-variant font-mono block">{ins.label}</span>
                    <span className="text-xs text-on-surface font-medium">{ins.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <ICON name="auto_awesome" size={16} />
              Retention Actions
            </h3>
            <p className="text-[10px] text-on-surface-variant font-mono">AI-suggested actions to retain VIPs</p>
            <div className="flex flex-col gap-3">
              {RETENTION_ACTIONS.map((a, i) => (
                <div key={i} className="p-3 rounded-lg bg-surface-container-high/40 border border-outline-variant flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <ICON name={a.icon} size={14} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-on-surface font-medium leading-snug">{a.title}</p>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">{a.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAction(i)}
                    className={`w-full py-1.5 rounded text-[11px] font-mono transition-colors ${
                      appliedActions.has(i)
                        ? "bg-success-accent/10 text-success-accent border border-success-accent/25"
                        : "border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-primary/25"
                    }`}
                  >
                    {appliedActions.has(i) ? "Applied" : "Apply"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
