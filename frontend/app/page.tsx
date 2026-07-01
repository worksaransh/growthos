"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { AppIcon } from "@/components/shared/app-icon";

const brands = [
  "Urban Thread Co",
  "Glow Naturals",
  "Apex Footwear",
  "Pure Origins",
  "Bloom & Co",
  "Zest Beverages",
  "Leaf & Petal",
  "SwiftWear",
  "NourishMe",
  "Bold Basics",
];

const kpiCards = [
  { label: "Revenue", value: "48.2L", delta: "+18%", up: true },
  { label: "ROAS", value: "4.45x", delta: "+8%", up: true },
  { label: "Orders", value: "1,281", delta: "+15%", up: true },
  { label: "CAC", value: "847", delta: "-6%", up: false },
];

const painPoints = [
  {
    icon: "grid_view",
    title: "Scattered Data",
    desc: "Shopify, Meta, Google all in different tabs. No single source of truth. Decision-making becomes guesswork.",
  },
  {
    icon: "money_off",
    title: "Hidden Margin Leaks",
    desc: "COGS, returns, payment gateway fees silently eating your profit. You are growing revenue but shrinking margins.",
  },
  {
    icon: "hourglass_empty",
    title: "Slow Decisions",
    desc: "Weekly reports by the time you react the window is gone. Your competitors move faster because they have AI.",
  },
];

const features = [
  {
    icon: "auto_awesome",
    title: "Founder AI",
    desc: "Ask anything about your business in plain English. Your AI co-founder answers with data, context, and next steps.",
    accent: "primary",
  },
  {
    icon: "payments",
    title: "Profit Engine",
    desc: "True P&L per SKU, per channel, per campaign. Know exactly where you make and lose money.",
    accent: "secondary",
  },
  {
    icon: "campaign",
    title: "Ads Intelligence",
    desc: "Unified Meta + Google dashboard with AI-powered budget recommendations.",
    accent: "tertiary",
  },
  {
    icon: "bubble_chart",
    title: "RFM Segments",
    desc: "Automatically segment customers by recency, frequency, and monetary value.",
    accent: "primary",
  },
  {
    icon: "query_stats",
    title: "Forecast Engine",
    desc: "AI-powered revenue and inventory forecasts based on historical trends.",
    accent: "secondary",
  },
  {
    icon: "local_shipping",
    title: "Operations",
    desc: "Track fulfillment, returns, and logistics costs in real time.",
    accent: "tertiary",
  },
];

const metrics = [
  { value: "500Cr+", label: "Revenue Tracked" },
  { value: "500+", label: "D2C Brands" },
  { value: "18%", label: "Avg ROAS Improvement" },
  { value: "4.9", label: "Customer Rating" },
];

