"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/empty-state";

const MOCK_SEGMENTS = {
  vip: { count: 124, total_value: 8924000, avg_ltv: 71968, color: "#00E5A0" },
  loyal: { count: 387, total_value: 12841000, avg_ltv: 33183, color: "#3B9EFF" },
  one_time: { count: 892, total_value: 4128000, avg_ltv: 4629, color: "#FFAD3B" },
  dormant: { count: 341, total_value: 2841000, avg_ltv: 8331, color: "#8A95B0" },
  at_risk: { count: 218, total_value: 3124000, avg_ltv: 14330, color: "#FF5B6B" },
};

const MOCK_CUSTOMERS = [
  { name: "Priya Mehta", orders: 18, ltv: 128400, last_purchase: "2 days ago", segment: "vip", location: "Mumbai" },
  { name: "Rahul Sharma", orders: 14, ltv: 94200, last_purchase: "5 days ago", segment: "vip", location: "Delhi" },
  { name: "Aisha Khan", orders: 12, ltv: 78800, last_purchase: "1 week ago", segment: "vip", location: "Bangalore" },
  { name: "Dev Patel", orders: 9, ltv: 52400, last_purchase: "3 days ago", segment: "loyal", location: "Ahmedabad" },
  { name: "Sneha Reddy", orders: 8, ltv: 48900, last_purchase: "10 days ago", segment: "loyal", location: "Hyderabad" },
  { name: "Aman Tyagi", orders: 7, ltv: 41200, last_purchase: "2 weeks ago", segment: "loyal", location: "Pune" },
  { name: "Kavya Nair", orders: 6, ltv: 38800, last_purchase: "3 days ago", segment: "loyal", location: "Chennai" },
  { name: "Rohan Gupta", orders: 1, ltv: 4299, last_purchase: "1 month ago", segment: "one_time", location: "Kolkata" },
];

const MOCK_LTV_DISTRIBUTION = [
  { bucket: "₹0-5K", count: 892 },
  { bucket: "₹5-15K", count: 387 },
  { bucket: "₹15-30K", count: 218 },
  { bucket: "₹30-50K", count: 141 },
  { bucket: "₹50-75K", count: 87 },
  { bucket: "₹75K+", count: 124 },
];

