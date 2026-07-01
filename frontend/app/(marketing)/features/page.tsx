"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { AppIcon } from "@/components/shared/app-icon";

const modules = [
  {
    icon: "auto_awesome",
    title: "Founder AI",
    subtitle: "Your AI business co-founder",
    desc: "Ask any question about your business in plain English. Get instant, data-backed answers with recommended actions.",
    accent: "primary",
    features: [
      "Natural language query interface",
      "Real-time data analysis across all channels",
      "Proactive alerts and recommendations",
      "Historical trend analysis",
      "Competitor benchmarking insights",
    ],
  },
  {
    icon: "payments",
    title: "Profit Engine",
    subtitle: "True profitability intelligence",
    desc: "Know exactly where you make and lose money. True P&L per SKU, channel, campaign, and customer segment.",
    accent: "secondary",
    features: [
      "SKU-level margin analysis",
      "Channel profitability breakdown",
      "COGS and returns tracking",
      "Payment gateway fee analysis",
      "Contribution margin reports",
    ],
  },
  {
    icon: "campaign",
    title: "Ads Intelligence",
    subtitle: "Unified ad performance hub",
    desc: "Connect Meta and Google into a single dashboard with AI-powered budget recommendations and creative analysis.",
    accent: "tertiary",
    features: [
      "Unified Meta + Google dashboard",
      "ROAS tracking per campaign and ad set",
      "AI budget allocation recommendations",
      "Creative performance scoring",
      "Audience overlap detection",
    ],
  },
  {
    icon: "bubble_chart",
    title: "RFM Segments",
    subtitle: "Customer intelligence engine",
    desc: "Automatically segment all customers by Recency, Frequency, and Monetary value. Target the right people at the right time.",
    accent: "primary",
    features: [
      "Automated RFM segmentation",
      "Champions, at-risk, lapsed customer tracking",
      "LTV prediction per segment",
      "Segment-level campaign targeting",
      "Cohort retention analysis",
    ],
  },
  {
    icon: "query_stats",
    title: "Forecast Engine",
    subtitle: "AI-powered growth forecasting",
    desc: "Predict next month's revenue, inventory needs, and demand peaks with machine learning models trained on your data.",
    accent: "secondary",
    features: [
      "Revenue forecasting (30/60/90 day)",
      "Inventory demand prediction",
      "Seasonal trend modeling",
      "Scenario planning tools",
      "Reorder point automation",
    ],
  },
  {
    icon: "local_shipping",
    title: "Operations",
    subtitle: "Fulfillment and logistics control",
    desc: "Track every order from placement to delivery. Monitor returns, logistics costs, and fulfillment SLAs in real time.",
    accent: "tertiary",
    features: [
      "Real-time order tracking dashboard",
      "Return rate monitoring by SKU",
      "Logistics cost per order analysis",
      "SLA breach alerting",
      "Warehouse inventory sync",
    ],
  },
  {
    icon: "store",
    title: "Shopify Analytics",
    subtitle: "Deep Shopify intelligence",
    desc: "Go beyond default Shopify reports. Get granular insights into store performance, conversion funnels, and product trends.",
    accent: "primary",
    features: [
      "Conversion funnel analysis",
      "Product page performance",
      "Cart abandonment insights",
      "Discount impact analysis",
      "Collection-level revenue tracking",
    ],
  },
  {
    icon: "bar_chart_4_bars",
    title: "Reports",
    subtitle: "Automated business reports",
    desc: "Daily, weekly, and monthly reports delivered automatically. Customizable dashboards for every role in your team.",
    accent: "secondary",
    features: [
      "Scheduled automated reports",
      "Custom KPI dashboards",
      "Exportable to PDF and Excel",
      "Team sharing and collaboration",
      "White-label reporting",
    ],
  },
  {
    icon: "notifications",
    title: "Alerts",
    subtitle: "Proactive anomaly detection",
    desc: "Never miss a critical change. AI-powered alerts notify you the moment something unusual happens in your business.",
    accent: "tertiary",
    features: [
      "ROAS drop alerts",
      "Revenue anomaly detection",
      "Inventory stockout warnings",
      "Return rate spike alerts",
      "Slack and email notifications",
    ],
  },
  {
    icon: "link",
    title: "Integrations",
    subtitle: "Connect your entire stack",
    desc: "Native integrations with the tools D2C brands already use. One-click setup with no technical expertise required.",
    accent: "primary",
    features: [
      "Shopify (native)",
      "Meta Ads",
      "Google Ads and Analytics",
      "Shiprocket, Delhivery, and more",
      "Razorpay and Cashfree",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full badge-primary text-xs font-medium mb-6">
          Platform
        </div>
        <h1 className="text-5xl font-bold text-on-surface mb-4">
          Every feature your D2C brand needs
        </h1>
        <p className="text-lg text-on-surface-variant max-w-2xl mx-auto mb-8">
          GrowthOS is a complete operating system for D2C brands. Ten powerful modules that work
          together to give you complete visibility and control over your business.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 text-sm font-semibold text-white rounded-xl primary-gradient hover:opacity-90 transition-all"
          >
            Start Free Trial
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-3 text-sm font-medium text-on-surface-variant rounded-xl border border-outline-variant hover:border-primary hover:text-on-surface transition-all"
          >
            See Pricing
          </Link>
        </div>
      </div>

      {/* Modules */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {modules.map((mod, idx) => (
          <div
            key={mod.title}
            className={cn(
              "grid grid-cols-1 lg:grid-cols-2 gap-10 items-center",
              idx % 2 === 1 && "lg:flex-row-reverse"
            )}
          >
            <div className={cn(idx % 2 === 1 && "lg:order-2")}>
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                  mod.accent === "primary" && "bg-[rgba(192,193,255,0.12)]",
                  mod.accent === "secondary" && "bg-[rgba(221,183,255,0.12)]",
                  mod.accent === "tertiary" && "bg-[rgba(123,208,255,0.12)]"
                )}
              >
                <AppIcon
                  name={mod.icon}
                  className={cn(
                    mod.accent === "primary" && "text-primary",
                    mod.accent === "secondary" && "text-secondary",
                    mod.accent === "tertiary" && "text-tertiary"
                  )}
                  size={22}
                />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
                {mod.subtitle}
              </p>
              <h2 className="text-3xl font-bold text-on-surface mb-3">{mod.title}</h2>
              <p className="text-on-surface-variant leading-relaxed mb-6">{mod.desc}</p>
              <ul className="space-y-2.5">
                {mod.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-on-surface-variant">
                    <AppIcon name="check_circle" className="text-success-accent mt-0.5" size={17} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className={cn(idx % 2 === 1 && "lg:order-1")}>
              <div className="glass-card-high rounded-2xl p-8 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[rgba(73,75,214,0.05)] to-transparent pointer-events-none" />
                <div className="text-center">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4",
                      mod.accent === "primary" && "bg-[rgba(192,193,255,0.12)]",
                      mod.accent === "secondary" && "bg-[rgba(221,183,255,0.12)]",
                      mod.accent === "tertiary" && "bg-[rgba(123,208,255,0.12)]"
                    )}
                  >
                    <AppIcon
                      name={mod.icon}
                      className={cn(
                        mod.accent === "primary" && "text-primary",
                        mod.accent === "secondary" && "text-secondary",
                        mod.accent === "tertiary" && "text-tertiary"
                      )}
                      size={34}
                    />
                  </div>
                  <p className="text-sm text-on-surface-variant">{mod.title} Preview</p>
                  <p className="text-xs text-on-surface-variant opacity-50 mt-1">
                    Interactive demo coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 text-center">
        <div className="glass-card-high rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(73,75,214,0.08)] to-[rgba(111,0,190,0.08)] pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-on-surface mb-4">
              Ready to see it all in action?
            </h2>
            <p className="text-on-surface-variant mb-8">
              Start your free trial today. All features included. No credit card required.
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-3.5 text-sm font-semibold text-white rounded-xl primary-gradient hover:opacity-90 transition-all"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
