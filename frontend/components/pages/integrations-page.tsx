"use client";

import { useState } from "react";

type IntegrationStatus = "connected" | "reconnect" | "not_connected" | "coming_soon";

interface Integration {
  id: string;
  name: string;
  category: string;
  icon: string;
  status: IntegrationStatus;
  lastSync?: string;
  description: string;
  featured?: boolean;
}

const INTEGRATIONS: Integration[] = [
  { id: "shopify", name: "Shopify", category: "ecommerce", icon: "storefront", status: "connected", lastSync: "2m ago", description: "Real-time sync for orders, inventory, and customer LTV.", featured: true },
  { id: "meta", name: "Meta Ads", category: "marketing", icon: "campaign", status: "reconnect", lastSync: "Auth expired 4h ago", description: "Campaign performance, ROAS tracking, and audience attribution.", featured: true },
  { id: "google-ads", name: "Google Ads", category: "marketing", icon: "travel_explore", status: "not_connected", description: "Search campaigns, Shopping ads, PMax performance.", featured: true },
  { id: "amazon", name: "Amazon", category: "ecommerce", icon: "shopping_bag", status: "not_connected", description: "Seller Central: multi-channel profit and inventory." },
  { id: "woocommerce", name: "WooCommerce", category: "ecommerce", icon: "store", status: "not_connected", description: "WordPress store: sync orders and products." },
  { id: "flipkart", name: "Flipkart", category: "ecommerce", icon: "local_mall", status: "not_connected", description: "Flipkart Seller Hub integration." },
  { id: "whatsapp", name: "WhatsApp (Interakt)", category: "marketing", icon: "chat", status: "not_connected", description: "Cart recovery and COD verification automation." },
  { id: "gsc", name: "Google Search Console", category: "analytics", icon: "search_insights", status: "not_connected", description: "Organic traffic, keywords, and ranking data." },
  { id: "ga4", name: "Google Analytics 4", category: "analytics", icon: "analytics", status: "not_connected", description: "Web traffic, events, and conversion funnels." },
  { id: "hotjar", name: "Hotjar", category: "analytics", icon: "touch_app", status: "not_connected", description: "Heatmaps and session recordings." },
  { id: "mixpanel", name: "Mixpanel", category: "analytics", icon: "bar_chart", status: "not_connected", description: "Product analytics and user behavior funnels." },
  { id: "razorpay", name: "Razorpay", category: "finance", icon: "credit_card", status: "not_connected", description: "Payment analytics, failed payments, and gateway fees." },
  { id: "cashfree", name: "Cashfree", category: "finance", icon: "account_balance", status: "not_connected", description: "COD, UPI, and payment gateway analytics." },
  { id: "tally", name: "Tally", category: "finance", icon: "receipt_long", status: "not_connected", description: "Accounting sync and GST reconciliation." },
  { id: "shiprocket", name: "Shiprocket", category: "shipping", icon: "local_shipping", status: "not_connected", description: "Shipment tracking, RTO analytics, courier comparison." },
  { id: "delhivery", name: "Delhivery", category: "shipping", icon: "inventory", status: "not_connected", description: "Direct Delhivery API for shipment management." },
  { id: "ecomm-express", name: "Ecomm Express", category: "shipping", icon: "package_2", status: "not_connected", description: "Pan-India courier network integration." },
  { id: "myntra", name: "Myntra", category: "ecommerce", icon: "checkroom", status: "coming_soon", description: "Fashion marketplace integration." },
  { id: "ondc", name: "ONDC", category: "ecommerce", icon: "hub", status: "coming_soon", description: "Open Network for Digital Commerce." },
  { id: "meesho", name: "Meesho", category: "ecommerce", icon: "storefront", status: "coming_soon", description: "Social commerce platform." },
  { id: "nykaa", name: "Nykaa", category: "ecommerce", icon: "spa", status: "coming_soon", description: "Beauty and wellness marketplace." },
];

const CATEGORIES = [
  { id: "all", label: "All Sources" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "marketing", label: "Marketing" },
  { id: "analytics", label: "Analytics" },
  { id: "finance", label: "Finance" },
  { id: "shipping", label: "Shipping" },
  { id: "payments", label: "Payments" },
];

