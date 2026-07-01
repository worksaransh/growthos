"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { AppIcon } from "@/components/shared/app-icon";
import { EmptyState } from "@/components/shared/empty-state";

const MOCK_PRODUCTS = [
  { name: "Classic Fit Tee — Pack of 3", sku: "CFT-P3-WHT", revenue: 892400, orders: 412, returns: 18, margin: 34.2, inventory: "in_stock", category: "Tops" },
  { name: "Oversized Hoodie", sku: "OSH-NVY-L", revenue: 741200, orders: 287, returns: 12, margin: 41.8, inventory: "in_stock", category: "Outerwear" },
  { name: "Cargo Pants — Olive", sku: "CPT-OLV-M", revenue: 612800, orders: 198, returns: 7, margin: 38.1, inventory: "low_stock", category: "Bottoms" },
  { name: "Linen Shirt — White", sku: "LSH-WHT-M", revenue: 489200, orders: 231, returns: 9, margin: 29.7, inventory: "in_stock", category: "Tops" },
  { name: "Jogger Set — Navy", sku: "JGS-NVY-M", revenue: 421600, orders: 189, returns: 5, margin: 33.4, inventory: "in_stock", category: "Sets" },
  { name: "Polo Tee — 5 Colors", sku: "PLT-5C-M", revenue: 398400, orders: 312, returns: 22, margin: 27.9, inventory: "in_stock", category: "Tops" },
  { name: "Chino Shorts", sku: "CSH-KHK-32", revenue: 321200, orders: 164, returns: 6, margin: 36.2, inventory: "in_stock", category: "Bottoms" },
  { name: "Tracksuit — Charcoal", sku: "TRS-CHR-L", revenue: 298800, orders: 121, returns: 4, margin: 44.1, inventory: "in_stock", category: "Sets" },
  { name: "Denim Jacket — Washed", sku: "DNJ-WSH-M", revenue: 267400, orders: 98, returns: 8, margin: 39.4, inventory: "low_stock", category: "Outerwear" },
  { name: "Compression Shorts", sku: "CMS-BLK-M", revenue: 198800, orders: 212, returns: 14, margin: 22.1, inventory: "in_stock", category: "Activewear" },
];

const MOCK_WORST = [
  { name: "V-Neck Tee — Grey", revenue: 48200, orders: 34, returns: 11, margin: 8.4, inventory: "overstock" },
  { name: "Formal Trouser — Beige", revenue: 38800, orders: 21, returns: 9, margin: 6.2, inventory: "overstock" },
  { name: "Casual Blazer — Tan", revenue: 29400, orders: 14, returns: 7, margin: 4.8, inventory: "overstock" },
];

const MOCK_CATEGORIES = [
  { category: "Tops", revenue: 1780000 },
  { category: "Bottoms", revenue: 934000 },
  { category: "Outerwear", revenue: 1008200 },
  { category: "Sets", revenue: 720400 },
  { category: "Activewear", revenue: 198800 },
];

const MOCK_BUNDLES = [
  { name: "Summer Essentials Pack", items: ["Classic Fit Tee", "Chino Shorts", "Polo Tee"], uplift: "₹320 avg discount · 2.4x AOV uplift" },
  { name: "Workwear Combo", items: ["Linen Shirt", "Chino Shorts"], uplift: "₹180 avg discount · 1.8x AOV uplift" },
  { name: "Athleisure Bundle", items: ["Jogger Set", "Compression Shorts"], uplift: "₹150 avg discount · 1.6x AOV uplift" },
];

