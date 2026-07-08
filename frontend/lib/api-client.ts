import type { DashboardData } from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token =
      typeof window !== "undefined"
        ? (await import("./supabase/client")).createClient().auth.getSession()
            .then(({ data }) => data.session?.access_token)
        : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      const accessToken = await token;
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(res.status, error.detail || "Unknown error");
    }

    return res.json();
  }

  async getDashboardMetrics(
    startDate: string,
    endDate: string,
    compare?: boolean
  ): Promise<DashboardMetricsResponse> {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    if (compare) params.set("compare", "true");
    return this.request(`/api/v1/dashboard/metrics?${params}`);
  }

  async getRevenueTrends(startDate: string, endDate: string): Promise<TrendResponse> {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    return this.request(`/api/v1/dashboard/trends/revenue?${params}`);
  }

  async getSpendTrends(startDate: string, endDate: string): Promise<TrendResponse> {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    return this.request(`/api/v1/dashboard/trends/spend?${params}`);
  }

  async getIntegrations(): Promise<IntegrationResponse[]> {
    return this.request("/api/v1/integrations");
  }

  async connectShopify(storeUrl: string): Promise<{ authUrl: string }> {
    return this.request("/api/v1/integrations/shopify/connect", {
      method: "POST",
      body: JSON.stringify({ store_url: storeUrl }),
    });
  }

  async disconnectIntegration(platform: string): Promise<void> {
    return this.request(`/api/v1/integrations/${platform}`, {
      method: "DELETE",
    });
  }

  async triggerSync(platform: string): Promise<{ message: string; job_id: string }> {
    return this.request(`/api/v1/sync/trigger/${platform}`, {
      method: "POST",
    });
  }

  async getSyncStatus(): Promise<SyncStatusResponse[]> {
    return this.request("/api/v1/sync/status");
  }

  async getWorkspace(): Promise<WorkspaceResponse> {
    return this.request("/api/v1/settings/workspace");
  }

  async updateWorkspace(data: Partial<WorkspaceResponse>): Promise<WorkspaceResponse> {
    return this.request("/api/v1/settings/workspace", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async initWorkspace(brandName: string): Promise<WorkspaceResponse> {
    return this.request("/api/v1/auth/workspace/init", {
      method: "POST",
      body: JSON.stringify({ brand_name: brandName }),
    });
  }

  async connectMeta(): Promise<{ authUrl: string }> {
    return this.request("/api/v1/integrations/meta/connect", {
      method: "POST",
    });
  }

  async connectGoogle(): Promise<{ authUrl: string }> {
    return this.request("/api/v1/integrations/google/connect", {
      method: "POST",
    });
  }

  async getRecentOrders(limit = 10): Promise<any[]> {
    return this.request(`/api/v1/dashboard/orders?limit=${limit}`);
  }

  // Products
  async getProducts(params?: { sort?: string; limit?: number; offset?: number }) {
    const q = params
      ? new URLSearchParams(Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))).toString()
      : "";
    return this.request<any[]>(`/api/v1/products${q ? "?" + q : ""}`);
  }
  async updateProductCost(productId: string, costPerItem: number) {
    return this.request<any>(`/api/v1/products/${productId}/cost`, {
      method: "POST",
      body: JSON.stringify({ cost_per_item: costPerItem }),
    });
  }

  // Customers
  async getCustomers(params?: { segment?: string; limit?: number; offset?: number }) {
    const q = params
      ? new URLSearchParams(Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))).toString()
      : "";
    return this.request<any[]>(`/api/v1/customers${q ? "?" + q : ""}`);
  }
  async getCustomerSegments() { return this.request<any>("/api/v1/customers/segments"); }

  // Campaigns
  async getCampaigns(params?: { platform?: string; start_date?: string; end_date?: string }) {
    const q = params ? new URLSearchParams(params as any).toString() : "";
    return this.request<any[]>(`/api/v1/campaigns${q ? "?" + q : ""}`);
  }
  async getCampaignSummary(startDate: string, endDate: string) {
    return this.request<any>(`/api/v1/campaigns/summary?start_date=${startDate}&end_date=${endDate}`);
  }

  // Profit
  async getProfitConfig() { return this.request<any>("/api/v1/profit/config"); }
  async saveProfitConfig(data: any) {
    return this.request<any>("/api/v1/profit/config", { method: "POST", body: JSON.stringify(data) });
  }
  async getProfitSummary(startDate: string, endDate: string) {
    return this.request<any>(`/api/v1/profit/summary?start_date=${startDate}&end_date=${endDate}`);
  }
  async getProfitByProduct(startDate: string, endDate: string) {
    return this.request<any[]>(`/api/v1/profit/by-product?start_date=${startDate}&end_date=${endDate}`);
  }
  async getProfitByChannel(startDate: string, endDate: string) {
    return this.request<any[]>(`/api/v1/profit/by-channel?start_date=${startDate}&end_date=${endDate}`);
  }

  // Forecast
  async getForecast() { return this.request<any>("/api/v1/forecast"); }
  async generateForecast() { return this.request<any>("/api/v1/forecast/generate", { method: "POST" }); }

  // Notifications
  async getNotifications() { return this.request<any[]>("/api/v1/notifications"); }
  async markNotificationRead(id: string) {
    return this.request<any>(`/api/v1/notifications/${id}/read`, { method: "POST" });
  }
  async markAllNotificationsRead() {
    return this.request<any>("/api/v1/notifications/read-all", { method: "POST" });
  }

  // Automation
  async getAutomationRules() { return this.request<any[]>("/api/v1/automation/rules"); }
  async createAutomationRule(data: any) {
    return this.request<any>("/api/v1/automation/rules", { method: "POST", body: JSON.stringify(data) });
  }
  async toggleAutomationRule(id: string) {
    return this.request<any>(`/api/v1/automation/rules/${id}/toggle`, { method: "POST" });
  }
  async deleteAutomationRule(id: string) {
    return this.request<any>(`/api/v1/automation/rules/${id}`, { method: "DELETE" });
  }

  // CRM
  async getCrmLeads(status?: string) {
    const q = status ? `?status=${status}` : "";
    return this.request<any[]>(`/api/v1/crm/leads${q}`);
  }
  async createCrmLead(data: any) {
    return this.request<any>("/api/v1/crm/leads", { method: "POST", body: JSON.stringify(data) });
  }
  async updateCrmLead(id: string, data: any) {
    return this.request<any>(`/api/v1/crm/leads/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  }
  async getCrmPipeline() { return this.request<any>("/api/v1/crm/pipeline"); }

  // Reports
  async getReportSummary(startDate: string, endDate: string) {
    return this.request<any>(`/api/v1/reports/summary?start_date=${startDate}&end_date=${endDate}`);
  }
  async exportOrdersCsv(startDate: string, endDate: string) {
    const token =
      typeof window !== "undefined"
        ? await (await import("./supabase/client"))
            .createClient()
            .auth.getSession()
            .then(({ data }) => data.session?.access_token)
        : null;
    const res = await fetch(
      `${this.baseUrl}/api/v1/reports/export/csv?start_date=${startDate}&end_date=${endDate}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Team Settings
  async getTeamMembers() { return this.request<any[]>("/api/v1/settings/team"); }
  async inviteTeamMember(email: string, role: string) {
    return this.request<any>("/api/v1/settings/team/invite", {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
  }
  async removeTeamMember(memberId: string) {
    return this.request<any>(`/api/v1/settings/team/${memberId}`, { method: "DELETE" });
  }

  // ── Generic REST helpers ─────────────────────────────────────────────────
  // Used by new modules (Finance, Operations, Analytics, AI Chat)
  // api.get('/finance/pnl'), api.post('/ai/chat', {...})
  async get<T = any>(path: string): Promise<T> {
    const fullPath = path.startsWith("/api/v1") ? path : `/api/v1${path}`;
    return this.request<T>(fullPath);
  }

  async post<T = any>(path: string, body?: unknown): Promise<T> {
    const fullPath = path.startsWith("/api/v1") ? path : `/api/v1${path}`;
    return this.request<T>(fullPath, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T = any>(path: string, body?: unknown): Promise<T> {
    const fullPath = path.startsWith("/api/v1") ? path : `/api/v1${path}`;
    return this.request<T>(fullPath, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async del<T = any>(path: string): Promise<T> {
    const fullPath = path.startsWith("/api/v1") ? path : `/api/v1${path}`;
    return this.request<T>(fullPath, { method: "DELETE" });
  }

  // Audit
  async getAuditLogs(params?: { action?: string; status?: string; limit?: number; offset?: number }) {
    const q = params ? new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)]))).toString() : "";
    return this.request<any>(`/api/v1/audit/logs${q ? "?" + q : ""}`);
  }
  // Billing
  async getSubscription() { return this.request<any>("/api/v1/billing/subscription"); }
  async getInvoices() { return this.request<any[]>("/api/v1/billing/invoices"); }
  async getPlans() { return this.request<any[]>("/api/v1/billing/plans"); }
  // Attribution
  async getAttribution(model?: string, start?: string, end?: string) {
    const q = new URLSearchParams({ model: model||"last_touch", start_date: start||"", end_date: end||"" }).toString();
    return this.request<any>(`/api/v1/attribution/summary?${q}`);
  }
  async getConversionPaths() { return this.request<any[]>("/api/v1/attribution/paths"); }
  // VIP
  async getVipCustomers() { return this.request<any>("/api/v1/vip/customers"); }
  async getVipSummary() { return this.request<any>("/api/v1/vip/summary"); }
  // Scheduled reports
  async getScheduledReports() { return this.request<any[]>("/api/v1/reports/schedule"); }
  async createScheduledReport(data: any) { return this.request<any>("/api/v1/reports/schedule", { method: "POST", body: JSON.stringify(data) }); }

  async specialistChat(module: string, message: string, sessionId?: string): Promise<{ response: string; module: string }> {
    return this.request('/api/v1/ai/specialist/chat', {
      method: 'POST',
      body: JSON.stringify({ module, message, session_id: sessionId, context_days: 30 })
    })
  }


  async getSeoSummary(startDate?: string, endDate?: string) {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    return this.request(`/api/v1/seo/summary?${params}`)
  }

  async getSeoQueries(limit = 25) {
    return this.request(`/api/v1/seo/queries?limit=${limit}`)
  }

  async getSeoPages(limit = 25) {
    return this.request(`/api/v1/seo/pages?limit=${limit}`)
  }

  async getCapiStatus() {
    return this.request('/api/v1/meta-capi/status')
  }

  // ── Super Admin ────────────────────────────────────────────────────────────
  async getSuperAdminOverview(): Promise<any> {
    return this.request('/api/v1/superadmin/overview')
  }
  async getSuperAdminOrgs(limit = 50, offset = 0): Promise<any[]> {
    return this.request(`/api/v1/superadmin/organizations?limit=${limit}&offset=${offset}`)
  }
  async getSuperAdminUsers(limit = 50, offset = 0, search?: string): Promise<any[]> {
    const p = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (search) p.set('search', search)
    return this.request(`/api/v1/superadmin/users?${p}`)
  }
  async grantPlan(orgId: string, planName: string, notes?: string): Promise<any> {
    return this.request('/api/v1/superadmin/grant-plan', {
      method: 'POST',
      body: JSON.stringify({ org_id: orgId, plan_name: planName, notes }),
    })
  }
  async setBrandAllocation(orgId: string, maxBrands: number, notes?: string): Promise<any> {
    return this.request('/api/v1/superadmin/brand-allocation', {
      method: 'POST',
      body: JSON.stringify({ org_id: orgId, max_brands: maxBrands, notes }),
    })
  }

  async getSuperAdminAdmins(): Promise<any[]> {
    return this.request('/api/v1/superadmin/admins')
  }
  async addPlatformAdmin(userEmail: string, role: string, notes?: string): Promise<any> {
    return this.request('/api/v1/superadmin/admins', {
      method: 'POST',
      body: JSON.stringify({ user_email: userEmail, role, notes }),
    })
  }

  // -- Upgrade / Plans -------------------------------------------------------
  async getBillingPlans(): Promise<any[]> {
    return this.request('/api/v1/billing/plans')
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export interface DashboardMetricsResponse {
  revenue: { value: number; delta_pct: number | null };
  orders: { value: number; delta_pct: number | null };
  ad_spend: { value: number; delta_pct: number | null };
  blended_roas: { value: number; delta_pct: number | null };
  cac: { value: number; delta_pct: number | null };
  gross_profit: { value: number; delta_pct: number | null };
  aov: { value: number; delta_pct: number | null };
  mer: { value: number; delta_pct: number | null };
  last_synced: { shopify: string | null; meta: string | null; google: string | null };
}

export interface TrendResponse {
  data: { date: string; revenue: number; spend: number }[];
}

export interface IntegrationResponse {
  id: string;
  platform: string;
  status: string;
  last_synced_at: string | null;
  platform_account_name: string | null;
}


export interface WorkspaceResponse {
  id: string;
  brand_name: string;
  user_id: string;
  shopify_domain: string | null;
  industry: string | null;
  website: string | null;
  currency: string | null;
  timezone: string | null;
  logo_url: string | null;
  settings: Record<string, any>;
  created_at: string;
}

export interface SyncStatusResponse {
  platform: string;
  status: string;
  last_synced_at: string | null;
  records_synced: number | null;
}

export const api = new ApiClient(
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
    : process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
);