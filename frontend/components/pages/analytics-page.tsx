"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { VisualEmptyState } from "@/components/shared/visual-system";
import { ConnectPrompt } from "@/components/shared/connect-prompt";

function inr(n: number | undefined | null): string {
  if (!n && n !== 0) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

// RFM Bubble (simplified scatter visualization)
function RFMBubble({ segment, count, ltv, color }: { segment: string; count: number; ltv: number; color: string }) {
  const size = Math.min(120, Math.max(40, Math.sqrt(count) * 8));
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="rounded-full flex items-center justify-center text-center transition-all hover:scale-105"
        style={{
          width: size, height: size,
          backgroundColor: `${color}20`,
          border: `2px solid ${color}40`,
        }}
      >
        <div>
          <div className="text-[10px] font-mono font-bold" style={{ color }}>{count}</div>
        </div>
      </div>
      <div className="text-[9px] text-[#48566E] text-center leading-tight max-w-[80px]">{segment}</div>
    </div>
  );
}

// Cohort Grid Cell
function CohortCell({ pct }: { pct?: number }) {
  if (pct === undefined) return <td className="px-1 py-1"><div className="w-10 h-6 bg-[#0A0C0F] rounded" /></td>;
  const opacity = Math.min(1, pct / 100);
  return (
    <td className="px-1 py-1">
      <div
        className="w-10 h-6 rounded text-[9px] flex items-center justify-center font-mono font-bold transition-all"
        style={{
          backgroundColor: `rgba(0,229,160,${opacity * 0.8})`,
          color: opacity > 0.5 ? "#0A0C0F" : "#00E5A0",
        }}
        title={`${pct}% retained`}
      >
        {pct > 0 ? `${pct}%` : ""}
      </div>
    </td>
  );
}

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"rfm"|"cohorts"|"ltv"|"lifecycle">("rfm");

  const { data: rfm } = useQuery({
    queryKey: ["analytics", "rfm"],
    queryFn: () => api.get("/analytics/rfm"),
    staleTime: 120_000,
  });

  const { data: cohorts } = useQuery({
    queryKey: ["analytics", "cohorts"],
    queryFn: () => api.get("/analytics/cohorts?months=6"),
    enabled: activeTab === "cohorts",
    staleTime: 120_000,
  });

  const { data: ltv } = useQuery({
    queryKey: ["analytics", "ltv"],
    queryFn: () => api.get("/analytics/ltv"),
    enabled: activeTab === "ltv",
    staleTime: 120_000,
  });

  const { data: lifecycle } = useQuery({
    queryKey: ["analytics", "lifecycle"],
    queryFn: () => api.get("/analytics/lifecycle"),
    enabled: activeTab === "lifecycle",
    staleTime: 60_000,
  });

  const TABS = [
    { id: "rfm",       label: "RFM Segments" },
    { id: "cohorts",   label: "Cohort Retention" },
    { id: "ltv",       label: "LTV Analysis" },
    { id: "lifecycle", label: "Customer Lifecycle" },
  ] as const;

  const totalCustomers = rfm?.summary?.reduce((a: number, s: any) => a + parseInt(s.customer_count), 0) || 0;

  const hasData = true // Switch to false to see empty state; will be driven by API later

  if (!hasData) return (
    <div className="p-4 lg:p-7 flex items-center justify-center min-h-96">
      <ConnectPrompt platform="all" pageName="Marketing Analytics" />
    </div>
  )

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-syne font-bold text-[#F0F4FF]">Customer Analytics</h1>
            <p className="text-[#48566E] text-sm">RFM segmentation · Cohort retention · LTV · Lifecycle</p>
          </div>
          {rfm && (
            <div className="bg-[#0F1217] border border-[#1E2737] rounded-lg px-3 py-2 text-right">
              <div className="text-[10px] text-[#48566E] font-mono">Analysed Customers</div>
              <div className="text-base font-syne font-bold text-[#F0F4FF]">{totalCustomers.toLocaleString()}</div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-[#0F1217] border border-[#1E2737] rounded-lg p-1 w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 text-[12px] rounded-md font-mono transition-all ${
                activeTab === t.id ? "bg-[#1C2230] text-[#F0F4FF]" : "text-[#48566E] hover:text-[#8A95B0]"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* RFM Segments */}
        {activeTab === "rfm" && rfm && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Bubble visualization */}
            <div className="col-span-2 bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
              <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-4">Segment Distribution</div>
              <div className="flex flex-wrap gap-6 justify-center py-4">
                {rfm.summary?.map((s: any) => (
                  <RFMBubble
                    key={s.segment}
                    segment={s.segment}
                    count={parseInt(s.customer_count)}
                    ltv={parseFloat(s.avg_ltv)}
                    color={s.color}
                  />
                ))}
              </div>
            </div>

            {/* Segment table */}
            <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
              <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-4">Segment Summary</div>
              <div className="flex flex-col gap-2">
                {rfm.summary?.map((s: any) => (
                  <div key={s.segment} className="flex items-center gap-2 py-1.5 border-b border-[#1E2737] last:border-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-[#F0F4FF] truncate">{s.segment}</div>
                      <div className="text-[9px] text-[#48566E] font-mono">Avg LTV: {inr(parseFloat(s.avg_ltv))}</div>
                    </div>
                    <div className="text-[11px] text-[#8A95B0] font-mono flex-shrink-0">{s.customer_count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer table */}
            <div className="col-span-3 bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
              <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-4">Top Customers by LTV</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-[10px] text-[#48566E] font-mono">
                      <th className="text-left py-2 pr-4">Customer</th>
                      <th className="text-left pr-4">Segment</th>
                      <th className="text-right pr-4">R</th>
                      <th className="text-right pr-4">F</th>
                      <th className="text-right pr-4">M</th>
                      <th className="text-right pr-4">Orders</th>
                      <th className="text-right pr-4">LTV</th>
                      <th className="text-right">Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfm.customers?.slice(0, 15).map((c: any, i: number) => {
                      const segColor = rfm.summary?.find((s: any) => s.segment === c.segment)?.color || "#8A95B0";
                      return (
                        <tr key={i} className="border-t border-[#1E2737] hover:bg-[#1C2230]">
                          <td className="py-2 pr-4">
                            <div className="text-[#F0F4FF]">{c.customer_name || "—"}</div>
                            <div className="text-[10px] text-[#48566E] font-mono">{c.customer_email}</div>
                          </td>
                          <td className="py-2 pr-4">
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ backgroundColor: `${segColor}20`, color: segColor }}>
                              {c.segment}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-right text-[#8A95B0] font-mono">{c.r_score}</td>
                          <td className="py-2 pr-4 text-right text-[#8A95B0] font-mono">{c.f_score}</td>
                          <td className="py-2 pr-4 text-right text-[#8A95B0] font-mono">{c.m_score}</td>
                          <td className="py-2 pr-4 text-right text-[#F0F4FF] font-mono">{c.order_count}</td>
                          <td className="py-2 pr-4 text-right text-[#00E5A0] font-mono">{inr(c.total_spent)}</td>
                          <td className="py-2 text-right text-[#48566E] font-mono text-[10px]">{c.last_order_date?.toString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Cohort Grid */}
        {activeTab === "cohorts" && cohorts && (
          <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5 overflow-x-auto">
            <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-2">Cohort Retention Grid</div>
            <div className="text-[11px] text-[#48566E] mb-4">% of customers from each acquisition month who made a repeat purchase</div>
            {cohorts.cohorts?.length > 0 ? (
              <table className="text-[11px]">
                <thead>
                  <tr>
                    <th className="text-left pr-4 pb-2 text-[#48566E] font-mono">Cohort</th>
                    <th className="text-right pr-3 pb-2 text-[#48566E] font-mono">Size</th>
                    {Array.from({ length: cohorts.max_months + 1 }, (_, i) => (
                      <th key={i} className="px-1 pb-2 text-[#48566E] font-mono">M{i}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohorts.cohorts.map((c: any) => (
                    <tr key={c.cohort_month}>
                      <td className="pr-4 py-1 text-[#8A95B0] font-mono">{c.cohort_month?.slice(0, 7)}</td>
                      <td className="pr-3 py-1 text-right text-[#F0F4FF] font-mono">{c.size}</td>
                      {Array.from({ length: cohorts.max_months + 1 }, (_, i) => (
                        <CohortCell key={i} pct={c.retention?.[i]?.pct} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <VisualEmptyState
                icon="analytics"
                title="No cohort data available yet."
                description="Cohort analysis needs Shopify order history. Connect or sync Shopify to unlock retention views."
              />
            )}
          </div>
        )}

        {/* LTV Analysis */}
        {activeTab === "ltv" && ltv && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
              <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-4">LTV Distribution</div>
              {ltv.percentiles && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "P25 (bottom 25%)", key: "p25" },
                    { label: "Median LTV", key: "p50" },
                    { label: "P75 (top 25%)", key: "p75" },
                    { label: "P90 (top 10%)", key: "p90" },
                    { label: "Average LTV", key: "avg_ltv" },
                    { label: "Total Customers", key: "total_customers" },
                  ].map(({ label, key }) => (
                    <div key={key} className="bg-[#0A0C0F] rounded-lg p-3">
                      <div className="text-[10px] text-[#48566E] font-mono mb-1">{label}</div>
                      <div className="text-[14px] font-mono font-bold text-[#F0F4FF]">
                        {key === "total_customers"
                          ? parseInt(ltv.percentiles[key]).toLocaleString()
                          : inr(ltv.percentiles[key])}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
              <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-4">LTV by Acquisition Month</div>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] text-[#48566E] font-mono">
                    <th className="text-left py-2">Month</th>
                    <th className="text-right">Customers</th>
                    <th className="text-right">Avg LTV</th>
                    <th className="text-right">Median LTV</th>
                  </tr>
                </thead>
                <tbody>
                  {ltv.by_cohort?.map((c: any) => (
                    <tr key={c.cohort_month} className="border-t border-[#1E2737]">
                      <td className="py-2 text-[#8A95B0] font-mono">{c.cohort_month?.toString().slice(0, 7)}</td>
                      <td className="py-2 text-right text-[#F0F4FF] font-mono">{c.customers}</td>
                      <td className="py-2 text-right text-[#00E5A0] font-mono">{inr(c.avg_ltv)}</td>
                      <td className="py-2 text-right text-[#8A95B0] font-mono">{inr(c.median_ltv)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lifecycle */}
        {activeTab === "lifecycle" && lifecycle && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "new_customers",    label: "New Customers",    desc: "1 order, last 30 days",    color: "#3B82F6" },
              { key: "active_customers", label: "Active Customers", desc: "Repeat buyers, last 60 days", color: "#00E5A0" },
              { key: "at_risk",          label: "At Risk",          desc: "No purchase in 61–120 days", color: "#FFAD3B" },
              { key: "churned",          label: "Churned",          desc: "No purchase in 120+ days",   color: "#FF5B6B" },
            ].map(({ key, label, desc, color }) => {
              const seg = lifecycle[key];
              return (
                <div key={key} className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color }}>{label}</div>
                      <div className="text-[11px] text-[#48566E] mt-0.5">{desc}</div>
                    </div>
                    <div className="text-2xl font-syne font-bold" style={{ color }}>{seg?.pct}%</div>
                  </div>
                  <div className="h-2 bg-[#1C2230] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${seg?.pct}%`, backgroundColor: color }} />
                  </div>
                  <div className="mt-2 text-[11px] text-[#48566E] font-mono">{seg?.count?.toLocaleString()} customers</div>
                </div>
              );
            })}
            <div className="col-span-2 bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
              <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-3">Total Analysed</div>
              <div className="text-2xl font-syne font-bold text-[#F0F4FF]">{lifecycle.total?.toLocaleString()} customers</div>
              <div className="mt-4 text-[12px] text-[#8A95B0] leading-relaxed">
                <strong className="text-[#00E5A0]">Action:</strong> Focus re-engagement campaigns on At-Risk customers.
                Send win-back offers to Churned segment. Upsell Active customers with bundles and cross-sells.
              </div>
            </div>
          </div>
        )}

        {/* Empty states for tabs with no data */}
        {activeTab === "rfm" && !rfm && (
          <VisualEmptyState
            icon="bubble_chart"
            title="No RFM data available yet."
            description="Connect Shopify and sync orders to unlock RFM segmentation."
          />
        )}
        {activeTab === "cohorts" && !cohorts && (
          <VisualEmptyState
            icon="analytics"
            title="No cohort data available yet."
            description="Cohort analysis needs Shopify order history."
          />
        )}
        {activeTab === "ltv" && !ltv && (
          <VisualEmptyState
            icon="query_stats"
            title="No LTV data available yet."
            description="Connect Shopify to unlock LTV analysis."
          />
        )}
        {activeTab === "lifecycle" && !lifecycle && (
          <VisualEmptyState
            icon="route"
            title="No lifecycle data available yet."
            description="Connect Shopify to unlock customer lifecycle analysis."
          />
        )}
      </div>
    </div>
  );
}
