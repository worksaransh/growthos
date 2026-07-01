"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { AppIcon } from "@/components/shared/app-icon";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

const ICON = ({ name, size = 20, fill = 1 }: { name: string; size?: number; fill?: number }) => (
  <AppIcon name={name} size={size} strokeWidth={fill ? 2.15 : 1.8} />
);

const TABS = ["Overview", "First Touch", "Last Touch", "Linear", "Data-Driven"];

const MOCK_CHANNELS = [
  { channel: "Meta Ads",     revenue: 4821000, pct: 38.2, conversions: 1142, cpa: 4221, color: "#1877F2" },
  { channel: "Google Ads",   revenue: 3214000, pct: 25.4, conversions: 784,  cpa: 4098, color: "#FFAD3B" },
  { channel: "Organic",      revenue: 1892000, pct: 15.0, conversions: 512,  cpa: 0,    color: "#00E5A0" },
  { channel: "Direct",       revenue: 1124000, pct: 8.9,  conversions: 298,  cpa: 0,    color: "#8A95B0" },
  { channel: "Email",        revenue: 842000,  pct: 6.7,  conversions: 224,  cpa: 1241, color: "#A78BFA" },
  { channel: "WhatsApp",     revenue: 728000,  pct: 5.8,  conversions: 181,  cpa: 892,  color: "#25D366" },
];

const MOCK_MODEL_DATA = {
  "First Touch":   [48, 29, 8,  7,  5,  3],
  "Last Touch":    [31, 28, 12, 11, 9,  9],
  "Linear":        [35, 26, 14, 10, 8,  7],
  "Data-Driven":   [38, 25, 15, 9,  7,  6],
};

const MOCK_KPIS = {
  totalRevenue: 12621000,
  efficiency: 4.28,
  topChannel: "Meta Ads",
  crossDevice: 34.2,
};

function fmt(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
}

const channelColors: Record<string, string> = {
  "Meta Ads": "#1877F2", "Google Ads": "#FFAD3B", "Organic": "#00E5A0",
  "Direct": "#8A95B0", "Email": "#A78BFA", "WhatsApp": "#25D366",
};

function SimpleChannelCards({ modelKey }: { modelKey: keyof typeof MOCK_MODEL_DATA }) {
  const pcts = MOCK_MODEL_DATA[modelKey];
  const sorted = MOCK_CHANNELS.map((c, i) => ({ ...c, modelPct: pcts[i] })).sort((a, b) => b.modelPct - a.modelPct);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {sorted.map((c, i) => (
        <div key={c.channel} className="glass-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-on-surface">{c.channel}</span>
            {i === 0 && <span className="badge-success text-[10px] px-2 py-0.5">Top</span>}
          </div>
          <div className="font-mono text-xl text-primary">{c.modelPct}%</div>
          <div className="w-full h-1.5 rounded-full bg-surface-container-high">
            <div className="h-1.5 rounded-full" style={{ width: `${c.modelPct}%`, backgroundColor: c.color }} />
          </div>
          <div className="text-[10px] text-on-surface-variant font-mono">{fmt(c.revenue)} attributed revenue</div>
        </div>
      ))}
    </div>
  );
}

