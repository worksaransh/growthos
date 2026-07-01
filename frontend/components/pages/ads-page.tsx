"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { AppIcon } from "@/components/shared/app-icon";
import { ConnectPrompt } from "@/components/shared/connect-prompt";

const TABS = ["All Channels", "Meta", "Google"];

const MOCK_CAMPAIGNS = [
  { name: "Lookalike — Purchase Intent", platform: "meta", spend: 182400, roas: 5.12, ctr: 2.84, cpc: 18.4, cpm: 522, conversions: 487, cpa: 374, status: "active" },
  { name: "Retargeting — 7 Day Visitors", platform: "meta", spend: 94200, roas: 7.21, ctr: 3.92, cpc: 12.1, cpm: 476, conversions: 312, cpa: 302, status: "active" },
  { name: "Broad Interest — Fashion 25-40", platform: "meta", spend: 211800, roas: 3.81, ctr: 1.94, cpc: 24.7, cpm: 481, conversions: 418, cpa: 507, status: "active" },
  { name: "DPA — All Products", platform: "meta", spend: 163600, roas: 6.14, ctr: 2.61, cpc: 16.9, cpm: 440, conversions: 389, cpa: 421, status: "active" },
  { name: "Brand Search — GrowthOS", platform: "google", spend: 48200, roas: 8.92, ctr: 4.41, cpc: 11.2, cpm: 0, conversions: 198, cpa: 244, status: "active" },
  { name: "Shopping — All Products", platform: "google", spend: 198400, roas: 4.22, ctr: 1.82, cpc: 28.4, cpm: 0, conversions: 412, cpa: 482, status: "active" },
  { name: "Competitor Keywords", platform: "google", spend: 89400, roas: 3.44, ctr: 2.12, cpc: 22.1, cpm: 0, conversions: 201, cpa: 445, status: "paused" },
  { name: "Display Retargeting", platform: "google", spend: 97200, roas: 2.89, ctr: 0.84, cpc: 8.2, cpm: 69, conversions: 142, cpa: 685, status: "active" },
];

const MOCK_SPEND_TREND = [
  { date: "Jun 1", meta: 21200, google: 14800, revenue: 92400 },
  { date: "Jun 3", meta: 24800, google: 17200, revenue: 118200 },
  { date: "Jun 5", meta: 19400, google: 13600, revenue: 84200 },
  { date: "Jun 7", meta: 28400, google: 19800, revenue: 142800 },
  { date: "Jun 9", meta: 32100, google: 22400, revenue: 171200 },
  { date: "Jun 11", meta: 26800, google: 18400, revenue: 128400 },
  { date: "Jun 13", meta: 38200, google: 26800, revenue: 198400 },
  { date: "Jun 15", meta: 35400, google: 24200, revenue: 182100 },
  { date: "Jun 17", meta: 41200, google: 28800, revenue: 214800 },
  { date: "Jun 19", meta: 31400, google: 21200, revenue: 158200 },
];

const MOCK_SUMMARY = {
  meta: { spend: 652000, roas: 4.82, ctr: 2.71, cpc: 17.8, cpm: 481, conversions: 1606, cpa: 406 },
  google: { spend: 433200, roas: 3.91, ctr: 2.13, cpc: 22.4, cpm: 34, conversions: 953, cpa: 455 },
  all: { spend: 1085200, roas: 4.45, ctr: 2.48, cpc: 19.8, cpm: 310, conversions: 2559, cpa: 424 },
};

