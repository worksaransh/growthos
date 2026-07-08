"use client";

import { useState, useMemo } from "react";
import { AppIcon } from "@/components/shared/app-icon";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface ModuleDef {
  id: string;
  name: string;
  tagline: string;
  category: string;
  icon: string;
  color: string;
  what: string;
  features: string[];
  howItWorks: string;
  benefits: string[];
  usp: string;
  metrics: string[];
}

const CATEGORIES = ["All", "Core", "Intelligence", "Customers", "Operations", "AI Growth", "AI Modules", "Account"] as const;
type Category = (typeof CATEGORIES)[number];

const CAT_COLORS: Record<string, string> = {
  Core: "#c0c1ff",
  Intelligence: "#7bd0ff",
  Customers: "#ddb7ff",
  Operations: "#4ade80",
  "AI Growth": "#fb923c",
  "AI Modules": "#f472b6",
  Account: "#94a3b8",
};

const MODULES: ModuleDef[] = [
  // ── CORE ──────────────────────────────────────────────────────────────────
  {
    id: "overview", category: "Core", icon: "space_dashboard", color: "#c0c1ff",
    name: "Dashboard Overview", tagline: "Your real-time command centre for the entire business",
    what: "The Dashboard Overview aggregates the most critical metrics from every connected data source — revenue, profit, ad spend, ROAS, CAC, and live orders — into a single high-density view. No switching tabs, no manual report pulls.",
    features: [
      "8 live KPI cards: Revenue, Gross Profit, Ad Spend, Blended ROAS, CAC, Orders, AOV, MER",
      "Revenue vs Ad Spend chart with daily breakdown across selected period",
      "Channel Performance donut: Meta vs Google spend allocation and ROAS",
      "Live Orders table updating in real-time via Shopify webhooks",
      "Date range filter: Today, 7d, 30d, 90d, custom range",
      "Delta badges showing % change vs previous period",
      "Sync dot indicators for live data freshness",
    ],
    howItWorks: "GrowthOS aggregates data from all connected sources every 15 minutes. Pre-computed Supabase aggregates power fast load times. Live orders come through Shopify webhooks which push to a realtime Supabase channel. Delta % calculations compare the selected period vs the identical prior period automatically.",
    benefits: [
      "Save 2–3 hours per day eliminating manual report pulls",
      "Spot revenue drops or ROAS degradation the moment they happen",
      "One-screen briefing before your morning standup",
      "CAC tracking prevents ad overspend before it damages profitability",
    ],
    usp: "Unlike Shopify Analytics or Google Ads dashboards, GrowthOS combines Shopify revenue AND ad platform spend into a single blended view — you see true profitability, not just GMV.",
    metrics: ["Net Revenue", "Gross Profit", "Total Ad Spend", "Blended ROAS", "CAC", "Orders", "AOV", "MER"],
  },
  {
    id: "founder-ai", category: "Core", icon: "auto_awesome", color: "#ddb7ff",
    name: "Founder AI", tagline: "Your always-on AI co-founder that knows your business",
    what: "Founder AI is a conversational intelligence layer trained on your actual business data. Unlike generic AI chatbots, it has real-time access to your revenue, ad performance, customer segments, inventory, and profit data.",
    features: [
      "Natural language questions answered with real business data",
      "Proactive briefings: 'Your ROAS dropped 18% overnight — here's why'",
      "Cross-module synthesis: Shopify + Meta + GSC data in one answer",
      "Suggested follow-up questions based on current anomalies",
      "Exportable AI-generated insights as PDF reports",
      "Voice-of-data mode: turns complex metrics into plain-English narratives",
    ],
    howItWorks: "Each message sends your question along with structured data context (current KPIs, top anomalies, connected sources) to Claude AI via the Anthropic API. The AI synthesises a grounded answer using only your actual integration data — no hallucinated numbers.",
    benefits: [
      "Instant strategic clarity without a data analyst on staff",
      "Replace expensive monthly BI consultant reports with real-time AI answers",
      "Reduce time-to-decision from days to seconds",
      "Catch ROAS drops, CAC spikes, and inventory risks before they compound",
    ],
    usp: "Founder AI is the only AI co-founder that speaks from your actual data, not generic industry averages. It knows your brand, your CAC, your best-selling SKUs, and your weakest campaigns.",
    metrics: ["All KPIs", "Revenue trends", "ROAS by channel", "CAC by campaign", "Top SKUs", "Customer LTV"],
  },

  // ── INTELLIGENCE ──────────────────────────────────────────────────────────
  {
    id: "profit", category: "Intelligence", icon: "payments", color: "#4ade80",
    name: "Profit Engine", tagline: "True net profit after every cost — not just revenue",
    what: "Profit Engine goes beyond GMV and revenue to calculate your actual net profit after COGS, ad spend, shipping, returns, payment gateway fees, and overheads. Most brands track revenue; GrowthOS tracks profit.",
    features: [
      "Net profit after COGS, ad spend, shipping, returns, payment fees",
      "Gross margin % and contribution margin by product and channel",
      "COGS tracking with editable cost inputs per SKU",
      "Ad-attributed profit: revenue generated vs cost per acquisition",
      "Return and refund impact on profit margin",
      "MER (Marketing Efficiency Ratio) tracking",
      "Break-even ROAS calculator with your actual margin data",
    ],
    howItWorks: "Pulls order revenue from Shopify, deducts COGS from your product cost inputs, subtracts ad spend from Meta and Google, applies shipping costs, and computes net profit per period. All calculations update every 15 minutes.",
    benefits: [
      "Know your actual profit — stop celebrating vanity metrics",
      "Identify which products or campaigns are profit-negative despite positive ROAS",
      "Set profitable ROAS targets based on real margins, not industry averages",
      "Negotiate better rates with suppliers using margin data",
    ],
    usp: "Most ecommerce dashboards show revenue. GrowthOS shows profit. The break-even ROAS calculator uses your actual COGS — not estimates — making it the most accurate profitability tool for D2C brands.",
    metrics: ["Net Profit", "Gross Margin %", "Contribution Margin", "MER", "Net ROAS", "Return Rate Impact", "COGS per Order"],
  },
  {
    id: "finance", category: "Intelligence", icon: "account_balance", color: "#7bd0ff",
    name: "Finance & P&L", tagline: "Full P&L statement, updated daily — without an accountant",
    what: "Finance & P&L converts your live business data into a structured Profit & Loss statement. Revenue lines, cost of goods, marketing spend, operational costs, and net income are organised in standard accounting format — ready for investor reviews, board meetings, or tax prep.",
    features: [
      "Full P&L: Revenue → Gross Profit → EBITDA → Net Income",
      "Revenue breakdown by channel: Shopify, Amazon, offline",
      "Cost categorisation: COGS, Marketing, Operations, Overheads",
      "Month-over-month and year-over-year variance tracking",
      "Cash flow waterfall chart",
      "Expense input module for offline costs (rent, salaries, software)",
      "PDF and Excel P&L export with GST estimates",
    ],
    howItWorks: "Revenue flows in from Shopify. Marketing costs from Meta and Google Ads. You manually enter COGS overrides, operational costs, and fixed expenses. GrowthOS aggregates these into a structured P&L using standard accounting logic and recomputes daily.",
    benefits: [
      "Eliminate the month-end scramble to compile numbers for your CA",
      "Impress investors with a real-time P&L during fundraising pitches",
      "Identify cost-category overruns before they hurt the business",
      "Plan headcount and marketing budgets on real gross margin",
    ],
    usp: "GrowthOS is the only D2C operating system that auto-populates a P&L from live ecommerce and ad data. Traditional tools require manual uploads; GrowthOS pulls automatically.",
    metrics: ["Gross Revenue", "Net Revenue", "COGS", "Gross Profit", "Marketing Spend", "EBITDA", "Net Income", "Cash Flow"],
  },
  {
    id: "ads", category: "Intelligence", icon: "campaign", color: "#fb923c",
    name: "Ads Intelligence", tagline: "Meta and Google ad spend in one unified view",
    what: "Ads Intelligence is your unified advertising dashboard combining Meta (Facebook & Instagram) and Google Ads data. Compare performance across platforms, identify budget inefficiencies, and see ROAS at campaign, ad set, and ad level.",
    features: [
      "Blended ROAS across Meta and Google — the single number that matters",
      "Campaign-level: spend, revenue, ROAS, CPM, CTR, CPC, conversions",
      "Ad set and creative drill-down",
      "Day-parting analysis: best hours and days for ad performance",
      "Frequency and reach data for creative fatigue detection",
      "Budget pacing: on-track vs off-track for monthly spend",
    ],
    howItWorks: "Pulls data from Meta Ads API and Google Ads API every 15 minutes. Campaign data is normalised into a common schema and cross-referenced with Shopify order attribution to compute true purchase ROAS.",
    benefits: [
      "Stop managing two dashboards — all ad performance in one place",
      "Identify campaigns with >5x ROAS vs campaigns burning money below 2x",
      "React to ROAS drops same-day instead of end-of-week",
      "Allocate budget to the best-performing platform with data",
    ],
    usp: "GrowthOS combines ad platform data WITH Shopify purchase data for true revenue-attributable ROAS — not the inflated ROAS reported by Meta and Google's own interfaces.",
    metrics: ["Blended ROAS", "Spend by Platform", "CPM", "CTR", "CPC", "Purchase ROAS", "Frequency", "Reach", "Conversions"],
  },
  {
    id: "products", category: "Intelligence", icon: "inventory_2", color: "#c0c1ff",
    name: "Product Intel", tagline: "SKU-level intelligence — revenue, margin, velocity, returns",
    what: "Product Intel gives you SKU-level intelligence — revenue, margins, return rates, inventory velocity, and ad attribution per product. Identify hero products, sunset dead weight, and make data-driven restocking and pricing decisions.",
    features: [
      "SKU-level revenue, units sold, and gross margin",
      "Return rate per product — identify quality or description issues",
      "Inventory velocity: days of stock remaining at current sell rate",
      "Low stock alerts with reorder suggestions",
      "Ad attribution per product: which campaigns drive which SKUs",
      "Top 10 / Bottom 10 SKU ranking tables",
    ],
    howItWorks: "Shopify product and inventory data syncs every 15 minutes. GrowthOS matches order line items to SKUs, applies COGS, and computes margin per product. Ad attribution uses UTM parameters and last-click model.",
    benefits: [
      "Stop restocking slow-moving inventory that ties up working capital",
      "Double down on hero SKUs that drive the most margin",
      "Catch high-return products before they erode profit",
      "Plan ad spend at SKU level — advertise only profitable products",
    ],
    usp: "GrowthOS links ad spend to product-level ROAS — unavailable in Shopify Analytics or standard ad dashboards. You know exactly which SKU your Meta campaign is profitably selling.",
    metrics: ["Revenue/SKU", "Margin/SKU", "Return Rate", "Days of Stock", "Units Sold", "Ad Attribution/SKU", "Velocity Score"],
  },
  {
    id: "customers", category: "Intelligence", icon: "group", color: "#ddb7ff",
    name: "Customer Intel", tagline: "Turn your customer database into a precision growth engine",
    what: "Customer Intel segments your entire customer base by behaviour, value, and lifecycle stage. See who your best customers are, how they found you, what they're worth over time, and which segments are at risk of churning.",
    features: [
      "LTV (Lifetime Value) by acquisition channel and cohort",
      "Customer segmentation: New, Returning, At-Risk, Churned, Champions",
      "AOV distribution and purchase frequency histograms",
      "First-purchase-to-repeat rate by channel",
      "Top 100 customers by LTV with contact details",
      "Churn prediction: customers who haven't ordered in X days",
      "Geographic distribution map",
    ],
    howItWorks: "Shopify customer data syncs and is enriched with attribution data from Meta and Google. GrowthOS clusters customers using RFM scoring and computes LTV using a rolling 12-month window.",
    benefits: [
      "Focus retention spend on high-LTV customers, not everyone",
      "Identify acquisition channels that bring your most loyal customers",
      "Prevent churn by spotting at-risk customers early",
      "Personalise WhatsApp and email outreach based on segment",
    ],
    usp: "GrowthOS connects ad attribution data to customer LTV — so you know your Meta Reels campaigns bring customers with 3x higher LTV than Google Shopping. No other D2C tool surfaces this automatically.",
    metrics: ["Customer LTV", "Repeat Purchase Rate", "Churn Rate", "AOV by Segment", "CAC by Channel", "Customer Count by Stage"],
  },
  {
    id: "analytics", category: "Intelligence", icon: "bubble_chart", color: "#7bd0ff",
    name: "RFM & Cohorts", tagline: "Scientific segmentation that reveals your most valuable buyers",
    what: "RFM & Cohorts applies Recency-Frequency-Monetary analysis to your full customer base, producing scientifically-grounded segments. Cohort analysis shows how customer behaviour changes over time — essential for measuring retention improvement.",
    features: [
      "Automatic RFM scoring: each customer scored 1–5 on Recency, Frequency, Monetary",
      "11 named RFM segments: Champions, Loyal, Potential Loyalist, At Risk, etc.",
      "Cohort retention heatmap: how many customers from each month are still buying",
      "Revenue cohort analysis: which acquisition cohort generates the most LTV",
      "Exportable segment lists with emails for campaign targeting",
      "Segment trend over time: is your Champions segment growing or shrinking?",
    ],
    howItWorks: "GrowthOS runs RFM scoring daily using all Shopify order history. Each customer receives a 1–5 score for Recency, Frequency, and Monetary. Combined scores map to 11 standard segment definitions. Cohorts are computed by first-order month.",
    benefits: [
      "Stop treating all customers the same — personalise at segment level",
      "Measure retention improvements month over month with cohort heatmaps",
      "Export Champions segment for referral programme invitations",
      "Identify At-Risk segment for win-back automation before permanent churn",
    ],
    usp: "RFM analysis is typically done by data scientists. GrowthOS automates it daily with zero setup. The cohort heatmap gives retention visibility previously only available at funded startups with analytics teams.",
    metrics: ["RFM Score/Customer", "Segment Size", "Segment Revenue", "Cohort Retention %", "30/60/90-Day Retention", "LTV by Cohort"],
  },
  {
    id: "forecast", category: "Intelligence", icon: "query_stats", color: "#4ade80",
    name: "Forecast Engine", tagline: "AI-powered revenue forecasting with confidence intervals",
    what: "Forecast Engine uses machine learning on your historical Shopify data to project future revenue, orders, and customer acquisition. Factor in seasonality, growth trends, and planned ad spend to build realistic quarterly plans.",
    features: [
      "30 / 60 / 90-day revenue forecasts with confidence intervals",
      "Order volume forecast with upper/lower bounds",
      "Seasonal adjustment: Diwali, New Year, sale period uplift modelling",
      "Ad spend scenario modelling: impact of increasing spend by 20%",
      "CAC trajectory forecast: how acquisition costs change at scale",
      "Revenue goal tracker: on-track vs off-track vs ahead",
      "Inventory demand forecast: units to sell next month",
    ],
    howItWorks: "Trains a time-series forecasting model (ARIMA + ML ensemble) on your historical order data. Incorporates day-of-week patterns, monthly seasonality, and year-over-year trends. Forecasts update weekly. Ad spend scenarios use your historical ROAS to estimate revenue impact.",
    benefits: [
      "Negotiate supplier terms with confidence using projected inventory needs",
      "Set realistic marketing budgets tied to forecasted revenue",
      "Spot revenue shortfalls 60 days in advance — enough time to course-correct",
      "Fundraise with defensible revenue projections",
    ],
    usp: "GrowthOS forecasts are grounded in your actual data, not industry benchmarks. Scenario modelling — 'what if I spend ₹10L more on Meta?' — gives founders an unfair planning advantage.",
    metrics: ["Revenue Forecast", "Order Forecast", "CAC Forecast", "Inventory Demand", "Confidence Interval", "Scenario Delta"],
  },
  {
    id: "attribution", category: "Intelligence", icon: "hub", color: "#fb923c",
    name: "Attribution", tagline: "Know exactly which touchpoints convert customers",
    what: "Attribution maps the full customer journey from first ad click to final purchase across Meta, Google, organic search, and direct. Understand which channels deserve credit and which are riding the coattails of others.",
    features: [
      "Multi-touch attribution models: Last Click, First Click, Linear, Time Decay, Data-Driven",
      "Cross-channel journey visualisation: sequence of touchpoints before purchase",
      "Assisted conversions: channels that support without getting last-click credit",
      "Attribution comparison: how ROAS changes per model",
      "Organic vs paid attribution split",
      "View-through attribution for Meta (impression → purchase)",
      "UTM campaign performance breakdown",
    ],
    howItWorks: "Combines UTM parameters from Shopify orders, Meta conversion events, and Google Ads conversion data to reconstruct customer journeys. Multiple attribution models computed simultaneously — switch models and see ROAS impact instantly.",
    benefits: [
      "Stop over-investing in last-click channels, under-investing in top-of-funnel",
      "Understand the true role of Meta brand awareness vs Google search intent",
      "Justify brand campaign spend with assisted conversion data",
      "Reduce wasted budget on channels that appear to convert but don't drive incremental sales",
    ],
    usp: "GrowthOS lets you switch attribution models in real-time and see the immediate impact on ROAS and channel budget allocation — without a data team.",
    metrics: ["ROAS by Model", "Assisted Conversions", "Attribution Model Comparison", "Journey Length", "Touchpoints per Purchase"],
  },
  {
    id: "creative-analytics", category: "Intelligence", icon: "auto_awesome_mosaic", color: "#ddb7ff",
    name: "Creative Analytics", tagline: "Know which ad creatives drive revenue — not just likes",
    what: "Creative Analytics analyses your Meta and Google ad creative performance — images, videos, carousels — and identifies which formats, hooks, and visual themes drive the highest ROAS and lowest CPM. Kill creative fatigue before it destroys your ROAS.",
    features: [
      "Creative performance table: ROAS, CTR, CPM, CPC per ad",
      "Creative fatigue detection: frequency threshold alerts",
      "Top vs bottom creative comparison",
      "Format breakdown: video vs image vs carousel performance",
      "Hook analysis: which ad opening drives highest 3-second view rate",
      "Creative lifespan tracking: days before performance decays",
      "Winning creative identification for scaling",
    ],
    howItWorks: "Meta and Google Ads creative data pulled every 15 minutes. GrowthOS normalises creative metadata, computes performance ratios, and tracks frequency over time to detect fatigue before it impacts ROAS.",
    benefits: [
      "Stop running dead creatives out of habit — replace with data",
      "Scale winning creatives earlier based on ROAS signals",
      "Brief your creative team with specific data: 'UGC outperforms studio shoots 3:1'",
      "Reduce CPM creep by rotating creatives before audience fatigue",
    ],
    usp: "Most ad tools report creative metrics per platform in silos. GrowthOS compares creative performance across Meta and Google with a unified ROAS score.",
    metrics: ["ROAS/Creative", "CTR/Creative", "CPM", "Frequency", "3s View Rate", "Creative Fatigue Score"],
  },
  {
    id: "budget-optimizer", category: "Intelligence", icon: "tune", color: "#4ade80",
    name: "Budget Optimizer", tagline: "AI-recommended budget allocation that maximises blended ROAS",
    what: "Budget Optimizer analyses your historical ad performance across Meta and Google and recommends the optimal budget split. It factors in current spend, platform saturation, and incremental ROAS curves.",
    features: [
      "Recommended Meta vs Google budget split based on marginal ROAS",
      "Scenario modelling: increase total budget by X% — optimal allocation shown",
      "Platform saturation curves: when does adding more spend stop being efficient?",
      "Campaign-level budget recommendations",
      "ROAS target mode: set minimum acceptable ROAS, get max spend recommendation",
      "Historical budget efficiency analysis",
    ],
    howItWorks: "Uses your historical spend-to-ROAS relationship on each platform to model the marginal return of additional budget. Identifies the point of diminishing returns per platform and recommends rebalancing. Models update weekly.",
    benefits: [
      "Increase blended ROAS 10–20% without increasing total ad budget",
      "Stop the guesswork of splitting budget between Meta and Google",
      "Identify when you are over-spending on a saturated platform",
      "Make budget decisions in 2 minutes instead of 2 hours",
    ],
    usp: "Budget Optimizer is forward-looking — it recommends where to put NEXT month's budget based on diminishing returns modelling. This analysis normally requires a paid media agency or growth data scientist.",
    metrics: ["Recommended Budget Split", "Marginal ROAS by Platform", "Efficiency Score", "Incremental Revenue Potential"],
  },

  // ── CUSTOMERS ─────────────────────────────────────────────────────────────
  {
    id: "customer-journey", category: "Customers", icon: "route", color: "#7bd0ff",
    name: "Customer Journey", tagline: "Map the full path from first touch to loyal advocate",
    what: "Customer Journey visualises the sequence of touchpoints, channels, and actions that lead to conversion and repeat purchase. Identify drop-off points in your funnel and optimise the path from prospect to loyal customer.",
    features: [
      "Acquisition channel → first purchase journey map",
      "Funnel stages: Awareness → Consideration → Purchase → Retention → Advocacy",
      "Drop-off rate at each funnel stage",
      "Average time between stages",
      "Channel-specific journey paths: Meta vs Google vs organic",
      "Post-purchase journey: first to second purchase timing",
      "Multi-channel overlap analysis",
    ],
    howItWorks: "Combines Shopify order history with UTM attribution data from Meta and Google. GA4 event data fills in the on-site funnel stages. The journey map is built for each acquisition cohort.",
    benefits: [
      "Identify the biggest drop-off point in your funnel and fix it first",
      "Understand how long it takes customers to convert — set realistic retargeting windows",
      "Invest in channels with the fastest path to first purchase",
      "Optimise post-purchase experience to shorten time to second order",
    ],
    usp: "GrowthOS integrates Shopify, ad platform, and GA4 data to build an end-to-end cross-channel journey map. No other D2C tool automatically reconstructs multi-touch journeys without a custom BI setup.",
    metrics: ["Funnel Conversion %", "Drop-off Rate/Stage", "Time Between Stages", "Journey Length", "Channel Overlap %"],
  },
  {
    id: "vip-customers", category: "Customers", icon: "star", color: "#ddb7ff",
    name: "VIP Customers", tagline: "Your top 1% — the customers who make your business profitable",
    what: "VIP Customers surfaces your highest-value buyers — ranked by LTV, total spend, order frequency, and margin contribution. These are the customers you can't afford to lose, and GrowthOS gives you full visibility into their behaviour and risk signals.",
    features: [
      "Top 100 VIP customers ranked by LTV",
      "VIP tier classification: Gold, Platinum, Diamond (configurable thresholds)",
      "Purchase frequency and AOV per VIP",
      "Last order date and churn risk signal",
      "Acquisition channel for each VIP customer",
      "VIP segment revenue contribution %",
      "Exportable VIP list for personalised outreach",
      "Win-back alert: VIPs who haven't ordered in 60+ days",
    ],
    howItWorks: "Ranks all customers by total lifetime spend from Shopify. VIP tiers are set using configurable spend thresholds. Churn risk is flagged when a VIP hasn't ordered longer than their average inter-purchase interval. Refreshes daily.",
    benefits: [
      "Prevent VIP churn with early warning alerts before they leave permanently",
      "Build personalised retention campaigns for highest-value customers",
      "Understand which acquisition channels produce your most valuable buyers",
      "Prioritise customer service resources toward customers who matter most",
    ],
    usp: "VIP Customers gives you the LTV-ranked list with churn risk flags — combining transactional data with behavioural signals. A standard Shopify report shows spend; GrowthOS shows risk-adjusted customer value.",
    metrics: ["VIP LTV", "VIP AOV", "Purchase Frequency", "Churn Risk Score", "VIP Revenue %", "Days Since Last Order"],
  },

  // ── OPERATIONS ────────────────────────────────────────────────────────────
  {
    id: "operations", category: "Operations", icon: "local_shipping", color: "#4ade80",
    name: "Operations", tagline: "Full control over fulfillment, RTO, and supply chain",
    what: "Operations brings together shipping performance, return-to-origin (RTO) rates, COD vs prepaid split, warehouse inventory levels, and supplier management — designed specifically for Indian D2C brands.",
    features: [
      "RTO rate by courier, region, and product with trend tracking",
      "COD vs Prepaid split and RTO impact",
      "Shipment status: in-transit, delivered, returned, failed",
      "NDR (Non-Delivery Report) management",
      "Courier performance comparison: delivery rate, transit time, cost/shipment",
      "Inventory levels by warehouse and SKU",
      "Purchase order tracking: open, received, partial",
      "Supplier performance: on-time delivery %, reject rate",
    ],
    howItWorks: "Shiprocket and direct courier APIs sync shipment status every 30 minutes. Shopify order data maps to shipment records. RTO rates computed per courier and region using delivered vs returned counts.",
    benefits: [
      "Identify which courier has a 25% RTO rate and switch before it kills margins",
      "Reduce NDR loss by acting on undelivered shipments within 24 hours",
      "Plan inventory purchases with accurate sell-through velocity data",
      "Improve COD-to-prepaid conversion rate to reduce RTO risk",
    ],
    usp: "GrowthOS is the first D2C operating system to combine RTO analytics, NDR management, courier performance comparison, and inventory planning in one screen — built for Indian ecommerce.",
    metrics: ["RTO Rate", "COD %", "Delivery Rate", "NDR Rate", "Transit Time", "Cost/Shipment", "Stock Levels"],
  },
  {
    id: "crm", category: "Operations", icon: "contacts", color: "#c0c1ff",
    name: "CRM", tagline: "Customer relationships and pipeline management built for D2C",
    what: "The CRM module brings lead and opportunity management into GrowthOS for D2C brands that also handle B2B or wholesale, as well as customer support ticket management and relationship tracking for key accounts.",
    features: [
      "Lead and opportunity pipeline: Prospecting → Qualified → Proposal → Won/Lost",
      "Contact database with purchase history and communication log",
      "Deal value and probability-weighted pipeline value",
      "Activity timeline: calls, emails, WhatsApp messages, meetings",
      "Customer support ticket management",
      "Integration with WhatsApp Business for conversation history",
      "Automatic contact enrichment from Shopify customer data",
    ],
    howItWorks: "CRM contacts are created manually or imported from Shopify customers. Each contact has a linked purchase history. Activities are logged manually or via WhatsApp Business integration. Pipeline stages are configurable per organisation.",
    benefits: [
      "Manage wholesale and B2B relationships alongside D2C in one tool",
      "Track every customer interaction in one place — no scattered WhatsApp threads",
      "Never lose a high-value deal because it fell out of someone's inbox",
      "Integrate customer support with purchase history for smarter resolution",
    ],
    usp: "GrowthOS CRM is natively connected to Shopify — every contact has instant access to their full order history, LTV, and RFM segment. Traditional CRMs require manual data entry or expensive integrations.",
    metrics: ["Pipeline Value", "Deal Win Rate", "Open Tickets", "Resolution Time", "Contact Count", "Activity Log"],
  },
  {
    id: "automation", category: "Operations", icon: "bolt", color: "#fb923c",
    name: "Automation", tagline: "Rules and triggers that run your operations on autopilot",
    what: "Automation lets you build condition-based rules that act on your data automatically — pause a campaign when ROAS drops, send a WhatsApp when RTO exceeds 20%, or alert the team when inventory hits zero.",
    features: [
      "Trigger-condition-action rule builder (no code required)",
      "Triggers: ROAS drop, RTO spike, inventory low, high CAC, revenue milestone",
      "Actions: WhatsApp message, email alert, Slack notification, campaign pause",
      "Schedule-based automations: daily reports, weekly summaries",
      "Multi-step automations with delays and conditions",
      "Pre-built templates: ROAS Guard, Cart Recovery, Low Stock Alert",
      "Automation run history and success/failure log",
    ],
    howItWorks: "Automation rules are stored and evaluated by the GrowthOS scheduler every 15 minutes. When a trigger condition is met, the action is executed via the relevant integration (Meta Ads API, WhatsApp Business API, email). Multi-step automations use a state machine.",
    benefits: [
      "Protect ROAS by auto-pausing underperforming campaigns — even at 3am",
      "Automate COD confirmation WhatsApp messages to reduce RTO",
      "Never run out of stock silently — get alerted before it happens",
      "Save 5–10 hours per week on manual monitoring",
    ],
    usp: "GrowthOS automations connect business intelligence triggers (ROAS drops, revenue milestones) to real-world actions (pause ad campaigns, send WhatsApp). This operational AI layer is unique to GrowthOS.",
    metrics: ["Rules Active", "Triggers Fired", "Actions Executed", "Campaigns Auto-Paused", "Alerts Sent"],
  },
  {
    id: "workflow-builder", category: "Operations", icon: "account_tree", color: "#ddb7ff",
    name: "Workflow Builder", tagline: "Drag-and-drop canvas for complex multi-step automations",
    what: "Workflow Builder is a visual canvas for building sophisticated multi-step automations. Drag nodes onto the canvas, connect them with conditional branches, and build workflows like cart recovery sequences, post-purchase review requests, or RTO escalation flows.",
    features: [
      "Visual drag-and-drop node canvas",
      "Node types: Trigger, Condition, Action, Delay, Split (A/B)",
      "Pre-built workflow templates for common D2C scenarios",
      "Conditional branching: if/else logic based on customer behaviour",
      "Delay nodes: wait X hours or days before next action",
      "Split test nodes: send variant A to 50%, variant B to 50%",
      "Workflow analytics: trigger count, success rate, revenue attributed",
    ],
    howItWorks: "Workflows are built as directed graphs where each node represents a step. The GrowthOS execution engine evaluates trigger conditions every 15 minutes, then walks the graph — executing actions, evaluating conditions, and waiting for delays — using a persistent workflow state machine in Supabase.",
    benefits: [
      "Replace Zapier + Klaviyo + Meta with one visual builder",
      "Build sophisticated cart recovery flows that adapt based on customer behaviour",
      "A/B test different automation approaches with built-in split nodes",
      "Visualise how automations work — easier to audit and hand off to a team",
    ],
    usp: "Workflow Builder brings enterprise-grade automation orchestration to D2C brands. The visual canvas makes complex multi-step flows understandable by non-technical founders.",
    metrics: ["Workflows Active", "Executions/Day", "Success Rate", "Revenue Attributed", "Avg Workflow Length"],
  },

  // ── AI GROWTH ─────────────────────────────────────────────────────────────
  {
    id: "ai", category: "AI Growth", icon: "psychology", color: "#c0c1ff",
    name: "AI Engine", tagline: "Proactive insights and recommendations from your live data",
    what: "AI Engine continuously analyses your business data and surfaces proactive recommendations — things you should do, anomalies you should investigate, and opportunities you're missing.",
    features: [
      "Proactive insight cards: top opportunities and risks right now",
      "Anomaly detection: alerts when metrics deviate significantly",
      "Weekly AI-generated performance summary",
      "Competitive benchmarking insights vs industry averages",
      "Action recommendations with estimated impact",
      "Insight history: track which recommendations you acted on",
      "Priority sorting: highest-impact insights first",
    ],
    howItWorks: "Runs a nightly analysis job comparing each KPI against historical trends, peer benchmarks, and expected trajectories. Significant deviations trigger insight cards. Revenue opportunity estimates use your historical ROAS and conversion rate.",
    benefits: [
      "Catch revenue opportunities and threats without staring at dashboards all day",
      "Get quantified recommendations — not vague suggestions",
      "Know which action has the highest ROI before deciding where to focus",
      "Replace expensive growth consultants with always-on AI analysis",
    ],
    usp: "AI Engine outputs are grounded in your actual data with projected financial impact. Unlike generic AI tools, recommendations are specific: 'Your ₹2.1L opportunity is in your dormant VIP segment.'",
    metrics: ["Insights Generated", "Anomalies Detected", "Recommendations Actioned", "Revenue Opportunity Identified"],
  },
  {
    id: "content", category: "AI Growth", icon: "edit_note", color: "#7bd0ff",
    name: "Content AI", tagline: "Ad copy, product descriptions, and campaign content from your data",
    what: "Content AI generates high-performing ad copy, product descriptions, email subject lines, and WhatsApp messages using your actual performance data as input. It knows your best-selling products, brand voice, and which hooks work for your audience.",
    features: [
      "Meta and Google ad copy generation — headlines, descriptions, CTAs",
      "Product description writing from SKU attributes",
      "Email subject line generation with A/B variants",
      "WhatsApp message templates for cart recovery and win-back",
      "Brand voice customisation: formal, conversational, urgent, aspirational",
      "Copy scoring: predicted CTR and relevance score",
      "One-click regeneration for different tones or lengths",
    ],
    howItWorks: "Sends your product data, target audience, campaign objective, and performance context to Claude AI. The model generates copy variants optimised for the specified format and platform. Brand voice settings are stored and applied consistently.",
    benefits: [
      "Generate a week's worth of ad copy in 10 minutes instead of 2 days",
      "Test more creative variations without hiring a larger copy team",
      "Ensure brand consistency across hundreds of ad variations",
      "Use data-driven hooks based on what's actually working in your campaigns",
    ],
    usp: "Content AI uses your actual campaign performance data as context — it knows your winning hooks, best-performing products, and brand voice. Far more relevant than generic AI writers.",
    metrics: ["Copy Pieces Generated", "Estimated CTR Score", "A/B Variants", "Brand Voice Consistency Score"],
  },
  {
    id: "seo", category: "AI Growth", icon: "travel_explore", color: "#4ade80",
    name: "SEO", tagline: "Organic search intelligence to grow traffic that doesn't cost per click",
    what: "The SEO module combines Google Search Console data with GA4 to give you a complete view of your organic search performance. Track keyword rankings, identify quick-win opportunities, and monitor page performance.",
    features: [
      "Keyword ranking tracker: positions 1–100 for all indexed terms",
      "Click-through rate by keyword and page",
      "Quick-win opportunities: keywords ranking 4–10 with high impressions",
      "Top landing pages by organic traffic",
      "Page speed and Core Web Vitals tracking",
      "Organic vs paid traffic split",
      "Keyword trend: rising vs declining queries",
    ],
    howItWorks: "GSC API provides query-level data: impressions, clicks, CTR, and average position per keyword. GA4 provides page-level metrics. GrowthOS combines these to compute opportunity scores — keywords in positions 4–10 with high impressions flagged as quick wins.",
    benefits: [
      "Identify keywords where you're close to the top 3 — small effort, big traffic gain",
      "Track which pages are driving organic revenue",
      "Reduce dependency on paid ads by building a compounding organic traffic engine",
      "Prove the ROI of SEO content investment with traffic-to-revenue attribution",
    ],
    usp: "GrowthOS connects GSC keyword rankings to Shopify revenue — you see which organic keywords drive purchases, not just traffic. No other D2C tool makes this connection automatically.",
    metrics: ["Keyword Rankings", "Organic CTR", "Organic Sessions", "Organic Revenue", "Quick-Win Keywords"],
  },
  {
    id: "reports", category: "AI Growth", icon: "bar_chart_4_bars", color: "#ddb7ff",
    name: "Reports", tagline: "Boardroom-ready reports generated in one click",
    what: "Reports module generates comprehensive business performance reports — weekly, monthly, and quarterly — in PDF and Excel format. Pre-formatted for investor updates, team reviews, board presentations, and CA submissions.",
    features: [
      "One-click weekly performance report: KPIs, trends, highlights",
      "Monthly P&L report in standard accounting format",
      "Ad performance report: platform breakdown, campaign analysis",
      "Customer report: acquisition, LTV, churn rates",
      "Scheduled report delivery: automated email every Monday 9am",
      "Custom date range and metric selection",
      "PDF and Excel export formats",
    ],
    howItWorks: "Reports pull live data from Supabase at generation time and populate pre-designed templates. PDF reports use a server-side renderer. Excel reports use SheetJS with formula templates pre-built. Scheduled reports run as background jobs.",
    benefits: [
      "Spend 10 minutes instead of 3 hours on monthly reporting",
      "Impress investors with professionally formatted performance updates",
      "Keep your CA or CFO updated with automated monthly P&L emails",
      "Create a single source of truth for all stakeholder reporting",
    ],
    usp: "Reports are designed for Indian D2C brands — GST-relevant P&L formats, Indian currency formatting (₹L, ₹Cr), and the specific metrics Indian investors and CAs care about.",
    metrics: ["Reports Generated", "Report Types", "Scheduled Reports", "PDF/Excel Downloads", "Metrics Covered"],
  },

  // ── AI MODULES ────────────────────────────────────────────────────────────
  {
    id: "ads-ai", category: "AI Modules", icon: "smart_toy", color: "#c0c1ff",
    name: "Ads AI", tagline: "AI-powered ad optimisation that acts like a paid media expert",
    what: "Ads AI analyses your entire ad account performance and generates specific, actionable optimisation recommendations — which campaigns to scale, which to pause, which audiences to test, and which creatives to refresh.",
    features: [
      "Campaign-level recommendations: scale, pause, reduce, test",
      "Audience recommendations: lookalike audiences based on VIP customers",
      "Creative refresh alerts with replacement suggestions",
      "Budget reallocation suggestions across campaigns",
      "A/B test recommendations: what to test next",
      "ROAS improvement roadmap: ordered list of highest-impact changes",
      "Weekly AI ad audit: overall account health score",
    ],
    howItWorks: "Sends campaign performance data (spend, ROAS, CTR, frequency, audience size) to Claude AI with a structured prompt optimised for paid media analysis. The model outputs specific recommendations with projected impact. Refreshed weekly.",
    benefits: [
      "Expert-level paid media optimisation without a ₹2L/month agency",
      "Act on recommendations that could improve ROAS 20–40% within 2 weeks",
      "Stop flying blind — know what to change and why before making changes",
      "Catch creative fatigue before it tanks your ROAS",
    ],
    usp: "Ads AI doesn't just report what's happening — it tells you exactly what to do next and why. Each recommendation includes the expected ROAS impact based on your historical data.",
    metrics: ["Recommendations Generated", "ROAS Impact Estimate", "Campaigns Flagged", "Creatives Due for Refresh"],
  },
  {
    id: "seo-ai", category: "AI Modules", icon: "travel_explore", color: "#7bd0ff",
    name: "SEO AI", tagline: "AI content strategy and optimisation from your GSC data",
    what: "SEO AI analyses your Google Search Console data and generates content strategy recommendations — which keywords to target, which pages to optimise, what new content to create, and how to improve your existing rankings.",
    features: [
      "Keyword cluster recommendations: groups of related keywords to target together",
      "Page optimisation suggestions: title tag, meta description, H1 improvements",
      "Content gap analysis: high-volume keywords you don't rank for yet",
      "Internal linking recommendations for SEO boost",
      "Content calendar suggestions: blog topics ranked by search opportunity",
      "Featured snippet opportunities: queries where you could claim position zero",
    ],
    howItWorks: "Combines your GSC ranking data with search volume estimates and competition signals. Claude AI processes this structured data to generate prioritised recommendations grounded in keywords your target audience is actually searching.",
    benefits: [
      "Build a content strategy backed by data, not guesswork",
      "Get specific page-level SEO recommendations to implement immediately",
      "Identify keywords with high commercial intent where you're close to ranking",
      "Reduce cost-per-acquisition by growing organic traffic that converts",
    ],
    usp: "SEO AI recommendations are grounded in your actual rankings and your store's product catalogue — not generic advice. It recommends writing 'budget kurti under ₹500' because your GSC shows 8,200 monthly searches at position 14.",
    metrics: ["Keywords Recommended", "Pages to Optimise", "Content Gap Keywords", "Estimated Traffic Upside"],
  },
  {
    id: "product-ai", category: "AI Modules", icon: "inventory_2", color: "#4ade80",
    name: "Product AI", tagline: "AI-driven product intelligence: stock, price, and discontinue",
    what: "Product AI analyses your SKU performance, inventory data, and customer purchase patterns to recommend which products to restock, which to discount, which to discontinue, and how to price for maximum margin.",
    features: [
      "Restock recommendations: low-velocity vs high-velocity SKU identification",
      "Pricing recommendations: suggested adjustments to improve margin",
      "Discontinuation candidates: low margin, high returns, low velocity",
      "Bundle opportunity identification: products frequently bought together",
      "Seasonal demand forecasting per SKU",
      "New product launch readiness: gaps in your catalogue",
    ],
    howItWorks: "Sends SKU performance data (velocity, margin, return rate, inventory level) to Claude AI. The model evaluates each product against configurable thresholds and business rules to generate ranked recommendations with reasoning and projected impact.",
    benefits: [
      "Stop carrying dead inventory — free up working capital for winning SKUs",
      "Price products at the margin-optimal point, not by gut feel",
      "Discover natural product bundles that increase AOV",
      "Make buy decisions for next season with AI-powered demand forecasting",
    ],
    usp: "Product AI combines sell-through velocity, margin data, return rates, and inventory levels into a single AI analysis. No other D2C tool produces this cross-dimensional product intelligence automatically.",
    metrics: ["SKUs Analysed", "Restock Recommendations", "Pricing Adjustments", "Bundle Opportunities", "Discontinuation Flags"],
  },
  {
    id: "finance-ai", category: "AI Modules", icon: "account_balance", color: "#c0c1ff",
    name: "Finance AI", tagline: "AI-powered financial analysis and cash flow intelligence",
    what: "Finance AI turns your P&L and cash flow data into plain-English narratives and forward-looking recommendations. Ask it to explain your margin decline, project your runway, or identify the biggest cost reduction opportunities.",
    features: [
      "P&L narrative: 'Your gross margin fell 3.2% because COGS increased ₹12L'",
      "Cash flow forecast: weeks of runway at current burn rate",
      "Cost optimisation opportunities with reduction suggestions",
      "Revenue quality analysis: one-time vs recurring revenue split",
      "Break-even analysis: revenue needed to turn profitable",
      "Expense trend alerts: categories growing faster than revenue",
      "Fundraising readiness score: how investment-ready are your financials?",
    ],
    howItWorks: "Sends structured P&L data (revenue, COGS, costs by category, margins) to Claude AI. The model generates narrative explanations, identifies trends, and produces forward-looking recommendations. Cash flow forecast uses current burn rate and receivables.",
    benefits: [
      "Understand your finances in plain English without an MBA",
      "Catch cost overruns weeks before they become cash flow problems",
      "Know your runway without waiting for your CA's monthly review",
      "Prepare investor-ready financial narrative from live data",
    ],
    usp: "Finance AI translates complex financial data into actionable narratives specific to D2C ecommerce. It speaks in terms of COGS, ad spend, and RTO loss — not abstract accounting concepts.",
    metrics: ["Margin Explained", "Cash Runway Weeks", "Cost Reduction Opportunities", "Revenue Quality Score"],
  },
  {
    id: "pricing-ai", category: "AI Modules", icon: "sell", color: "#7bd0ff",
    name: "Pricing AI", tagline: "Dynamic pricing recommendations that maximise margin and revenue",
    what: "Pricing AI analyses your product velocity, competitor pricing signals, and margin data to recommend optimal prices. Find the sweet spot where sales volume and margin combine for maximum revenue contribution.",
    features: [
      "Price elasticity estimation per SKU",
      "Margin-optimal price recommendations",
      "Volume vs margin trade-off analysis",
      "Discount impact modelling: net effect of a 20% sale",
      "Price change history and performance tracking",
      "Bundle pricing optimisation",
      "Category-level pricing strategy recommendations",
    ],
    howItWorks: "Uses your historical sales volume at different price points to estimate price elasticity. Combined with COGS data, it computes the margin-optimal price. Competitor pricing data adds external market context when available.",
    benefits: [
      "Stop pricing by cost-plus — start pricing by value and elasticity",
      "Know the exact revenue impact of a planned discount before you run it",
      "Increase margin by identifying products that can sustain a 5–10% price increase",
      "Optimise bundle prices to maximise AOV and margin simultaneously",
    ],
    usp: "Pricing AI uses your actual historical price-volume relationship — not industry average elasticity assumptions — making it significantly more accurate than generic pricing tools.",
    metrics: ["Price Elasticity/SKU", "Margin Impact", "Revenue Change Estimate", "Optimal Price Points"],
  },
  {
    id: "automation-ai", category: "AI Modules", icon: "bolt", color: "#fb923c",
    name: "Automation AI", tagline: "AI-designed workflows tailored to your business patterns",
    what: "Automation AI analyses your operational data and customer behaviour to suggest specific automation workflows you should build. It identifies patterns and designs targeted automations to address them.",
    features: [
      "Automation opportunity identification from your data patterns",
      "Pre-built workflow design suggestions for your use cases",
      "ROI estimate for each suggested automation",
      "Natural language workflow creation: describe what you want in plain English",
      "Workflow performance analysis: which existing automations are working",
      "Automation gap analysis: what should you automate that you haven't yet",
    ],
    howItWorks: "Analyses your operational metrics, customer behaviour data, and existing automation performance to identify high-impact opportunities. Suggestions are passed to the Workflow Builder where you can customise and deploy with one click.",
    benefits: [
      "Discover automations you didn't know you needed",
      "Build complex workflows by describing them in plain English",
      "Quantify the ROI of automations before building them",
      "Replace repetitive manual tasks with intelligent automation systematically",
    ],
    usp: "Automation AI proactively designs workflows based on your data. This proactive generation is unique to GrowthOS and dramatically reduces the expertise needed to build effective automations.",
    metrics: ["Automations Suggested", "Workflows Built from AI", "Estimated Hours Saved", "ROI Projected"],
  },
  {
    id: "decision-ai", category: "AI Modules", icon: "psychology", color: "#ddb7ff",
    name: "Decision AI", tagline: "An AI thinking partner for your most important business decisions",
    what: "Decision AI is a structured thinking tool for complex business decisions — whether to enter a new market, launch a new product, hire, cut ad spend, or pivot strategy. It models multiple scenarios and gives you a recommended course of action.",
    features: [
      "Structured decision framework: define decision, options, and success criteria",
      "Scenario modelling: optimistic, base, pessimistic outcome projections",
      "Trade-off analysis: revenue vs margin, growth vs profitability",
      "Risk assessment: what could go wrong with each option?",
      "Data-grounded recommendations using your actual KPIs",
      "Decision journal: track decisions made and actual outcomes",
    ],
    howItWorks: "You define the decision and options. Decision AI sends this context along with your current business KPIs to Claude AI, which generates a structured analysis covering trade-offs, risks, opportunities, and a recommended direction. All projections use your real data.",
    benefits: [
      "Make high-stakes decisions with analytical rigour instead of gut feel",
      "See the downside scenarios before committing to a direction",
      "Justify decisions to co-founders or investors with structured reasoning",
      "Build a decision journal to learn from past choices",
    ],
    usp: "Decision AI structures ambiguous strategic questions into analytical frameworks, grounded in your actual business data. It's the equivalent of a strategy consultant who knows your business intimately.",
    metrics: ["Decisions Analysed", "Scenarios Modelled", "Recommendations Followed", "Decision Accuracy (tracked)"],
  },
  {
    id: "forecast-ai", category: "AI Modules", icon: "query_stats", color: "#4ade80",
    name: "Forecast AI", tagline: "Narrative forecasting that explains the why behind projected numbers",
    what: "Forecast AI combines the quantitative projections of the Forecast Engine with natural language analysis. It explains why revenue is projected to grow or decline, what risks could disrupt the forecast, and what actions could shift the trajectory.",
    features: [
      "Narrative forecast explanation: 'Revenue is projected to grow 22% because...'",
      "Risk scenario analysis: events that could cause the forecast to miss",
      "Upside scenario: what would need to happen for outperformance",
      "Forecast confidence level and key assumptions",
      "Action recommendations to hit or beat the forecast",
      "Monthly forecast vs actual tracking with variance explanation",
      "Investor-narrative version of the forecast for fundraising",
    ],
    howItWorks: "Takes quantitative outputs from the Forecast Engine and passes them to Claude AI, which generates a plain-English analysis with supporting reasoning, risk factors, and opportunity identification.",
    benefits: [
      "Communicate forecast rationale to co-founders and investors in plain language",
      "Understand what's driving the forecast — not just what the number is",
      "Identify the 2–3 actions that would most improve forecast outcomes",
      "Build investor confidence with narratively-grounded financial projections",
    ],
    usp: "The combination of statistical forecasting + narrative AI analysis is unique to GrowthOS, previously only available with a full analytics team.",
    metrics: ["Forecast Accuracy %", "Scenarios Narrated", "Variance Explained", "Investor Report Generated"],
  },

  // ── ACCOUNT ───────────────────────────────────────────────────────────────
  {
    id: "integrations", category: "Account", icon: "hub", color: "#c0c1ff",
    name: "Integrations", tagline: "Connect your entire business stack to GrowthOS",
    what: "The Integrations hub is where you connect all your data sources. Five platforms are live — Shopify, Meta Ads, Google Ads, Google Search Console, and Google Analytics 4. Each connection feeds data into every GrowthOS module automatically.",
    features: [
      "One-click OAuth connections for all 5 supported platforms",
      "Real-time connection status: Connected, Reconnect needed, Not connected",
      "Last sync timestamp per integration",
      "Manual sync trigger — force a data refresh on demand",
      "Data readiness score: % of active integrations connected",
      "Disconnect option for each integration",
      "Coming soon preview of 15+ upcoming integrations",
    ],
    howItWorks: "Each integration uses OAuth 2.0 for secure, token-based access. Tokens stored encrypted in Supabase. GrowthOS polls each platform's API every 15 minutes. Token refresh is handled automatically. Shopify webhooks provide real-time updates.",
    benefits: [
      "All your data in one place — end the multi-tab chaos",
      "Set it once — GrowthOS keeps syncing automatically in the background",
      "OAuth means you never share your platform passwords with GrowthOS",
      "Data readiness score keeps you accountable to full connectivity",
    ],
    usp: "GrowthOS is the only Indian D2C operating system with native OAuth integrations for all 5 major growth platforms. No CSV uploads, no manual syncs.",
    metrics: ["Connected Platforms", "Last Sync Time", "Data Readiness %", "Records Synced Total"],
  },
  {
    id: "alerts", category: "Account", icon: "notifications_active", color: "#fb923c",
    name: "Alerts", tagline: "Configurable alerts that keep your team informed in real-time",
    what: "Alerts lets you configure thresholds on any metric and get notified instantly when they're breached — via in-app notification, email, or WhatsApp. Never miss a ROAS drop, a stock-out, or a revenue milestone again.",
    features: [
      "Alert types: Threshold breach, Anomaly detection, Milestone achievement",
      "Metric coverage: any KPI available in GrowthOS",
      "Notification channels: in-app, email, WhatsApp (via Interakt)",
      "Alert frequency: immediate, daily digest, weekly summary",
      "Team alerting: assign alerts to specific team members",
      "Snooze and acknowledge workflow",
      "Alert templates: pre-built for ROAS Guard, CAC Spike, etc.",
    ],
    howItWorks: "Alert conditions evaluated every 15 minutes against latest data. When a condition is met, GrowthOS creates an in-app notification and sends configured external notifications. Each alert has a cooldown period to prevent repeated firing.",
    benefits: [
      "React to business problems hours earlier than with daily reports",
      "Protect profitability with ROAS threshold alerts before spend spirals",
      "Keep the whole team informed without manual update meetings",
      "Build a culture of data-driven operations with automated accountability",
    ],
    usp: "GrowthOS alerts fire on business logic conditions — not just raw metric values. 'Alert me when ROAS drops below 2.5x for more than 2 hours' is a time-conditioned alert that prevents false positives.",
    metrics: ["Alerts Configured", "Alerts Fired/Week", "Response Time", "Notifications Sent"],
  },
  {
    id: "notifications", category: "Account", icon: "notifications", color: "#7bd0ff",
    name: "Notifications", tagline: "Your GrowthOS activity feed — every important event in one place",
    what: "The Notifications centre is your unified activity feed — new orders, sync completions, alert fires, AI insights, system updates, and team mentions all appear here in chronological order.",
    features: [
      "Real-time notification feed with unread count badge",
      "Notification types: Order, Sync, Alert, Insight, System, Team mention",
      "Mark as read / mark all as read",
      "Notification filtering by type",
      "Click-to-navigate: tap a notification to jump to the relevant section",
      "Notification preferences: choose which events trigger notifications",
      "7-day notification history",
    ],
    howItWorks: "Notifications are written to Supabase by various GrowthOS systems. The frontend subscribes to the notifications table via Supabase realtime, so new notifications appear instantly without page refresh.",
    benefits: [
      "Single feed for all business events — no more context-switching between tools",
      "Never miss an important event even when you're not actively in the dashboard",
      "Quick navigation: click a notification to go directly to the relevant data",
      "Reduce information overload with notification type filtering",
    ],
    usp: "GrowthOS notifications are context-rich — they don't just say 'New order' but 'New order #5891 · ₹4,299 · via Meta Ads · Priya M.' This turns notifications into actionable intelligence.",
    metrics: ["Notifications/Day", "Unread Rate", "Notification Types", "Response Time"],
  },
  {
    id: "billing", category: "Account", icon: "credit_card", color: "#4ade80",
    name: "Billing", tagline: "Subscription management, usage tracking, and invoice history",
    what: "Billing manages your GrowthOS subscription — current plan, usage metrics, upgrade options, payment history, and invoices. Transparent pricing with no hidden costs.",
    features: [
      "Current plan and usage: orders tracked, data sources, users, modules",
      "Plan comparison and upgrade flow",
      "Invoice history: downloadable GST invoices",
      "Payment method management",
      "Usage alerts: approaching plan limits",
      "Annual vs monthly billing toggle (annual saves 20%)",
      "Team seat management",
    ],
    howItWorks: "Billing is managed through a secure payment integration. Subscription state and usage limits are stored in Supabase. Usage is computed daily and compared against plan limits. Invoice PDFs are generated server-side.",
    benefits: [
      "Full cost transparency — know exactly what you're paying for",
      "Downloadable GST invoices ready for your CA",
      "Usage visibility prevents surprise overages",
      "Easy upgrade path as your business grows",
    ],
    usp: "GrowthOS billing includes India-specific GST invoicing built in — no manual invoice requests, no delayed credits. Invoices are auto-generated and immediately downloadable.",
    metrics: ["Plan Tier", "Orders Tracked", "Data Sources Connected", "Seats Used", "Next Invoice Date"],
  },
  {
    id: "security", category: "Account", icon: "security", color: "#c0c1ff",
    name: "Security", tagline: "Enterprise-grade security controls for your business data",
    what: "Security gives admins control over authentication, access permissions, session management, and audit visibility. Protect sensitive business data with 2FA, role-based access, and session monitoring.",
    features: [
      "Two-factor authentication (TOTP)",
      "Role-based access control: Owner, Admin, Member, Viewer",
      "Session management: view and revoke active sessions",
      "Password policy enforcement",
      "IP allowlist for admin access",
      "Login history with device and location",
      "API key management for integrations",
    ],
    howItWorks: "Authentication handled by Supabase Auth with JWT tokens. Roles enforced at the database level via Row Level Security policies. 2FA uses standard TOTP (compatible with Google Authenticator, Authy).",
    benefits: [
      "Protect sensitive revenue and customer data from unauthorised access",
      "Give team members the right level of access — no more, no less",
      "Detect suspicious login attempts immediately",
      "Meet data security requirements for enterprise customer contracts",
    ],
    usp: "GrowthOS uses Supabase Row Level Security — access controls enforced at the database level, not just the application layer. Data is protected even if application-level code has a bug.",
    metrics: ["Active Sessions", "Team Members", "2FA Enabled %", "Login Attempts", "Security Events"],
  },
  {
    id: "audit-logs", category: "Account", icon: "manage_search", color: "#7bd0ff",
    name: "Audit Logs", tagline: "Complete activity trail for compliance, security, and accountability",
    what: "Audit Logs records every action taken in GrowthOS — data access, configuration changes, integration events, user logins, and AI queries — in an immutable, searchable log.",
    features: [
      "Complete action log: who did what, when, from where",
      "Filter by user, action type, date range, module",
      "Integration events: OAuth connections, sync completions, API calls",
      "Configuration changes: alert edits, automation updates, role changes",
      "AI query history: what questions were asked of Founder AI",
      "Export to CSV for external compliance reporting",
      "Immutable records: logs cannot be edited or deleted",
    ],
    howItWorks: "Every significant action triggers an audit_log INSERT in Supabase. Records are written with user ID, timestamp, action type, affected resource, and request metadata. The audit log table is append-only with no UPDATE or DELETE permissions.",
    benefits: [
      "Investigate security incidents with a complete activity trail",
      "Hold team members accountable with an objective record of actions",
      "Meet GDPR, ISO 27001, and SOC 2 audit requirements",
      "Diagnose integration issues by reviewing sync event history",
    ],
    usp: "GrowthOS audit logs are immutable — written directly to the database with no application-level delete capability. This meets enterprise compliance standards that most SaaS tools don't support.",
    metrics: ["Log Entries/Day", "Users Tracked", "Action Types", "Export Downloads", "Retention Days"],
  },
  {
    id: "white-label", category: "Account", icon: "palette", color: "#fb923c",
    name: "White Label", tagline: "Make GrowthOS your own — your brand, your domain, your product",
    what: "White Label lets agencies and enterprise customers deploy GrowthOS under their own brand. Custom logo, colour scheme, domain name, and email templates — your clients see your brand, powered by GrowthOS underneath.",
    features: [
      "Custom logo upload and replacement",
      "Brand colour scheme customisation",
      "Custom domain: dashboard.youragency.com",
      "Custom email templates with your branding",
      "Client workspace isolation: each client sees only their data",
      "Reseller billing: set your own pricing for client seats",
      "Remove GrowthOS branding (Enterprise plan)",
    ],
    howItWorks: "White label settings stored per workspace and applied at render time. Custom domains use CNAME DNS records pointing to GrowthOS infrastructure. Client isolation is enforced via Supabase RLS workspace scoping.",
    benefits: [
      "Offer a premium AI analytics product under your agency brand",
      "Build a recurring SaaS revenue stream on top of GrowthOS",
      "Increase client retention by making GrowthOS feel like your proprietary tool",
      "Scale from 1 to 100 clients without building your own analytics infrastructure",
    ],
    usp: "GrowthOS White Label includes full client workspace isolation — each client has their own data environment with no cross-contamination. This enterprise-grade multi-tenancy is rare in D2C analytics platforms.",
    metrics: ["Client Workspaces", "Custom Domains", "Branded Logins", "Client Retention Rate"],
  },
  {
    id: "settings", category: "Account", icon: "settings", color: "#94a3b8",
    name: "Settings", tagline: "Configure GrowthOS to match your business: brand, team, preferences",
    what: "Settings is where you configure your workspace — brand name, timezone, currency, fiscal year, team members, notification preferences, and workspace-level defaults.",
    features: [
      "Workspace profile: brand name, logo, industry, store URL",
      "Timezone and currency settings",
      "Fiscal year configuration (April–March for Indian businesses)",
      "Team member invitations and role assignment",
      "Default date range for all dashboards",
      "Email and notification preferences",
      "API key management for custom integrations",
    ],
    howItWorks: "Settings stored as workspace-level configuration in Supabase. Team invitations send email links with scoped JWT tokens. Role assignments enforced via Supabase Auth user metadata and RLS. All settings changes logged in the Audit Log.",
    benefits: [
      "Configure once — every report, export, and notification respects your timezone and currency",
      "Onboard team members in minutes with role-scoped invitations",
      "Set fiscal year to April–March to match Indian financial reporting",
      "API keys let you push custom data or pull GrowthOS data into your own tools",
    ],
    usp: "GrowthOS Settings is India-first — fiscal year April–March, INR currency, GST-ready. Most global SaaS tools require workarounds for Indian business requirements; GrowthOS handles them natively.",
    metrics: ["Team Members", "Workspaces", "Configured Preferences", "API Keys Active"],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface FeaturesDocsPageProps {
  onNav?: (page: string) => void;
}

export function FeaturesDocsPage({ onNav }: FeaturesDocsPageProps) {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return MODULES.filter((m) => {
      const catMatch = activeCategory === "All" || m.category === activeCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.tagline.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.features.some((f) => f.toLowerCase().includes(q))
      );
    });
  }, [activeCategory, search]);

  const stats = [
    { num: "38", label: "Modules" },
    { num: "7", label: "Categories" },
    { num: "5", label: "Live Integrations" },
    { num: "200+", label: "Features" },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-7 pt-7 pb-5 border-b border-outline-variant bg-gradient-to-b from-surface-container/40 to-transparent">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-primary text-[10px] tracking-widest uppercase">Feature Documentation</span>
            </div>
            <h1 className="font-syne text-2xl font-bold text-on-surface leading-tight">
              GrowthOS — Every Module, Explained
            </h1>
            <p className="text-xs text-on-surface-variant font-mono mt-1 max-w-xl leading-relaxed">
              Comprehensive documentation for all 38 dashboard modules. Click any module icon to open it directly in GrowthOS.
            </p>
            <div className="flex items-center gap-6 mt-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="font-syne text-xl font-bold text-primary">{s.num}</div>
                  <div className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Search */}
          <div className="relative w-64 flex-shrink-0">
            <AppIcon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules, features..."
              className="w-full pl-8 pr-4 py-2 rounded-xl bg-surface-container border border-outline-variant text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors font-mono"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 mt-5 overflow-x-auto pb-0.5">
          {CATEGORIES.map((cat) => {
            const color = cat === "All" ? "#c0c1ff" : CAT_COLORS[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline"
                }`}
                style={isActive ? { borderColor: color + "80", color, backgroundColor: color + "12" } : {}}
              >
                {cat}
                {cat !== "All" && (
                  <span className="ml-1.5 text-[9px] opacity-60">
                    {MODULES.filter((m) => m.category === cat).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Module Grid ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-7 py-5">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AppIcon name="search_off" size={40} className="text-on-surface-variant/30 mb-3" />
            <div className="font-syne font-bold text-on-surface text-sm">No modules found</div>
            <div className="text-xs text-on-surface-variant mt-1">Try a different search term or category</div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {filtered.map((mod) => {
            const isExpanded = expandedId === mod.id;
            const catColor = CAT_COLORS[mod.category] || "#94a3b8";
            return (
              <div
                key={mod.id}
                className="glass-card overflow-hidden transition-all duration-200"
                style={{ borderLeft: `3px solid ${mod.color}40` }}
              >
                {/* ── Card Header (always visible) ── */}
                <button
                  className="w-full text-left p-5 flex items-center gap-4 hover:bg-surface-container/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : mod.id)}
                >
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: mod.color + "18" }}
                  >
                    <AppIcon name={mod.icon} size={22} style={{ color: mod.color }} />
                  </div>

                  {/* Title block */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[9px] font-bold uppercase tracking-widest font-mono"
                        style={{ color: catColor }}
                      >
                        {mod.category}
                      </span>
                    </div>
                    <div className="font-syne font-bold text-on-surface text-sm leading-tight">{mod.name}</div>
                    <div className="text-xs text-on-surface-variant mt-0.5 leading-relaxed line-clamp-1">{mod.tagline}</div>
                  </div>

                  {/* Metrics chips — desktop only */}
                  <div className="hidden lg:flex flex-wrap gap-1 max-w-xs justify-end">
                    {mod.metrics.slice(0, 3).map((mt) => (
                      <span
                        key={mt}
                        className="text-[9px] px-2 py-0.5 rounded-full border font-mono"
                        style={{ borderColor: mod.color + "40", color: mod.color }}
                      >
                        {mt}
                      </span>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {onNav && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNav(mod.id);
                        }}
                        className="primary-gradient text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <AppIcon name={mod.icon} size={12} />
                        Open
                      </button>
                    )}
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200"
                      style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      <AppIcon name="expand_more" size={16} className="text-on-surface-variant" />
                    </div>
                  </div>
                </button>

                {/* ── Expanded Details ── */}
                {isExpanded && (
                  <div className="border-t border-outline-variant">
                    {/* What it is */}
                    <div className="px-5 py-4 bg-surface-container/20 border-b border-outline-variant">
                      <p className="text-[13px] text-on-surface-variant leading-relaxed">{mod.what}</p>
                    </div>

                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Features */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <AppIcon name="check_circle" size={14} className="text-primary" />
                          <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-on-surface-variant">Key Features</span>
                        </div>
                        <ul className="flex flex-col gap-2">
                          {mod.features.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-xs text-on-surface-variant leading-relaxed">
                              <span
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                                style={{ backgroundColor: mod.color }}
                              />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Benefits */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <AppIcon name="trending_up" size={14} className="text-green-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-on-surface-variant">Business Benefits</span>
                        </div>
                        <ul className="flex flex-col gap-2">
                          {mod.benefits.map((b) => (
                            <li key={b} className="flex items-start gap-2 text-xs text-on-surface-variant leading-relaxed">
                              <AppIcon name="check" size={13} className="text-green-400 flex-shrink-0 mt-0.5" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* How It Works */}
                      <div className="glass-card p-4 bg-surface-container/40">
                        <div className="flex items-center gap-2 mb-2">
                          <AppIcon name="bolt" size={14} className="text-amber-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-on-surface-variant">How It Works</span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{mod.howItWorks}</p>
                      </div>

                      {/* USP */}
                      <div
                        className="glass-card p-4"
                        style={{ borderColor: mod.color + "30", background: mod.color + "08" }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <AppIcon name="star" size={14} style={{ color: mod.color }} />
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest font-mono"
                            style={{ color: mod.color }}
                          >
                            What Makes It Unique
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: mod.color + "cc" }}>{mod.usp}</p>
                      </div>
                    </div>

                    {/* Metrics + CTA */}
                    <div className="px-5 pb-5 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex flex-wrap gap-1.5">
                        {mod.metrics.map((mt) => (
                          <span
                            key={mt}
                            className="text-[10px] px-2.5 py-0.5 rounded-full border font-mono"
                            style={{ borderColor: mod.color + "40", color: mod.color }}
                          >
                            {mt}
                          </span>
                        ))}
                      </div>
                      {onNav && (
                        <button
                          onClick={() => onNav(mod.id)}
                          className="flex items-center gap-2 primary-gradient text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
                        >
                          <AppIcon name={mod.icon} size={14} />
                          Open {mod.name} in GrowthOS
                          <AppIcon name="arrow_forward" size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}