function StatusBadge({ status }: { status: IntegrationStatus }) {
  if (status === "connected") {
    return (
      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold">
        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
        Connected
      </span>
    );
  }
  if (status === "reconnect") {
    return (
      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-error/10 text-error text-[10px] font-bold">
        <span className="w-2 h-2 rounded-full bg-error inline-block" />
        Reconnect
      </span>
    );
  }
  if (status === "coming_soon") {
    return (
      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
        Coming Soon
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-outline text-[10px] font-bold">
      Not Connected
    </span>
  );
}

function StatusDot({ status }: { status: IntegrationStatus }) {
  if (status === "connected")
    return <span className="w-2 h-2 rounded-full bg-green-400 inline-block flex-shrink-0" />;
  if (status === "reconnect")
    return <span className="w-2 h-2 rounded-full bg-error inline-block flex-shrink-0" />;
  if (status === "coming_soon")
    return <span className="w-2 h-2 rounded-full bg-primary/40 inline-block flex-shrink-0" />;
  return <span className="w-2 h-2 rounded-full bg-outline/40 inline-block flex-shrink-0" />;
}

function ActionButton({ status, size = "sm" }: { status: IntegrationStatus; size?: "sm" | "md" }) {
  const base =
    size === "md"
      ? "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
      : "w-full py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer";
  if (status === "connected") {
    return (
      <button className={`${base} border border-outline-variant/50 text-on-surface hover:bg-surface-variant/40`}>
        Manage
      </button>
    );
  }
  if (status === "reconnect") {
    return (
      <button className={`${base} text-on-primary font-bold shadow-lg`} style={{ background: "linear-gradient(135deg, #494bd6 0%, #c0c1ff 100%)" }}>
        Reconnect
      </button>
    );
  }
  if (status === "coming_soon") {
    return (
      <button className={`${base} border border-outline-variant/30 text-on-surface-variant hover:border-primary/50`}>
        Notify Me
      </button>
    );
  }
  return (
    <button className={`${base} bg-surface-container-high text-on-surface hover:bg-primary hover:text-on-primary`}>
      Connect
    </button>
  );
}

function FeaturedCard({ integration }: { integration: Integration }) {
  const borderColor =
    integration.status === "connected"
      ? "border-l-primary"
      : integration.status === "reconnect"
      ? "border-l-error"
      : "border-l-outline-variant/30";
  return (
    <div className={`glass-card rounded-2xl p-6 flex flex-col items-start relative border-l-4 ${borderColor}`}>
      <div className="bg-white/5 p-3 rounded-xl mb-4">
        <span className="material-symbols-outlined text-4xl text-on-surface">{integration.icon}</span>
      </div>
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <h4 className="font-semibold text-base text-on-surface">{integration.name}</h4>
        <StatusBadge status={integration.status} />
      </div>
      <p className="text-on-surface-variant text-sm mb-6 flex-1">{integration.description}</p>
      <div className="mt-auto w-full flex items-center justify-between gap-3">
        {integration.status === "connected" && (
          <span className="text-xs text-outline">Last sync: {integration.lastSync}</span>
        )}
        {integration.status === "reconnect" && (
          <span className="text-xs text-error">{integration.lastSync}</span>
        )}
        {integration.status === "not_connected" && (
          <span className="text-xs text-outline">Not connected</span>
        )}
        <ActionButton status={integration.status} size="md" />
      </div>
    </div>
  );
}

function IntegrationGridCard({ integration }: { integration: Integration }) {
  const isComingSoon = integration.status === "coming_soon";
  return (
    <div className={`glass-card rounded-xl p-4 flex flex-col gap-3 ${isComingSoon ? "opacity-60 grayscale-[0.3]" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="bg-white/5 p-2 rounded-lg">
          <span className="material-symbols-outlined text-2xl text-on-surface">{integration.icon}</span>
        </div>
        <StatusDot status={integration.status} />
      </div>
      <div>
        <h5 className="font-semibold text-sm text-on-surface mb-1">{integration.name}</h5>
        <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-container border border-outline-variant/20 text-outline capitalize">
          {integration.category}
        </span>
      </div>
      <p className="text-xs text-on-surface-variant line-clamp-2 flex-1">{integration.description}</p>
      <ActionButton status={integration.status} size="sm" />
    </div>
  );
}

function DataReadinessWidget({ integrations }: { integrations: Integration[] }) {
  const important = integrations.filter(
    (i) => i.featured || ["ga4", "razorpay", "shiprocket"].includes(i.id)
  );
  const connected = important.filter((i) => i.status === "connected");
  const pct = Math.round((connected.length / important.length) * 100);
  const activeCount = integrations.filter((i) => i.status === "connected").length;
  return (
    <div className="glass-card rounded-2xl p-6 w-full lg:w-80 relative overflow-hidden flex-shrink-0">
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Data Readiness</span>
          <span className="text-primary font-bold text-xl">{pct}%</span>
        </div>
        <div className="w-full bg-surface-container-highest h-2 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: "linear-gradient(135deg, #494bd6 0%, #c0c1ff 100%)" }}
          />
        </div>
        <p className="text-[11px] text-on-surface-variant/80 italic">
          {activeCount} module{activeCount !== 1 ? "s" : ""} active. Connect Meta Ads to unlock LTV Forecasts.
        </p>
      </div>
    </div>
  );
}

export function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const featured = INTEGRATIONS.filter((i) => i.featured);
  const nonFeatured = INTEGRATIONS.filter((i) => !i.featured && i.status !== "coming_soon");
  const comingSoon = INTEGRATIONS.filter((i) => i.status === "coming_soon");

  const filteredFeatured =
    activeCategory === "all" ? featured : featured.filter((f) => f.category === activeCategory);
  const filteredGrid =
    activeCategory === "all" ? nonFeatured : nonFeatured.filter((i) => i.category === activeCategory);
  const filteredComingSoon =
    activeCategory === "all" ? comingSoon : comingSoon.filter((i) => i.category === activeCategory);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-on-surface mb-2">Integrations</h2>
          <p className="text-on-surface-variant text-base">
            Connect your business ecosystem to fuel the GrowthOS AI engine. Sync sales, marketing, and operational data for real-time forecasting.
          </p>
        </div>
        <DataReadinessWidget integrations={INTEGRATIONS} />
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              activeCategory === cat.id
                ? "bg-primary text-on-primary"
                : "bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:border-primary/50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Featured Integrations */}
      {filteredFeatured.length > 0 && (
        <section>
          <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-4">Featured Sources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredFeatured.map((integration) => (
              <FeaturedCard key={integration.id} integration={integration} />
            ))}
          </div>
        </section>
      )}

      {/* All Integrations Grid */}
      {filteredGrid.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest">Available Extensions</h3>
            <span className="text-sm text-primary font-medium cursor-pointer hover:underline">View all</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredGrid.map((integration) => (
              <IntegrationGridCard key={integration.id} integration={integration} />
            ))}
          </div>
        </section>
      )}

      {/* Coming Soon */}
      {filteredComingSoon.length > 0 && (
        <section>
          <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-4">Coming Soon</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredComingSoon.map((integration) => (
              <IntegrationGridCard key={integration.id} integration={integration} />
            ))}
          </div>
        </section>
      )}

      {/* Custom Source Footer */}
      <div className="mt-4 p-6 rounded-2xl bg-surface-container border border-dashed border-outline-variant/50 flex flex-col items-center text-center">
        <span className="material-symbols-outlined text-5xl text-primary mb-3">terminal</span>
        <h4 className="font-semibold text-base text-on-surface mb-2">Missing a data source?</h4>
        <p className="text-on-surface-variant text-sm mb-6 max-w-lg">
          Our API allows you to push custom data streams from legacy systems or proprietary spreadsheets directly into the GrowthOS engine.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <button className="px-6 py-3 rounded-xl border border-primary text-primary font-bold hover:bg-primary/5 transition-all text-sm">
            View API Docs
          </button>
          <button className="px-6 py-3 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-variant/40 transition-all text-sm">
            Request Integration
          </button>
        </div>
      </div>
    </div>
  );
}
