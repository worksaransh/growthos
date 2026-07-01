"use client";

import { Badge } from "@/components/ui/badge";

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
            className="grid grid-cols-[1fr_1.2fr_1fr_0.8fr_0.8fr_0.8fr] px-4 py-2.5 gap-2 rounded-lg hover:bg-[#1C2230] transition-colors cursor-pointer"
          >
            <span className="font-mono text-xs text-[#00E5A0]">{o.id}</span>
            <span className="text-xs text-[#8A95B0]">{o.customer}</span>
            <span className="font-mono text-xs text-[#F0F4FF]">
              ₹{o.amount.toLocaleString("en-IN")}
            </span>
            <Badge color={statusColor(o.status)}>{o.status}</Badge>
            <span className="text-xs text-[#8A95B0]">{o.channel}</span>
            <span className="font-mono text-[11px] text-[#48566E]">{o.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
