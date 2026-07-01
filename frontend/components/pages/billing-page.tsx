"use client";

import { useState } from "react";

const INVOICES = [
  { id: "INV-2026-006", date: "Jun 1, 2026", amount: "₹12,999", status: "Paid" },
  { id: "INV-2026-005", date: "May 1, 2026", amount: "₹12,999", status: "Paid" },
  { id: "INV-2026-004", date: "Apr 1, 2026", amount: "₹12,999", status: "Paid" },
  { id: "INV-2026-003", date: "Mar 1, 2026", amount: "₹12,999", status: "Paid" },
  { id: "INV-2026-002", date: "Feb 1, 2026", amount: "₹12,999", status: "Paid" },
  { id: "INV-2026-001", date: "Jan 1, 2026", amount: "₹9,999", status: "Paid" },
];

const USAGE_METERS = [
  { label: "GMV Tracked", used: "₹4.8Cr", total: "₹10Cr", pct: 48, color: "bg-primary" },
  { label: "API Calls", used: "24,847", total: "100,000", pct: 25, color: "bg-green-500" },
  { label: "Team Members", used: "3", total: "10", pct: 30, color: "bg-amber-400" },
  { label: "AI Credits", used: "68%", total: "100%", pct: 68, color: "bg-purple-500" },
];

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full bg-surface-container rounded-full h-1.5">
      <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function BillingPage() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  return (
    <div className="p-7 flex flex-col gap-6">
      <div>
        <h2 className="font-syne text-base font-bold text-on-surface">Billing & Subscription</h2>
        <p className="text-xs text-on-surface-variant font-mono mt-0.5">Manage your plan, invoices and payment details</p>
      </div>

      {/* Current plan */}
      <div className="glass-card overflow-hidden">
        <div className="h-1 primary-gradient" />
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-syne font-bold text-on-surface">Current Plan</h3>
                <span className="badge-primary">Growth</span>
                <span className="badge-success">Active</span>
              </div>
              <div className="text-2xl font-syne font-bold text-on-surface mt-2">₹12,999<span className="text-sm font-normal text-on-surface-variant">/month</span></div>
              <div className="text-xs text-on-surface-variant font-mono mt-1">Next billing date: July 1, 2026</div>
            </div>
            <div className="flex gap-2">
              <button className="primary-gradient text-white text-xs font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity">Upgrade to Enterprise</button>
              <button className="text-xs px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors">Manage Plan</button>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-on-surface-variant">GMV Tracked this month</span>
              <span className="text-on-surface">₹4.8Cr / ₹10Cr limit</span>
            </div>
            <ProgressBar pct={48} color="bg-primary" />
          </div>
        </div>
      </div>

      {/* Usage meters */}
      <div>
        <h3 className="font-syne font-bold text-on-surface text-sm mb-3">Usage This Month</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {USAGE_METERS.map((m) => (
            <div key={m.label} className="glass-card p-4 flex flex-col gap-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">{m.label}</div>
              <div className="font-mono font-bold text-on-surface text-lg">{m.used}</div>
              <ProgressBar pct={m.pct} color={m.color} />
              <div className="flex justify-between text-[10px] font-mono text-on-surface-variant">
                <span>{m.pct}% used</span>
                <span>of {m.total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-outline-variant">
          <h3 className="font-syne font-bold text-on-surface text-sm">Invoices</h3>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-outline-variant">
              {["Invoice #", "Date", "Amount", "Status", "Download"].map((h) => (
                <th key={h} className="text-left px-5 py-3 font-mono text-on-surface-variant font-normal uppercase tracking-wider text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv, i) => (
              <tr key={i} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-lowest transition-colors">
                <td className="px-5 py-3 font-mono text-on-surface">{inv.id}</td>
                <td className="px-5 py-3 text-on-surface-variant">{inv.date}</td>
                <td className="px-5 py-3 text-on-surface font-medium">{inv.amount}</td>
                <td className="px-5 py-3"><span className="badge-success">{inv.status}</span></td>
                <td className="px-5 py-3">
                  <button className="text-primary hover:text-primary/80 transition-colors font-mono">↓ PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment method */}
      <div className="glass-card p-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 bg-surface-container rounded border border-outline-variant flex items-center justify-center">
            <span className="text-xs font-bold text-on-surface-variant">VISA</span>
          </div>
          <div>
            <div className="text-sm text-on-surface font-medium">Visa ending in 6411</div>
            <div className="text-xs text-on-surface-variant font-mono mt-0.5">Expires 09/27</div>
          </div>
        </div>
        <button onClick={() => setShowPaymentModal(true)} className="text-xs px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors">Update Payment Method</button>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="glass-card-high p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="font-syne font-bold text-on-surface">Update Payment Method</h3>
            <div className="flex flex-col gap-3">
              <input className="input-base" placeholder="Card number" />
              <div className="grid grid-cols-2 gap-3">
                <input className="input-base" placeholder="MM/YY" />
                <input className="input-base" placeholder="CVV" />
              </div>
              <input className="input-base" placeholder="Cardholder name" />
            </div>
            <div className="flex gap-2">
              <button className="primary-gradient text-white text-xs font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity flex-1">Save Card</button>
              <button onClick={() => setShowPaymentModal(false)} className="text-xs px-5 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
