"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { AppIcon } from "@/components/shared/app-icon";
import { api } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/empty-state";

const HORIZONS = ["30 Days", "60 Days", "90 Days", "180 Days"];

const MOCK_FORECASTS: Record<string, any> = {
  "30 Days": {
    expected: 5420000, best: 6180000, worst: 4820000, confidence: 84,
    profit_expected: 812000, profit_best: 980000, profit_worst: 648000,
    chart: [
      { date: "Jun 29", actual: 4823600, expected: null, upper: null, lower: null },
      { date: "Jul 5", actual: null, expected: 5100000, upper: 5480000, lower: 4720000 },
      { date: "Jul 10", actual: null, expected: 5240000, upper: 5680000, lower: 4800000 },
      { date: "Jul 15", actual: null, expected: 5380000, upper: 5820000, lower: 4940000 },
      { date: "Jul 20", actual: null, expected: 5420000, upper: 6180000, lower: 4820000 },
      { date: "Jul 25", actual: null, expected: 5350000, upper: 6050000, lower: 4760000 },
      { date: "Jul 30", actual: null, expected: 5420000, upper: 6180000, lower: 4820000 },
    ],
  },
  "60 Days": {
    expected: 10840000, best: 12800000, worst: 9200000, confidence: 74,
    profit_expected: 1628000, profit_best: 2100000, profit_worst: 1280000,
    chart: [
      { date: "Jun", actual: 4823600, expected: null, upper: null, lower: null },
      { date: "Jul", actual: null, expected: 5420000, upper: 6180000, lower: 4820000 },
      { date: "Aug 15", actual: null, expected: 5040000, upper: 6200000, lower: 4300000 },
      { date: "Aug 30", actual: null, expected: 10840000, upper: 12800000, lower: 9200000 },
    ],
  },
  "90 Days": {
    expected: 16200000, best: 19800000, worst: 13200000, confidence: 64,
    profit_expected: 2430000, profit_best: 3280000, profit_worst: 1820000,
    chart: [
      { date: "Jun", actual: 4823600, expected: null, upper: null, lower: null },
      { date: "Jul", actual: null, expected: 5420000, upper: 6900000, lower: 4700000 },
      { date: "Aug", actual: null, expected: 5380000, upper: 6800000, lower: 4500000 },
      { date: "Sep", actual: null, expected: 5402000, upper: 6800000, lower: 4000000 },
    ],
  },
  "180 Days": {
    expected: 32000000, best: 41000000, worst: 24000000, confidence: 52,
    profit_expected: 4800000, profit_best: 7200000, profit_worst: 3100000,
    chart: [
      { date: "Jun", actual: 4823600, expected: null, upper: null, lower: null },
      { date: "Jul", actual: null, expected: 5420000, upper: 7200000, lower: 4500000 },
      { date: "Aug", actual: null, expected: 5380000, upper: 7100000, lower: 4200000 },
      { date: "Oct", actual: null, expected: 6800000, upper: 8900000, lower: 5200000 },
      { date: "Nov", actual: null, expected: 8400000, upper: 11000000, lower: 6400000 },
      { date: "Dec", actual: null, expected: 5400000, upper: 6800000, lower: 3700000 },
    ],
  },
};