function fmt(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v.toFixed(0)}`;
}

const SEGMENT_LABELS: Record<string, string> = {
  vip: "VIP", loyal: "Loyal", one_time: "One-Time", dormant: "Dormant", at_risk: "At-Risk"
};
const SEGMENT_COLORS: Record<string, string> = {
  vip: "#00E5A0", loyal: "#3B9EFF", one_time: "#FFAD3B", dormant: "#8A95B0", at_risk: "#FF5B6B"
};

export function CustomersPage() {
  const { data: segments } = useQuery({
    queryKey: ["customers", "segments"],
    queryFn: () => api.getCustomerSegments(),
  });

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.getCustomers({ limit: 50 }),
  });

  const seg = segments || MOCK_SEGMENTS;
  const allCustomers = customers && customers.length > 0 ? customers : MOCK_CUSTOMERS;

  const totalCustomers = Object.values(seg).reduce((acc: number, s: any) => acc + s.count, 0);
  const totalValue = Object.values(seg).reduce((acc: number, s: any) => acc + s.total_value, 0);
  const avgLtv = totalCustomers > 0 ? totalValue / totalCustomers : 0;
  const repeatRate = totalCustomers > 0
    ? (((seg.loyal?.count ?? 0) + (seg.vip?.count ?? 0)) / totalCustomers * 100).toFixed(1)
    : "0";

  if (isLoading) return (
    <div className="p-7 animate-pulse flex flex-col gap-4">
      <div className="grid grid-cols-5 gap-3">
        {Array(5).fill(0).map((_, i) => <div key={i} className="h-24 rounded-xl bg-[#0F1217] border border-[#1E2737]" />)}
      </div>
    </div>
  );

  const hasData = true // Switch to false to see empty state; will be driven by API later

  if (!hasData) return (
    <div className="p-4 lg:p-7 flex items-center justify-center min-h-96">
      <EmptyState icon="group" title="No customers yet" description="Connect your Shopify store to import customer data automatically." />
    </div>
  )

  return (
    <div className="p-7 flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="text-[10px] text-[#48566E] font-mono uppercase tracking-wider mb-2">Repeat Rate</div>
          <div className="font-mono text-[22px] text-[#00E5A0] font-medium">{repeatRate}%</div>
          <div className="text-[11px] text-[#48566E] mt-1">Industry avg: 28%</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-[#48566E] font-mono uppercase tracking-wider mb-2">Avg. LTV</div>
          <div className="font-mono text-[22px] text-[#F0F4FF] font-medium">{fmt(avgLtv)}</div>
          <div className="text-[11px] text-[#48566E] mt-1">Lifetime value</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] text-[#48566E] font-mono uppercase tracking-wider mb-2">Avg. Order Value</div>
          <div className="font-mono text-[22px] text-[#3B9EFF] font-medium">₹3,766</div>
          <div className="text-[11px] text-[#48566E] mt-1">Last 30 days</div>
        </Card>
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-5 gap-3">
        {Object.entries(seg).map(([key, data]: [string, any]) => (
          <Card key={key} className="p-4" style={{ borderColor: `${SEGMENT_COLORS[key]}30` }}>
            <div className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: SEGMENT_COLORS[key] }}>{SEGMENT_LABELS[key]}</div>
            <div className="font-mono text-[22px] text-[#F0F4FF] font-medium">{data.count.toLocaleString()}</div>
            <div className="text-[11px] text-[#48566E] mt-1">{fmt(data.total_value)} total</div>
            <div className="text-[10px] font-mono mt-0.5" style={{ color: SEGMENT_COLORS[key] }}>{fmt(data.avg_ltv)} avg LTV</div>
          </Card>
        ))}
      </div>

      {/* LTV Chart + Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        <Card className="p-5">
          <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-1">LTV Distribution</h3>
          <p className="text-[11px] text-[#48566E] font-mono mb-4">Customers by lifetime value bucket</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MOCK_LTV_DISTRIBUTION} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2737" />
              <XAxis dataKey="bucket" tick={{ fill: "#48566E", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#48566E", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0F1217", border: "1px solid #1E2737", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" name="Customers" fill="#3B9EFF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto"><div className="min-w-[600px]">
          <div className="grid grid-cols-[2fr_0.8fr_1fr_1.2fr_1fr_1fr] px-5 py-3 border-b border-[#1E2737] gap-3">
            {["Customer", "Orders", "LTV", "Last Purchase", "Segment", "Location"].map(h => (
              <span key={h} className="text-[10px] text-[#48566E] font-mono uppercase tracking-wider">{h}</span>
            ))}
          </div>
          {allCustomers.map((c: any, i: number) => (
            <div key={i} className="grid grid-cols-[2fr_0.8fr_1fr_1.2fr_1fr_1fr] px-5 py-3 gap-3 hover:bg-[#151921] transition-colors border-b border-[#1E2737] last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#1C2230] border border-[#1E2737] flex items-center justify-center text-[10px] text-[#8A95B0]">
                  {c.name?.[0] || "?"}
                </div>
                <span className="text-xs text-[#F0F4FF]">{c.name}</span>
              </div>
              <span className="font-mono text-xs text-[#8A95B0]">{c.orders}</span>
              <span className="font-mono text-xs text-[#F0F4FF]">{fmt(c.ltv)}</span>
              <span className="font-mono text-xs text-[#48566E]">{c.last_purchase}</span>
              <span className="font-mono text-[10px]" style={{ color: SEGMENT_COLORS[c.segment] || "#8A95B0" }}>
                {SEGMENT_LABELS[c.segment] || c.segment}
              </span>
              <span className="text-xs text-[#48566E]">{c.location}</span>
            </div>
          ))}
          </div></div>
        </Card>
      </div>
    </div>
  );
}
