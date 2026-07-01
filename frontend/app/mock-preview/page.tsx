"use client";

import { useState } from "react";
import { KPICard } from "@/components/kpi/kpi-card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { ChannelBreakdown } from "@/components/charts/channel-breakdown";
import { ChannelDonut } from "@/components/charts/channel-donut";
import { OrdersTable } from "@/components/dashboard/orders-table";
import { SyncDot } from "@/components/shared/sync-dot";
import { DeltaBadge } from "@/components/shared/delta-badge";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import type { DatePreset } from "@/lib/hooks";

const MOCK_DATA = {
  overview: {
    revenue: { value: 4823600, delta: 18.4, label: "Net Revenue", format: "inr" as const },
    profit: { value: 1247800, delta: 22.1, label: "Gross Profit", format: "inr" as const },
    adSpend: { value: 1085200, delta: 9.2, label: "Total Ad Spend", format: "inr" as const },
    roas: { value: 4.45, delta: 8.3, label: "Blended ROAS", format: "x" as const },
    cac: { value: 847, delta: -6.2, label: "CAC", format: "inr" as const, invertDelta: true },
    orders: { value: 1281, delta: 14.7, label: "Orders", format: "num" as const },
    aov: { value: 3766, delta: 3.1, label: "Avg Order Value", format: "inr" as const },
    mer: { value: 1.15, delta: 12.4, label: "MER", format: "x" as const },
  },
  revenueChart: [
    { date: "May 1", revenue: 98000, spend: 22000 },
    { date: "May 3", revenue: 121000, spend: 28000 },
    { date: "May 5", revenue: 89000, spend: 19000 },
    { date: "May 7", revenue: 155000, spend: 34000 },
    { date: "May 9", revenue: 178000, spend: 39000 },
    { date: "May 11", revenue: 134000, spend: 31000 },
    { date: "May 13", revenue: 201000, spend: 44000 },
    { date: "May 15", revenue: 188000, spend: 41000 },
    { date: "May 17", revenue: 215000, spend: 48000 },
    { date: "May 19", revenue: 167000, spend: 37000 },
    { date: "May 21", revenue: 243000, spend: 53000 },
    { date: "May 23", revenue: 229000, spend: 49000 },
    { date: "May 25", revenue: 198000, spend: 43000 },
    { date: "May 27", revenue: 261000, spend: 57000 },
    { date: "May 29", revenue: 247000, spend: 51000 },
  ],
  channelSplit: [
    { name: "Meta Ads", spend: 652000, roas: 4.82, color: "#1877F2" },
    { name: "Google Ads", spend: 433200, roas: 3.91, color: "#3B9EFF" },
  ],
  orders: [
    { id: "#5891", customer: "Priya M.", amount: 4299, status: "fulfilled" as const, channel: "Meta", time: "2m ago" },
    { id: "#5890", customer: "Rahul K.", amount: 2199, status: "pending" as const, channel: "Google", time: "8m ago" },
    { id: "#5889", customer: "Aisha S.", amount: 7499, status: "fulfilled" as const, channel: "Meta", time: "14m ago" },
    { id: "#5888", customer: "Dev P.", amount: 1899, status: "fulfilled" as const, channel: "Direct", time: "22m ago" },
    { id: "#5887", customer: "Sneha R.", amount: 5299, status: "refunded" as const, channel: "Google", time: "35m ago" },
    { id: "#5886", customer: "Aman T.", amount: 3149, status: "fulfilled" as const, channel: "Meta", time: "51m ago" },
    { id: "#5885", customer: "Kavya N.", amount: 8999, status: "fulfilled" as const, channel: "Google", time: "1h ago" },
  ],
};

export default function MockPreviewPage() {
  const [dateRange, setDateRange] = useState<DatePreset>("Last 30 Days");
  const kpis = Object.entries(MOCK_DATA.overview);

  return (
    <div className="min-h-screen bg-[#0A0C0F] p-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00E5A0] to-[#00B87D] flex items-center justify-center text-[#0A0C0F] text-base font-bold">G</div>
          <h1 className="font-syne text-lg font-bold text-[#F0F4FF]">GrowthOS Preview</h1>
          <span className="rounded px-2 py-0.5 text-xs font-mono font-medium bg-[rgba(0,229,160,0.08)] text-[#00E5A0]">Mock Data</span>
        </div>
        <DateRangeFilter selected={dateRange} onChange={setDateRange} />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-3 gap-3.5 mb-6">
        {kpis.slice(0, 6).map(([key, m], i) => (
          <KPICard
            key={key}
            label={m.label}
            value={m.value}
            delta={m.delta}
            format={m.format}
            invertDelta={(m as any).invertDelta}
            animClass={`fade-up-${i + 1}`}
          />
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-[#1E2737] bg-[#0F1217] p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-syne text-sm font-bold text-[#F0F4FF]">Revenue vs Ad Spend</h3>
            <p className="text-[11px] text-[#48566E] font-mono mt-0.5">Daily breakdown · Last 30 days</p>
          </div>
        </div>
        <RevenueChart data={MOCK_DATA.revenueChart} height={200} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-[360px_1fr] gap-3.5">
        <div className="rounded-xl border border-[#1E2737] bg-[#0F1217] p-5">
          <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-1">Channel Performance</h3>
          <p className="text-[11px] text-[#48566E] font-mono mb-4">Spend allocation + ROAS by channel</p>
          <div className="flex justify-center mb-4"><ChannelDonut channels={MOCK_DATA.channelSplit} /></div>
          <ChannelBreakdown channels={MOCK_DATA.channelSplit} />
        </div>

        <div className="rounded-xl border border-[#1E2737] bg-[#0F1217] pt-5 pb-2">
          <div className="flex justify-between items-center px-5 pb-3">
            <div>
              <h3 className="font-syne text-sm font-bold text-[#F0F4FF]">Live Orders</h3>
              <p className="flex items-center gap-1.5 mt-1">
                <SyncDot status="active" />
                <span className="text-[11px] text-[#48566E] font-mono">Updating in real-time</span>
              </p>
            </div>
            <span className="rounded px-2 py-0.5 text-xs font-mono font-medium bg-[rgba(0,229,160,0.08)] text-[#00E5A0]">1,281 today</span>
          </div>
          <OrdersTable orders={MOCK_DATA.orders} />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-[#1E2737] flex justify-between items-center">
        <div className="flex items-center gap-4">
          <SyncDot status="active" />
          <span className="text-[11px] text-[#48566E] font-mono">All integrations synced</span>
          <span className="text-[11px] text-[#48566E] font-mono">Last sync: 2 min ago</span>
        </div>
        <DeltaBadge delta={18.4} />
      </div>
    </div>
  );
}
