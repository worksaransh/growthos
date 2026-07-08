"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { AppIcon } from "@/components/shared/app-icon";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

// ─── Types ─────────────────────────────────────────────────────────────────

type IntegrationStatus = "connected" | "reconnect" | "not_connected" | "coming_soon";

interface IntegrationDef {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  featured?: boolean;
  connectType: "oauth_shopify" | "oauth_meta" | "oauth_google" | "coming_soon";
}

// ─── Catalogue ─────────────────────────────────────────────────────────────
// Active (connectable): Shopify, Meta Ads, Google Ads, Google Search Console, GA4
// Everything else: coming_soon

const CATALOGUE: IntegrationDef[] = [
  // ── ACTIVE ──────────────────────────────────────────────────────────────
  { id: "shopify",    name: "Shopify",               category: "ecommerce",  icon: "shopify",         description: "Real-time sync of orders, inventory, customers, and LTV. The core data layer for GrowthOS.",           featured: true, connectType: "oauth_shopify" },
  { id: "meta",       name: "Meta Ads",              category: "marketing",  icon: "campaign",        description: "Campaign performance, ROAS tracking, audience attribution, and creative analytics from Facebook & Instagram.", featured: true, connectType: "oauth_meta" },
  { id: "google-ads", name: "Google Ads",            category: "marketing",  icon: "travel_explore",  description: "Search campaigns, Shopping ads, PMax performance, and keyword-level ROAS tracking.",                  featured: true, connectType: "oauth_google" },
  { id: "gsc",        name: "Google Search Console", category: "analytics",  icon: "search_insights", description: "Organic keyword rankings, click-through rates, impressions, and indexing health from Google Search.",              connectType: "oauth_google" },
  { id: "ga4",        name: "Google Analytics 4",    category: "analytics",  icon: "analytics",       description: "Web traffic, user events, conversion funnels, and engagement metrics from your storefront.",                      connectType: "oauth_google" },

  // ── COMING SOON ──────────────────────────────────────────────────────────
  { id: "amazon",        name: "Amazon",              category: "ecommerce",  icon: "shopping_bag",   description: "Seller Central: multi-channel profit, inventory, and FBA analytics.",                        connectType: "coming_soon" },
  { id: "woocommerce",   name: "WooCommerce",         category: "ecommerce",  icon: "store",          description: "WordPress store: sync orders, products, and customer data.",                                 connectType: "coming_soon" },
  { id: "flipkart",      name: "Flipkart",            category: "ecommerce",  icon: "local_mall",     description: "Flipkart Seller Hub: orders, returns, and performance intelligence.",                        connectType: "coming_soon" },
  { id: "myntra",        name: "Myntra",              category: "ecommerce",  icon: "checkroom",       description: "Fashion marketplace: sales, returns, and brand performance.",                                connectType: "coming_soon" },
  { id: "meesho",        name: "Meesho",              category: "ecommerce",  icon: "store",          description: "Social commerce: reseller network and order analytics.",                                     connectType: "coming_soon" },
  { id: "nykaa",         name: "Nykaa",               category: "ecommerce",  icon: "spa",            description: "Beauty & wellness marketplace integration.",                                                  connectType: "coming_soon" },
  { id: "ondc",          name: "ONDC",                category: "ecommerce",  icon: "hub",            description: "Open Network for Digital Commerce: unified marketplace channel.",                             connectType: "coming_soon" },
  { id: "whatsapp",      name: "WhatsApp Business",   category: "marketing",  icon: "chat",           description: "Cart recovery, COD confirmation, and re-engagement via WhatsApp (Interakt / WATI).",        connectType: "coming_soon" },
  { id: "hotjar",        name: "Hotjar",              category: "analytics",  icon: "touch_app",      description: "Heatmaps, session recordings, and UX funnel analysis.",                                      connectType: "coming_soon" },
  { id: "mixpanel",      name: "Mixpanel",            category: "analytics",  icon: "bar_chart",      description: "Product analytics, user cohorts, and behaviour funnels.",                                   connectType: "coming_soon" },
  { id: "razorpay",      name: "Razorpay",            category: "finance",    icon: "credit_card",    description: "Payment success rates, failed payments, refunds, and gateway fees.",                         connectType: "coming_soon" },
  { id: "cashfree",      name: "Cashfree",            category: "finance",    icon: "account_balance", description: "COD, UPI, and multi-gateway payment analytics.",                                            connectType: "coming_soon" },
  { id: "tally",         name: "Tally",               category: "finance",    icon: "receipt_long",   description: "Accounting sync, P&L, and GST reconciliation.",                                             connectType: "coming_soon" },
  { id: "shiprocket",    name: "Shiprocket",          category: "shipping",   icon: "local_shipping",  description: "Shipment tracking, RTO rates, and courier performance analytics.",                          connectType: "coming_soon" },
  { id: "delhivery",     name: "Delhivery",           category: "shipping",   icon: "inventory",      description: "Direct Delhivery API for shipment management and delivery intelligence.",                    connectType: "coming_soon" },
  { id: "ecomm-express", name: "Ecomm Express",       category: "shipping",   icon: "package_2",      description: "Pan-India courier network: shipment and RTO tracking.",                                     connectType: "coming_soon" },
];

