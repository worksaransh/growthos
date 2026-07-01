"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface SimpleBarChartProps {
  data: Array<{ label: string; value: number; color?: string }>
  height?: number
  valuePrefix?: string
  valueSuffix?: string
  color?: string
}

export function SimpleBarChart({ data, height = 220, valuePrefix = "", valueSuffix = "", color = "#c0c1ff" }: SimpleBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#c7c4d7", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#c7c4d7", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "#171f33", border: "1px solid #464554", borderRadius: 12, color: "#dbe2fd" }}
          formatter={(v: number) => [valuePrefix + v.toLocaleString("en-IN") + valueSuffix]}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color || color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
