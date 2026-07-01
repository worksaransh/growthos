/**
 * GrowthOS Global State Store (Zustand)
 * Central state for workspace, user, UI, and data
 */

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

// ── Types ──────────────────────────────────────────────────────────────────

export interface Workspace {
  id: string
  name: string
  slug: string
  plan: "starter" | "growth" | "enterprise"
  shopifyConnected: boolean
  metaConnected: boolean
  googleConnected: boolean
}

export interface User {
  id: string
  email: string
  name: string
  role: "owner" | "admin" | "member" | "viewer"
  avatarUrl?: string
}

export interface DashboardMetrics {
  revenue: number
  revenueChange: number
  orders: number
  ordersChange: number
  aov: number
  aovChange: number
  customers: number
  customersChange: number
  adSpend: number
  roas: number
  roasChange: number
  cac: number
  netProfit: number
  netMargin: number
  lastUpdated?: string
}

export type DateRange = "7d" | "30d" | "90d" | "mtd" | "ytd" | "custom"

interface UIState {
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean
  activePage: string
  dateRange: DateRange
  notificationsOpen: boolean
  unreadNotifications: number
}

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  timestamp: string
  href?: string
}

interface GrowthOSStore {
  // Auth
  user: User | null
  workspace: Workspace | null
  setUser: (user: User | null) => void
  setWorkspace: (workspace: Workspace | null) => void

  // Metrics cache
  metrics: DashboardMetrics | null
  metricsLoading: boolean
  setMetrics: (metrics: DashboardMetrics) => void
  setMetricsLoading: (loading: boolean) => void

  // UI
  ui: UIState
  setSidebarCollapsed: (collapsed: boolean) => void
  setCommandPaletteOpen: (open: boolean) => void
  setActivePage: (page: string) => void
  setDateRange: (range: DateRange) => void
  setNotificationsOpen: (open: boolean) => void
  setUnreadNotifications: (count: number) => void
  decrementUnread: () => void

  // Notifications
  notifications: Notification[]
  addNotification: (n: Notification) => void
  markAllRead: () => void
  clearNotification: (id: string) => void
}

export const useGrowthOS = create<GrowthOSStore>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      workspace: null,
      setUser: (user) => set({ user }),
      setWorkspace: (workspace) => set({ workspace }),

      // Metrics
      metrics: null,
      metricsLoading: false,
      setMetrics: (metrics) => set({ metrics }),
      setMetricsLoading: (loading) => set({ metricsLoading: loading }),

      // UI
      ui: {
        sidebarCollapsed: false,
        commandPaletteOpen: false,
        activePage: "overview",
        dateRange: "30d",
        notificationsOpen: false,
        unreadNotifications: 3,
      },
      setSidebarCollapsed: (collapsed) =>
        set((s) => ({ ui: { ...s.ui, sidebarCollapsed: collapsed } })),
      setCommandPaletteOpen: (open) =>
        set((s) => ({ ui: { ...s.ui, commandPaletteOpen: open } })),
      setActivePage: (page) =>
        set((s) => ({ ui: { ...s.ui, activePage: page } })),
      setDateRange: (range) =>
        set((s) => ({ ui: { ...s.ui, dateRange: range } })),
      setNotificationsOpen: (open) =>
        set((s) => ({ ui: { ...s.ui, notificationsOpen: open } })),
      setUnreadNotifications: (count) =>
        set((s) => ({ ui: { ...s.ui, unreadNotifications: count } })),
      decrementUnread: () =>
        set((s) => ({
          ui: {
            ...s.ui,
            unreadNotifications: Math.max(0, s.ui.unreadNotifications - 1),
          },
        })),

      // Notifications
      notifications: [
        {
          id: "1",
          title: "ROAS Alert",
          message: "Meta campaign ROAS dropped to 1.8x — below 2.5x threshold",
          type: "warning",
          read: false,
          timestamp: new Date(Date.now() - 300000).toISOString(),
          href: "#ads",
        },
        {
          id: "2",
          title: "Shopify Sync Complete",
          message: "247 new orders synced from the last 24 hours",
          type: "success",
          read: false,
          timestamp: new Date(Date.now() - 900000).toISOString(),
        },
        {
          id: "3",
          title: "Low Stock Warning",
          message: "Product 'Mysore Sandal Soap 100g' — only 8 units left",
          type: "warning",
          read: false,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          href: "#products",
        },
        {
          id: "4",
          title: "New VIP Customer",
          message: "Priya Sharma crossed ₹50,000 lifetime value milestone",
          type: "info",
          read: true,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
      addNotification: (n) =>
        set((s) => ({
          notifications: [n, ...s.notifications],
          ui: { ...s.ui, unreadNotifications: s.ui.unreadNotifications + 1 },
        })),
      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
          ui: { ...s.ui, unreadNotifications: 0 },
        })),
      clearNotification: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: "growthos-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        ui: { dateRange: state.ui.dateRange, sidebarCollapsed: state.ui.sidebarCollapsed },
      }),
    }
  )
)

// Selectors
export const useUser = () => useGrowthOS((s) => s.user)
export const useWorkspace = () => useGrowthOS((s) => s.workspace)
export const useMetrics = () => useGrowthOS((s) => ({ metrics: s.metrics, loading: s.metricsLoading }))
export const useDateRange = () => useGrowthOS((s) => s.ui.dateRange)
export const useUnreadCount = () => useGrowthOS((s) => s.ui.unreadNotifications)
export const useNotifications = () => useGrowthOS((s) => s.notifications)