const ACTIVE_IDS = ["shopify", "meta", "google-ads", "gsc", "ga4"];

const CATEGORIES = [
  { id: "all",       label: "All" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "marketing", label: "Marketing" },
  { id: "analytics", label: "Analytics" },
  { id: "finance",   label: "Finance" },
  { id: "shipping",  label: "Shipping" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function getStatus(id: string, liveList: any[]): IntegrationStatus {
  const def = CATALOGUE.find((c) => c.id === id)!;
  if (def.connectType === "coming_soon") return "coming_soon";
  const live = liveList.find((i: any) => i.platform === id || i.platform === id.replace("-", "_"));
  if (!live) return "not_connected";
  if (live.status === "error" || live.status === "auth_error") return "reconnect";
  return "connected";
}

function getLastSync(id: string, liveList: any[]): string | undefined {
  const live = liveList.find((i: any) => i.platform === id || i.platform === id.replace("-", "_"));
  if (!live?.last_synced_at) return undefined;
  return new Date(live.last_synced_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
}

// ─── StatusBadge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: IntegrationStatus }) {
  if (status === "connected")
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Connected
      </span>
    );
  if (status === "reconnect")
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />Reconnect
      </span>
    );
  if (status === "coming_soon")
    return <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-outline text-[10px] font-bold">Coming Soon</span>;
  return <span className="px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant text-[10px] font-bold">Not Connected</span>;
}

// ─── ActionButton ──────────────────────────────────────────────────────────

function ActionButton({
  status, size = "sm", onClick, loading,
}: {
  status: IntegrationStatus; size?: "sm" | "md"; onClick: () => void; loading?: boolean;
}) {
  const base = size === "md"
    ? "px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 cursor-pointer"
    : "w-full py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-60 cursor-pointer";

  if (status === "connected")
    return <button onClick={onClick} disabled={loading} className={`${base} border border-outline-variant/50 text-on-surface hover:bg-surface-variant/40`}>{loading ? "Syncing…" : "Sync Now"}</button>;
  if (status === "reconnect")
    return <button onClick={onClick} disabled={loading} className={`${base} text-[#0b1326] font-bold`} style={{ background: "linear-gradient(135deg,#494bd6 0%,#c0c1ff 100%)" }}>{loading ? "Connecting…" : "Reconnect"}</button>;
  if (status === "coming_soon")
    return <button disabled className={`${base} border border-outline-variant/20 text-on-surface-variant/40 cursor-not-allowed`}>Coming Soon</button>;
  return <button onClick={onClick} disabled={loading} className={`${base} text-[#0b1326] font-bold`} style={{ background: "linear-gradient(135deg,#494bd6 0%,#c0c1ff 100%)" }}>{loading ? "Connecting…" : "Connect"}</button>;
}

