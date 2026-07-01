"use client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

interface MultiLineChartProps {
  data: Array<Record<string, any>>
  lines: Array<{ key: string; color: string; name: string; dashed?: boolean }>
  xKey?: string
  height?: number
  referenceValue?: number
}

export function MultiLineChart({ data, lines, xKey = "date", height = 280, referenceValue }: MultiLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey={xKey} tick={{ fill: "#c7c4d7", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#c7c4d7", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "#171f33", border: "1px solid #464554", borderRadius: 12, color: "#dbe2fd" }} />
        {referenceValue && <ReferenceLine y={referenceValue} stroke="#fb923c" strokeDasharray="4 4" strokeWidth={1} />}
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2}
            strokeDasharray={l.dashed ? "5 5" : undefined} dot={false} activeDot={{ r: 4, fill: l.color }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