function fmt(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v.toFixed(0)}`;
}

function ConfidenceBar({ score }: { score: number }) {
  const color = score >= 80 ? "#00E5A0" : score >= 60 ? "#FFAD3B" : "#FF5B6B";
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1.5 rounded-full bg-[#1E2737]">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="font-mono text-[10px]" style={{ color }}>{score}% conf.</span>
    </div>
  );
}

export function ForecastPage() {
  const [horizon, setHorizon] = useState("30 Days");
  const { toast } = useToast();

  useQuery({
    queryKey: ["forecast"],
    queryFn: () => api.getForecast(),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.generateForecast(),
    onSuccess: () => toast({ type: "success", title: "Forecast generated", message: "Your forecast model has been refreshed." }),
    onError: (err: any) => toast({ type: "error", title: "Failed to generate forecast", message: err.message }),
  });

  const f = MOCK_FORECASTS[horizon];

  const hasData = true // Switch to false to see empty state; will be driven by API later

  if (!hasData) return (
    <div className="p-4 lg:p-7 flex items-center justify-center min-h-96">
      <EmptyState icon="query_stats" title="Not enough data yet" description="Forecast requires at least 30 days of order history. Check back soon." />
    </div>
  )

  return (
    <div className="p-7 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {HORIZONS.map(h => (
            <button key={h} onClick={() => setHorizon(h)}
              className={`px-4 py-1.5 rounded-lg text-sm font-mono transition-all ${horizon === h ? "bg-[rgba(0,229,160,0.1)] text-[#00E5A0] border border-[#00E5A0]" : "text-[#8A95B0] hover:text-[#F0F4FF] border border-[#1E2737]"}`}>
              {h}
            </button>
          ))}
        </div>
        <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
          {generateMutation.isPending ? "Generating…" : "↻ Regenerate Forecast"}
        </Button>
      </div>

      {/* Revenue Forecast Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="p-5" style={{ borderColor: "rgba(0,229,160,0.2)" }}>
          <div className="text-[10px] text-[#00E5A0] font-mono uppercase tracking-wider mb-2">Expected Revenue</div>
          <div className="font-mono text-2xl text-[#F0F4FF] font-medium">{fmt(f.expected)}</div>
          <ConfidenceBar score={f.confidence} />
        </Card>
        <Card className="p-5" style={{ borderColor: "rgba(59,158,255,0.2)" }}>
          <div className="text-[10px] text-[#3B9EFF] font-mono uppercase tracking-wider mb-2">Best Case</div>
          <div className="font-mono text-2xl text-[#F0F4FF] font-medium">{fmt(f.best)}</div>
          <div className="text-[11px] text-[#48566E] mt-2">+{(((f.best - f.expected) / f.expected) * 100).toFixed(0)}% above expected</div>
        </Card>
        <Card className="p-5" style={{ borderColor: "rgba(255,91,107,0.2)" }}>
          <div className="text-[10px] text-[#FF5B6B] font-mono uppercase tracking-wider mb-2">Worst Case</div>
          <div className="font-mono text-2xl text-[#F0F4FF] font-medium">{fmt(f.worst)}</div>
          <div className="text-[11px] text-[#48566E] mt-2">−{(((f.expected - f.worst) / f.expected) * 100).toFixed(0)}% below expected</div>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="p-5">
        <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-1">Revenue Forecast</h3>
        <p className="text-[11px] text-[#48566E] font-mono mb-4">Historical + {horizon} projection with confidence band</p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={f.chart} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="upperGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B9EFF" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3B9EFF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expectedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00E5A0" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#00E5A0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2737" />
            <XAxis dataKey="date" tick={{ fill: "#48566E", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#48566E", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
            <Tooltip contentStyle={{ background: "#0F1217", border: "1px solid #1E2737", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => v != null ? fmt(v) : "–"} />
            <Area type="monotone" dataKey="upper" name="Best Case" stroke="#3B9EFF" strokeWidth={1} strokeDasharray="4 4" fill="url(#upperGrad)" connectNulls />
            <Area type="monotone" dataKey="expected" name="Expected" stroke="#00E5A0" strokeWidth={2} fill="url(#expectedGrad)" connectNulls />
            <Area type="monotone" dataKey="lower" name="Worst Case" stroke="#FF5B6B" strokeWidth={1} strokeDasharray="4 4" fill="transparent" connectNulls />
            <Area type="monotone" dataKey="actual" name="Actual" stroke="#F0F4FF" strokeWidth={2.5} fill="transparent" connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Profit Forecast + Inventory Alert */}
      <div className="grid grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-4">Profit Forecast</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: "Expected", value: f.profit_expected, color: "#00E5A0" },
              { label: "Best Case", value: f.profit_best, color: "#3B9EFF" },
              { label: "Worst Case", value: f.profit_worst, color: "#FF5B6B" },
            ].map((p, i) => (
              <div key={i} className="p-3 rounded-xl bg-[#151921] border border-[#1E2737]">
                <div className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: p.color }}>{p.label}</div>
                <div className="font-mono text-sm text-[#F0F4FF] font-medium">{fmt(p.value)}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-[#151921]">
            <div className="text-[10px] text-[#48566E] font-mono mb-1">Model basis</div>
            <div className="text-xs text-[#8A95B0]">Based on last 90 days of revenue patterns, seasonal adjustments, and current ad spend trajectory.</div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-1">Inventory Alert</h3>
          <p className="text-[11px] text-[#48566E] font-mono mb-4">Products at risk of stocking out during forecast period</p>
          <div className="flex flex-col gap-2.5">
            {[
              { product: "Cargo Pants — Olive", days_left: 12, severity: "critical" },
              { product: "Denim Jacket — Washed", days_left: 19, severity: "warning" },
              { product: "Oversized Hoodie (L)", days_left: 24, severity: "warning" },
            ].map((alert, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${alert.severity === "critical" ? "bg-[rgba(255,91,107,0.05)] border-[rgba(255,91,107,0.2)]" : "bg-[rgba(255,173,59,0.05)] border-[rgba(255,173,59,0.2)]"}`}>
                <div>
                  <div className="text-xs text-[#F0F4FF]">{alert.product}</div>
                  <div className="text-[10px] text-[#48566E] font-mono mt-0.5">~{alert.days_left} days of stock remaining</div>
                </div>
                <span className={`text-[10px] font-mono ${alert.severity === "critical" ? "text-[#FF5B6B]" : "text-[#FFAD3B]"}`}>
                  <span className="inline-flex items-center gap-1">
                    <AppIcon name="alert" size={12} />
                    {alert.severity === "critical" ? "Critical" : "Warning"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
