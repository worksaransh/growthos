"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AppIcon } from "@/components/shared/app-icon";

const tiers = [
  {
    name: "Starter",
    monthlyPrice: 4999,
    annualPrice: 3999,
    desc: "Perfect for early-stage D2C brands getting started with data-driven growth.",
    features: [
      { label: "Up to 1Cr GMV per month", included: true },
      { label: "Shopify integration", included: true },
      { label: "Basic profit dashboard", included: true },
      { label: "30-day AI chat history", included: true },
      { label: "Email support", included: true },
      { label: "Meta + Google Ads", included: false },
      { label: "RFM segments", included: false },
      { label: "Forecast Engine", included: false },
      { label: "Custom reports", included: false },
      { label: "Dedicated success manager", included: false },
    ],
    cta: "Start Free Trial",
    href: "/signup",
    popular: false,
  },
  {
    name: "Growth",
    monthlyPrice: 12999,
    annualPrice: 10999,
    desc: "For scaling brands that need full visibility and intelligence to grow profitably.",
    features: [
      { label: "Up to 10Cr GMV per month", included: true },
      { label: "Shopify integration", included: true },
      { label: "Full Profit Engine", included: true },
      { label: "Unlimited AI chat history", included: true },
      { label: "Priority email and chat support", included: true },
      { label: "Meta + Google Ads", included: true },
      { label: "RFM segments", included: true },
      { label: "Forecast Engine", included: true },
      { label: "Custom reports", included: true },
      { label: "Dedicated success manager", included: false },
    ],
    cta: "Start Free Trial",
    href: "/signup",
    popular: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: 0,
    annualPrice: 0,
    desc: "For large D2C brands with high GMV and custom integration requirements.",
    features: [
      { label: "Unlimited GMV", included: true },
      { label: "All integrations", included: true },
      { label: "Full Profit Engine", included: true },
      { label: "Unlimited AI chat history", included: true },
      { label: "SLA-backed support", included: true },
      { label: "Meta + Google Ads", included: true },
      { label: "RFM segments", included: true },
      { label: "Forecast Engine", included: true },
      { label: "Custom reports", included: true },
      { label: "Dedicated success manager", included: true },
    ],
    cta: "Contact Sales",
    href: "/contact",
    popular: false,
  },
];

