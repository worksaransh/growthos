"use client"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface DonutChartProps {
  data: Array<{ name: string; value: number; color: string }>
  height?: number
  innerRadius?: number
  outerRadius?: number
}

export function DonutChart({ data, height = 240, innerRadius = 60, outerRadius = 100 }: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={3} dataKey="value">
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#171f33", border: "1px solid #464554", borderRadius: 12, color: "#dbe2fd" }}
          formatter={(v: number) => [v.toLocaleString("en-IN")]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#c7c4d7" }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
