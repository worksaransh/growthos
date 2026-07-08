"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { TopBar } from "@/components/shared/topbar";
import { CommandPalette } from "@/components/shared/command-palette";
import { NotificationCenter } from "@/components/shared/notification-center";
import { LiveOrderTicker } from "@/components/shared/live-ticker";
import { PageVisualIntro, VisualEmptyState, VisualSkeletonGrid } from "@/components/shared/visual-system";
import { AppIcon } from "@/components/shared/app-icon";
import { KPICard } from "@/components/kpi/kpi-card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { ChannelBreakdown } from "@/components/charts/channel-breakdown";
import { ChannelDonut } from "@/components/charts/channel-donut";
import { OrdersTable } from "@/components/dashboard/orders-table";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SyncDot } from "@/components/shared/sync-dot";
import { DeltaBadge } from "@/components/shared/delta-badge";
import { useToast } from "@/components/ui/toast";
import { useDateRange } from "@/lib/hooks";
import {
  useDashboardMetrics,
  useRevenueTrends,
  useSpendTrends,
  useIntegrations,
  useSyncStatus,
  useRecentOrders
} from "@/lib/hooks/use-dashboard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { WorkspaceResponse } from "@/lib/api-client";

// Page components
import {
  ProfitPage,
  AdsPage,
  ProductsPage,
  CustomersPage,
  ForecastPage,
  AiPage,
  AutomationPage,
  ContentPage,
  ReportsPage,
  CrmPage,
  NotificationsPage,
  SeoPage,
  FounderAiPage,
  FinancePage,
  OperationsPage,
  AnalyticsPage,
  AttributionPage,
  CreativeAnalyticsPage,
  BudgetOptimizerPage,
  CustomerJourneyPage,
  VipCustomersPage,
  AdsAiPage,
  SeoAiPage,
  ProductAiPage,
  FinanceAiPage,
  PricingAiPage,
  AutomationAiPage,
  DecisionAiPage,
  ForecastAiPage,
  AlertsPage,
  AuditLogsPage,
  BillingPage,
  SecurityPage,
  WhiteLabelPage,
  IntegrationsPage,
  WorkflowBuilderPage,
  SettingsPage,
  FeaturesDocsPage,
} from "@/components/pages";

const PLATFORM_DETAILS = {
  shopify: { name: "Shopify", icon: "shopify", color: "#00E5A0" },
  meta: { name: "Meta Ads", icon: "meta", color: "#1877F2" },
  google: { name: "Google Ads", icon: "google", color: "#FFAD3B" },
};

