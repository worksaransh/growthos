"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";

const MOCK_SUMMARY = {
  net_revenue: 4823600,
  gross_profit: 1928540,
  net_profit: 723200,
  contribution_margin: 18.4,
  roas: 4.45,
  cogs: 2895060,
  ad_spend: 1085200,
  shipping: 89400,
  packaging: 41200,
  gateway_fees: 86824,
  taxes: 216180,
};

const MOCK_CONFIG = {
  cogs_pct: 60,
  shipping_cost: 89,
  packaging_cost: 42,
  gateway_fee_pct: 1.8,
  tax_pct: 4.5,
};

const MOCK_BY_CHANNEL = [
  { channel: "Meta Ads", revenue: 2652000, ad_spend: 652000, profit: 398000 },
  { channel: "Google Ads", revenue: 1692000, ad_spend: 433200, profit: 261000 },
  { channel: "Direct", revenue: 479600, ad_spend: 0, profit: 243000 },
];

const MOCK_BY_PRODUCT = [
  { name: "Classic Fit Tee — Pack of 3", revenue: 892400, orders: 412, margin: 34.2 },
  { name: "Oversized Hoodie", revenue: 741200, orders: 287, margin: 41.8 },
  { name: "Cargo Pants — Olive", revenue: 612800, orders: 198, margin: 38.1 },
  { name: "Linen Shirt — White", revenue: 489200, orders: 231, margin: 29.7 },
  { name: "Jogger Set — Navy", revenue: 421600, orders: 189, margin: 33.4 },
  { name: "Polo Tee — 5 Colors", revenue: 398400, orders: 312, margin: 27.9 },
  { name: "Chino Shorts", revenue: 321200, orders: 164, margin: 36.2 },
  { name: "Tracksuit — Charcoal", revenue: 298800, orders: 121, margin: 44.1 },
];

