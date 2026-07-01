"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { AppIcon } from "@/components/shared/app-icon";

const ICON = ({ name, size = 20, fill = 1 }: { name: string; size?: number; fill?: number }) => (
  <AppIcon name={name} size={size} strokeWidth={fill ? 2.15 : 1.8} />
);

type Channel = {
  name: string;
  current: number;
  recommended: number;
  projectedRoas: number;
};

const BASE_CHANNELS: Channel[] = [
  { name: "Meta Ads",        current: 800000,  recommended: 1000000, projectedRoas: 5.84 },
  { name: "Google Shopping", current: 600000,  recommended: 650000,  projectedRoas: 4.92 },
  { name: "Google Search",   current: 350000,  recommended: 380000,  projectedRoas: 6.21 },
  { name: "Google Display",  current: 450000,  recommended: 170000,  projectedRoas: 1.84 },
];

const TOTAL_BASE = BASE_CHANNELS.reduce((s, c) => s + c.current, 0);

const AI_INSIGHTS = [
  { icon: "trending_up",   text: "Meta performing 23% above average", cls: "badge-success" },
  { icon: "trending_down", text: "Google Display underperforming",     cls: "badge-error" },
  { icon: "schedule",      text: "Weekend ROAS 2.1x weekday",          cls: "badge-info" },
];