const MOCK_DATA = {
  overview: {
    revenue: { value: 4823600, delta: 18.4, label: "Net Revenue", format: "inr" as const },
    profit: { value: 1247800, delta: 22.1, label: "Gross Profit", format: "inr" as const },
    adSpend: { value: 1085200, delta: 9.2, label: "Total Ad Spend", format: "inr" as const },
    roas: { value: 4.45, delta: 8.3, label: "Blended ROAS", format: "x" as const },
    cac: { value: 847, delta: -6.2, label: "CAC", format: "inr" as const, invertDelta: true },
    orders: { value: 1281, delta: 14.7, label: "Orders", format: "num" as const },
    aov: { value: 3766, delta: 3.1, label: "Avg Order Value", format: "inr" as const },
    mer: { value: 1.15, delta: 12.4, label: "MER", format: "x" as const },
  },
  revenueChart: [
    { date: "May 1", revenue: 98000, spend: 22000 },
    { date: "May 3", revenue: 121000, spend: 28000 },
    { date: "May 5", revenue: 89000, spend: 19000 },
    { date: "May 7", revenue: 155000, spend: 34000 },
    { date: "May 9", revenue: 178000, spend: 39000 },
    { date: "May 11", revenue: 134000, spend: 31000 },
    { date: "May 13", revenue: 201000, spend: 44000 },
    { date: "May 15", revenue: 188000, spend: 41000 },
    { date: "May 17", revenue: 215000, spend: 48000 },
    { date: "May 19", revenue: 167000, spend: 37000 },
    { date: "May 21", revenue: 243000, spend: 53000 },
    { date: "May 23", revenue: 229000, spend: 49000 },
    { date: "May 25", revenue: 198000, spend: 43000 },
    { date: "May 27", revenue: 261000, spend: 57000 },
    { date: "May 29", revenue: 247000, spend: 51000 },
  ],
  channelSplit: [
    { name: "Meta Ads", spend: 652000, roas: 4.82, color: "#1877F2" },
    { name: "Google Ads", spend: 433200, roas: 3.91, color: "#3B9EFF" },
  ],
  orders: [
    { id: "#5891", customer: "Priya M.", amount: 4299, status: "fulfilled" as const, channel: "Meta", time: "2m ago" },
    { id: "#5890", customer: "Rahul K.", amount: 2199, status: "pending" as const, channel: "Google", time: "8m ago" },
    { id: "#5889", customer: "Aisha S.", amount: 7499, status: "fulfilled" as const, channel: "Meta", time: "14m ago" },
    { id: "#5888", customer: "Dev P.", amount: 1899, status: "fulfilled" as const, channel: "Direct", time: "22m ago" },
    { id: "#5887", customer: "Sneha R.", amount: 5299, status: "refunded" as const, channel: "Google", time: "35m ago" },
    { id: "#5886", customer: "Aman T.", amount: 3149, status: "fulfilled" as const, channel: "Meta", time: "51m ago" },
    { id: "#5885", customer: "Kavya N.", amount: 8999, status: "fulfilled" as const, channel: "Google", time: "1h ago" },
  ],
  clients: [
    { name: "Urban Thread Co.", revenue: "₹48.2L", roas: "5.1x", cac: "₹712", orders: 1842, status: "active" as const, change: 22 },
    { name: "Glow Naturals", revenue: "₹31.7L", roas: "3.8x", cac: "₹934", orders: 1203, status: "active" as const, change: 8 },
    { name: "Apex Footwear", revenue: "₹62.1L", roas: "4.4x", cac: "₹821", orders: 2341, status: "active" as const, change: -3 },
    { name: "Pure Origins", revenue: "₹19.4L", roas: "2.9x", cac: "₹1120", orders: 714, status: "warning" as const, change: -14 },
    { name: "Bloom & Co.", revenue: "₹27.8L", roas: "4.1x", cac: "₹889", orders: 998, status: "active" as const, change: 18 },
    { name: "Zest Beverages", revenue: "₹11.2L", roas: "2.1x", cac: "₹1340", orders: 389, status: "error" as const, change: -28 },
  ],
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardFallback() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden w-64 border-r border-outline-variant/20 bg-surface-container-low lg:block" />
      <div className="flex-1">
        <div className="h-16 border-b border-outline-variant/20 bg-background/80" />
        <div className="p-7">
          <VisualSkeletonGrid cards={6} className="lg:grid-cols-3" />
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const [page, setPage] = useState("overview");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { dateRange, preset, changePreset } = useDateRange();

  // Cmd+K / Ctrl+K to open command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // API hooks
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(dateRange.start, dateRange.end, true);
  const { data: revTrends } = useRevenueTrends(dateRange.start, dateRange.end);
  const { data: spendTrends } = useSpendTrends(dateRange.start, dateRange.end);
  const { data: integrations, refetch: refetchIntegrations } = useIntegrations();
  const { data: syncLogs } = useSyncStatus();
  const { data: recentOrders } = useRecentOrders(10);

  // Unread notification count for sidebar badge
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.getNotifications(),
    staleTime: 60_000,
  });
  const unreadCount = notifications?.filter((n: any) => !n.read).length ?? 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <NotificationCenter />
      <LiveOrderTicker />
      {cmdOpen && (
        <CommandPalette onNav={(p) => { setPage(p); setCmdOpen(false); }} onClose={() => setCmdOpen(false)} />
      )}
      <Sidebar active={page} onNav={(id) => { setPage(id); setSidebarOpen(false); }} unreadNotifications={unreadCount} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <TopBar
          page={page}
          dateRange={preset}
          onDateChange={changePreset}
          onSearchOpen={() => setCmdOpen(true)}
          onNav={(id) => { setPage(id); setSidebarOpen(false); }}
          onMenuOpen={() => setSidebarOpen(true)}
          unreadNotifications={unreadCount}
        />
        <div className="flex-1 overflow-y-auto pt-16">
          <div key={page} className="page-enter h-full">
          <PageVisualIntro page={page} />
          {page === "overview" && (
            <OverviewPage
              metrics={metrics}
              isLoading={metricsLoading}
              revTrends={revTrends?.data || []}
              spendTrends={spendTrends?.data || []}
              recentOrders={recentOrders || []}
            />
          )}
          {page === "clients" && <ClientsPage />}
          {page === "profit" && <ProfitPage />}
          {page === "ads" && <AdsPage />}
          {page === "products" && <ProductsPage />}
          {page === "customers" && <CustomersPage />}
          {page === "forecast" && <ForecastPage />}
          {page === "ai" && <AiPage />}
          {page === "automation" && <AutomationPage />}
          {page === "content" && <ContentPage />}
          {page === "reports" && <ReportsPage />}
          {page === "crm" && <CrmPage />}
          {page === "notifications" && <NotificationsPage />}
          {page === "seo" && <SeoPage />}
          {page === "founder-ai" && <FounderAiPage />}
          {page === "finance" && <FinancePage />}
          {page === "operations" && <OperationsPage />}
          {page === "analytics" && <AnalyticsPage />}
          {page === "integrations" && <IntegrationsPage />}
          {page === "settings" && <SettingsPage />}
          {page === "attribution" && <AttributionPage />}
          {page === "creative-analytics" && <CreativeAnalyticsPage />}
          {page === "budget-optimizer" && <BudgetOptimizerPage />}
          {page === "customer-journey" && <CustomerJourneyPage />}
          {page === "vip-customers" && <VipCustomersPage />}
          {page === "ads-ai" && <AdsAiPage />}
          {page === "seo-ai" && <SeoAiPage />}
          {page === "product-ai" && <ProductAiPage />}
          {page === "finance-ai" && <FinanceAiPage />}
          {page === "pricing-ai" && <PricingAiPage />}
          {page === "automation-ai" && <AutomationAiPage />}
          {page === "decision-ai" && <DecisionAiPage />}
          {page === "forecast-ai" && <ForecastAiPage />}
          {page === "alerts" && <AlertsPage />}
          {page === "audit-logs" && <AuditLogsPage />}
          {page === "billing" && <BillingPage />}
          {page === "security" && <SecurityPage />}
          {page === "white-label" && <WhiteLabelPage />}
          {page === "workflow-builder" && <WorkflowBuilderPage />}
          {page === "features-docs" && <FeaturesDocsPage onNav={(id) => setPage(id)} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── OVERVIEW PAGE ─────────────────────────────────────────────────
function OverviewPage({
  metrics,
  isLoading,
  revTrends,
  spendTrends,
  recentOrders
}: {
  metrics: any;
  isLoading: boolean;
  revTrends: any[];
  spendTrends: any[];
  recentOrders: any[];
}) {
  const kpis = [
    { label: "Net Revenue", value: metrics?.revenue?.value ?? 0, delta: metrics?.revenue?.delta_pct ?? null, format: "inr" as const, icon: "payments" },
    { label: "Gross Profit", value: metrics?.gross_profit?.value ?? 0, delta: metrics?.gross_profit?.delta_pct ?? null, format: "inr" as const, icon: "trending_up" },
    { label: "Total Ad Spend", value: metrics?.ad_spend?.value ?? 0, delta: metrics?.ad_spend?.delta_pct ?? null, format: "inr" as const, icon: "campaign" },
    { label: "Blended ROAS", value: metrics?.blended_roas?.value ?? 0, delta: metrics?.blended_roas?.delta_pct ?? null, format: "x" as const, icon: "query_stats" },
    { label: "CAC", value: metrics?.cac?.value ?? 0, delta: metrics?.cac?.delta_pct ?? null, format: "inr" as const, invertDelta: true, icon: "group" },
    { label: "Orders", value: metrics?.orders?.value ?? 0, delta: metrics?.orders?.delta_pct ?? null, format: "num" as const, icon: "package" },
  ];

  const totalMetaSpend = spendTrends?.reduce((acc, p) => acc + (p.revenue || 0), 0) ?? 0;
  const totalGoogleSpend = spendTrends?.reduce((acc, p) => acc + (p.spend || 0), 0) ?? 0;

  const channels = [
    { name: "Meta Ads", spend: totalMetaSpend, roas: metrics?.meta_roas?.value ?? 4.82, color: "#1877F2" },
    { name: "Google Ads", spend: totalGoogleSpend, roas: metrics?.google_roas?.value ?? 3.91, color: "#3B9EFF" },
  ];

  const ordersCount = metrics?.orders?.value ?? 0;

  return (
    <div className="p-7 flex flex-col gap-6">
      {isLoading ? (
        <VisualSkeletonGrid cards={6} className="lg:grid-cols-3" />
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {kpis.map((metric, i) => (
          <KPICard
            key={metric.label} label={metric.label} value={metric.value}
            delta={metric.delta} format={metric.format}
            invertDelta={metric.invertDelta}
            icon={metric.icon}
            animClass={`fade-up-${i + 1}`}
          />
        ))}
      </div>
      )}
      <div className="glass-card p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Inter" }}>Revenue vs Ad Spend</h3>
            <p className="text-[11px] text-on-surface-variant/50 font-mono mt-0.5">Daily breakdown · Selected Period</p>
          </div>
        </div>
        <RevenueChart data={revTrends || []} height={200} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-3.5">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-on-surface mb-1" style={{ fontFamily: "Inter" }}>Channel Performance</h3>
          <p className="text-[11px] text-on-surface-variant/50 font-mono mb-4">Spend allocation + ROAS by channel</p>
          <div className="flex justify-center mb-4"><ChannelDonut channels={channels} /></div>
          <ChannelBreakdown channels={channels} />
        </div>
        <div className="glass-card pt-5 pb-2">
          <div className="flex justify-between items-center px-5 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Inter" }}>Live Orders</h3>
              <p className="flex items-center gap-1.5 mt-1">
                <SyncDot status="active" />
                <span className="text-[11px] text-on-surface-variant/50 font-mono">Updating in real-time</span>
              </p>
            </div>
            <span className="badge-success text-xs px-2.5 py-1 rounded-full">{ordersCount.toLocaleString()} orders</span>
          </div>
          <OrdersTable orders={recentOrders || []} />
        </div>
      </div>
    </div>
  );
}

