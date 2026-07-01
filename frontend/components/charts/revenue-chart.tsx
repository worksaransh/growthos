"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

interface DataPoint {
  date: string;
  revenue: number;
  spend: number;
  profit?: number;
}

interface RevenueChartProps {
  data: DataPoint[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-[#1E2737] bg-[#0F1217] p-3 shadow-xl">
      <div className="text-xs text-[#48566E] font-mono mb-2">{label}</div>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs font-mono">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-[#8A95B0]">{entry.name}:</span>
          <span className="text-[#F0F4FF]">
            ₹{entry.value.toLocaleString("en-IN")}
          </span>
        </div>
      ))}
    </div>
  );
};

export function RevenueChart({ data, height = 300 }: RevenueChartProps) {
  const [view, setView] = useState<"revenue" | "spend" | "both">("both");

  const chartData = useMemo(() => {
    if (view === "revenue") {
      return data.map((d) => ({ date: d.date, Revenue: d.revenue }));
    }
    if (view === "spend") {
      return data.map((d) => ({ date: d.date, Spend: d.spend }));
    }
    return data.map((d) => ({
      date: d.date,
      Revenue: d.revenue,
      Spend: d.spend,
      Profit: d.revenue - d.spend,
    }));
  }, [data, view]);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(["revenue", "spend", "both"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
              view === v
                ? "bg-[rgba(0,229,160,0.08)] border border-[rgba(0,229,160,0.25)] text-[#00E5A0]"
                : "bg-[#151921] border border-[#1E2737] text-[#8A95B0]"
            }`}
          >
            {v === "both" ? "All" : v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1E2737"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "#48566E", fontSize: 10, fontFamily: "'DM Mono', monospace" }}
            tickLine={false}
            axisLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fill: "#48566E", fontSize: 10, fontFamily: "'DM Mono', monospace" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />

          {view !== "spend" && (
            <Bar
              dataKey="Revenue"
              fill="rgba(0,229,160,0.15)"
              stroke="#00E5A0"
              strokeWidth={1}
              radius={[3, 3, 0, 0]}
              barSize={12}
            />
          )}

          {view !== "revenue" && (
            <Bar
              dataKey="Spend"
              fill="rgba(59,158,255,0.15)"
              stroke="#3B9EFF"
              strokeWidth={1}
              radius={[3, 3, 0, 0]}
              barSize={12}
            />
          )}

          {view === "both" && (
            <Line
              type="monotone"
              dataKey="Profit"
              stroke="#00E5A0"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 3"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      <div className="flex gap-5 mt-3 ml-12">
        {view !== "spend" && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-[#00E5A0] rounded" />
            <span className="text-[11px] text-[#8A95B0] font-mono">Net Revenue</span>
          </div>
        )}
        {view !== "revenue" && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-[#3B9EFF] rounded" />
            <span className="text-[11px] text-[#8A95B0] font-mono">Ad Spend</span>
          </div>
        )}
        {view === "both" && (
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-0.5"
              style={{
                background: "repeating-linear-gradient(90deg, #00E5A0 0, #00E5A0 4px, transparent 4px, transparent 7px)",
              }}
            />
            <span className="text-[11px] text-[#8A95B0] font-mono">Gross Profit</span>
          </div>
        )}
      </div>
    </div>
  );
}