function fmt(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v.toFixed(0)}`;
}

export function BudgetOptimizerPage() {
  const [totalBudget, setTotalBudget] = useState(TOTAL_BASE);
  const [applied, setApplied] = useState(false);

  useQuery({
    queryKey: ["budget-optimizer"],
    queryFn: () => api.get("/budget/optimizer"),
    enabled: false,
  });

  const ratio = totalBudget / TOTAL_BASE;
  const channels: Channel[] = BASE_CHANNELS.map(c => ({
    ...c,
    current: Math.round(c.current * ratio),
    recommended: Math.round(c.recommended * ratio),
  }));

  const projectedRevenue = channels.reduce((s, c) => s + c.recommended * c.projectedRoas, 0);

  return (
    <div className="p-4 lg:p-7 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-on-surface">AI Budget Optimizer</h2>
          <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">AI-powered budget allocation recommendations</p>
        </div>
        <span className="badge-info text-[10px] px-2 py-0.5 flex items-center gap-1">
          <ICON name="science" size={12} /> Demo Data
        </span>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">

        {/* Left Panel */}
        <div className="flex flex-col gap-5">
          {/* Allocation Table */}
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-outline-variant">
              <h3 className="text-sm font-bold text-on-surface">Current vs Recommended Allocation</h3>
              <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">Based on last 30 days performance data</p>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[540px]">
                <div className="grid grid-cols-[2fr_1fr_1fr_0.8fr_1fr] px-5 py-3 border-b border-outline-variant gap-3">
                  {["Channel", "Current Budget", "Recommended", "Change", "Proj. ROAS"].map(h => (
                    <span key={h} className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">{h}</span>
                  ))}
                </div>
                {channels.map((c, i) => {
                  const delta = c.recommended - c.current;
                  const pctChange = ((delta / c.current) * 100).toFixed(1);
                  const up = delta > 0;
                  const neutral = delta === 0;
                  return (
                    <div key={i} className="grid grid-cols-[2fr_1fr_1fr_0.8fr_1fr] px-5 py-4 gap-3 hover:bg-surface-container-high/30 transition-colors border-b border-outline-variant last:border-0">
                      <span className="text-xs text-on-surface font-medium">{c.name}</span>
                      <span className="font-mono text-xs text-on-surface-variant">{fmt(c.current)}</span>
                      <span className="font-mono text-xs text-on-surface">{fmt(c.recommended)}</span>
                      <div className="flex items-center gap-1">
                        {!neutral && (
                          <ICON
                            name={up ? "arrow_upward" : "arrow_downward"}
                            size={14}
                            fill={1}
                          />
                        )}
                        <span className={`font-mono text-xs ${neutral ? "text-on-surface-variant" : up ? "text-success-accent" : "text-error"}`}>
                          {neutral ? "—" : `${up ? "+" : ""}${pctChange}%`}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-primary">{c.projectedRoas.toFixed(2)}x</span>
                    </div>
                  );
                })}
                {/* Totals row */}
                <div className="grid grid-cols-[2fr_1fr_1fr_0.8fr_1fr] px-5 py-3 gap-3 bg-surface-container-high/20">
                  <span className="text-xs font-bold text-on-surface">Total</span>
                  <span className="font-mono text-xs font-bold text-on-surface">{fmt(channels.reduce((s, c) => s + c.current, 0))}</span>
                  <span className="font-mono text-xs font-bold text-on-surface">{fmt(channels.reduce((s, c) => s + c.recommended, 0))}</span>
                  <span />
                  <span className="font-mono text-xs text-success-accent">~{fmt(projectedRevenue)} rev</span>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-outline-variant">
              <button
                onClick={() => setApplied(true)}
                className="primary-gradient px-5 py-2.5 rounded-lg text-sm font-medium text-white flex items-center gap-2 transition-opacity hover:opacity-90"
              >
                <ICON name={applied ? "check_circle" : "auto_fix_high"} size={16} />
                {applied ? "Recommendations Applied" : "Apply Recommendations"}
              </button>
            </div>
          </div>

          {/* Scenario Simulator */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
              <ICON name="tune" size={16} fill={0} />
              Scenario Simulator
            </h3>
            <p className="text-[11px] text-on-surface-variant font-mono mb-4">Adjust total budget to recompute allocation proportionally</p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-mono">Total Budget</span>
                <span className="font-mono text-sm text-primary font-medium">{fmt(totalBudget)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={5000000}
                step={50000}
                value={totalBudget}
                onChange={e => setTotalBudget(Number(e.target.value))}
                className="w-full accent-primary h-1.5 rounded"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
                <span>₹0</span>
                <span>₹25L</span>
                <span>₹50L</span>
              </div>
              {/* Mini allocation preview */}
              <div className="flex flex-col gap-2 mt-1">
                {channels.map(c => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-[10px] text-on-surface-variant font-mono w-32 flex-shrink-0">{c.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-surface-container-high">
                      <div
                        className="h-1.5 rounded-full bg-primary/70"
                        style={{ width: `${Math.min(100, (c.recommended / Math.max(...channels.map(x => x.recommended))) * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-on-surface w-16 text-right">{fmt(c.recommended)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col gap-4">
          <div className="glass-card-high p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <ICON name="auto_awesome" size={18} />
              <h3 className="text-sm font-bold text-on-surface">AI Analysis</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Based on your last 30 days performance, <span className="text-on-surface font-medium">Meta Ads</span> shows{" "}
              <span className="text-success-accent font-mono">23% higher ROAS efficiency</span>. Reallocating{" "}
              <span className="text-primary font-mono">₹2.5L</span> from Google Display to Meta would generate an estimated{" "}
              <span className="text-success-accent font-mono">₹3.2L additional revenue</span>.
            </p>
            <div className="flex flex-col gap-2">
              {AI_INSIGHTS.map((ins, i) => (
                <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-mono ${ins.cls}`}>
                  <ICON name={ins.icon} size={14} />
                  {ins.text}
                </div>
              ))}
            </div>
            <button className="w-full py-2.5 rounded-lg border border-primary/25 text-primary text-sm font-mono hover:bg-primary/10 transition-colors flex items-center justify-center gap-2">
              <ICON name="refresh" size={16} fill={0} />
              Generate New Analysis
            </button>
          </div>

          {/* Projected Impact */}
          <div className="glass-card p-5 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-on-surface">Projected Impact</h3>
            <div className="flex flex-col gap-2">
              {[
                { label: "Projected Revenue",   value: fmt(projectedRevenue),                   color: "text-success-accent" },
                { label: "Projected Blended ROAS", value: `${(projectedRevenue / totalBudget || 0).toFixed(2)}x`, color: "text-primary" },
                { label: "Budget Utilisation",  value: "100%",                                  color: "text-on-surface" },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
                  <span className="text-[11px] text-on-surface-variant font-mono">{m.label}</span>
                  <span className={`font-mono text-sm font-medium ${m.color}`}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