const getGradientForName = (name: string) => {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)",
    "linear-gradient(135deg, #7bd0ff 0%, #c0c1ff 100%)",
    "linear-gradient(135deg, #ddb7ff 0%, #7bd0ff 100%)",
    "linear-gradient(135deg, #4ade80 0%, #7bd0ff 100%)",
    "linear-gradient(135deg, #fb923c 0%, #ddb7ff 100%)",
  ];
  return gradients[hash % gradients.length];
};

// ─── CLIENTS PAGE ──────────────────────────────────────────────────
function ClientsPage() {
  const d = MOCK_DATA;
  return (
    <div className="p-7">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { l: "Total Brands", v: "6", sub: "2 agencies", icon: "store" },
          { l: "Combined Rev.", v: "₹2.0Cr", sub: "Last 30 days", icon: "payments" },
          { l: "Avg ROAS", v: "3.7x", sub: "Across clients", icon: "trending_up" },
          { l: "Total Orders", v: "7,487", sub: "This month", icon: "package" },
        ].map((s, i) => (
          <div key={i} className="glass-card p-4 relative overflow-hidden group hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] text-on-surface-variant/50 font-mono uppercase tracking-wider">{s.l}</div>
              <div className="w-7 h-7 rounded-lg glass-card-high flex items-center justify-center">
                <AppIcon name={s.icon} size={15} className="text-primary" />
              </div>
            </div>
            <div className="font-mono text-[22px] text-on-surface font-medium leading-none mb-1.5">{s.v}</div>
            <div className="text-[11px] text-on-surface-variant/50">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_0.8fr_0.8fr] p-3.5 px-5 border-b border-outline-variant/20 gap-3">
          {["Brand", "Revenue", "ROAS", "CAC", "Orders", "Status", "30D Trend"].map(h => (
            <span key={h} className="text-[10px] text-on-surface-variant/50 font-mono uppercase tracking-wider">{h}</span>
          ))}
        </div>
        {d.clients.map((c, i) => (
          <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_0.8fr_0.8fr] p-3.5 px-5 gap-3 hover:bg-surface-container-high/30 transition-colors cursor-pointer border-b border-outline-variant/10 last:border-0 items-center">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-[#0b1326] uppercase flex-shrink-0"
                style={{ background: getGradientForName(c.name) }}
              >
                {c.name[0]}
              </div>
              <span className="text-sm text-on-surface font-medium">{c.name}</span>
            </div>
            <span className="font-mono text-sm text-on-surface">{c.revenue}</span>
            <span className="font-mono text-sm text-success-accent">{c.roas}</span>
            <span className="font-mono text-sm text-on-surface-variant">{c.cac}</span>
            <span className="font-mono text-sm text-on-surface-variant">{c.orders.toLocaleString()}</span>
            <SyncDot status={c.status} />
            <DeltaBadge delta={c.change} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── INTEGRATIONS PAGE (LEGACY) ─────────────────────────────────────────────
function LegacyIntegrationsPage({
  integrations,
  syncLogs,
  refetch
}: {
  integrations: any[];
  syncLogs: any[];
  refetch: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [shopifyModalOpen, setShopifyModalOpen] = useState(false);
  const [shopifyUrl, setShopifyUrl] = useState("");

  const handleSync = async (platform: string, isConnected: boolean) => {
    if (!isConnected) {
      if (platform === "shopify") {
        setShopifyModalOpen(true);
        return;
      }
      try {
        let authUrl = "";
        if (platform === "meta") {
          const res = await api.connectMeta();
          authUrl = res.authUrl;
        } else if (platform === "google") {
          const res = await api.connectGoogle();
          authUrl = res.authUrl;
        }
        if (authUrl) window.location.href = authUrl;
      } catch (err: any) {
        toast({ type: "error", title: "Failed to connect", message: err.message });
      }
    } else {
      try {
        await api.triggerSync(platform);
        toast({ type: "success", title: `${platform} sync started`, message: "Data will update in a few minutes." });
        queryClient.invalidateQueries({ queryKey: ["sync", "status"] });
      } catch (err: any) {
        toast({ type: "error", title: "Sync trigger failed", message: err.message });
      }
    }
  };

  const handleShopifyConnect = async () => {
    if (!shopifyUrl.trim()) { toast({ type: "warning", title: "Please enter your Shopify store URL" }); return; }
    try {
      const res = await api.connectShopify(shopifyUrl.trim());
      if (res.authUrl) window.location.href = res.authUrl;
    } catch (err: any) {
      toast({ type: "error", title: "Failed to connect Shopify", message: err.message });
    }
    setShopifyModalOpen(false);
  };

  const handleDisconnect = async (platform: string) => {
    try {
      await api.disconnectIntegration(platform);
      toast({ type: "success", title: `${platform} disconnected` });
      refetch();
    } catch (err: any) {
      toast({ type: "error", title: "Failed to disconnect", message: err.message });
    }
  };

  const getCardProps = (platform: "shopify" | "meta" | "google") => {
    const details = PLATFORM_DETAILS[platform];
    const match = integrations?.find((i) => i.platform === platform);
    const isConnected = !!match;
    const statusMap: Record<string, "active" | "warning" | "error" | "disconnected"> = {
      active: "active", syncing: "warning", pending: "warning", error: "error", auth_error: "error", disconnected: "disconnected",
    };
    return {
      name: details.name, icon: details.icon, color: details.color,
      status: match ? statusMap[match.status] || "active" : ("disconnected" as const),
      account: match ? match.platform_account_id || "Connected" : "Not Connected",
      lastSync: match && match.last_synced_at ? new Date(match.last_synced_at).toLocaleString() : "Never",
      onSync: () => handleSync(platform, isConnected),
      onDisconnect: () => isConnected ? handleDisconnect(platform) : handleSync(platform, isConnected),
    };
  };

  return (
    <div className="p-7 flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {(["shopify", "meta", "google"] as const).map((platform) => (
          <IntegrationCard key={platform} {...getCardProps(platform)} />
        ))}
      </div>

      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-on-surface mb-1" style={{ fontFamily: "Inter" }}>Add Integration</h3>
        <p className="text-xs text-on-surface-variant/60 mb-4">Connect additional data sources to enrich your intelligence</p>
        <div className="flex gap-2.5 flex-wrap">
          {["Amazon", "Flipkart", "Razorpay", "WooCommerce", "TikTok Ads"].map(p => (
            <button key={p} className="px-4 py-2 rounded-lg text-xs font-mono bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant/40 cursor-not-allowed flex items-center gap-1.5">
              {p} <span className="badge-info text-[9px] px-1.5 py-0.5 rounded">Soon</span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Inter" }}>Sync History</h3>
        <div className="flex flex-col gap-0.5">
          {syncLogs && syncLogs.length > 0 ? (
            syncLogs.map((log: any, i: number) => (
              <div key={i} className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr] px-3 py-2.5 rounded-lg gap-3 hover:bg-surface-container-high/30 transition-colors">
                <span className="text-xs text-on-surface capitalize">{log.platform}</span>
                <span className="badge-secondary text-[10px] px-2 py-0.5 rounded self-center">{log.sync_type || "manual"}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded self-center ${log.status === "success" ? "badge-success" : log.status === "running" ? "badge-warning" : "badge-error"}`}>{log.status}</span>
                <span className="font-mono text-xs text-on-surface-variant">{log.records_fetched ?? 0} records</span>
                <span className="font-mono text-[11px] text-on-surface-variant/40">{log.started_at ? new Date(log.started_at).toLocaleString() : ""}</span>
              </div>
            ))
          ) : (
            <VisualEmptyState
              icon="refreshccw"
              title="No sync history yet."
              description="Connect a source or trigger your first sync to see a reliable activity trail here."
              actionLabel="Connect data"
              onAction={() => setShopifyModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Shopify URL Modal */}
      <Modal open={shopifyModalOpen} onClose={() => setShopifyModalOpen(false)} title="Connect Shopify">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-on-surface-variant">Enter your Shopify store URL to begin the OAuth connection.</p>
          <div>
            <label className="block text-[10px] font-mono text-on-surface-variant/50 uppercase tracking-wider mb-1.5">Store URL</label>
            <Input
              value={shopifyUrl}
              onChange={e => setShopifyUrl(e.target.value)}
              placeholder="mybrand.myshopify.com"
              className="bg-surface-container-lowest border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/50"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleShopifyConnect} className="flex-1">Connect Shopify</Button>
            <Button onClick={() => setShopifyModalOpen(false)} className="flex-1 bg-transparent border border-outline-variant/20 text-on-surface-variant hover:text-on-surface">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