// ─── FeaturedCard ──────────────────────────────────────────────────────────

function FeaturedCard({ def, status, lastSync, onAction, onDisconnect, loading }: {
  def: IntegrationDef; status: IntegrationStatus; lastSync?: string;
  onAction: () => void; onDisconnect: () => void; loading: boolean;
}) {
  const border = status === "connected" ? "border-l-[#4ade80]" : status === "reconnect" ? "border-l-red-500" : "border-l-outline-variant/20";
  return (
    <div className={`glass-card rounded-2xl p-6 flex flex-col relative border-l-4 ${border} hover:border-primary/40 transition-all`}>
      <div className="flex items-start justify-between mb-4">
        <div className="bg-white/5 p-3 rounded-xl">
          <AppIcon name={def.icon} size={32} className="text-on-surface" />
        </div>
        <StatusBadge status={status} />
      </div>
      <h4 className="font-semibold text-base text-on-surface mb-1">{def.name}</h4>
      <p className="text-on-surface-variant text-sm mb-5 flex-1 leading-relaxed">{def.description}</p>
      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="text-[11px] text-outline/70 truncate">
          {status === "connected" && lastSync ? `Synced ${lastSync}` : status === "reconnect" ? "Auth expired — reconnect" : "Not yet connected"}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {status === "connected" && (
            <button onClick={onDisconnect} className="text-[11px] text-outline hover:text-red-400 transition-colors px-2 py-1 rounded">
              Disconnect
            </button>
          )}
          <ActionButton status={status} size="md" onClick={onAction} loading={loading} />
        </div>
      </div>
    </div>
  );
}

// ─── GridCard ──────────────────────────────────────────────────────────────

function GridCard({ def, status, onAction, loading }: {
  def: IntegrationDef; status: IntegrationStatus; onAction: () => void; loading: boolean;
}) {
  return (
    <div className={`glass-card rounded-xl p-4 flex flex-col gap-3 ${status === "coming_soon" ? "opacity-50" : "hover:border-primary/30 transition-all"}`}>
      <div className="flex items-start justify-between">
        <div className="bg-white/5 p-2 rounded-lg">
          <AppIcon name={def.icon} size={20} className="text-on-surface" />
        </div>
        <StatusBadge status={status} />
      </div>
      <div>
        <h5 className="font-semibold text-sm text-on-surface mb-1">{def.name}</h5>
        <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-container border border-outline-variant/20 text-outline capitalize">{def.category}</span>
      </div>
      <p className="text-xs text-on-surface-variant line-clamp-2 flex-1">{def.description}</p>
      <ActionButton status={status} size="sm" onClick={onAction} loading={loading} />
    </div>
  );
}

// ─── DataReadiness ─────────────────────────────────────────────────────────

