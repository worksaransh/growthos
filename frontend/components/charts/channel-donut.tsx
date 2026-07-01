"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface ChannelData {
  name: string;
  spend: number;
  roas: number;
  color: string;
}

interface ChannelDonutProps {
  channels: ChannelData[];
  size?: number;
}

export function ChannelDonut({ channels, size = 120 }: ChannelDonutProps) {
  const total = channels.reduce((s, c) => s + c.spend, 0);
  const data = channels.map((c) => ({ name: c.name, value: c.spend, color: c.color }));
  const totalLabel = "₹" + (total / 100000).toFixed(1) + "L";

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.3}
            outerRadius={size * 0.46}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="transparent" fillOpacity={0.8} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#0F1217", border: "1px solid #1E2737", borderRadius: 8, fontSize: 11 }}
            formatter={(v: number) => ["₹" + (v / 100000).toFixed(1) + "L"]}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Centre label */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            fontWeight: 500,
            color: "#F0F4FF",
          }}
        >
          {totalLabel}
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8,
            color: "#48566E",
            marginTop: 1,
          }}
        >
          total
        </span>
      </div>
    </div>
  );
}
