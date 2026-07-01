"use client"

import { useState, useCallback } from "react"
import { useLiveOrders } from "@/lib/realtime"
import { useGrowthOS } from "@/lib/store"

interface TickerItem {
  id: string
  orderId: string
  amount: number
  customer: string
  ts: string
}

export function LiveOrderTicker() {
  const [items, setItems] = useState<TickerItem[]>([])
  const { addNotification } = useGrowthOS()

  const handleNewOrder = useCallback(
    (order: Record<string, unknown>) => {
      const item: TickerItem = {
        id: crypto.randomUUID(),
        orderId: (order.order_number as string) || "—",
        amount: (order.total_price as number) || 0,
        customer: (order.customer_name as string) || "Customer",
        ts: new Date().toISOString(),
      }
      setItems((prev) => [item, ...prev].slice(0, 5))
      addNotification({
        id: item.id,
        title: `New Order #${item.orderId}`,
        message: `${item.customer} placed an order for ₹${item.amount.toLocaleString("en-IN")}`,
        type: "success",
        read: false,
        timestamp: item.ts,
      })
    },
    [addNotification]
  )

  useLiveOrders(handleNewOrder)

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-40 space-y-2 pointer-events-none">
      {items.slice(0, 3).map((item) => (
        <div
          key={item.id}
          className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-3 pointer-events-auto"
          style={{ minWidth: 280 }}
        >
          <span
            className="material-symbols-outlined text-[#4ade80] text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <div>
            <p className="text-[#dbe2fd] text-xs font-semibold">New Order #{item.orderId}</p>
            <p className="text-[#c7c4d7] text-[10px]">
              ₹{item.amount.toLocaleString("en-IN")} · {item.customer}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
