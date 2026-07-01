"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/empty-state";

// ── Helpers ───────────────────────────────────────────────────────────────────
function inr(n: number | undefined | null): string {
  if (!n && n !== 0) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

function pct(n: number | undefined | null): string {
  if (!n && n !== 0) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

// ── P&L Row ───────────────────────────────────────────────────────────────────
type PLRowProps =
  | { separator: true; label?: never; value?: never; sub?: never; indent?: never; highlight?: never; negative?: never; bold?: never }
  | { separator?: false; label: string; value?: number; sub?: string; indent?: number; highlight?: boolean; negative?: boolean; bold?: boolean };

function PLRow({
  label, value, sub, indent = 0, highlight = false, negative = false, bold = false, separator = false
}: PLRowProps) {
  if (separator) return <tr><td colSpan={2} className="py-2"><div className="h-px bg-outline-variant/20" /></td></tr>;
  const textColor = highlight ? "var(--color-primary)" : negative ? "var(--color-error)" : "var(--color-on-surface)";
  return (
    <tr className={highlight ? "bg-primary/[0.04]" : ""}>
      <td className="py-2 pr-4" style={{ paddingLeft: `${(indent ?? 0) * 16 + 8}px` }}>
        <span className={`text-[13px] ${bold ? "font-semibold text-on-surface" : "text-on-surface-variant"}`}>
          {label}
        </span>
        {sub && <div className="text-[10px] text-on-surface-variant/40 font-mono">{sub}</div>}
      </td>
      <td className="py-2 text-right pr-2">
        <span className={`text-[13px] font-mono ${bold ? "font-bold" : ""}`} style={{ color: textColor }}>
          {value !== undefined ? inr(value) : "—"}
        </span>
      </td>
    </tr>
  );
}

// ── Trend Bar Chart ───────────────────────────────────────────────────────────
function TrendBar({ label, revenue, expenses, profit }: { label: string; revenue: number; expenses: number; profit: number }) {
  const max = Math.max(revenue, 1);
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] text-[#48566E] font-mono text-center">{label}</div>
      <div className="flex flex-col gap-0.5 items-center">
        <div className="w-8 h-16 bg-[#1C2230] rounded-sm relative overflow-hidden flex items-end">
          <div className="w-full bg-[rgba(0,229,160,0.3)] absolute bottom-0"
            style={{ height: `${(revenue / max) * 100}%` }} />
          <div className="w-full bg-[#00E5A0] absolute bottom-0"
            style={{ height: `${Math.max(0, profit / max) * 100}%` }} />
        </div>
      </div>
      <div className="text-[9px] text-[#48566E] font-mono text-center">{inr(revenue)}</div>
    </div>
  );
}

// ── Add Expense Modal ─────────────────────────────────────────────────────────
function AddExpenseModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "marketing",
    amount: "",
    description: "",
    vendor: "",
  });

  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.post("/finance/expenses", { ...form, amount: parseFloat(form.amount) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance"] }); onSaved(); onClose(); },
  });

  const cats = ["cogs","marketing","logistics","salaries","technology","office","returns","payment_gateway","packaging","other"];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-syne font-bold text-[#F0F4FF]">Add Expense</h3>
          <button onClick={onClose} className="text-[#48566E] hover:text-[#8A95B0] text-xl leading-none">×</button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#48566E] uppercase tracking-wider font-mono mb-1.5 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-[#0A0C0F] border border-[#1E2737] rounded-lg px-3 py-2 text-[13px] text-[#F0F4FF] outline-none focus:border-[rgba(0,229,160,0.3)]" />
            </div>
            <div>
              <label className="text-[11px] text-[#48566E] uppercase tracking-wider font-mono mb-1.5 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-[#0A0C0F] border border-[#1E2737] rounded-lg px-3 py-2 text-[13px] text-[#F0F4FF] outline-none focus:border-[rgba(0,229,160,0.3)] capitalize">
                {cats.map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-[#48566E] uppercase tracking-wider font-mono mb-1.5 block">Amount (₹)</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="e.g. 50000"
              className="w-full bg-[#0A0C0F] border border-[#1E2737] rounded-lg px-3 py-2 text-[13px] text-[#F0F4FF] outline-none focus:border-[rgba(0,229,160,0.3)]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#48566E] uppercase tracking-wider font-mono mb-1.5 block">Vendor</label>
              <input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                placeholder="e.g. Meta Ads"
                className="w-full bg-[#0A0C0F] border border-[#1E2737] rounded-lg px-3 py-2 text-[13px] text-[#F0F4FF] outline-none focus:border-[rgba(0,229,160,0.3)]" />
            </div>
            <div>
              <label className="text-[11px] text-[#48566E] uppercase tracking-wider font-mono mb-1.5 block">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional note"
                className="w-full bg-[#0A0C0F] border border-[#1E2737] rounded-lg px-3 py-2 text-[13px] text-[#F0F4FF] outline-none focus:border-[rgba(0,229,160,0.3)]" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#1E2737] rounded-lg text-[13px] text-[#8A95B0] hover:text-[#F0F4FF] transition-colors">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.amount || mutation.isPending}
            className="flex-1 py-2.5 bg-[#00E5A0] text-[#0A0C0F] rounded-lg text-[13px] font-semibold hover:bg-[#00B87D] disabled:opacity-40 transition-colors"
          >
            {mutation.isPending ? "Saving..." : "Save Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function FinancePage() {
  const [period, setPeriod] = useState<"week"|"month"|"quarter"|"year">("month");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [activeTab, setActiveTab] = useState<"pnl"|"trend"|"margin"|"cashflow">("pnl");
  const qc = useQueryClient();

  const { data: pnl, isLoading: pnlLoading } = useQuery({
    queryKey: ["finance", "pnl", period],
    queryFn: () => api.get(`/finance/pnl?period=${period}&compare=true`),
    staleTime: 60_000,
  });

  const { data: trend } = useQuery({
    queryKey: ["finance", "trend"],
    queryFn: () => api.get("/finance/pnl/trend?months=6"),
    staleTime: 60_000,
  });

  const { data: margin } = useQuery({
    queryKey: ["finance", "margin"],
    queryFn: () => api.get("/finance/contribution-margin?days=30"),
    staleTime: 60_000,
  });

  const { data: cashflow } = useQuery({
    queryKey: ["finance", "cashflow"],
    queryFn: () => api.get("/finance/cashflow?months=3"),
    staleTime: 60_000,
  });

  const { data: expenses } = useQuery({
    queryKey: ["finance", "expenses"],
    queryFn: () => api.get("/finance/expenses?days=30"),
    staleTime: 30_000,
  });

  const PERIODS = [
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "quarter", label: "Quarter" },
    { id: "year", label: "Year" },
  ] as const;

  const TABS = [
    { id: "pnl", label: "P&L Statement" },
    { id: "trend", label: "Trend" },
    { id: "margin", label: "Contribution Margin" },
    { id: "cashflow", label: "Cash Flow" },
  ] as const;

  const hasData = true // Switch to false to see empty state; will be driven by API later

  if (!hasData) return (
    <div className="p-4 lg:p-7 flex items-center justify-center min-h-96">
      <EmptyState icon="account_balance" title="Set up your P&L" description="Connect Shopify and configure your COGS to see real profit data." actionLabel="Configure P&L" />
    </div>
  )

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-syne font-bold text-[#F0F4FF]">Finance & P&L</h1>
            <p className="text-[#48566E] text-sm">Revenue, expenses, margins, cash flow</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Period toggle */}
            <div className="flex bg-[#0F1217] border border-[#1E2737] rounded-lg p-0.5">
              {PERIODS.map(p => (
                <button key={p.id} onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1.5 text-[12px] rounded-md font-mono transition-all ${
                    period === p.id ? "bg-[#1C2230] text-[#F0F4FF]" : "text-[#48566E] hover:text-[#8A95B0]"
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddExpense(true)}
              className="px-3 py-1.5 bg-[#00E5A0] text-[#0A0C0F] text-[12px] font-semibold rounded-lg hover:bg-[#00B87D] transition-colors"
            >
              + Add Expense
            </button>
          </div>
        </div>

        {/* KPI Row */}
        {pnl && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Gross Revenue", value: pnl.revenue?.gross_revenue, color: "#F0F4FF" },
              { label: "Net Revenue", value: pnl.revenue?.net_revenue, color: "#F0F4FF" },
              { label: "Gross Profit", value: pnl.gross_profit, sub: `${pnl.gross_margin_pct}% margin`, color: "#00E5A0" },
              { label: "Net Profit (EBITDA)", value: pnl.ebitda, sub: `${pnl.ebitda_margin_pct}% margin`, color: pnl.ebitda >= 0 ? "#00E5A0" : "#FF5B6B" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-4">
                <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-2">{label}</div>
                <div className="text-xl font-syne font-bold" style={{ color }}>{inr(value)}</div>
                {sub && <div className="text-[11px] text-[#48566E] font-mono mt-1">{sub}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-[#0F1217] border border-[#1E2737] rounded-lg p-1 w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`px-3 py-1.5 text-[12px] rounded-md font-mono transition-all ${
                activeTab === t.id ? "bg-[#1C2230] text-[#F0F4FF]" : "text-[#48566E] hover:text-[#8A95B0]"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "pnl" && pnl && (
          <div className="grid grid-cols-2 gap-4">
            {/* P&L Table */}
            <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
              <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-4">Profit & Loss Statement</div>
              <table className="w-full">
                <tbody>
                  <PLRow label="Gross Revenue" value={pnl.revenue?.gross_revenue} bold />
                  <PLRow label="Less: Discounts" value={-pnl.revenue?.discounts} indent={1} negative />
                  <PLRow label="Net Revenue" value={pnl.revenue?.net_revenue} bold highlight />
                  <PLRow separator />
                  <PLRow label="Cost of Goods (COGS)" value={-pnl.cogs} indent={1} negative />
                  <PLRow label="Gross Profit" value={pnl.gross_profit} bold highlight sub={`${pnl.gross_margin_pct}% margin`} />
                  <PLRow separator />
                  <PLRow label="Operating Expenses" bold />
                  <PLRow label="Marketing" value={-pnl.operating_expenses?.marketing} indent={1} negative />
                  <PLRow label="Logistics" value={-pnl.operating_expenses?.logistics} indent={1} negative />
                  <PLRow label="Salaries" value={-pnl.operating_expenses?.salaries} indent={1} negative />
                  <PLRow label="Technology" value={-pnl.operating_expenses?.technology} indent={1} negative />
                  <PLRow label="Payment Gateway" value={-pnl.operating_expenses?.payment_gateway} indent={1} negative />
                  <PLRow label="Packaging" value={-pnl.operating_expenses?.packaging} indent={1} negative />
                  <PLRow label="Returns" value={-pnl.operating_expenses?.returns} indent={1} negative />
                  <PLRow label="Other" value={-pnl.operating_expenses?.other} indent={1} negative />
                  <PLRow separator />
                  <PLRow label="EBITDA" value={pnl.ebitda} bold highlight sub={`${pnl.ebitda_margin_pct}% margin`} />
                </tbody>
              </table>
            </div>

            {/* Recent Expenses */}
            <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider">Recent Expenses</div>
                <span className="text-[10px] text-[#48566E] font-mono">{expenses?.length || 0} entries</span>
              </div>
              {expenses && expenses.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                  {expenses.slice(0, 15).map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between py-2 border-b border-[#1E2737] last:border-0">
                      <div>
                        <div className="text-[12px] text-[#F0F4FF] capitalize">{e.category.replace("_", " ")}</div>
                        <div className="text-[10px] text-[#48566E]">{e.vendor || e.description || "—"} · {e.date}</div>
                      </div>
                      <div className="text-[12px] text-[#FF5B6B] font-mono">-{inr(e.amount)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-[#48566E] text-sm py-12">
                  No expenses yet.<br />
                  <span className="text-[11px]">Add your first expense to see P&L data.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "trend" && trend && (
          <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
            <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-4">6-Month Revenue & Profit Trend</div>
            <div className="flex items-end gap-4 h-40">
              {trend.map((t: any) => (
                <TrendBar key={t.month} label={t.month?.slice(5)} revenue={t.revenue} expenses={t.expenses} profit={t.profit} />
              ))}
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2 text-[11px] text-[#48566E]"><span className="w-3 h-3 rounded-sm bg-[rgba(0,229,160,0.3)]" />Revenue</div>
              <div className="flex items-center gap-2 text-[11px] text-[#48566E]"><span className="w-3 h-3 rounded-sm bg-[#00E5A0]" />Profit</div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] text-[#48566E] font-mono">
                    <th className="text-left py-2 pr-4">Month</th>
                    <th className="text-right pr-4">Revenue</th>
                    <th className="text-right pr-4">Expenses</th>
                    <th className="text-right pr-4">Profit</th>
                    <th className="text-right">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {trend.map((t: any) => (
                    <tr key={t.month} className="border-t border-[#1E2737]">
                      <td className="py-2 pr-4 text-[#8A95B0] font-mono">{t.month}</td>
                      <td className="py-2 pr-4 text-right text-[#F0F4FF] font-mono">{inr(t.revenue)}</td>
                      <td className="py-2 pr-4 text-right text-[#FF5B6B] font-mono">{inr(t.expenses)}</td>
                      <td className={`py-2 pr-4 text-right font-mono ${t.profit >= 0 ? "text-[#00E5A0]" : "text-[#FF5B6B]"}`}>{inr(t.profit)}</td>
                      <td className="py-2 text-right text-[#8A95B0] font-mono">{t.orders?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "margin" && margin && (
          <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
            <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-4">Contribution Margin by Product (Last 30 Days)</div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] text-[#48566E] font-mono">
                    <th className="text-left py-2 pr-4">Product</th>
                    <th className="text-right pr-4">Units</th>
                    <th className="text-right pr-4">Revenue</th>
                    <th className="text-right pr-4">Var. Costs</th>
                    <th className="text-right pr-4">CM</th>
                    <th className="text-right">CM%</th>
                  </tr>
                </thead>
                <tbody>
                  {margin.map((m: any) => (
                    <tr key={m.product} className="border-t border-[#1E2737] hover:bg-[#1C2230]">
                      <td className="py-2 pr-4 text-[#F0F4FF] max-w-[200px] truncate">{m.product}</td>
                      <td className="py-2 pr-4 text-right text-[#8A95B0] font-mono">{m.units_sold?.toLocaleString()}</td>
                      <td className="py-2 pr-4 text-right text-[#F0F4FF] font-mono">{inr(m.revenue)}</td>
                      <td className="py-2 pr-4 text-right text-[#FF5B6B] font-mono">{inr(m.variable_costs)}</td>
                      <td className={`py-2 pr-4 text-right font-mono ${m.contribution_margin >= 0 ? "text-[#00E5A0]" : "text-[#FF5B6B]"}`}>
                        {inr(m.contribution_margin)}
                      </td>
                      <td className="py-2 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          m.cm_pct >= 30 ? "bg-[rgba(0,229,160,0.1)] text-[#00E5A0]" :
                          m.cm_pct >= 15 ? "bg-[rgba(255,173,59,0.1)] text-[#FFAD3B]" :
                          "bg-[rgba(255,91,107,0.1)] text-[#FF5B6B]"
                        }`}>
                          {m.cm_pct?.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-[11px] text-[#48566E] font-mono">
              Note: Variable costs estimated at 45% (COGS 35% + shipping 8% + payment 2%). Add actual expenses for precision.
            </div>
          </div>
        )}

        {activeTab === "cashflow" && cashflow && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
              <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-4">Current Month Actuals</div>
              <div className="space-y-4">
                {[
                  { label: "Monthly Revenue (base)", value: cashflow.base_monthly_revenue, color: "#00E5A0" },
                  { label: "Monthly Expenses (base)", value: cashflow.base_monthly_expenses, color: "#FF5B6B" },
                  { label: "Monthly Net Cash Flow", value: cashflow.base_monthly_net, color: cashflow.base_monthly_net >= 0 ? "#00E5A0" : "#FF5B6B" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-[#1E2737]">
                    <span className="text-[12px] text-[#8A95B0]">{label}</span>
                    <span className="text-[14px] font-mono font-bold" style={{ color }}>{inr(value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0F1217] border border-[#1E2737] rounded-xl p-5">
              <div className="text-[11px] text-[#48566E] font-mono uppercase tracking-wider mb-4">3-Month Projection</div>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] text-[#48566E] font-mono">
                    <th className="text-left py-1.5">Month</th>
                    <th className="text-right">Revenue</th>
                    <th className="text-right">Expenses</th>
                    <th className="text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {cashflow.projections?.map((p: any) => (
                    <tr key={p.month} className="border-t border-[#1E2737]">
                      <td className="py-2 text-[#8A95B0] font-mono">{p.month}</td>
                      <td className="py-2 text-right text-[#F0F4FF] font-mono">{inr(p.projected_revenue)}</td>
                      <td className="py-2 text-right text-[#FF5B6B] font-mono">{inr(p.projected_expenses)}</td>
                      <td className={`py-2 text-right font-mono ${p.projected_net >= 0 ? "text-[#00E5A0]" : "text-[#FF5B6B]"}`}>
                        {inr(p.projected_net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 text-[10px] text-[#48566E] font-mono">{cashflow.assumptions}</div>
            </div>
          </div>
        )}
      </div>

      {showAddExpense && (
        <AddExpenseModal onClose={() => setShowAddExpense(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["finance"] })} />
      )}
    </div>
  );
}