export function AttributionPage() {
  const [tab, setTab] = useState("Overview");

  useQuery({
    queryKey: ["attribution"],
    queryFn: () => api.get("/attribution/overview"),
    enabled: false,
  });

  const kpis = [
    { label: "Total Attributed Revenue", value: fmt(MOCK_KPIS.totalRevenue), icon: "payments", color: "text-primary" },
    { label: "Attribution Efficiency", value: `${MOCK_KPIS.efficiency}x ROAS`, icon: "trending_up", color: "text-success-accent" },
    { label: "Top Channel", value: MOCK_KPIS.topChannel, icon: "bar_chart", color: "text-on-surface" },
    { label: "Cross-Device %", value: `${MOCK_KPIS.crossDevice}%`, icon: "devices", color: "text-tertiary" },
  ];

  const modelKeys = Object.keys(MOCK_MODEL_DATA) as (keyof typeof MOCK_MODEL_DATA)[];

  return (
    <div className="p-4 lg:p-7 flex flex-col gap-5">
      {/* Demo badge */}
      <div className="flex items-center gap-2">
        <span className="badge-info text-[10px] px-2 py-0.5 flex items-center gap-1">
          <ICON name="science" size={12} /> Demo Data
        </span>
        <span className="text-[11px] text-on-surface-variant font-mono">Showing illustrative attribution data</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-mono transition-all ${
              tab === t
                ? "bg-primary/15 border border-primary/25 text-primary"
                : "text-on-surface-variant hover:text-on-surface border border-outline-variant"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((k, i) => (
              <div key={i} className="glass-card p-4 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <ICON name={k.icon} size={16} />
                  <span className="text-[10px] font-mono uppercase tracking-wider">{k.label}</span>
                </div>
                <div className={`font-mono text-xl font-medium ${k.color}`}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Channel Attribution Table */}
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-outline-variant">
              <h3 className="text-sm font-bold text-on-surface">Channel Attribution Table</h3>
              <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">Data-driven model, last 30 days</p>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-[2fr_1.2fr_1fr_0.8fr_0.8fr] px-5 py-3 border-b border-outline-variant gap-3">
                  {["Channel", "Attributed Revenue", "% Contribution", "Conversions", "CPA"].map(h => (
                    <span key={h} className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">{h}</span>
                  ))}
                </div>
                {MOCK_CHANNELS.map((c, i) => (
                  <div key={i} className="grid grid-cols-[2fr_1.2fr_1fr_0.8fr_0.8fr] px-5 py-3.5 gap-3 hover:bg-surface-container-high/30 transition-colors border-b border-outline-variant last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-xs text-on-surface">{c.channel}</span>
                    </div>
                    <span className="font-mono text-xs text-on-surface">{fmt(c.revenue)}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-surface-container-high max-w-[80px]">
                        <div className="h-1.5 rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
                      </div>
                      <span className="font-mono text-xs text-on-surface-variant">{c.pct}%</span>
                    </div>
                    <span className="font-mono text-xs text-on-surface-variant">{c.conversions.toLocaleString()}</span>
                    <span className="font-mono text-xs text-on-surface-variant">{c.cpa > 0 ? fmt(c.cpa) : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Attribution Model Comparison */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-on-surface mb-1">Attribution Model Comparison</h3>
            <p className="text-[11px] text-on-surface-variant font-mono mb-5">How credit is distributed across channels per model</p>
            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                {/* Legend */}
                <div className="flex gap-4 flex-wrap mb-4">
                  {MOCK_CHANNELS.map(c => (
                    <div key={c.channel} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-[10px] font-mono text-on-surface-variant">{c.channel}</span>
                    </div>
                  ))}
                </div>
                {/* Recharts grouped bar chart — one bar group per attribution model */}
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={modelKeys.map((model) => ({
                      model,
                      ...Object.fromEntries(
                        MOCK_CHANNELS.map((c, ci) => [c.channel, MOCK_MODEL_DATA[model][ci]])
                      ),
                    }))}
                    margin={{ top: 16, right: 4, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="model" tick={{ fill: "#8A95B0", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#8A95B0", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: "#0F1217", border: "1px solid #1E2737", borderRadius: 8, fontSize: 11 }}
                      formatter={(v: number) => [`${v}%`]}
                    />
                    {MOCK_CHANNELS.map((c) => (
                      <Bar key={c.channel} dataKey={c.channel} fill={c.color} fillOpacity={0.85} radius={[3, 3, 0, 0]} barSize={14} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {(tab === "First Touch" || tab === "Last Touch" || tab === "Linear" || tab === "Data-Driven") && (
        <>
          <div className="glass-card p-4">
            <p className="text-xs text-on-surface-variant font-mono">
              <span className="text-on-surface font-medium">{tab} Attribution</span> — credit distributed as shown below
            </p>
          </div>
          <SimpleChannelCards modelKey={tab as keyof typeof MOCK_MODEL_DATA} />
        </>
      )}
    </div>
  );
}
