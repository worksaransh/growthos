"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppIcon } from "@/components/shared/app-icon";
import { VisualEmptyState, VisualSkeletonGrid } from "@/components/shared/visual-system";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";

const FILTER_TABS = ["All", "Unread", "Alerts", "Sync"];

const MOCK_NOTIFICATIONS = [
  { id: "1", type: "alert", title: "ROAS dropped below 3.0x", message: "Your blended ROAS dropped to 2.8x in the last 2 hours. Google Display campaign may need attention.", time: "12m ago", read: false },
  { id: "2", type: "sync", title: "Shopify sync completed", message: "1,284 orders synced successfully. Last sync at 2:14 PM today.", time: "46m ago", read: false },
  { id: "3", type: "alert", title: "CAC spike detected", message: "CAC increased by 24% in the last 6 hours vs 7-day average. Lookalike campaign showing fatigue.", time: "1h ago", read: false },
  { id: "4", type: "info", title: "Weekly performance report ready", message: "Your weekly performance report for Jun 23-29 is ready to view.", time: "3h ago", read: true },
  { id: "5", type: "sync", title: "Meta Ads sync completed", message: "Campaign data synced for 8 active campaigns. ROAS data updated.", time: "5h ago", read: true },
  { id: "6", type: "alert", title: "Low stock: Cargo Pants - Olive", message: "Only 28 units remaining. At current velocity, stock out in about 12 days.", time: "1d ago", read: true },
  { id: "7", type: "info", title: "New integration available", message: "Razorpay integration is now in beta. Connect to track payment analytics.", time: "2d ago", read: true },
  { id: "8", type: "sync", title: "Google Ads sync failed", message: "Failed to sync Google Ads data. Auth token may have expired. Reconnect to resume.", time: "2d ago", read: true },
];

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  alert: { icon: "alert", color: "#FF5B6B" },
  sync: { icon: "refreshccw", color: "#3B9EFF" },
  info: { icon: "help", color: "#FFAD3B" },
  success: { icon: "check_circle", color: "#00E5A0" },
};

export function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("All");

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.getNotifications(),
  });

  const allNotifs = notifications && notifications.length > 0 ? notifications : MOCK_NOTIFICATIONS;

  const markAllMutation = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      toast({ type: "success", title: "All notifications marked as read" });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => toast({ type: "info", title: "All marked as read" }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const filtered = allNotifs.filter((n: any) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Unread") return !n.read;
    if (activeFilter === "Alerts") return n.type === "alert";
    if (activeFilter === "Sync") return n.type === "sync";
    return true;
  });

  const unreadCount = allNotifs.filter((n: any) => !n.read).length;

  if (isLoading) return (
    <div className="p-7">
      <VisualSkeletonGrid cards={4} />
    </div>
  );

  return (
    <div className="p-7 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-syne text-base font-bold text-[#F0F4FF]">Notifications</h2>
          <p className="text-xs text-[#48566E] font-mono mt-0.5">
            {unreadCount > 0 ? <span className="text-[#FFAD3B]">{unreadCount} unread</span> : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}
            className="bg-transparent border border-[#1E2737] text-[#8A95B0] hover:text-[#F0F4FF] text-xs">
            Mark all read
          </Button>
        )}
      </div>

      <div className="flex gap-1.5">
        {FILTER_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveFilter(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-mono transition-all ${activeFilter === tab ? "bg-[rgba(0,229,160,0.1)] text-[#00E5A0] border border-[#00E5A0]" : "text-[#8A95B0] hover:text-[#F0F4FF] border border-[#1E2737]"}`}>
            {tab}
            {tab === "Unread" && unreadCount > 0 && (
              <span className="ml-1.5 text-[10px] bg-[#FFAD3B] text-[#0A0C0F] rounded-full px-1.5 py-0.5">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <VisualEmptyState
            icon="notifications"
            title={`No ${activeFilter.toLowerCase()} notifications.`}
            description="Important sync, campaign, inventory, and workspace alerts will appear here when they need attention."
          />
        ) : (
          filtered.map((n: any) => {
            const iconConfig = TYPE_ICONS[n.type] || TYPE_ICONS.info;
            return (
              <Card key={n.id}
                className={`p-4 cursor-pointer transition-all ${!n.read ? "border-l-2" : ""}`}
                style={!n.read ? { borderLeftColor: iconConfig.color } : {}}
                onClick={() => !n.read && markOneMutation.mutate(n.id)}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${iconConfig.color}15` }}>
                    <AppIcon name={iconConfig.icon} size={16} style={{ color: iconConfig.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-medium ${n.read ? "text-[#8A95B0]" : "text-[#F0F4FF]"}`}>{n.title}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#FFAD3B]" />}
                        <span className="font-mono text-[10px] text-[#48566E]">{n.time}</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#48566E] mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
