"use client";

/**
 * UpgradeModal — shown when user hits brand limit (402 from backend)
 * or clicks "Upgrade" anywhere in the app.
 * Plans shown: Pro (2 brands), Enterprise (10 brands).
 */

import { AppIcon } from "./app-icon";

interface Plan {
  name: string;
  price: string;
  period: string;
  brands: number | "Custom";
  channels: number | "Unlimited";
  users: number | "Unlimited";
  highlights: string[];
  cta: string;
  gradient: string;
  featured?: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Pro",
    price: "₹8,299",
    period: "/month",
    brands: 2,
    channels: 6,
    users: 10,
    highlights: [
      "2 brands under 1 login",
      "Switch brands instantly",
      "6 connected channels",
      "Founder AI + all analytics",
      "10 team members",
    ],
    cta: "Upgrade to Pro",
    gradient: "linear-gradient(135deg,#494bd6 0%,#c0c1ff 100%)",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    brands: 10,
    channels: "Unlimited",
    users: "Unlimited",
    highlights: [
      "Up to 10 brands per account",
      "Allocated by GrowthOS admin",
      "Unlimited channels & users",
      "White-label option",
      "Dedicated CSM + SLA",
    ],
    cta: "Contact Sales",
    gradient: "linear-gradient(135deg,#D97706 0%,#FDE68A 100%)",
  },
];

export function UpgradeModal({
  onClose,
  reason,
}: {
  onClose: () => void;
  reason?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-card rounded-2xl p-6 w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Unlock Multi-Brand</h2>
            {reason && (
              <p className="text-sm text-on-surface-variant mt-1">{reason}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-variant/40 transition-colors"
          >
            <AppIcon name="close" size={20} className="text-on-surface-variant" />
          </button>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-5 border flex flex-col gap-4 ${
                plan.featured
                  ? "border-primary/50 bg-primary/5"
                  : "border-outline-variant/30 bg-surface-container"
              }`}
            >
              {plan.featured && (
                <span className="self-start px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-on-primary">
                  MOST POPULAR
                </span>
              )}
              <div>
                <h3 className="text-lg font-bold text-on-surface">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-on-surface">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-on-surface-variant">{plan.period}</span>
                  )}
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex gap-3 flex-wrap">
                {[
                  { icon: "storefront", val: plan.brands === "Custom" ? "10" : `${plan.brands}`, label: "Brands" },
                  { icon: "hub",       val: plan.channels === "Unlimited" ? "∞" : `${plan.channels}`, label: "Channels" },
                  { icon: "group",     val: plan.users === "Unlimited" ? "∞" : `${plan.users}`, label: "Users" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/20">
                    <AppIcon name={s.icon} size={14} className="text-primary" />
                    <span className="text-sm font-bold text-on-surface">{s.val}</span>
                    <span className="text-[11px] text-on-surface-variant">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Highlights */}
              <ul className="space-y-1.5 flex-1">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm text-on-surface-variant">
                    <AppIcon name="check_circle" size={15} className="text-primary mt-0.5 flex-shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  if (plan.name === "Enterprise") {
                    window.open("mailto:sales@growthos.ai?subject=Enterprise Plan Enquiry", "_blank");
                  } else {
                    // TODO: wire to Stripe/Razorpay checkout
                    alert("Redirecting to checkout…");
                  }
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: plan.gradient,
                  color: plan.featured ? "#0b1326" : "#0b1326",
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-on-surface-variant">
          Enterprise accounts are managed by GrowthOS staff.{" "}
          <a href="mailto:support@growthos.ai" className="text-primary underline">
            Contact support
          </a>{" "}
          to get started.
        </p>
      </div>
    </div>
  );
}