const faqs = [
  {
    q: "Is there a free trial?",
    a: "Yes. All plans come with a 14-day free trial. No credit card required. You get full access to all features in your chosen plan during the trial.",
  },
  {
    q: "What integrations are included?",
    a: "Starter includes Shopify. Growth and Enterprise include Shopify, Meta Ads, Google Ads, Google Analytics, and major Indian payment gateways (Razorpay, Cashfree). Enterprise can include custom integrations.",
  },
  {
    q: "How is GMV calculated?",
    a: "GMV (Gross Merchandise Value) is the total value of orders processed through your connected Shopify store(s) in a rolling 30-day period. If you exceed your plan's GMV limit, we will reach out to upgrade your plan.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel your subscription at any time from your account settings. Your access continues until the end of your billing period. No cancellation fees.",
  },
  {
    q: "Do you offer a discount for annual billing?",
    a: "Yes. Annual billing gives you 2 months free (approximately 17% savings). The annual price is shown when you toggle to annual billing above.",
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full badge-primary text-xs font-medium mb-6">
          Pricing
        </div>
        <h1 className="text-5xl font-bold text-on-surface mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-on-surface-variant max-w-xl mx-auto mb-8">
          No hidden fees. No per-seat charges. One flat price that scales with your brand.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3">
          <span className={cn("text-sm", !annual ? "text-on-surface font-medium" : "text-on-surface-variant")}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors duration-200",
              annual ? "bg-primary" : "bg-outline-variant"
            )}
          >
            <span
              className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200",
                annual ? "translate-x-7" : "translate-x-1"
              )}
            />
          </button>
          <span className={cn("text-sm", annual ? "text-on-surface font-medium" : "text-on-surface-variant")}>
            Annual
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full badge-success">2 months free</span>
          </span>
        </div>
      </div>

      {/* Tier Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "rounded-2xl p-6 flex flex-col relative",
                tier.popular ? "glass-card-high ai-border" : "glass-card"
              )}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full primary-gradient text-white">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-on-surface mb-1">{tier.name}</h3>
                <p className="text-sm text-on-surface-variant mb-5">{tier.desc}</p>

                {tier.name === "Enterprise" ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-on-surface">Custom</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-on-surface">
                      {annual ? tier.annualPrice.toLocaleString("en-IN") : tier.monthlyPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm text-on-surface-variant">/mo</span>
                    {annual && (
                      <span className="text-xs text-on-surface-variant line-through ml-2">
                        {tier.monthlyPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                )}
                {annual && tier.name !== "Enterprise" && (
                  <p className="text-xs text-success-accent mt-1">
                    Billed annually ({(tier.annualPrice * 12).toLocaleString("en-IN")}/yr)
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-2 text-sm">
                    <AppIcon
                      name={f.included ? "check_circle" : "cancel"}
                      className={cn(
                        "mt-0.5",
                        f.included ? "text-success-accent" : "text-on-surface-variant opacity-40"
                      )}
                      size={17}
                    />
                    <span className={f.included ? "text-on-surface-variant" : "text-on-surface-variant opacity-40"}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={cn(
                  "block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all",
                  tier.popular
                    ? "primary-gradient text-white hover:opacity-90"
                    : "border border-outline-variant text-on-surface-variant hover:border-primary hover:text-on-surface"
                )}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <h2 className="text-3xl font-bold text-on-surface text-center mb-10">
          Full feature comparison
        </h2>
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(70,69,84,0.3)]">
                <th className="text-left px-6 py-4 text-sm text-on-surface-variant font-medium w-1/2">
                  Feature
                </th>
                {tiers.map((t) => (
                  <th key={t.name} className="text-center px-4 py-4 text-sm font-semibold text-on-surface">
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "GMV limit", values: ["1Cr/mo", "10Cr/mo", "Unlimited"] },
                { label: "Shopify integration", values: [true, true, true] },
                { label: "Meta + Google Ads", values: [false, true, true] },
                { label: "Profit Engine", values: ["Basic", "Full", "Full"] },
                { label: "Founder AI chat", values: ["30-day history", "Unlimited", "Unlimited"] },
                { label: "RFM segments", values: [false, true, true] },
                { label: "Forecast Engine", values: [false, true, true] },
                { label: "Custom reports", values: [false, true, true] },
                { label: "API access", values: [false, false, true] },
                { label: "Dedicated success manager", values: [false, false, true] },
                { label: "SLA guarantee", values: [false, false, true] },
              ].map((row) => (
                <tr key={row.label} className="border-b border-[rgba(70,69,84,0.15)] last:border-0">
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{row.label}</td>
                  {row.values.map((val, i) => (
                    <td key={i} className="px-4 py-4 text-center">
                      {typeof val === "boolean" ? (
                        <AppIcon
                          name={val ? "check_circle" : "cancel"}
                          className={cn(
                            val ? "text-success-accent" : "text-on-surface-variant opacity-30"
                          )}
                          size={17}
                        />
                      ) : (
                        <span className="text-sm text-on-surface-variant">{val}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <h2 className="text-3xl font-bold text-on-surface text-center mb-10">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-card rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="text-sm font-medium text-on-surface">{faq.q}</span>
                <AppIcon
                  name="expand_more"
                  className={cn(
                    "text-on-surface-variant transition-transform duration-200",
                    openFaq === i && "rotate-180"
                  )}
                  size={18}
                />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-on-surface-variant leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="glass-card-high rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(73,75,214,0.08)] to-[rgba(111,0,190,0.08)] pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-on-surface mb-4">
              Still have questions?
            </h2>
            <p className="text-on-surface-variant mb-8">
              Our team is happy to help you find the right plan for your brand.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="px-8 py-3.5 text-sm font-semibold text-white rounded-xl primary-gradient hover:opacity-90 transition-all"
              >
                Start Free Trial
              </Link>
              <Link
                href="/contact"
                className="px-8 py-3.5 text-sm font-medium text-on-surface-variant rounded-xl border border-outline-variant hover:border-primary hover:text-on-surface transition-all"
              >
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