function DataReadiness({ liveList }: { liveList: any[] }) {
  const connected = liveList.filter((i: any) => ["active", "syncing"].includes(i.status)).length;
  const pct = Math.round((connected / ACTIVE_IDS.length) * 100);
  return (
    <div className="glass-card rounded-2xl p-5 w-full lg:w-64 flex-shrink-0">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Data Readiness</span>
        <span className="text-primary font-bold text-lg">{pct}%</span>
      </div>
      <div className="w-full bg-surface-container-highest h-1.5 rounded-full mb-3 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(pct, 3)}%`, background: "linear-gradient(135deg,#494bd6 0%,#c0c1ff 100%)" }} />
      </div>
      <div className="space-y-1.5">
        {ACTIVE_IDS.map((id) => {
          const def = CATALOGUE.find((c) => c.id === id)!;
          const status = getStatus(id, liveList);
          return (
            <div key={id} className="flex items-center gap-2 text-[11px]">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status === "connected" ? "bg-green-400" : status === "reconnect" ? "bg-red-400" : "bg-outline/30"}`} />
              <span className={status === "connected" ? "text-on-surface" : "text-on-surface-variant/50"}>{def.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────

export function IntegrationsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("all");
  const [shopifyModal, setShopifyModal] = useState(false);
  const [shopifyUrl, setShopifyUrl] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { data: liveList = [] } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => api.getIntegrations(),
    staleTime: 30_000,
  });

  const syncMutation = useMutation({
    mutationFn: (platform: string) => api.triggerSync(platform),
    onSuccess: (_d, platform) => { toast({ type: "success", title: `${platform} sync started` }); queryClient.invalidateQueries({ queryKey: ["integrations"] }); },
    onError: (e: any) => toast({ type: "error", title: "Sync failed", message: e.message }),
  });

  const disconnectMutation = useMutation({
    mutationFn: (platform: string) => api.disconnectIntegration(platform),
    onSuccess: (_d, platform) => { toast({ type: "success", title: `${platform} disconnected` }); queryClient.invalidateQueries({ queryKey: ["integrations"] }); },
    onError: (e: any) => toast({ type: "error", title: "Disconnect failed", message: e.message }),
  });

  const shopifyMutation = useMutation({
    mutationFn: (storeUrl: string) => api.connectShopify(storeUrl),
    onSuccess: (res) => { if (res.authUrl) window.location.href = res.authUrl; },
    onError: (e: any) => toast({ type: "error", title: "Shopify connect failed", message: e.message }),
  });

  async function handleAction(def: IntegrationDef) {
    const status = getStatus(def.id, liveList);
    setLoadingId(def.id);
    try {
      if (status === "connected") {
        await syncMutation.mutateAsync(def.id);
      } else if (def.connectType === "oauth_shopify") {
        setShopifyModal(true);
      } else if (def.connectType === "oauth_meta") {
        const res = await api.connectMeta();
        if (res.authUrl) window.location.href = res.authUrl;
      } else if (def.connectType === "oauth_google") {
        const res = await api.connectGoogle();
        if (res.authUrl) window.location.href = res.authUrl;
      }
    } catch (err: any) {
      const msg = err?.message || "Connection failed";
      // Surface config errors as friendly messages
      if (msg.includes("not configured") || msg.includes("Add META") || msg.includes("Add GOOGLE")) {
        toast({ type: "error", title: "Integration not configured", message: "Credentials missing in backend — contact your admin." });
      } else if (!msg.includes("sync")) {
        toast({ type: "error", title: "Connection failed", message: msg });
      }
    } finally {
      setLoadingId(null);
    }
  }

  async function handleShopifyConnect() {
    if (!shopifyUrl.trim()) { toast({ type: "warning", title: "Enter your Shopify store URL" }); return; }
    setShopifyModal(false);
    await shopifyMutation.mutateAsync(shopifyUrl.trim());
    setShopifyUrl("");
  }

  const filter = (list: IntegrationDef[]) =>
    activeCategory === "all" ? list : list.filter((c) => c.category === activeCategory);

  const activeDefs   = CATALOGUE.filter((c) => c.connectType !== "coming_soon");
  const comingSoon   = CATALOGUE.filter((c) => c.connectType === "coming_soon");
  const featuredDefs = activeDefs.filter((c) => c.featured);
  const gridDefs     = activeDefs.filter((c) => !c.featured);

  const connectedCount = liveList.filter((i: any) => ["active", "syncing"].includes(i.status)).length;

  return (
    <div className="p-6 lg:p-7 space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold text-on-surface mb-2">Integrations</h2>
          <p className="text-on-surface-variant text-base leading-relaxed">
            Connect your data sources to power GrowthOS AI. Start with Shopify, then add ads and analytics for full intelligence.
          </p>
          {connectedCount === 0 && (
            <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-primary/5 border border-primary/20">
              <AppIcon name="lightbulb" size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-on-surface-variant">
                <span className="text-primary font-semibold">Start with Shopify.</span> It unlocks Revenue, Profit Engine, Customer Intel, and Forecast modules instantly.
              </p>
            </div>
          )}
        </div>
        <DataReadiness liveList={liveList} />
      </div>

      {/* ── Category tabs ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.id ? "bg-primary text-on-primary" : "bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:border-primary/50"
            }`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Featured (Shopify, Meta, Google Ads) ───────────────────────── */}
      {filter(featuredDefs).length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest">Core Integrations</h3>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-primary/10 text-primary font-bold">LIVE</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filter(featuredDefs).map((def) => (
              <FeaturedCard key={def.id} def={def}
                status={getStatus(def.id, liveList)}
                lastSync={getLastSync(def.id, liveList)}
                onAction={() => handleAction(def)}
                onDisconnect={() => disconnectMutation.mutate(def.id)}
                loading={loadingId === def.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Grid (GSC, GA4) ────────────────────────────────────────────── */}
      {filter(gridDefs).length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest">Analytics & Intelligence</h3>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-primary/10 text-primary font-bold">LIVE</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filter(gridDefs).map((def) => (
              <GridCard key={def.id} def={def}
                status={getStatus(def.id, liveList)}
                onAction={() => handleAction(def)}
                loading={loadingId === def.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Coming Soon ────────────────────────────────────────────────── */}
      {filter(comingSoon).length > 0 && (
        <section>
          <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-4">Coming Soon</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {filter(comingSoon).map((def) => (
              <div key={def.id} className="glass-card rounded-xl p-3 flex flex-col gap-2 opacity-50">
                <div className="flex items-center gap-2">
                  <AppIcon name={def.icon} size={16} className="text-on-surface-variant" />
                  <span className="text-xs font-medium text-on-surface-variant truncate">{def.name}</span>
                </div>
                <span className="text-[10px] text-outline capitalize">{def.category}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Docs CTA ───────────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-surface-container border border-dashed border-outline-variant/40 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-12 h-12 rounded-xl primary-gradient flex items-center justify-center flex-shrink-0">
          <AppIcon name="menu_book" size={24} className="text-white" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h4 className="font-semibold text-base text-on-surface mb-1">Integration Setup Guide</h4>
          <p className="text-sm text-on-surface-variant">Step-by-step instructions for connecting all 5 platforms. Anyone can follow it independently.</p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button className="px-5 py-2.5 rounded-xl border border-primary text-primary font-bold hover:bg-primary/5 transition-all text-sm whitespace-nowrap">
            View Docs
          </button>
          <button className="px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-variant/40 transition-all text-sm whitespace-nowrap">
            Request Integration
          </button>
        </div>
      </div>

      {/* ── Shopify modal ──────────────────────────────────────────────── */}
      <Modal open={shopifyModal} onClose={() => setShopifyModal(false)} title="Connect Shopify">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-on-surface-variant">Enter your Shopify store URL to start the OAuth connection flow.</p>
          <div>
            <label className="block text-[10px] font-mono text-on-surface-variant/50 uppercase tracking-wider mb-1.5">Store URL</label>
            <Input value={shopifyUrl} onChange={(e) => setShopifyUrl(e.target.value)}
              placeholder="mybrand.myshopify.com"
              onKeyDown={(e) => e.key === "Enter" && handleShopifyConnect()} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleShopifyConnect} disabled={shopifyMutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#0b1326] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#494bd6 0%,#c0c1ff 100%)" }}>
              {shopifyMutation.isPending ? "Connecting…" : "Connect Shopify"}
            </button>
            <button onClick={() => setShopifyModal(false)}
              className="flex-1 py-2.5 rounded-xl text-sm border border-outline-variant/30 text-on-surface-variant hover:text-on-surface">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