function fmt(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v.toFixed(0)}`;
}

function InventoryBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    in_stock: { color: "#00E5A0", label: "In Stock" },
    low_stock: { color: "#FFAD3B", label: "Low Stock" },
    out_of_stock: { color: "#FF5B6B", label: "Out of Stock" },
    overstock: { color: "#3B9EFF", label: "Overstock" },
  };
  const s = map[status] || map.in_stock;
  return <span className="font-mono text-[10px]" style={{ color: s.color }}>{s.label}</span>;
}

export function ProductsPage() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.getProducts({ limit: 50 }),
  });

  const allProducts = products && products.length > 0 ? products : MOCK_PRODUCTS;

  if (isLoading) return (
    <div className="p-7 animate-pulse flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array(4).fill(0).map((_, i) => <div key={i} className="h-24 rounded-xl bg-[#0F1217] border border-[#1E2737]" />)}
      </div>
    </div>
  );

  const hasData = true // Switch to false to see empty state; will be driven by API later

  if (!hasData) return (
    <div className="p-4 lg:p-7 flex items-center justify-center min-h-96">
      <EmptyState icon="inventory_2" title="No products synced" description="Connect your Shopify store to see product performance." />
    </div>
  )

  return (
    <div className="p-7 flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Products", value: "48", sub: "10 categories" },
          { label: "Avg Margin", value: "34.8%", sub: "After COGS" },
          { label: "Return Rate", value: "4.2%", sub: "Industry avg 8%" },
          { label: "Low Stock Alerts", value: "3", sub: "Reorder needed" },
        ].map((k, i) => (
          <Card key={i} className="p-4">
            <div className="text-[10px] text-[#48566E] font-mono uppercase tracking-wider mb-2">{k.label}</div>
            <div className="font-mono text-[22px] text-[#F0F4FF] font-medium">{k.value}</div>
            <div className="text-[11px] text-[#48566E] mt-1">{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Top Products Table */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-[#1E2737]">
          <h3 className="font-syne text-sm font-bold text-[#F0F4FF]">Top Products</h3>
          <p className="text-[11px] text-[#48566E] font-mono mt-0.5">Ranked by revenue · Last 30 days</p>
        </div>
        <div className="grid grid-cols-[0.3fr_2.5fr_1fr_0.8fr_0.8fr_0.8fr_1fr] px-5 py-2.5 border-b border-[#1E2737] gap-3">
          {["#", "Product", "Revenue", "Orders", "Returns", "Margin%", "Stock"].map(h => (
            <span key={h} className="text-[10px] text-[#48566E] font-mono uppercase tracking-wider">{h}</span>
          ))}
        </div>
        {allProducts.map((p: any, i: number) => (
          <div key={i} className="grid grid-cols-[0.3fr_2.5fr_1fr_0.8fr_0.8fr_0.8fr_1fr] px-5 py-3 gap-3 hover:bg-[#151921] transition-colors border-b border-[#1E2737] last:border-0">
            <span className="font-mono text-xs text-[#48566E]">{i + 1}</span>
            <div>
              <div className="text-xs text-[#F0F4FF]">{p.name}</div>
              <div className="text-[10px] text-[#48566E] font-mono mt-0.5">{p.sku}</div>
            </div>
            <span className="font-mono text-xs text-[#F0F4FF]">{fmt(p.revenue)}</span>
            <span className="font-mono text-xs text-[#8A95B0]">{p.orders}</span>
            <span className="font-mono text-xs text-[#FF5B6B]">{p.returns}</span>
            <span className="font-mono text-xs text-[#00E5A0]">{p.margin?.toFixed(1)}%</span>
            <InventoryBadge status={p.inventory} />
          </div>
        ))}
      </Card>

      <div className="grid grid-cols-2 gap-5">
        {/* Category Chart */}
        <Card className="p-5">
          <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-1">Revenue by Category</h3>
          <p className="text-[11px] text-[#48566E] font-mono mb-4">Last 30 days</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MOCK_CATEGORIES} layout="vertical" margin={{ top: 0, right: 10, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2737" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#48566E", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="category" tick={{ fill: "#8A95B0", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0F1217", border: "1px solid #1E2737", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmt(v)} />
              <Bar dataKey="revenue" fill="#3B9EFF" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Worst + Bundles */}
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-3">Worst Performers</h3>
            <div className="flex flex-col gap-2">
              {MOCK_WORST.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,91,107,0.05)] border border-[rgba(255,91,107,0.15)]">
                  <div>
                    <div className="text-xs text-[#F0F4FF]">{p.name}</div>
                    <div className="text-[10px] text-[#48566E] font-mono mt-0.5">{p.orders} orders · {p.returns} returns · {p.margin.toFixed(1)}% margin</div>
                  </div>
                  <InventoryBadge status={p.inventory} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-syne text-sm font-bold text-[#F0F4FF] mb-1">Bundle Suggestions</h3>
            <p className="text-[11px] text-[#48566E] font-mono mb-3">AI-generated product pairs</p>
            <div className="flex flex-col gap-2">
              {MOCK_BUNDLES.map((b, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#151921] border border-[#1E2737]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AppIcon name="auto_awesome" className="text-[#3B9EFF]" size={13} />
                    <span className="text-xs text-[#F0F4FF] font-medium">{b.name}</span>
                  </div>
                  <div className="text-[10px] text-[#48566E] font-mono">{b.items.join(" + ")}</div>
                  <div className="text-[10px] text-[#00E5A0] font-mono mt-1">{b.uplift}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