function fmt(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v.toFixed(0)}`;
}

export function AdsPage() {
  const [tab, setTab] = useState("All Channels");
  const [sortKey, setSortKey] = useState("spend");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data: campaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => api.getCampaigns(),
  });

  const allCampaigns = campaigns && campaigns.length > 0 ? campaigns : MOCK_CAMPAIGNS;
  const platformKey = tab === "Meta" ? "meta" : tab === "Google" ? "google" : "all";
  const filteredCampaigns = tab === "All Channels" ? allCampaigns : allCampaigns.filter((c: any) => c.platform === platformKey);
  const summary = MOCK_SUMMARY[platformKey as keyof typeof MOCK_SUMMARY];

  const sortedCampaigns = [...filteredCampaigns].sort((a: any, b: any) => {
    const mult = sortDir === "desc" ? -1 : 1;
    return mult * ((a[sortKey] ?? 0) - (b[sortKey] ?? 0));
  });

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const kpis = [
    { label: "Total Spend", value: fmt(summary.spend), color: "#F0F4FF" },
    { label: "Blended ROAS", value: `${summary.roas.toFixed(2)}x`, color: "#00E5A0" },
    { label: "Avg CTR", value: `${summary.ctr.toFixed(2)}%`, color: "#3B9EFF" },
    { label: "Avg CPC", value: `₹${summary.cpc.toFixed(1)}`, color: "#8A95B0" },
    { label: "Conversions", value: summary.conversions.toLocaleString(), color: "#F0F4FF" },
    { label: "Avg CPA", value: fmt(summary.cpa), color: "#FFAD3B" },
  ];

  const hasData = true // Switch to false to see empty state; will be driven by API later

  if (!hasData) return (
    <div className="p-4 lg:p-7 flex items-center justify-center min-h-96">
      <ConnectPrompt platform="meta" pageName="Ads Performance" />
    </div>
  )

  return (
    <div className="p-7 flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex gap-1.5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-mono transition-all ${tab === t ? "bg-[rgba(0,229,160,0.1)] text-[#00E5A0] border border-[#00E5A0]" : "text-[#8A95B0] hover:text-[#F0F4FF] border border-[#1E2737]"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-6 gap-3">
        {kpis.map((k, i) => (
          <Card key={i} className="p-4">
            <div className="text-[10px] text-[#48566E] font-mono uppercase tracking-wider mb-2">{k.label}</div>
            <div className="font-mono text-lg font-medium" style={{ color: k.color }}>{k.value}</div>
          </Card>
        ))}
      </div>

      {/* Spend Trend */}
      <Card className="p-5">
        <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-1">Spend & Revenue Trend</h3>
        <p className="text-[11px] text-[#48566E] font-mono mb-4">Daily platform spend vs revenue generated</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={MOCK_SPEND_TREND} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2737" />
            <XAxis dataKey="date" tick={{ fill: "#48566E", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#48566E", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
            <Tooltip contentStyle={{ background: "#0F1217", border: "1px solid #1E2737", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmt(v)} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "monospace" }} />
            <Line type="monotone" dataKey="meta" name="Meta Spend" stroke="#1877F2" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="google" name="Google Spend" stroke="#FFAD3B" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#00E5A0" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Campaigns Table */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-[#1E2737]">
          <h3 className="font-syne text-sm font-bold text-[#F0F4FF]">Campaign Performance</h3>
        </div>
        <div className="overflow-x-auto"><div className="min-w-[650px]">
        <div className="grid grid-cols-[2.5fr_0.8fr_0.8fr_0.7fr_0.7fr_0.8fr_0.7fr] px-5 py-3 border-b border-[#1E2737] gap-3">
          {[
            { key: "name", label: "Campaign" },
            { key: "spend", label: "Spend" },
            { key: "roas", label: "ROAS" },
            { key: "ctr", label: "CTR" },
            { key: "cpc", label: "CPC" },
            { key: "conversions", label: "Conv." },
            { key: "status", label: "Status" },
          ].map(h => (
            <button key={h.key}
              onClick={() => h.key !== "name" && h.key !== "status" && handleSort(h.key)}
              className="text-[10px] text-[#48566E] font-mono uppercase tracking-wider text-left flex items-center gap-1 hover:text-[#8A95B0] transition-colors">
              {h.label}
              {sortKey === h.key && <span className="text-[#00E5A0]">{sortDir === "desc" ? "↓" : "↑"}</span>}
            </button>
          ))}
        </div>
        {sortedCampaigns.map((c: any, i: number) => (
          <div key={i} className="grid grid-cols-[2.5fr_0.8fr_0.8fr_0.7fr_0.7fr_0.8fr_0.7fr] px-5 py-3 gap-3 hover:bg-[#151921] transition-colors border-b border-[#1E2737] last:border-0">
            <div>
              <div className="text-xs text-[#F0F4FF]">{c.name}</div>
              <div className="text-[10px] text-[#48566E] font-mono mt-0.5 capitalize">{c.platform}</div>
            </div>
            <span className="font-mono text-xs text-[#8A95B0]">{fmt(c.spend)}</span>
            <span className="font-mono text-xs text-[#00E5A0]">{c.roas?.toFixed(2)}x</span>
            <span className="font-mono text-xs text-[#8A95B0]">{c.ctr?.toFixed(2)}%</span>
            <span className="font-mono text-xs text-[#8A95B0]">₹{c.cpc?.toFixed(1)}</span>
            <span className="font-mono text-xs text-[#8A95B0]">{c.conversions?.toLocaleString()}</span>
            <span className={`font-mono text-xs ${c.status === "active" ? "text-[#00E5A0]" : "text-[#FFAD3B]"}`}>{c.status}</span>
          </div>
        ))}
        </div></div>
      </Card>

      {/* Creative Fatigue + AI Scaling */}
      <div className="grid grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-1">Creative Fatigue Indicator</h3>
          <p className="text-[11px] text-[#48566E] font-mono mb-4">Frequency vs performance correlation</p>
          <div className="flex flex-col gap-2.5">
            {[
              { ad: "UGC Hook — 'I switched to…'", freq: 4.2, ctr: 1.84, status: "warning" },
              { ad: "Product Demo Carousel", freq: 2.8, ctr: 3.12, status: "healthy" },
              { ad: "Founder Story Reel", freq: 3.6, ctr: 2.41, status: "moderate" },
              { ad: "Testimonial Static", freq: 5.1, ctr: 0.94, status: "fatigued" },
            ].map((ad, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#151921]">
                <div>
                  <div className="text-xs text-[#F0F4FF]">{ad.ad}</div>
                  <div className="text-[10px] text-[#48566E] font-mono mt-0.5">Freq: {ad.freq} · CTR: {ad.ctr}%</div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  ad.status === "healthy" ? "bg-[rgba(0,229,160,0.1)] text-[#00E5A0]"
                  : ad.status === "moderate" ? "bg-[rgba(255,173,59,0.1)] text-[#FFAD3B]"
                  : ad.status === "warning" ? "bg-[rgba(255,173,59,0.15)] text-[#FFAD3B]"
                  : "bg-[rgba(255,91,107,0.1)] text-[#FF5B6B]"
                }`}>{ad.status}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-syne text-sm font-bold text-[#F0F4FF]">AI Scaling Suggestions</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[rgba(0,229,160,0.1)] text-[#00E5A0]">AI</span>
          </div>
          <p className="text-[11px] text-[#48566E] font-mono mb-4">Based on performance patterns</p>
          <div className="flex flex-col gap-2.5">
            {[
              { suggestion: "Scale Retargeting — 7 Day Visitors by 30%", reason: "ROAS 7.2x — above threshold, room to grow" },
              { suggestion: "Pause Testimonial Static ad", reason: "Frequency 5.1 with CTR below 1% — showing fatigue" },
              { suggestion: "Duplicate Lookalike campaign with new creative", reason: "Good ROAS but scaling ceiling hit — fresh creative needed" },
              { suggestion: "Reduce Competitor Keywords bid by 15%", reason: "CPA ₹445 — above ₹400 target with low volume" },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-lg bg-[#151921] border border-[#1E2737]">
                <div className="flex items-start gap-2">
                  <AppIcon name="auto_awesome" className="mt-0.5 text-[#00E5A0] shrink-0" size={14} />
                  <div>
                    <div className="text-xs text-[#F0F4FF] font-medium">{s.suggestion}</div>
                    <div className="text-[10px] text-[#48566E] font-mono mt-1">{s.reason}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
