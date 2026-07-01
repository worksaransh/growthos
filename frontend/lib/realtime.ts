"use client"

import { useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useGrowthOS } from "./store"

interface RealtimeKPI {
  revenue?: number
  orders?: number
  roas?: number
  aov?: number
}

/**
 * Subscribes to Supabase Realtime for live order updates.
 * Falls back gracefully if Supabase is not connected.
 */
export function useLiveOrders(onNewOrder?: (order: Record<string, unknown>) => void) {
  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null
    try {
      const supabase = createClient()
      channel = supabase
        .channel("live-orders")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "shopify_orders" },
          (payload) => {
            onNewOrder?.(payload.new as Record<string, unknown>)
          }
        )
        .subscribe()
    } catch {
      // Supabase not configured — fail silently
    }
    return () => {
      channel?.unsubscribe()
    }
  }, [onNewOrder])
}

/**
 * Subscribes to Realtime for metric broadcasts.
 * Backend can broadcast on channel "kpi-updates" to push live metric deltas.
 */
export function useLiveMetrics() {
  const { setMetrics, metrics } = useGrowthOS()

  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null
    try {
      const supabase = createClient()
      channel = supabase
        .channel("kpi-updates")
        .on("broadcast", { event: "metrics" }, (payload) => {
          const update = payload.payload as RealtimeKPI
          if (metrics) {
            setMetrics({
              ...metrics,
              ...(update.revenue !== undefined && { revenue: update.revenue }),
              ...(update.orders !== undefined && { orders: update.orders }),
              ...(update.roas !== undefined && { roas: update.roas }),
              ...(update.aov !== undefined && { aov: update.aov }),
              lastUpdated: new Date().toISOString(),
            })
          }
        })
        .subscribe()
    } catch {
      // fail silently
    }
    return () => {
      channel?.unsubscribe()
    }
  }, [metrics, setMetrics])
}

/**
 * Subscribes to workflow execution events for the automation page.
 */
export function useLiveWorkflowExecutions(
  workflowId: string,
  onExecution?: (exec: Record<string, unknown>) => void
) {
  useEffect(() => {
    if (!workflowId) return
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null
    try {
      const supabase = createClient()
      channel = supabase
        .channel(`workflow-${workflowId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "workflow_executions",
            filter: `workflow_id=eq.${workflowId}`,
          },
          (payload) => onExecution?.(payload.new as Record<string, unknown>)
        )
        .subscribe()
    } catch {
      // fail silently
    }
    return () => {
      channel?.unsubscribe()
    }
  }, [workflowId, onExecution])
}
