"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/empty-state";

function inr(n: number | undefined | null): string {
  if (!n && n !== 0) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

function StatCard({ label, value, sub, color = "#F0F4FF", warn = false }: {
  label: string; value: string; sub?: string; color?: string; warn?: boolean;
}) {
  return (
    <div className={`bg-[#0F1217] border rounded-xl p-4 ${warn ? "border-[rgba(255,91,107,0.3)]" : "border-[#1E2737]"}`}>
      <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-2">{label}</div>
      <div className="text-xl font-syne font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-[#48566E] mt-1 font-mono">{sub}</div>}
    </div>
  );
}

function DonutSlice({ value, total, color, label }: { value: number; total: number; color: string; label: string }) {
  const pct = total > 0 ? Math.round(value / total * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1">
        <div className="flex justify-between text-[12px] mb-0.5">
          <span className="text-[#8A95B0]">{label}</span>
          <span className="text-[#F0F4FF] font-mono">{value.toLocaleString()} ({pct}%)</span>
        </div>
        <div className="h-1.5 bg-[#1C2230] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
    </div>
  );
}

export function OperationsPage() {
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<"overview"|"rto"|"cod"|"shipping"|"returns">("overview");

  const { data: overview } = useQuery({
    queryKey: ["operations", "overview", days],
    queryFn: () => api.get(`/operations/overview?days=${days}`),
    staleTime: 60_000,
  });

  const { data: rto } = useQuery({
    queryKey: ["operations", "rto", days],
    queryFn: () => api.get(`/operations/rto?days=${days}`),
    enabled: activeTab === "rto",
    staleTime: 60_000,
  });

  const { data: cod } = useQuery({
    queryKey: ["operations", "cod", days],
    queryFn: () => api.get(`/operations/cod?days=${days}`),
    enabled: activeTab === "cod",
    staleTime: 60_000,
  });

  const { data: shipping } = useQuery({
    queryKey: ["operations", "shipping", days],
    queryFn: () => api.get(`/operations/shipping?days=${days}`),
    enabled: activeTab === "shipping",
    staleTime: 60_000,
  });

  const { data: returns } = useQuery({
    queryKey: ["operations", "returns", days],
    queryFn: () => api.get(`/operations/returns?days=${days}`),
    enabled: activeTab === "returns",
    staleTime: 60_000,
  });

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "rto",      label: "RTO Analysis" },
    { id: "cod",      label: "COD vs Prepaid" },
    { id: "shipping", label: "Shipping" },
    { id: "returns",  label: "Returns Log" },
  ] as const;

  const rtoRate = overview?.returns?.rto_rate_pct;
  const returnRate = overview?.returns?.return_rate_pct;

  const hasData = true // Switch to false to see empty state; will be driven by API later

  if (!hasData) return (
    <div className="p-4 lg:p-7 flex items-center justify-center min-h-96">
      <EmptyState icon="local_shipping" title="No shipping data" description="Connect Shiprocket or your courier partner to track orders." actionLabel="Connect Shiprocket" />
    </div>
  )

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-syne font-bold text-[#F0F4FF]">Operations</h1>
            <p className="text-[#48566E] text-sm">RTO · COD · Returns · Shipping performance</p>
          </div>
          <div className="flex bg-[#0F1217] border border-[#1E2737] rounded-lg p-0.5">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-[12px] rounded-md font-mono transition-all ${
                  days === d ? "bg-[#1C2230] text-[#F0F4FF]" : "text-[#48566E] hover:text-[#8A95B0]"
                }`}>
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        {overview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Orders"
              value={overview.orders?.total?.toLocaleString() || "0"}
              sub={`GMV: ${inr(overview.orders?.gmv)}`}
            />
            <StatCard
              label="RTO Rate"
              value={`${rtoRate?.toFixed(1) || 0}%`}
              sub={`${overview.returns?.rto || 0} RTOs`}
              color={rtoRate > 15 ? "#FF5B6B" : rtoRate > 8 ? "#FFAD3B" : "#00E5A0"}
              warn={rtoRate > 15}
            />
            <StatCard
              label="Return Rate"
              value={`${returnRate?.toFixed(1) || 0}%`}
              sub={`${overview.returns?.total || 0} returns`}
              color={returnRate > 10 ? "#FFAD3B" : "#F0F4FF"}
            />
            <StatCard
              label="COD Orders"
              value={`${overview.orders?.cod_pct?.toFixed(1) || 0}%`}
              sub={`${overview.orders?.cod?.toLocaleString() || 0} of ${overview.orders?.total?.toLocaleString() || 0}`}
              color="#FFAD3B"
            />
          </div>
        )}

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

        {/* Tab Content */}
        {activeTab === "overview" && overview && (
          <div className="grid grid-cols-2 gap-4">
            {/* Order breakdown */}
            <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
              <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-4">Payment Method Split</div>
              <DonutSlice value={overview.orders?.prepaid || 0} total={overview.orders?.total || 1} color="#00E5A0" label="Prepaid" />
              <DonutSlice value={overview.orders?.cod || 0} total={overview.orders?.total || 1} color="#FFAD3B" label="COD" />
              <div className="mt-4 pt-4 border-t border-[#1E2737] grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-[#48566E] font-mono">AOV</div>
                  <div className="text-[14px] font-mono font-bold text-[#F0F4FF]">{inr(overview.orders?.aov)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#48566E] font-mono">Shipping Collected</div>
                  <div className="text-[14px] font-mono font-bold text-[#F0F4FF]">{inr(overview.orders?.shipping_collected)}</div>
                </div>
              </div>
            </div>

            {/* Returns breakdown */}
            <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
              <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-4">Returns Breakdown</div>
              <DonutSlice value={overview.returns?.rto || 0} total={overview.returns?.total || 1} color="#FF5B6B" label="RTO (Return to Origin)" />
              <DonutSlice value={overview.returns?.customer_returns || 0} total={overview.returns?.total || 1} color="#FFAD3B" label="Customer Returns" />
              <DonutSlice value={overview.returns?.exchanges || 0} total={overview.returns?.total || 1} color="#3B82F6" label="Exchanges" />
              <div className="mt-4 pt-4 border-t border-[#1E2737]">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#48566E]">Return value (lost)</span>
                  <span className="text-[#FF5B6B] font-mono font-bold">{inr(overview.returns?.return_value)}</span>
                </div>
              </div>
            </div>

            {/* RTO health indicator */}
            <div className="col-span-2 bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
              <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-4">Operations Health</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "RTO Rate", val: rtoRate, thresholds: [8, 15], fmt: (v: number) => `${v.toFixed(1)}%`, ideal: "< 8%" },
                  { label: "Return Rate", val: returnRate, thresholds: [5, 10], fmt: (v: number) => `${v.toFixed(1)}%`, ideal: "< 5%" },
                  { label: "COD Ratio", val: overview.orders?.cod_pct, thresholds: [40, 60], fmt: (v: number) => `${v.toFixed(1)}%`, ideal: "< 40%" },
                  { label: "Processed Returns", val: overview.returns?.processed / (overview.returns?.total || 1) * 100, thresholds: [70, 50], fmt: (v: number) => `${v.toFixed(0)}%`, ideal: "> 70%" },
                ].map(({ label, val = 0, thresholds, fmt, ideal }) => {
                  const isGood = thresholds[0] >= thresholds[1]
                    ? val >= thresholds[0]
                    : val <= thresholds[0];
                  const isWarn = thresholds[0] >= thresholds[1]
                    ? val >= thresholds[1]
                    : val <= thresholds[1];
                  const color = isGood ? "#00E5A0" : isWarn ? "#FFAD3B" : "#FF5B6B";
                  return (
                    <div key={label} className="text-center">
                      <div className="text-[11px] text-[#48566E] font-mono mb-2">{label}</div>
                      <div className="text-2xl font-syne font-bold mb-1" style={{ color }}>{fmt(val)}</div>
                      <div className="text-[10px] text-[#48566E] font-mono">ideal: {ideal}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "rto" && rto && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
              <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-4">RTO by Courier</div>
              {rto.by_courier?.length > 0 ? rto.by_courier.map((c: any) => (
                <div key={c.courier} className="flex items-center justify-between py-2 border-b border-[#1E2737] last:border-0">
                  <span className="text-[12px] text-[#8A95B0]">{c.courier}</span>
                  <div className="text-right">
                    <span className="text-[12px] text-[#F0F4FF] font-mono">{c.count} RTOs</span>
                    <span className="text-[11px] text-[#48566E] ml-2">{inr(c.value)}</span>
                  </div>
                </div>
              )) : (
                <div className="text-center text-[#48566E] text-sm py-8">No RTO data for this period</div>
              )}
            </div>
            <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
              <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-4">RTO by Reason</div>
              {rto.by_reason?.length > 0 ? rto.by_reason.map((r: any) => (
                <div key={r.reason} className="flex items-center justify-between py-2 border-b border-[#1E2737] last:border-0">
                  <span className="text-[12px] text-[#8A95B0] truncate max-w-[200px]">{r.reason}</span>
                  <span className="text-[12px] text-[#F0F4FF] font-mono">{r.count}</span>
                </div>
              )) : (
                <div className="text-center text-[#48566E] text-sm py-8">No reason data yet</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "cod" && cod && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
              <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-4">COD vs Prepaid Comparison</div>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] text-[#48566E] font-mono">
                    <th className="text-left py-2">Type</th>
                    <th className="text-right py-2">Orders</th>
                    <th className="text-right py-2">Revenue</th>
                    <th className="text-right py-2">AOV</th>
                  </tr>
                </thead>
                <tbody>
                  {cod.breakdown?.map((b: any) => (
                    <tr key={b.payment_type} className="border-t border-[#1E2737]">
                      <td className="py-2.5 text-[#F0F4FF] font-medium">{b.payment_type}</td>
                      <td className="py-2.5 text-right text-[#8A95B0] font-mono">{b.orders?.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-[#F0F4FF] font-mono">{inr(b.revenue)}</td>
                      <td className="py-2.5 text-right text-[#00E5A0] font-mono">{inr(b.aov)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
              <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-4">Monthly Trend</div>
              {cod.monthly_trend?.length > 0 ? (
                <div className="text-[12px] text-[#48566E] text-center py-4">Chart coming soon — data available</div>
              ) : (
                <div className="text-center text-[#48566E] text-sm py-8">No trend data yet</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "shipping" && shipping && (
          <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
            <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-4">Top Shipping States</div>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] text-[#48566E] font-mono">
                  <th className="text-left py-2 pr-4">State</th>
                  <th className="text-right pr-4">Orders</th>
                  <th className="text-right pr-4">Revenue</th>
                  <th className="text-right pr-4">AOV</th>
                  <th className="text-right">Shipping Cost</th>
                </tr>
              </thead>
              <tbody>
                {shipping.by_state?.map((s: any) => (
                  <tr key={s.state} className="border-t border-[#1E2737] hover:bg-[#1C2230]">
                    <td className="py-2 pr-4 text-[#F0F4FF]">{s.state}</td>
                    <td className="py-2 pr-4 text-right text-[#8A95B0] font-mono">{s.orders?.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right text-[#F0F4FF] font-mono">{inr(s.revenue)}</td>
                    <td className="py-2 pr-4 text-right text-[#00E5A0] font-mono">{inr(s.aov)}</td>
                    <td className="py-2 text-right text-[#FFAD3B] font-mono">{inr(s.shipping_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "returns" && (
          <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider">Returns Log</div>
              <div className="text-[11px] text-[#48566E] font-mono">{returns?.length || 0} records</div>
            </div>
            {returns && returns.length > 0 ? (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] text-[#48566E] font-mono">
                    <th className="text-left py-2 pr-4">Order ID</th>
                    <th className="text-left pr-4">Type</th>
                    <th className="text-left pr-4">Status</th>
                    <th className="text-left pr-4">Reason</th>
                    <th className="text-right pr-4">Amount</th>
                    <th className="text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((r: any) => (
                    <tr key={r.id} className="border-t border-[#1E2737] hover:bg-[#1C2230]">
                      <td className="py-2 pr-4 text-[#F0F4FF] font-mono">{r.order_id}</td>
                      <td className="py-2 pr-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          r.return_type === "rto" ? "bg-[rgba(255,91,107,0.1)] text-[#FF5B6B]" :
                          r.return_type === "exchange" ? "bg-[rgba(59,130,246,0.1)] text-[#3B82F6]" :
                          "bg-[rgba(255,173,59,0.1)] text-[#FFAD3B]"
                        }`}>
                          {r.return_type?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-[#8A95B0]">{r.status}</td>
                      <td className="py-2 pr-4 text-[#8A95B0] truncate max-w-[150px]">{r.reason || "—"}</td>
                      <td className="py-2 pr-4 text-right text-[#FF5B6B] font-mono">{r.amount ? inr(r.amount) : "—"}</td>
                      <td className="py-2 text-right text-[#48566E] font-mono">{r.initiated_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center text-[#48566E] py-12">
                No returns logged yet.<br/>
                <span className="text-[11px]">Use the Operations API to log RTOs and customer returns.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
