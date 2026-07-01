"use client"

import { useEffect, useRef } from "react"
import { useGrowthOS, useNotifications } from "@/lib/store"

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const typeConfig = {
  success: { icon: "check_circle", color: "#4ade80", bg: "#4ade80" },
  warning: { icon: "warning",      color: "#fb923c", bg: "#fb923c" },
  error:   { icon: "error",        color: "#ffb4ab", bg: "#ffb4ab" },
  info:    { icon: "info",         color: "#7bd0ff", bg: "#7bd0ff" },
}

export function NotificationCenter() {
  const { ui, setNotificationsOpen, markAllRead, clearNotification } = useGrowthOS()
  const notifications = useNotifications()
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!ui.notificationsOpen) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [ui.notificationsOpen, setNotificationsOpen])

  if (!ui.notificationsOpen) return null

  const unread = notifications.filter((n) => !n.read).length

  return (
    <div
      ref={panelRef}
      className="fixed right-4 top-16 z-50 w-96 max-h-[calc(100vh-5rem)] flex flex-col rounded-2xl border border-white/10 bg-[#0f1729]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
      style={{ boxShadow: "0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[#dbe2fd] font-semibold text-sm">Notifications</h3>
          {unread > 0 && (
            <span className="bg-[#c0c1ff] text-[#0b1326] text-[10px] font-bold px-2 py-0.5 rounded-full">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-[#c0c1ff] text-xs hover:text-white transition-colors"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={() => setNotificationsOpen(false)}
            className="text-[#c7c4d7] hover:text-white"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span
              className="material-symbols-outlined text-4xl text-[#464554] mb-2"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              notifications_none
            </span>
            <p className="text-[#c7c4d7] text-sm">No notifications yet</p>
          </div>
        ) : (
          <div>
            {notifications.map((n) => {
              const cfg = typeConfig[n.type]
              return (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/[0.03] ${
                    !n.read ? "bg-white/[0.02]" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: cfg.bg + "18" }}
                    >
                      <span
                        className="material-symbols-outlined text-sm"
                        style={{ color: cfg.color, fontVariationSettings: "'FILL' 1" }}
                      >
                        {cfg.icon}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm font-medium leading-tight ${
                          !n.read ? "text-[#dbe2fd]" : "text-[#c7c4d7]"
                        }`}
                      >
                        {n.title}
                      </p>
                      <button
                        onClick={() => clearNotification(n.id)}
                        className="flex-shrink-0 text-[#464554] hover:text-[#c7c4d7] transition-colors -mt-0.5"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                    <p className="text-[#918f9a] text-xs mt-0.5 leading-snug">{n.message}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[#464554] text-[10px]">{timeAgo(n.timestamp)}</span>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#c0c1ff]" />}
                      {n.href && (
                        <a
                          href={n.href}
                          className="text-[#c0c1ff] text-[10px] hover:text-white transition-colors"
                        >
                          View →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-white/10 flex-shrink-0">
        <button className="text-[#c0c1ff] text-xs hover:text-white transition-colors">
          View all notifications →
        </button>
      </div>
    </div>
  )
}