function fmt(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v.toFixed(0)}`;
}

function KPI({ label, value, sub, color = "#F0F4FF" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <Card className="p-4">
      <div className="text-[10px] text-[#48566E] font-mono uppercase tracking-wider mb-2">{label}</div>
      <div className="font-mono text-[22px] font-medium" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-[#48566E] mt-1">{sub}</div>}
    </Card>
  );
}

export function ProfitPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startDate = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const endDate = new Date().toISOString().slice(0, 10);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["profit", "summary"],
    queryFn: () => api.getProfitSummary(startDate, endDate),
  });

  const { data: config } = useQuery({
    queryKey: ["profit", "config"],
    queryFn: () => api.getProfitConfig(),
  });

  const { data: byProduct } = useQuery({
    queryKey: ["profit", "by-product"],
    queryFn: () => api.getProfitByProduct(startDate, endDate),
  });

  const { data: byChannel } = useQuery({
    queryKey: ["profit", "by-channel"],
    queryFn: () => api.getProfitByChannel(startDate, endDate),
  });

  const s = summary || MOCK_SUMMARY;
  const cfg = config || MOCK_CONFIG;
  const products = (byProduct && byProduct.length > 0 ? byProduct : MOCK_BY_PRODUCT).slice(0, 8);
  const channels = byChannel && byChannel.length > 0 ? byChannel : MOCK_BY_CHANNEL;

  const [cogsP, setCogsP] = useState(String(cfg.cogs_pct ?? 60));
  const [shippingC, setShippingC] = useState(String(cfg.shipping_cost ?? 89));
  const [packagingC, setPackagingC] = useState(String(cfg.packaging_cost ?? 42));
  const [gatewayP, setGatewayP] = useState(String(cfg.gateway_fee_pct ?? 1.8));
  const [taxP, setTaxP] = useState(String(cfg.tax_pct ?? 4.5));

  useEffect(() => {
    if (config) {
      setCogsP(String(config.cogs_pct ?? 60));
      setShippingC(String(config.shipping_cost ?? 89));
      setPackagingC(String(config.packaging_cost ?? 42));
      setGatewayP(String(config.gateway_fee_pct ?? 1.8));
      setTaxP(String(config.tax_pct ?? 4.5));
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: () => api.saveProfitConfig({
      cogs_pct: parseFloat(cogsP),
      shipping_cost: parseFloat(shippingC),
      packaging_cost: parseFloat(packagingC),
      gateway_fee_pct: parseFloat(gatewayP),
      tax_pct: parseFloat(taxP),
    }),
    onSuccess: () => {
      toast({ type: "success", title: "Profit config saved", message: "Your cost configuration has been updated." });
      queryClient.invalidateQueries({ queryKey: ["profit"] });
    },
    onError: (err: any) => {
      toast({ type: "error", title: "Failed to save config", message: err.message });
    },
  });

  const netRevenue = s.net_revenue ?? 0;
  const grossProfit = s.gross_profit ?? netRevenue * 0.4;
  const netProfit = s.net_profit ?? 0;
  const cogs = s.cogs ?? netRevenue * 0.6;
  const adSpend = s.ad_spend ?? 0;
  const shipping = s.shipping ?? 0;
  const packaging = s.packaging ?? 0;
  const gatewayFees = s.gateway_fees ?? 0;
  const taxes = s.taxes ?? 0;

  const plRows = [
    { label: "Net Revenue", value: netRevenue, indent: 0, color: "#F0F4FF", bold: false },
    { label: "Cost of Goods (COGS)", value: -cogs, indent: 1, color: "#FF5B6B", bold: false },
    { label: "Gross Profit", value: grossProfit, indent: 0, color: "#00E5A0", bold: true },
    { label: "Ad Spend", value: -adSpend, indent: 1, color: "#FFAD3B", bold: false },
    { label: "Shipping & Packaging", value: -(shipping + packaging), indent: 1, color: "#FFAD3B", bold: false },
    { label: "Gateway Fees", value: -gatewayFees, indent: 1, color: "#FFAD3B", bold: false },
    { label: "Taxes", value: -taxes, indent: 1, color: "#FFAD3B", bold: false },
    { label: "Net Profit", value: netProfit, indent: 0, color: "#00E5A0", bold: true },
  ];

  if (isLoading) return (
    <div className="p-7 animate-pulse">
      <div className="grid grid-cols-5 gap-3 mb-6">
        {Array(5).fill(0).map((_, i) => <div key={i} className="h-24 rounded-xl bg-[#0F1217] border border-[#1E2737]" />)}
      </div>
    </div>
  );

  return (
    <div className="p-7 flex flex-col gap-6">
      {/* KPI Row */}
      <div className="grid grid-cols-5 gap-3">
        <KPI label="Net Revenue" value={fmt(netRevenue)} sub="Last 30 days" color="#F0F4FF" />
        <KPI label="Gross Profit" value={fmt(grossProfit)} sub={`${netRevenue > 0 ? ((grossProfit / netRevenue) * 100).toFixed(1) : 0}% margin`} color="#00E5A0" />
        <KPI label="Net Profit" value={fmt(netProfit)} sub={`${netRevenue > 0 ? ((netProfit / netRevenue) * 100).toFixed(1) : 0}% margin`} color="#00E5A0" />
        <KPI label="Contribution Margin" value={`${s.contribution_margin?.toFixed(1) ?? "18.4"}%`} sub="After ad spend" color="#3B9EFF" />
        <KPI label="Blended ROAS" value={`${s.roas?.toFixed(2) ?? "4.45"}x`} sub="Across all channels" color="#FFAD3B" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        {/* P&L Waterfall */}
        <Card className="p-5">
          <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-1">P&L Breakdown</h3>
          <p className="text-[11px] text-[#48566E] font-mono mb-4">Revenue waterfall · Last 30 days</p>
          <div className="flex flex-col gap-0.5">
            {plRows.map((row, i) => (
              <div key={i} className={`flex items-center justify-between py-2.5 ${row.indent ? "px-5" : "px-3"} rounded-lg ${row.bold ? "bg-[#151921]" : "hover:bg-[#151921]"} transition-colors`}>
                <div className="flex items-center gap-2">
                  {row.indent > 0 && <span className="text-[#48566E] text-xs">└</span>}
                  <span className={`text-sm ${row.bold ? "font-medium text-[#F0F4FF]" : "text-[#8A95B0]"}`}>{row.label}</span>
                </div>
                <span className="font-mono text-sm font-medium" style={{ color: row.color }}>
                  {row.value < 0 ? `−${fmt(Math.abs(row.value))}` : fmt(row.value)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Profit Config */}
        <Card className="p-5">
          <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-1">Cost Configuration</h3>
          <p className="text-[11px] text-[#48566E] font-mono mb-4">Used for profit calculations</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[10px] font-mono text-[#48566E] uppercase tracking-wider mb-1">COGS %</label>
              <Input value={cogsP} onChange={e => setCogsP(e.target.value)} className="bg-[#151921] border-[#1E2737] text-[#F0F4FF]" placeholder="60" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-[#48566E] uppercase tracking-wider mb-1">Shipping Cost (₹ per order)</label>
              <Input value={shippingC} onChange={e => setShippingC(e.target.value)} className="bg-[#151921] border-[#1E2737] text-[#F0F4FF]" placeholder="89" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-[#48566E] uppercase tracking-wider mb-1">Packaging Cost (₹ per order)</label>
              <Input value={packagingC} onChange={e => setPackagingC(e.target.value)} className="bg-[#151921] border-[#1E2737] text-[#F0F4FF]" placeholder="42" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-[#48566E] uppercase tracking-wider mb-1">Gateway Fee %</label>
              <Input value={gatewayP} onChange={e => setGatewayP(e.target.value)} className="bg-[#151921] border-[#1E2737] text-[#F0F4FF]" placeholder="1.8" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-[#48566E] uppercase tracking-wider mb-1">Tax %</label>
              <Input value={taxP} onChange={e => setTaxP(e.target.value)} className="bg-[#151921] border-[#1E2737] text-[#F0F4FF]" placeholder="4.5" />
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="mt-2">
              {saveMutation.isPending ? "Saving…" : "Save Config"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Channel Chart + Product Table */}
      <div className="grid grid-cols-[1fr_1fr] gap-5">
        <Card className="p-5">
          <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-1">Profit by Channel</h3>
          <p className="text-[11px] text-[#48566E] font-mono mb-4">Revenue vs Ad Spend vs Profit</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={channels} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2737" />
              <XAxis dataKey="channel" tick={{ fill: "#48566E", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#48566E", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: "#0F1217", border: "1px solid #1E2737", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "monospace" }} />
              <Bar dataKey="revenue" name="Revenue" fill="#3B9EFF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ad_spend" name="Ad Spend" fill="#FFAD3B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#00E5A0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-5 border-b border-[#1E2737]">
            <h3 className="font-syne text-sm font-bold text-[#F0F4FF]">Top Products by Revenue</h3>
          </div>
          <div className="overflow-x-auto"><div className="min-w-[450px]">
          <div className="grid grid-cols-[2fr_1fr_0.7fr_0.8fr] px-5 py-2.5 border-b border-[#1E2737]">
            {["Product", "Revenue", "Orders", "Margin%"].map(h => (
              <span key={h} className="text-[10px] text-[#48566E] font-mono uppercase tracking-wider">{h}</span>
            ))}
          </div>
          <div className="overflow-y-auto max-h-[224px]">
            {products.map((p: any, i: number) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_0.7fr_0.8fr] px-5 py-2.5 hover:bg-[#151921] transition-colors border-b border-[#1E2737] last:border-0">
                <span className="text-xs text-[#F0F4FF] truncate pr-2">{p.name}</span>
                <span className="font-mono text-xs text-[#8A95B0]">{fmt(p.revenue)}</span>
                <span className="font-mono text-xs text-[#8A95B0]">{p.orders}</span>
                <span className="font-mono text-xs text-[#00E5A0]">{p.margin?.toFixed(1)}%</span>
              </div>
            ))}
          </div>
          </div></div>
        </Card>
      </div>
    </div>
  );
}
