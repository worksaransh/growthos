export interface KPIMetric {
  value: number;
  delta: number;
  label: string;
  format: "inr" | "x" | "num" | "pct";
  invertDelta?: boolean;
}

export interface DashboardMetrics {
  revenue: KPIMetric;
  profit: KPIMetric;
  adSpend: KPIMetric;
  roas: KPIMetric;
  cac: KPIMetric;
  orders: KPIMetric;
  aov: KPIMetric;
  mer: KPIMetric;
}

export interface TrendPoint {
  date: string;
  revenue: number;
  spend: number;
}

export interface ChannelPerformance {
  name: string;
  spend: number;
  roas: number;
  color: string;
}

export interface Order {
  id: string;
  customer: string;
  amount: number;
  status: "fulfilled" | "pending" | "refunded";
  channel: string;
  time: string;
}

export interface Integration {
  name: string;
  status: "active" | "warning" | "error" | "disconnected";
  lastSync: string;
  icon: string;
  color: string;
  account: string;
}

export interface Report {
  name: string;
  date: string;
  pages: number;
  type: string;
}

export interface DashboardData {
  overview: DashboardMetrics;
  revenueChart: TrendPoint[];
  channelSplit: ChannelPerformance[];
  orders: Order[];
  integrations: Integration[];
  reports: Report[];
}

export interface DateRangePreset {
  label: string;
  days: number | null;
}

export const DATE_RANGES: DateRangePreset[] = [
  { label: "Today", days: 0 },
  { label: "Yesterday", days: 1 },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "This Month", days: null },
  { label: "Last Month", days: null },
];