const pricingTiers = [
  {
    name: "Starter",
    price: "4,999",
    period: "/mo",
    desc: "Perfect for early-stage D2C brands.",
    features: [
      "Up to 1Cr GMV",
      "Shopify integration",
      "Basic profit dashboard",
      "30-day AI chat history",
      "Email support",
    ],
    cta: "Start Free Trial",
    href: "/signup",
    popular: false,
  },
  {
    name: "Growth",
    price: "12,999",
    period: "/mo",
    desc: "For scaling brands that need full intelligence.",
    features: [
      "Up to 10Cr GMV",
      "All integrations (Meta, Google, Shopify)",
      "Full Profit Engine",
      "RFM segments",
      "Forecast Engine",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: "/signup",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large D2C brands with custom needs.",
    features: [
      "Unlimited GMV",
      "Custom integrations",
      "Dedicated success manager",
      "White-glove onboarding",
      "SLA guarantee",
      "Custom AI training",
    ],
    cta: "Contact Sales",
    href: "/contact",
    popular: false,
  },
];

const testimonials = [
  {
    quote:
      "GrowthOS gave us visibility into margins we never had before. We cut CAC by 22% in the first month by killing underperforming ad sets we did not even know existed.",
    name: "Priya Mehta",
    brand: "Founder, Glow Naturals",
  },
  {
    quote:
      "The Founder AI is like having a data analyst, CFO, and growth strategist on call 24/7. I asked it why our ROAS dropped last Tuesday and it pinpointed the exact ad set.",
    name: "Arjun Kapoor",
    brand: "CEO, Urban Thread Co",
  },
  {
    quote:
      "We scaled from 30L to 1.2Cr per month in 6 months. GrowthOS helped us identify the right channels, the right SKUs, and the right customers to double down on.",
    name: "Sneha Iyer",
    brand: "Co-Founder, Apex Footwear",
  },
];

const chatMessages = [
  {
    type: "user",
    text: "Why did my ROAS drop last week on Meta?",
  },
  {
    type: "ai",
    text: "Your Meta ROAS dropped from 4.8x to 3.2x between Jun 22-28. The primary cause: Ad Set #47 (Lookalike 3%, Women 25-34) spent 82,000 at 1.4x ROAS dragging your blended average down. I recommend pausing it and reallocating budget to Ad Set #31 which is running at 6.1x.",
  },
  {
    type: "user",
    text: "Which SKU is most profitable right now?",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const token = localStorage.getItem("growthos_auth_token");
      if (token) {
        router.push("/dashboard");
      }
    } catch {
      // localStorage not available
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <Image
          src="/visuals/founder-workspace.png"
          alt="GrowthOS founder workspace with analytics dashboard, ecommerce orders, and product packaging"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/88 to-background/55" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full badge-primary text-xs font-medium mb-6">
                <span className="text-primary">+</span>
                The AI OS for D2C Brands
              </div>

              <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight text-on-surface mb-6">
                Turn Every Rupee Into{" "}
                <span className="gradient-text">Maximum Profit</span>
              </h1>

              <p className="text-lg text-on-surface-variant leading-relaxed mb-8 max-w-lg">
                GrowthOS connects your Shopify store, Meta Ads, and Google campaigns into one
                AI-powered command center. See your real numbers. Make faster decisions. Grow
                profitably.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
                <Link
                  href="/signup"
                  className="px-6 py-3 text-sm font-semibold text-white rounded-xl primary-gradient hover:opacity-90 transition-all"
                >
                  Start Free Trial
                </Link>
                <button className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-on-surface-variant rounded-xl border border-outline-variant hover:border-primary hover:text-on-surface transition-all">
                  <AppIcon name="play_circle" size={17} />
                  Watch 2-min Demo
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-accent" />
                  Trusted by 500+ D2C brands
                </span>
                <span>·</span>
                <span>500Cr+ Revenue Tracked</span>
                <span>·</span>
                <span>4.9 Star Rating</span>
              </div>
            </div>

            <div className="relative">
              <div className="glass-card-high rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[rgba(73,75,214,0.05)] to-transparent pointer-events-none" />

                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-on-surface-variant mb-0.5">Dashboard - Last 30 days</p>
                    <p className="text-sm font-semibold text-on-surface">Overview</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg badge-success text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-success-accent" />
                    Live
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {kpiCards.map((kpi) => (
                    <div key={kpi.label} className="glass-card rounded-xl p-3.5">
                      <p className="text-xs text-on-surface-variant mb-1">{kpi.label}</p>
                      <p className="text-xl font-bold text-on-surface">{kpi.value}</p>
                      <p
                        className={cn(
                          "text-xs font-medium mt-1",
                          kpi.up ? "metric-up" : "metric-down"
                        )}
                      >
                        {kpi.delta} vs last month
                      </p>
                    </div>
                  ))}
                </div>

                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-on-surface">Revenue Trend</span>
                    <span className="text-xs text-success-accent font-medium">up 18%</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-14">
                    {[40, 55, 48, 62, 58, 72, 68, 80, 75, 88, 82, 96].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm primary-gradient opacity-70"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 glass-card-high rounded-xl px-3 py-2 flex items-center gap-2">
                <AppIcon name="auto_awesome" className="text-primary" size={17} />
                <span className="text-xs font-medium text-on-surface">AI Insight Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 border-y border-[rgba(70,69,84,0.3)] overflow-hidden">
        <div className="flex items-center">
          <p className="shrink-0 text-xs font-semibold uppercase tracking-widest text-on-surface-variant px-8">
            Trusted by
          </p>
          <div
            className="flex items-center gap-8 whitespace-nowrap"
            style={{ animation: "marquee 30s linear infinite" }}
          >
            {[...brands, ...brands].map((brand, i) => (
              <span
                key={i}
                className="text-sm font-semibold text-on-surface-variant opacity-60 hover:opacity-100 transition-opacity cursor-default"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
        `}</style>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              The Problem
            </p>
            <h2 className="text-4xl font-bold text-on-surface">
              Most D2C founders are flying blind
            </h2>
            <p className="mt-4 text-on-surface-variant max-w-xl mx-auto">
              You have data everywhere but no insight anywhere. GrowthOS changes that.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {painPoints.map((p) => (
              <div key={p.title} className="glass-card rounded-2xl p-6">
                <div className="w-11 h-11 rounded-xl bg-[rgba(192,193,255,0.1)] flex items-center justify-center mb-4">
                  <AppIcon name={p.icon} className="text-primary" size={21} />
                </div>
                <h3 className="text-lg font-semibold text-on-surface mb-2">{p.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[rgba(23,31,51,0.3)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Platform
            </p>
            <h2 className="text-4xl font-bold text-on-surface">Everything your brand needs</h2>
            <p className="mt-4 text-on-surface-variant max-w-xl mx-auto">
              Six powerful modules. One unified platform. Zero data silos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bento-card p-6 hover:border-[rgba(192,193,255,0.2)] transition-all duration-200 group cursor-default"
              >
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                    f.accent === "primary" && "bg-[rgba(192,193,255,0.12)]",
                    f.accent === "secondary" && "bg-[rgba(221,183,255,0.12)]",
                    f.accent === "tertiary" && "bg-[rgba(123,208,255,0.12)]"
                  )}
                >
                  <AppIcon
                    name={f.icon}
                    className={cn(
                      f.accent === "primary" && "text-primary",
                      f.accent === "secondary" && "text-secondary",
                      f.accent === "tertiary" && "text-tertiary"
                    )}
                    size={21}
                  />
                </div>
                <h3 className="text-base font-semibold text-on-surface mb-2">{f.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-on-surface transition-colors font-medium"
            >
              See all features
              <AppIcon name="arrow_forward" size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {metrics.map((m) => (
              <div key={m.label} className="text-center">
                <p className="text-4xl font-bold gradient-text mb-2">{m.value}</p>
                <p className="text-sm text-on-surface-variant">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Demo Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[rgba(23,31,51,0.3)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                Founder AI
              </p>
              <h2 className="text-4xl font-bold text-on-surface mb-4">
                Ask your AI co-founder{" "}
                <span className="gradient-text">anything</span>
              </h2>
              <p className="text-on-surface-variant leading-relaxed mb-6">
                No more pulling reports. No more guessing. Ask a question in plain English and get
                a precise, data-backed answer in seconds.
              </p>
              <ul className="space-y-3">
                {[
                  "Why did my ROAS drop?",
                  "Which SKUs are hurting my margins?",
                  "Which customer segment should I target next?",
                  "Forecast next month revenue",
                ].map((q) => (
                  <li key={q} className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <AppIcon name="check_circle" className="text-primary" size={17} />
                    {q}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card-high rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-[rgba(70,69,84,0.3)]">
                <div className="w-8 h-8 rounded-lg primary-gradient flex items-center justify-center">
                  <AppIcon name="auto_awesome" className="text-white" size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Founder AI</p>
                  <p className="text-xs text-success-accent">Online</p>
                </div>
              </div>

              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={cn("flex", msg.type === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed",
                      msg.type === "user"
                        ? "primary-gradient text-white"
                        : "glass-card text-on-surface"
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Ask anything about your business..."
                  className="flex-1 input-pill text-sm"
                  readOnly
                />
                <button className="w-9 h-9 rounded-full primary-gradient flex items-center justify-center shrink-0">
                  <AppIcon name="send" className="text-white" size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Pricing
            </p>
            <h2 className="text-4xl font-bold text-on-surface">Simple, transparent pricing</h2>
            <p className="mt-4 text-on-surface-variant">No hidden fees. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingTiers.map((tier) => (
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
                      POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-on-surface mb-1">{tier.name}</h3>
                  <p className="text-sm text-on-surface-variant mb-4">{tier.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-on-surface">{tier.price}</span>
                    {tier.period && (
                      <span className="text-sm text-on-surface-variant">{tier.period}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-on-surface-variant">
                      <AppIcon name="check_circle" className="text-success-accent mt-0.5" size={17} />
                      {f}
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

          <div className="text-center mt-8">
            <Link
              href="/pricing"
              className="text-sm text-primary hover:text-on-surface transition-colors font-medium"
            >
              View full pricing details
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[rgba(23,31,51,0.3)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Testimonials
            </p>
            <h2 className="text-4xl font-bold text-on-surface">Loved by founders</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="text-yellow-400 text-sm">
                      star
                    </span>
                  ))}
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-5">
                  {t.quote}
                </p>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{t.name}</p>
                  <p className="text-xs text-on-surface-variant">{t.brand}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card-high rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(73,75,214,0.08)] to-[rgba(111,0,190,0.08)] pointer-events-none" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
                Get Started Today
              </p>
              <h2 className="text-4xl font-bold text-on-surface mb-4">
                Ready to see your{" "}
                <span className="gradient-text">real numbers?</span>
              </h2>
              <p className="text-on-surface-variant mb-8 max-w-lg mx-auto">
                Join 500+ D2C brands already using GrowthOS to grow profitably. Set up in under
                10 minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="px-8 py-3.5 text-sm font-semibold text-white rounded-xl primary-gradient hover:opacity-90 transition-all"
                >
                  Start Free Trial - No Credit Card Required
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-3.5 text-sm font-medium text-on-surface-variant rounded-xl border border-outline-variant hover:border-primary hover:text-on-surface transition-all"
                >
                  Talk to Sales
                </Link>
              </div>
              <p className="text-xs text-on-surface-variant mt-4">
                14-day free trial - No credit card needed - Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
