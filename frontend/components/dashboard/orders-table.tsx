"use client";

import { Badge } from "@/components/ui/badge";
import { AppIcon } from "@/components/shared/app-icon";

interface Order {
  id: string;
  customer: string;
  amount: number;
  status: "fulfilled" | "pending" | "refunded";
  channel: string;
  time: string;
}

interface OrdersTableProps {
  orders: Order[];
}

const statusColor = (s: string) => {
  switch (s) {
    case "fulfilled":
      return "#00E5A0";
    case "pending":
      return "#FFAD3B";
    case "refunded":
      return "#FF5B6B";
    default:
      return "#48566E";
  }
};

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

const getChannelIcon = (c: string) => {
  switch (c.toLowerCase()) {
    case "meta":
      return "meta";
    case "google":
      return "google";
    case "shopify":
      return "shopify";
    default:
      return "link";
  }
};

const getChannelColor = (c: string) => {
  switch (c.toLowerCase()) {
    case "meta":
      return "#1877F2";
    case "google":
      return "#FFAD3B";
    case "shopify":
      return "#00E5A0";
    default:
      return "#8A95B0";
  }
};

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <div>
      <div className="grid grid-cols-[1fr_1.2fr_1fr_0.8fr_0.8fr_0.8fr] px-4 pb-2.5 gap-2">
        {["Order", "Customer", "Amount", "Status", "Channel", "Time"].map((h) => (
          <span
            key={h}
            className="text-[10px] text-[#48566E] font-mono uppercase tracking-wider"
          >
            {h}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-0.5">
        {orders.map((o, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_1.2fr_1fr_0.8fr_0.8fr_0.8fr] px-4 py-2.5 gap-2 rounded-lg hover:bg-[#1C2230] items-center transition-colors cursor-pointer"
          >
            <span className="font-mono text-xs text-[#00E5A0] font-semibold">{o.id}</span>
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-[#0b1326] uppercase flex-shrink-0"
                style={{ background: getGradientForName(o.customer) }}
              >
                {o.customer.charAt(0)}
              </div>
              <span className="text-xs text-[#8A95B0] font-medium truncate">{o.customer}</span>
            </div>
            <span className="font-mono text-xs text-[#F0F4FF] font-medium">
              ₹{o.amount.toLocaleString("en-IN")}
            </span>
            <div className="flex">
              <Badge color={statusColor(o.status)}>{o.status}</Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: getChannelColor(o.channel) + "20" }}
              >
                <AppIcon name={getChannelIcon(o.channel)} size={11} style={{ color: getChannelColor(o.channel) }} />
              </div>
              <span className="text-xs text-[#8A95B0] capitalize">{o.channel}</span>
            </div>
            <span className="font-mono text-[11px] text-[#48566E]">{o.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
