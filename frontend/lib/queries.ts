/**
 * TanStack Query hooks for all GrowthOS API endpoints
 * Provides: loading states, error handling, caching, background refetch
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "./api-client"
import { subDays, format } from "date-fns"

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysToDateRange(days: number): { startDate: string; endDate: string } {
  const endDate = format(new Date(), "yyyy-MM-dd")
  const startDate = format(subDays(new Date(), days), "yyyy-MM-dd")
  return { startDate, endDate }
}

// ── Query Keys ──────────────────────────────────────────────────────────────

export const queryKeys = {
  metrics: (range: string) => ["metrics", range],
  orders: (params: object) => ["orders", params],
  products: (params: object) => ["products", params],
  customers: (params: object) => ["customers", params],
  campaigns: (params: object) => ["campaigns", params],
  forecast: () => ["forecast"],
  attribution: (range: string) => ["attribution", range],
  vip: () => ["vip"],
  auditLogs: (params: object) => ["audit-logs", params],
  notifications: () => ["notifications"],
  integrations: () => ["integrations"],
  seoSummary: (range: string) => ["seo-summary", range],
  seoQueries: () => ["seo-queries"],
  paymentSummary: (days: number) => ["payments", days],
  shippingSummary: (days: number) => ["shipping", days],
  whatsappAnalytics: () => ["whatsapp"],
  scheduledReports: () => ["scheduled-reports"],
  subscription: () => ["subscription"],
  aiChatHistory: (sessionId: string) => ["ai-chat", sessionId],
} as const

// ── Dashboard Metrics ───────────────────────────────────────────────────────

export function useDashboardMetrics(days = 30) {
  return useQuery({
    queryKey: queryKeys.metrics(String(days)),
    queryFn: () => {
      const { startDate, endDate } = daysToDateRange(days)
      return api.getDashboardMetrics(startDate, endDate, true)
    },
    staleTime: 2 * 60 * 1000, // 2 min
    refetchInterval: 5 * 60 * 1000, // refetch every 5 min
    retry: 2,
  })
}

// ── Products ────────────────────────────────────────────────────────────────

export function useProducts(params: { sort?: string; limit?: number; search?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => api.getProducts(params),
    staleTime: 5 * 60 * 1000,
  })
}

// ── Customers ───────────────────────────────────────────────────────────────

export function useCustomers(params: { limit?: number; segment?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.customers(params),
    queryFn: () => api.getCustomers(params),
    staleTime: 5 * 60 * 1000,
  })
}

export function useVipCustomers() {
  return useQuery({
    queryKey: queryKeys.vip(),
    queryFn: () => api.getVipCustomers(),
    staleTime: 10 * 60 * 1000,
  })
}

// ── Campaigns ───────────────────────────────────────────────────────────────

export function useCampaigns(platform?: string) {
  return useQuery({
    queryKey: queryKeys.campaigns({ platform }),
    queryFn: () => api.getCampaigns(platform ? { platform } : undefined),
    staleTime: 3 * 60 * 1000,
  })
}

// ── Attribution ─────────────────────────────────────────────────────────────

export function useAttribution(days = 30) {
  return useQuery({
    queryKey: queryKeys.attribution(String(days)),
    queryFn: () => {
      const { startDate, endDate } = daysToDateRange(days)
      return api.getAttribution(undefined, startDate, endDate)
    },
    staleTime: 10 * 60 * 1000,
  })
}

// ── SEO ─────────────────────────────────────────────────────────────────────

export function useSeoSummary(days = 28) {
  return useQuery({
    queryKey: queryKeys.seoSummary(String(days)),
    queryFn: () => {
      const { startDate, endDate } = daysToDateRange(days)
      return api.getSeoSummary(startDate, endDate)
    },
    staleTime: 30 * 60 * 1000,
  })
}

export function useSeoQueries() {
  return useQuery({
    queryKey: queryKeys.seoQueries(),
    queryFn: () => api.getSeoQueries(),
    staleTime: 30 * 60 * 1000,
  })
}

// ── Payments ─────────────────────────────────────────────────────────────────

export function usePaymentSummary(days = 30) {
  return useQuery({
    queryKey: queryKeys.paymentSummary(days),
    queryFn: () => {
      const { startDate, endDate } = daysToDateRange(days)
      return api.get(`/payments/summary?start_date=${startDate}&end_date=${endDate}`)
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useShippingSummary(days = 30) {
  return useQuery({
    queryKey: queryKeys.shippingSummary(days),
    queryFn: () => {
      const { startDate, endDate } = daysToDateRange(days)
      return api.get(`/shipping/summary?start_date=${startDate}&end_date=${endDate}`)
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ── Audit Logs ───────────────────────────────────────────────────────────────

export function useAuditLogs(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.auditLogs(params),
    queryFn: () => api.getAuditLogs(params),
    staleTime: 60 * 1000,
  })
}

// ── Subscription ─────────────────────────────────────────────────────────────

export function useSubscription() {
  return useQuery({
    queryKey: queryKeys.subscription(),
    queryFn: () => api.getSubscription(),
    staleTime: 15 * 60 * 1000,
  })
}

// ── Integrations ──────────────────────────────────────────────────────────────

export function useIntegrations() {
  return useQuery({
    queryKey: queryKeys.integrations(),
    queryFn: () => api.getIntegrations(),
    staleTime: 5 * 60 * 1000,
  })
}

// ── Notifications ─────────────────────────────────────────────────────────────

export function useApiNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: () => api.getNotifications(),
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  })
}

// ── Scheduled Reports ─────────────────────────────────────────────────────────

export function useScheduledReports() {
  return useQuery({
    queryKey: queryKeys.scheduledReports(),
    queryFn: () => api.getScheduledReports(),
    staleTime: 5 * 60 * 1000,
  })
}

// ── Forecast ──────────────────────────────────────────────────────────────────

export function useForecast() {
  return useQuery({
    queryKey: queryKeys.forecast(),
    queryFn: () => api.getForecast(),
    staleTime: 15 * 60 * 1000,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateScheduledReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createScheduledReport>[0]) =>
      api.createScheduledReport(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.scheduledReports() }),
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications() }),
  })
}

export function useTriggerSync() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (platform: string) => api.triggerSync(platform),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.integrations() }),
  })
}

export function useGenerateForecast() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.generateForecast(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.forecast() }),
  })
}
