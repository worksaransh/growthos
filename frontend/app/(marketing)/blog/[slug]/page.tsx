"use client";

import Link from "next/link";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { POSTS } from "../posts-data";
import { AppIcon } from "@/components/shared/app-icon";

// ── Full article content ───────────────────────────────────────────────────

const ARTICLES: Record<string, { sections: { heading?: string; body: string; type?: "quote" | "callout" | "list"; items?: string[] }[] }> = {
  "roas-vs-mer-which-metric-actually-matters": {
    sections: [
      { body: "Every D2C founder knows their ROAS. It's the first number they check every morning. But here's the uncomfortable truth: blended ROAS is a vanity metric that can actively mislead you into making worse decisions." },
      { heading: "What's wrong with ROAS?", body: "ROAS (Return on Ad Spend) only measures revenue generated per rupee of advertising spend. It ignores everything else — organic revenue, influencer-driven sales, repeat purchases from email, and direct traffic. When you scale, these non-paid channels grow. Your blended ROAS looks better, but your paid ROAS might actually be declining." },
      { type: "callout", body: "Example: You're doing ₹1Cr revenue with ₹20L ad spend. ROAS = 5x. Looks great. But ₹30L of that revenue is organic (returning customers, SEO, word of mouth). Your true paid ROAS is actually ₹70L revenue / ₹20L spend = 3.5x. Still decent — but very different picture." },
      { heading: "Introducing MER: Marketing Efficiency Ratio", body: "MER = Total Revenue ÷ Total Marketing Spend. This includes all marketing spend — Meta, Google, influencers, WhatsApp campaigns, email platform costs, everything. It gives you the true efficiency of your entire marketing operation." },
      { heading: "Why MER is superior for D2C", body: "As your brand matures, you build brand equity. Organic traffic grows. Returning customer revenue increases. MER captures all of this. A healthy MER trend means your brand is getting more efficient over time — each rupee spent on marketing generates more total revenue as the brand compounds.", type: undefined },
      { type: "list", body: "When to use each metric:", items: [
        "ROAS by campaign: Use this to optimize individual campaigns — pause low performers, scale winners",
        "Blended ROAS by channel: Use this to allocate budget between Meta vs Google vs influencers",
        "MER: Use this to set total marketing budget, evaluate CAC trends, and measure brand health over time",
        "nCAC (new customer CAC): Use this to evaluate if you're acquiring new customers efficiently",
      ]},
      { heading: "MER benchmarks for Indian D2C", body: "These vary significantly by category and stage, but here's what we see across GrowthOS customers:" },
      { type: "list", body: "Category benchmarks:", items: [
        "Beauty & Skincare: MER 3.5–5.5x (high margins support more spend)",
        "Fashion & Apparel: MER 2.5–4x (returns and seasonality are headwinds)",
        "Health & Nutrition: MER 3–5x (strong LTV if subscription is established)",
        "Home & Decor: MER 2–3.5x (longer purchase cycles, fewer impulse buys)",
        "Food & Beverages: MER 2.5–4x (high repeat rate helps)",
      ]},
      { type: "quote", body: "The brands that scale profitably aren't the ones with the highest ROAS. They're the ones who know their real efficiency numbers and make decisions accordingly. — Saransh Gulati, Founder GrowthOS" },
      { heading: "How to track MER in GrowthOS", body: "GrowthOS automatically calculates your MER daily by pulling total revenue from Shopify and total marketing spend from Meta, Google, and any other connected platforms. You can see MER trends over 7, 30, and 90 days, broken down by channel contribution." },
      { heading: "The bottom line", body: "ROAS isn't useless — it's essential for campaign-level optimization. But if you're using it to make budget decisions or evaluate your marketing health, you're flying with broken instruments. Add MER to your daily dashboard and you'll make better decisions immediately." },
    ],
  },

  "how-to-reduce-rto-rate-d2c-india": {
    sections: [
      { body: "If you're running a D2C brand in India and your RTO rate is above 15%, you're silently destroying your business. A 20% RTO rate with COD orders means 1 in 5 packages comes back — paying forward shipping, reverse shipping, repackaging, and the opportunity cost of tied-up inventory." },
      { heading: "The true cost of RTO", body: "Most founders only count the direct shipping cost. The real math is brutal. For a ₹500 order: ₹80 forward shipping + ₹120 reverse logistics + ₹30 repackaging + ₹50 in inventory holding cost + ₹15 payment gateway fee + the original ad spend to acquire that customer. A 20% RTO rate can eat 8-12% of your total revenue in hidden costs." },
      { type: "callout", body: "Quick math: If you're doing ₹1Cr/month with 20% RTO, you're losing ₹8–12L every month to returns. That's ₹1–1.5Cr per year — enough to hire 3 senior people or run a full brand campaign." },
      { heading: "Step 1: Segment your RTO by pincode", body: "Not all pincodes are equal. Using Shiprocket or Delhivery data, identify your top 20 high-RTO pincodes. You'll often find that 20% of pincodes account for 60% of your RTO. The simplest intervention: restrict COD for high-RTO pincodes and offer only prepaid." },
      { heading: "Step 2: WhatsApp COD verification", body: "Before dispatching any COD order, send a WhatsApp message asking the customer to confirm their order. Use a simple template: 'Hi [Name], we're packing your order of [Product] for ₹[Amount]. Reply YES to confirm or NO to cancel.' Brands that implement this see RTO drop by 30-50% immediately." },
      { type: "list", body: "The verification message should:", items: [
        "Arrive within 30 minutes of order placement",
        "Include order details and delivery date estimate",
        "Have a single-tap YES/NO response option",
        "Follow up with a reminder if unanswered after 2 hours",
        "Auto-cancel unconfirmed orders after 4 hours (or move to manual review)",
      ]},
      { heading: "Step 3: Incentivise prepaid", body: "Offer a small incentive to switch from COD to prepaid. A ₹30-50 discount or free shipping for prepaid orders can shift 20-30% of COD customers to prepaid. The economics are clear: you save ₹150+ in potential reverse logistics for a ₹50 discount." },
      { heading: "Step 4: NDR (Non-Delivery Report) automation", body: "When a delivery attempt fails, the courier raises an NDR. Most brands handle this manually — a customer care agent calls the customer. Automate this with WhatsApp: send an automated message with the courier tracking link, ask if they want to reschedule, and update the courier accordingly. Brands using this recover 40-60% of otherwise-failed deliveries." },
      { heading: "Step 5: Courier performance scoring", body: "Not all courier partners perform equally in all pincodes. Use your Shiprocket data to score each courier by delivery success rate per pincode cluster. Automatically route orders to the best-performing courier for each pin. This alone can drop RTO by 3-5 percentage points." },
      { type: "quote", body: "We went from 31% RTO to 8% in 45 days using the WhatsApp COD confirmation flow and pincode restrictions in GrowthOS. That's ₹12L/month back in our pocket. — Neha Sharma, Bloom & Co" },
      { heading: "What 8% RTO looks like", body: "Getting below 10% RTO is achievable for most categories. Brands that crack it see: improved net margin by 4-6%, better working capital (less inventory tied up in transit), improved brand reputation (fewer disappointed customers), and lower CAC over time (happier customers = better word of mouth)." },
      { heading: "GrowthOS RTO dashboard", body: "GrowthOS pulls data from Shiprocket, Delhivery, and Bluedart to give you a live RTO rate by pincode, courier, product, and channel. It flags high-risk orders before dispatch and automates the WhatsApp COD verification flow — all without a single line of code." },
    ],
  },

  "shopify-profit-calculator-true-margin": {
    sections: [
      { body: "Congratulations on your ₹50L month. Now let me tell you something nobody else will: that number is almost certainly not what you think it is. Shopify's revenue dashboard is a starting point, not the finish line." },
      { heading: "The 7 layers between revenue and actual profit", body: "Most D2C founders stop at gross revenue. The brands that survive long-term obsess over net profit per order. Here are the seven deductions between your Shopify revenue and what actually hits your bank account." },
      { type: "list", body: "The profit layers:", items: [
        "Layer 1 — Returns & Refunds: Shopify reports gross revenue. Subtract return rate (often 8-18%) to get net revenue",
        "Layer 2 — COGS: Cost of goods sold including manufacturing, packaging, and inbound freight",
        "Layer 3 — Payment Gateway Fees: Razorpay/Cashfree charge 2-3% on prepaid, COD has additional ₹20-40/order",
        "Layer 4 — Shipping Costs: Forward + reverse. Remember to account for RTO separately",
        "Layer 5 — Ad Spend Attribution: Attribute your Meta/Google spend per order by channel",
        "Layer 6 — Platform & App Fees: Shopify subscription, apps, GrowthOS, email tool, etc. divided by order volume",
        "Layer 7 — GST & Tax: Your effective tax burden per order after input credits",
      ]},
      { heading: "A real example", body: "Let's take a ₹999 skincare order. Here's what the math typically looks like for a mid-stage D2C brand:" },
      { type: "callout", body: "Revenue: ₹999 | Returns provision (12%): -₹120 | COGS (35%): -₹350 | Payment gateway (2.5%): -₹25 | Shipping: -₹85 | Reverse logistics provision: -₹28 | Ad attribution (blended CAC/LTV): -₹180 | Platform costs per order: -₹15 | Net profit: ₹196 (19.6% margin)" },
      { heading: "Why contribution margin matters more than net profit", body: "Net profit includes fixed costs (salaries, office, software) that don't scale with orders. Contribution margin (CM) strips out only variable costs. CM1 = Revenue minus COGS. CM2 = CM1 minus marketing spend. CM3 = CM2 minus fulfilment costs. If CM2 is negative, scaling will make you more unprofitable, not less." },
      { heading: "How GrowthOS calculates your true margin", body: "GrowthOS connects to Shopify, your ad platforms, Razorpay/Cashfree, and Shiprocket to automatically calculate your true contribution margin per order, per SKU, and per channel — updated daily. No spreadsheets. No manual reconciliation." },
      { type: "quote", body: "I thought I was running a 25% margin business. GrowthOS showed me it was actually 11%. The scary part? That was still profitable. The dangerous part is I wouldn't have known." },
      { heading: "Start with one SKU", body: "Don't try to calculate profit for your entire catalogue at once. Pick your bestseller and run the numbers manually first. If the true margin surprises you, you need GrowthOS. If it doesn't, you're one of the lucky few who already has financial clarity." },
    ],
  },

  "whatsapp-cart-recovery-playbook": {
    sections: [
      { body: "Apex Footwear had a 76% cart abandonment rate. Their email recovery sequence was getting 8% open rates. WhatsApp got them 94% open rates and a 28% recovery rate on abandoned carts — generating ₹2.4Cr in additional revenue over 6 months." },
      { heading: "Why WhatsApp beats email for cart recovery in India", body: "India has 500M+ WhatsApp users. Open rates for WhatsApp Business messages hover between 85-98%. Email open rates for cart recovery average 15-20%. For Indian D2C, WhatsApp isn't an optional channel — it's your highest-leverage recovery tool." },
      { heading: "The 3-message recovery sequence", body: "The sequence that works is simple, time-sensitive, and respects the customer's attention. Here's the exact framework:" },
      { type: "list", body: "Message 1 — Reminder (30 minutes after abandonment):", items: [
        "Tone: Helpful, not pushy",
        "Content: 'Hi [Name]! You left something behind 👀 Your [Product Name] is waiting for you. Stock is limited — complete your order before it sells out.'",
        "CTA: Single button — 'Complete Order'",
        "No discount yet — test if urgency alone converts",
      ]},
      { type: "list", body: "Message 2 — Social proof (3 hours after abandonment):", items: [
        "Tone: Build trust, reduce risk",
        "Content: 'Still thinking about [Product]? 4,200 happy customers can't be wrong ⭐⭐⭐⭐⭐ Here's what they said: [Review snippet]. Free returns within 7 days. No questions asked.'",
        "Include: A genuine 5-star review and your return policy",
        "CTA: 'View Reviews & Order'",
      ]},
      { type: "list", body: "Message 3 — Incentive (24 hours after abandonment):", items: [
        "Tone: Final nudge, genuine value",
        "Content: 'Last chance, [Name]. We're holding your [Product] for the next 2 hours. Use code SAVE10 for 10% off — exclusively for you.'",
        "Make the coupon personal and time-limited",
        "After this message, let the customer go — no more messages",
      ]},
      { heading: "Timing is everything", body: "The 30-minute first message is critical. After 2 hours, conversion rates drop by 60%. After 24 hours, most people have mentally moved on. The sweet spot for message 2 is 3-6 hours. Message 3 works best at 20-24 hours — when the customer has slept on it." },
      { type: "callout", body: "A/B test to run immediately: Split your abandoned carts 50/50. Group A gets the sequence above. Group B gets your existing email sequence. Measure recovery rate and revenue recovered. In our experience, WhatsApp outperforms email 3:1 for Indian D2C." },
      { heading: "Compliance: Stay on the right side of WhatsApp", body: "WhatsApp has strict rules for business messaging. You need: an approved business account, pre-approved message templates, and customers who have opted into communications. GrowthOS handles template approval and manages opt-ins from your Shopify checkout flow automatically." },
      { type: "quote", body: "We were leaving ₹40L on the table every month. GrowthOS automated the recovery flow and now WhatsApp is our highest-ROAS channel at 11.2x. — Rohan Kapoor, Co-Founder Apex Footwear" },
      { heading: "Beyond cart recovery", body: "Once the cart recovery sequence is working, expand WhatsApp automation to: order confirmation + tracking updates, delivery feedback and review requests, reorder reminders (30 days after purchase for consumables), VIP early access announcements, and COD order verification to reduce RTO." },
    ],
  },

  "meta-ads-creative-fatigue-signals": {
    sections: [
      { body: "You had a winning creative. It ran for 3 weeks, ROAS was 4.5x, you scaled the budget. Now it's week 6 and ROAS is 2.1x. You're still running the same creative. This is creative fatigue — and it's the number one silent killer of Meta Ads performance." },
      { heading: "What is creative fatigue?", body: "Creative fatigue occurs when your target audience has seen your ad so many times that they stop engaging with it. The algorithm then has to pay more to reach new people (CPM rises), click-through rates decline, and conversion rates drop — even if the landing page and offer are unchanged." },
      { heading: "Signal #1: Frequency above 3.5 in 7 days", body: "Check your ad set frequency. If your audience is seeing your ad more than 3.5 times in a week, they're oversaturated. This is the earliest quantitative signal. Act before you see CPM rise." },
      { heading: "Signal #2: CTR declining week-over-week", body: "A healthy creative maintains or improves CTR as the algorithm learns. If your CTR is declining consistently for 2+ weeks, the creative is tired even if the audience isn't fully saturated. Monitor CTR by creative — not by campaign." },
      { heading: "Signal #3: CPM rising without audience size decrease", body: "If your CPM increases but your audience size hasn't shrunk (you haven't narrowed targeting), Meta is telling you it has to work harder to find receptive people in your audience. This is the algorithm's version of 'this ad is getting stale.'" },
      { type: "list", body: "Signal #4: Comments change in tone", items: [
        "Early stage (fresh creative): mostly positive comments, questions, purchases",
        "Mid stage (warming): mix of engagement and some 'I've seen this 10 times'",
        "Fatigue stage: comments like 'same ad again', 'already bought it', negative sentiment",
        "Check your ad comments weekly — qualitative signals often precede quantitative ones",
      ]},
      { heading: "Signal #5: View rate on video drops below 20%", body: "For video creatives, track the percentage of people watching past the 3-second and 15-second marks. When 3-second view rate drops below 20% (from a higher baseline), people are actively scrolling past — they've seen it and aren't interested." },
      { type: "callout", body: "Rule of thumb: Prepare 3x more creatives than you think you need. Top D2C brands in GrowthOS churn through 8-12 creative variations per month. The brands winning on Meta are creative production machines, not just ad buyers." },
      { heading: "How to refresh creative without losing learning", body: "Don't delete fatigued ad sets — this loses algorithm learning. Instead: duplicate the ad set, swap the creative, keep all other parameters identical. The algorithm retains audience and placement learning while testing the fresh creative. Let both run for 7 days, then kill the underperformer." },
      { heading: "Creative rotation framework", body: "Set a calendar reminder to audit creatives every 2 weeks. Any creative with frequency >3 or CTR declining 15%+ gets rotated out. Keep a creative bank of 5-7 approved concepts so rotation is proactive, not reactive." },
      { type: "quote", body: "The best Meta advertisers spend 40% of their time on creative strategy, not ad structure. Structure matters — but creative wins." },
    ],
  },

  "rfm-segmentation-d2c-guide": {
    sections: [
      { body: "Most D2C brands treat all customers the same. Same emails. Same discounts. Same WhatsApp blasts. This is the fastest way to train your best customers to wait for promotions, alienate your occasional buyers, and waste money re-engaging customers who've permanently churned." },
      { heading: "What is RFM?", body: "RFM stands for Recency (how recently they bought), Frequency (how often they buy), and Monetary (how much they spend). By scoring customers on all three dimensions, you create segments that behave very differently — and require very different marketing approaches." },
      { type: "list", body: "The core RFM segments:", items: [
        "Champions (High R, High F, High M): Your VIPs. Bought recently, buy often, spend the most. Reward them with early access and exclusive offers.",
        "Loyal Customers (High F, High M, moderate R): Regular buyers who trust you. Great for upsell and subscription offers.",
        "At-Risk (Low R, High F, High M): Were loyal, haven't bought recently. Highest priority for win-back campaigns.",
        "One-Timers (Low F, varies R): Bought once and never again. The largest segment for most brands. Price-sensitive, need strong reason to return.",
        "Dormant (Low R, Low F, Low M): Likely churned. Low investment, high-discount win-back or suppress entirely.",
      ]},
      { heading: "Building your RFM model", body: "Score each customer 1-5 on each dimension. R=5 means very recent (bought in last 30 days), R=1 means haven't bought in 6+ months. F=5 means 5+ orders, F=1 means first-time buyer. M=5 means top 20% by spend. Your RFM score is a 3-digit number: 555 is a Champion, 111 is Dormant." },
      { heading: "The maths behind D2C success", body: "In GrowthOS data across 200+ D2C brands: Champions (the top 10% of customers by RFM) generate 40-60% of total revenue. Increasing Champion repeat purchase rate by 20% typically grows total revenue by 8-12% without any additional ad spend." },
      { type: "callout", body: "The single highest-ROI campaign you can run: identify your At-Risk Champions (bought 3+ times, high spend, but haven't bought in 60+ days) and run a hyper-personalised win-back via WhatsApp and email. These customers have already proven they love your product — they just need a reason to come back." },
      { heading: "Campaign playbook by segment", body: "Once you have segments, here's how to activate them:" },
      { type: "list", body: "Segment-specific campaigns:", items: [
        "Champions: VIP early access, loyalty rewards, referral program invite, co-creation opportunities",
        "Loyal Customers: Subscription offer (save 15%), product launch exclusives, bundle recommendations",
        "At-Risk: Personalised 'We miss you' with meaningful discount (15-20%), highlight new arrivals since last purchase",
        "One-Timers: Education content about the category, social proof from happy customers, small incentive to try again",
        "Dormant: One final win-back attempt with 25%+ discount, then suppress from paid campaigns entirely",
      ]},
      { type: "quote", body: "RFM turned our email list from a liability into our highest-margin channel. The At-Risk campaign alone recovered ₹18L in a single week. — Pure Origins customer" },
      { heading: "GrowthOS RFM automation", body: "GrowthOS automatically segments your customers into RFM groups daily using Shopify purchase data. When a Champion drops into At-Risk status, it triggers an automated WhatsApp win-back sequence. No manual exports, no spreadsheets." },
    ],
  },

  "google-shopping-feed-optimisation": {
    sections: [
      { body: "Google Shopping is the most intent-driven paid channel available to D2C brands. Customers searching 'buy organic face serum 100ml' are ready to purchase. But most brands treat their product feed like a database dump — and wonder why their Shopping ROAS is stuck at 1.5x." },
      { heading: "The feed is your ad", body: "Unlike traditional ads where you write copy, in Shopping your feed IS the ad. Your product title, image, price, and rating determine whether you appear, what you pay per click, and whether the customer clicks. Optimising the feed is the highest-leverage Shopping action you can take." },
      { heading: "Title optimisation: the most impactful change", body: "Google reads your title to understand what query your product should appear for. Most brands use their internal product names. Shoppers search differently. Restructure titles as: [Brand] + [Product Type] + [Key Feature] + [Size/Variant]. Urban Thread Co changed 'Classic Tee 001' to 'Urban Thread Co Men's Slim Fit Cotton T-Shirt White XL' — CTR went from 0.8% to 2.4% in 2 weeks." },
      { type: "list", body: "Title optimisation rules:", items: [
        "Lead with the most searchable terms — Google weights the first 70 characters most heavily",
        "Include size, colour, and material where relevant — these are common search modifiers",
        "Avoid internal codes, abbreviations, or creative product names that shoppers don't search for",
        "Include the brand name — branded searches convert 3x better than generic",
        "Use Google's query report to find actual search terms driving impressions and update titles accordingly",
      ]},
      { heading: "Image optimisation", body: "White background images are required. But within that constraint, image quality has enormous impact. Use high-resolution images (minimum 800x800px, ideally 1200x1200px). Show the product clearly, not at an angle. If you have lifestyle images, use them in supplementary image slots — they improve click-through for warm audiences." },
      { heading: "Pricing strategy in Shopping", body: "Shopping ads show your price alongside competitors. If you're 20% more expensive with no visible differentiation, you'll pay more for clicks and convert less. Either justify the premium (reviews, brand strength, bundle) or ensure competitive pricing on your hero SKUs. GrowthOS can track competitor prices for your top products automatically." },
      { type: "callout", body: "The 15-minute feed audit: Export your current Shopping feed, sort by impressions, look at your top 20 products by impression. For each, check: Is the title search-optimised? Is the image white-background, high quality? Is there a GTIN/MPN? Are reviews synced? Fixing these 20 products can move overall Shopping performance by 30%+." },
      { heading: "Product ratings and reviews", body: "Google shows star ratings in Shopping ads. Products with 4+ stars and 50+ reviews see 15-25% higher CTR. Sync your Shopify reviews to Google using Google's Product Ratings programme or a supported app. For new products, use Judge.me or Stamped to accelerate review collection post-purchase." },
      { heading: "Smart Shopping vs Standard Shopping", body: "Google's Smart Shopping (now Performance Max) uses AI to optimise placement and bids. It works well for brands with good conversion data (50+ conversions/month per campaign). For smaller catalogues or newer brands, Standard Shopping with manual bidding gives more control and transparency while you build data." },
      { type: "quote", body: "We spent 6 months optimising bids and ignoring the feed. GrowthOS showed us that feed optimisation was 5x higher leverage. CTR went from 1.2% to 3.8% in 30 days. — Vikram Nair, CMO Urban Thread Co" },
    ],
  },

  "d2c-inventory-forecast-prevent-stockouts": {
    sections: [
      { body: "A stockout during a sale event is one of the most expensive things that can happen to a D2C brand. You've paid to acquire traffic. You've built up demand. And then: 'Out of stock'. The customer bounces, your ad spend is wasted, and your conversion rate tanks just when it should be at its peak." },
      { heading: "Why traditional reorder points fail", body: "Most brands set a fixed reorder point — when stock hits 100 units, order 500 more. This works when demand is flat. D2C demand is anything but flat. Seasonality, campaign launches, influencer mentions, and platform algorithm changes cause 3-5x demand spikes. A static reorder point can't handle this." },
      { heading: "The four inputs to accurate forecasting", body: "Good inventory forecasting requires four data streams working together:" },
      { type: "list", body: "Required data inputs:", items: [
        "Sell-through velocity: Daily and weekly units sold by SKU for the last 90 days, weighted toward recent performance",
        "Seasonality index: Historical sales patterns by month — which SKUs spike in summer, winter, or festival season",
        "Supplier lead time: Exact days from order placement to stock-in (including buffer for delays)",
        "Campaign calendar: Upcoming marketing campaigns, sale events, influencer posts that will spike demand",
      ]},
      { heading: "The forecast formula", body: "Reorder Point = (Average Daily Sales × Lead Time Days) + Safety Stock. Safety Stock = Z-score × Standard Deviation of Daily Sales × √Lead Time. For a 95% service level, Z-score = 1.65. This accounts for both demand variability and supply variability." },
      { type: "callout", body: "Simplified example: You sell 50 units/day of Product A (SD = 15 units/day). Supplier lead time is 14 days. Safety stock = 1.65 × 15 × √14 = 93 units. Reorder point = (50 × 14) + 93 = 793 units. When you hit 793 units in stock, place a new order." },
      { heading: "Campaign-adjusted forecasting", body: "The most important enhancement: adjust your forecast for upcoming demand events. If you're running a 40% off sale next week and historically see 5x traffic during sales, multiply your base forecast by 5 for that SKU during that window. GrowthOS does this automatically by pulling your campaign calendar and historical sale lift data." },
      { heading: "ABC analysis for inventory investment", body: "Not all SKUs deserve equal inventory investment. A-items (top 20% by revenue) should have 98%+ service level — never stock out. B-items (next 30% by revenue) can run at 95% service level. C-items (bottom 50% by revenue) can run lean at 90% — occasional stockouts here are acceptable. Focus your forecasting rigour on A-items." },
      { type: "quote", body: "GrowthOS's forecast engine prevented 4 major stockout events in one quarter. The alert came 3 weeks before we would have run out — enough time to expedite a supplier order. — Aisha Patel, Founder Pure Origins" },
      { heading: "Bundle management", body: "Bundles add forecasting complexity. If you have a bundle of Product A + Product B, the constraint is whichever component runs out first. Track bundle component consumption separately and forecast for component demand including both standalone and bundle usage." },
      { heading: "Start with your top 10 SKUs", body: "Don't try to implement sophisticated forecasting across your entire catalogue at once. Start with your top 10 SKUs by revenue — these are where stockouts hurt most. Get the forecasting right for these, then expand." },
    ],
  },

  "ltv-cac-ratio-benchmarks-india-d2c": {
    sections: [
      { body: "3:1 is the standard benchmark for LTV:CAC. But this benchmark was developed for SaaS businesses in the West, where subscription models are common and payment failure rates are low. For Indian D2C — with COD at 60%, return rates of 10-20%, and category-specific repeat purchase patterns — the math is different." },
      { heading: "How to calculate LTV correctly for D2C India", body: "LTV = (Average Order Value × Purchase Frequency × Customer Lifespan) × Gross Margin Percentage. Most brands calculate LTV using revenue, not margin. This overstates LTV by 30-70%. A ₹2,000 order with 40% gross margin contributes ₹800 in LTV — not ₹2,000." },
      { type: "callout", body: "Corrected LTV example: AOV = ₹1,500 | Purchase frequency = 2.8×/year | Customer lifespan = 2.2 years | Gross margin = 55% | LTV = ₹1,500 × 2.8 × 2.2 × 0.55 = ₹5,082. Not ₹9,240 (the gross LTV without margin). This is the number to use." },
      { heading: "Category benchmarks: what's healthy?", body: "Based on GrowthOS data across 200+ brands:" },
      { type: "list", body: "LTV:CAC by category:", items: [
        "Beauty & Skincare: Healthy = 4:1–6:1. High repeat purchases and subscription potential make this a forgiving category.",
        "Fashion & Apparel: Healthy = 2.5:1–4:1. Returns and seasonal purchasing reduce LTV. Focus on reducing return rates.",
        "Health & Nutrition: Healthy = 3:1–5:1. Subscription converts well. Monthly reorder cadence = strong LTV if retained past 3 orders.",
        "Home & Decor: Healthy = 2:1–3:1. Low purchase frequency. CAC must be kept very tight. Referrals and SEO are critical.",
        "Food & Beverages: Healthy = 3:1–5:1. Weekly/monthly consumption = high frequency potential. Unit economics are tight on COGS.",
      ]},
      { heading: "Red flags to act on immediately", body: "LTV:CAC below 2:1 means you're acquiring customers at a loss when you factor in operations and overhead. At this ratio, scaling makes the business less profitable, not more. This is the #1 signal that your unit economics need fixing before you scale." },
      { type: "list", body: "Warning signs:", items: [
        "LTV:CAC below 2:1: Acquisition cost too high or LTV too low — don't scale",
        "LTV declining quarter-over-quarter: Customer quality degrading — audit channel mix",
        "CAC rising faster than LTV: Efficiency gap — improve retention before increasing spend",
        "High LTV:CAC but declining absolute profit: Volume growth masking margin erosion",
      ]},
      { heading: "How to improve your ratio", body: "You can improve LTV:CAC from either direction. To reduce CAC: improve creative performance, shift budget to lower-CAC channels (Google, SEO, WhatsApp), improve landing page conversion rate. To improve LTV: increase repeat purchase rate with post-purchase WhatsApp, introduce subscription, increase AOV through bundles, and reduce return rates." },
      { type: "quote", body: "Our LTV:CAC was 2.1:1 when we started with GrowthOS. 6 months later it's 4.8:1 — not from cutting acquisition spend but from doubling repeat purchase rate through automated retention flows." },
      { heading: "Track LTV by cohort, not average", body: "Average LTV masks cohort differences. Customers acquired in December (holiday season) often have lower LTV than those acquired in September — because holiday buyers are more deal-motivated and less brand-loyal. Track LTV by acquisition month and channel to understand where your best customers come from." },
    ],
  },

  "founder-ai-vs-data-analyst-hire": {
    sections: [
      { body: "At some point in your D2C journey, you'll hit a wall. Your Shopify reports aren't enough. You're making decisions based on gut feel and weekly spreadsheet exports. The obvious solution seems like hiring a data analyst. But in 2026, that's not always the right first move." },
      { heading: "What a data analyst actually does (and costs)", body: "A good data analyst at a D2C brand earning ₹5-15Cr ARR will cost you ₹8-14L per year in salary, plus time spent onboarding them to your tools and data structure. Their output: dashboards, ad-hoc analysis, and weekly reports. They're typically 3-5 days behind the data because of the time it takes to pull, clean, and analyse." },
      { heading: "What AI tools do in 2026", body: "Modern AI analytics (including GrowthOS's Founder AI) can: answer any question about your business in seconds, identify patterns humans miss across millions of data points, run attribution analysis across all channels, flag anomalies proactively before you notice them, and generate complete P&L analysis by SKU, channel, and campaign — all updated in real-time." },
      { type: "callout", body: "The test: Ask both an analyst and GrowthOS's Founder AI this question: 'Which of my products has the highest true profit margin after shipping, returns, and ad attribution?' The AI answers in 4 seconds. The analyst takes 3 days. The AI's answer is likely more accurate because it has live data." },
      { heading: "Where humans still win", body: "AI is not a replacement for human judgment in all areas. Data analysts excel at: building custom data pipelines and integrations, designing experimentation frameworks, qualitative research (customer interviews, focus groups), strategic storytelling for investor presentations, and navigating political complexity inside larger organisations." },
      { type: "list", body: "Hire a data analyst when:", items: [
        "You're above ₹50Cr ARR and have multiple teams who need custom data access",
        "You have complex data infrastructure needs (multiple ERPs, offline sales, international ops)",
        "You need a human to own experimentation methodology and statistical rigour",
        "Your board or investors require formal data governance and audit trails",
        "You've already extracted maximum value from AI tools and hit their ceiling",
      ]},
      { type: "list", body: "Use AI tools instead when:", items: [
        "You're between ₹5-50Cr ARR — the AI ROI is 10x higher than analyst ROI at this stage",
        "You need answers fast — campaign decisions can't wait 3 days",
        "You want proactive alerts — AI monitors 24/7, humans don't",
        "Budget is a constraint — ₹15,000/month for GrowthOS vs ₹1L+ for analyst salary",
        "Your questions are operational, not strategic (what's my ROAS, what's my RTO rate, which SKU is most profitable)",
      ]},
      { type: "quote", body: "I'm a 3-person team doing ₹3Cr/month. GrowthOS's Founder AI has been my analytics team, CFO, and growth advisor all year. I'll hire a human analyst when I'm at ₹30Cr. — Aisha Patel, Pure Origins" },
      { heading: "The hybrid future", body: "The best outcome at scale is both — AI that handles 90% of operational analysis automatically, freeing a human analyst to focus on the 10% that requires genuine creative thinking and strategic judgment. But for most D2C brands below ₹30Cr ARR, starting with AI is the smarter investment." },
    ],
  },

  "cod-to-prepaid-conversion-strategy": {
    sections: [
      { body: "COD (Cash on Delivery) remains 55-65% of all D2C orders in India. And it carries hidden costs most brands don't fully account for: higher RTO, reverse logistics, payment delays, and the emotional cost of dealing with fraudulent orders. Getting even 25% of COD customers to go prepaid is worth ₹2-5L/month for a ₹1Cr/month brand." },
      { heading: "Why customers choose COD", body: "Understanding the motivation is essential before designing conversion strategies. Customers choose COD primarily for three reasons: trust (they don't trust the brand enough to pay upfront), habit (COD is what they've always done), or risk aversion (what if the product is bad quality?). Your strategy must address the actual reason — not assume it's all about payment method." },
      { heading: "Strategy #1: Prepaid incentive at checkout", body: "The simplest approach. Offer a meaningful discount or benefit for choosing prepaid at checkout. 'Pay online and get free express shipping' or 'Pay online and save ₹50'. The discount must be visible and compelling — a ₹10 discount on a ₹999 order won't move the needle. Test ₹40-75 discounts or free shipping (valued at ₹60-80)." },
      { type: "list", body: "Effective prepaid incentives:", items: [
        "Free shipping (high perceived value, ₹60-80 actual cost — better than straight discount)",
        "₹50-75 cashback to store wallet (drives repeat purchase while incentivising prepaid)",
        "Priority processing — 'prepaid orders ship same day'",
        "Free gift with prepaid (add a sample or accessory — low cost, high perceived value)",
        "Extended return window — '30-day returns for prepaid vs 7-day for COD'",
      ]},
      { heading: "Strategy #2: Post-COD nudge via WhatsApp", body: "When a COD order is placed, send a WhatsApp message within 2 minutes: 'Thank you for your order! Switch to online payment now and get ₹50 cashback. Pay here: [link]. Offer valid for the next 30 minutes.' This captures impulsive prepaid conversions from customers who chose COD out of habit, not distrust." },
      { type: "callout", body: "Real result: A GrowthOS customer running this post-order nudge converted 18% of COD orders to prepaid within 30 minutes of order placement. At their volume (800 orders/day), this was ₹28L/month shifted from COD to prepaid — eliminating ₹4L in monthly reverse logistics costs." },
      { heading: "Strategy #3: Trust-building for first-time buyers", body: "First-time buyers have the highest COD rate. They don't know you yet. Build trust before asking for prepayment: show reviews on the product page, add a 'Verified by [rating platform]' badge, highlight your return policy prominently, and use an 'As seen in [media]' strip. Once they've bought from you once (even COD), prepaid conversion on subsequent orders is 3x easier." },
      { heading: "Strategy #4: COD block for repeat offenders", body: "Identify customers with 3+ COD orders that resulted in RTO. These customers cost you real money — shipping there and back, and they rarely convert to prepaid. Block COD for these customers automatically. GrowthOS can flag and block high-RTO customer profiles from placing COD orders." },
      { type: "quote", body: "We ran the post-order WhatsApp nudge for 30 days. 18% of COD orders converted to prepaid. The ₹50 incentive cost us ₹1.2L total. We saved ₹3.8L in reverse logistics. Net gain: ₹2.6L in one month." },
      { heading: "Measuring success", body: "Track prepaid rate weekly by channel (SEO vs Meta vs Google have very different COD rates), by pincode, and by customer cohort (new vs returning). Aim to move prepaid rate from a typical 40% baseline to 55-60% over 6 months. Beyond 60% requires sustained trust-building and brand equity — there's no shortcut." },
    ],
  },

  "d2c-contribution-margin-guide": {
    sections: [
      { body: "Your D2C business is not a revenue story. It's a contribution margin story. Revenue growth with declining contribution margins is the path to burning cash faster as you scale. Understanding and tracking CM is the single most important financial discipline for D2C founders." },
      { heading: "The three levels of contribution margin", body: "Contribution margin isn't one number — it's three, each stripping out different cost layers. Understanding all three gives you a complete picture of your financial health." },
      { type: "list", body: "The CM layers:", items: [
        "CM1 (Gross Margin) = Revenue − COGS. This tells you if your product economics are viable. Healthy: 55-70% for beauty/health, 45-60% for fashion, 30-50% for F&B.",
        "CM2 (Marketing Contribution) = CM1 − Paid Marketing Spend. This tells you if your customer acquisition is profitable before fulfilment. Healthy: 30-50% of revenue.",
        "CM3 (Fulfilment Contribution) = CM2 − Shipping + Returns + Payment Gateway. This is what you actually 'keep' before fixed costs. Healthy: 15-30% of revenue.",
      ]},
      { heading: "Why CM3 is the survival metric", body: "Fixed costs (salaries, rent, software) exist regardless of order volume. If your CM3 is negative, more orders make you more unprofitable. If CM3 is positive, every additional order contributes to covering fixed costs and eventually generating profit. CM3 is the line between a viable business model and a money pit." },
      { type: "callout", body: "The CM3 trap: A brand doing ₹1Cr/month with 25% CM1, spending ₹30L on ads (30% of revenue), and 12% fulfilment costs has CM3 = 25% - 30% - 12% = -17%. Every order loses money. Scaling to ₹2Cr/month doubles losses. This is how well-funded D2C brands die." },
      { heading: "Calculating CM by channel", body: "Your overall CM is less useful than CM by channel. Meta-acquired customers might have CAC of ₹600 and LTV of ₹1,400 — positive CM2. SEO customers might have CAC of ₹80 and LTV of ₹1,600 — very positive. Direct/type-in customers have CAC of ~₹0. Blending these hides the fact that one channel is profitable and one isn't." },
      { heading: "Calculating CM by SKU", body: "Every SKU has a different gross margin, return rate, and weight (affecting shipping cost). Your bestseller might have the worst CM per order. Your slow-moving premium product might have the best. SKU-level CM calculation tells you which products to push, bundle, and discount — and which to quietly discontinue." },
      { type: "list", body: "Common CM improvement levers:", items: [
        "Increase AOV through bundles (same shipping cost, more margin per shipment)",
        "Negotiate COGS down with suppliers (volume discounts, advance payment discounts)",
        "Reduce return rate (each return destroys CM3 on that transaction and raises future CAC)",
        "Shift channel mix toward organic/SEO (same LTV, much lower CAC = better CM2)",
        "Renegotiate courier rates (meaningful savings at 1,000+ shipments/month)",
        "Switch high-volume customers to subscription (predictable demand, lower per-unit fulfilment cost)",
      ]},
      { heading: "The healthy CM benchmark", body: "Target: CM1 > 55%, CM2 > 25%, CM3 > 12%. If your CM3 is above 12%, you have a path to profitability. If it's below 5%, you need to fix unit economics before growth. If it's negative, stop scaling immediately and diagnose." },
      { type: "quote", body: "I tracked revenue for 2 years and thought I was building a profitable business. GrowthOS showed me my CM3 was 3%. I was one bad month from insolvency. Fixing it took 90 days of hard decisions — but it saved the company." },
      { heading: "GrowthOS contribution margin tracking", body: "GrowthOS calculates all three CM levels daily, by SKU, by channel, and by customer cohort — automatically pulling from Shopify, your ad platforms, and your fulfilment data. The P&L dashboard makes CM trends visible in real-time, so you can course-correct before a problem becomes a crisis." },
    ],
  },
};

// ── Renderers ──────────────────────────────────────────────────────────────

function Section({ section }: { section: { heading?: string; body: string; type?: string; items?: string[] } }) {
  if (section.type === "quote") {
    return (
      <blockquote className="my-8 border-l-4 border-[#c0c1ff]/40 pl-6 py-2">
        <p className="text-[#dbe2fd] text-lg italic leading-relaxed">&ldquo;{section.body}&rdquo;</p>
      </blockquote>
    );
  }

  if (section.type === "callout") {
    return (
      <div className="my-6 rounded-2xl bg-[#c0c1ff]/8 border border-[#c0c1ff]/20 p-5">
        <div className="flex gap-3">
          <AppIcon name="lightbulb" size={18} className="mt-0.5 text-[#c0c1ff]" />
          <p className="text-[#dbe2fd] text-sm leading-relaxed">{section.body}</p>
        </div>
      </div>
    );
  }

  if (section.type === "list" && section.items) {
    return (
      <div className="my-5">
        {section.body && <p className="text-[#c7c4d7] text-sm leading-relaxed mb-3">{section.body}</p>}
        <ul className="space-y-2.5">
          {section.items.map((item, i) => {
            const [bold, ...rest] = item.split(": ");
            const hasBold = item.includes(": ") && rest.length > 0;
            return (
              <li key={i} className="flex gap-3 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c0c1ff] flex-shrink-0 mt-2" />
                <span className="text-[#c7c4d7] text-sm leading-relaxed">
                  {hasBold ? (
                    <><strong className="text-[#dbe2fd]">{bold}</strong>: {rest.join(": ")}</>
                  ) : item}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="my-5">
      {section.heading && (
        <h2 className="text-[#dbe2fd] text-xl font-bold mb-3 mt-8">{section.heading}</h2>
      )}
      <p className="text-[#c7c4d7] text-base leading-relaxed">{section.body}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const post = POSTS.find((p) => p.slug === slug);
  const article = ARTICLES[slug];

  if (!post) return notFound();

  const related = POSTS.filter((p) => p.slug !== slug && p.category === post.category).slice(0, 3);
  const otherRelated = related.length < 2 ? POSTS.filter((p) => p.slug !== slug && !related.includes(p)).slice(0, 3 - related.length) : [];
  const relatedPosts = [...related, ...otherRelated].slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0b1326]">
      {/* Hero */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-[#c0c1ff] text-sm hover:text-white transition-colors mb-8">
            <AppIcon name="arrow_forward" size={15} className="rotate-180" />
            Back to Blog
          </Link>

          <div className="flex items-center gap-3 mb-5">
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
              style={{ backgroundColor: post.tag_color + "20", color: post.tag_color }}
            >
              {post.category}
            </span>
            <span className="text-[#464554] text-xs">{post.read_time}</span>
            <span className="text-[#464554] text-xs">·</span>
            <span className="text-[#464554] text-xs">{post.date}</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-black text-[#dbe2fd] leading-snug mb-6">
            {post.title}
          </h1>

          <p className="text-[#c7c4d7] text-lg leading-relaxed mb-8">{post.excerpt}</p>

          {/* Author */}
          <div className="flex items-center gap-3 pb-8 border-b border-white/10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c0c1ff] to-[#ddb7ff] flex items-center justify-center text-sm font-bold text-[#0b1326]">
              {post.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <p className="text-[#dbe2fd] font-semibold text-sm">{post.author}</p>
              <p className="text-[#c7c4d7] text-xs">{post.author_role}</p>
            </div>
          </div>

          <div className="relative mt-8 h-64 overflow-hidden rounded-3xl border border-white/10 bg-[#0f1729] md:h-80">
            <Image
              src={post.image}
              alt={post.image_alt}
              fill
              priority
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover opacity-[0.85]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1729]/80 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#0b1326]/75 backdrop-blur-md">
                <AppIcon name={post.icon ?? "blog"} size={24} style={{ color: post.icon_color ?? "#c0c1ff" }} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#c7c4d7]">GrowthOS Field Notes</p>
                <p className="text-sm font-semibold text-[#dbe2fd]">{post.category}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article body */}
      <section className="px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          {article ? (
            article.sections.map((section, i) => (
              <Section key={i} section={section} />
            ))
          ) : (
            <p className="text-[#c7c4d7] text-base leading-relaxed">
              Full article coming soon. Check back later.
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-12">
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-3xl p-8 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(192,193,255,0.08) 0%, rgba(221,183,255,0.08) 100%)",
              border: "1px solid rgba(192,193,255,0.2)",
            }}
          >
            <h3 className="text-[#dbe2fd] text-xl font-bold mb-2">
              See this in action on your own data
            </h3>
            <p className="text-[#c7c4d7] text-sm mb-5">
              GrowthOS gives you live visibility into the metrics discussed in this article — automatically connected to your Shopify, Meta, and Google accounts.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[#0b1326] text-sm transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #c0c1ff 0%, #ddb7ff 100%)" }}
            >
              Start free trial — no credit card
              <AppIcon name="arrow_forward" size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="px-4 pb-24">
          <div className="max-w-3xl mx-auto">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#464554] mb-5">
              Continue Reading
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {relatedPosts.map((rp) => (
                <Link key={rp.slug} href={`/blog/${rp.slug}`} className="group block">
                  <div className="rounded-2xl border border-white/10 bg-[#0f1729] p-4 hover:border-[#c0c1ff]/30 transition-all h-full">
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full mb-3 block w-fit"
                      style={{ backgroundColor: rp.tag_color + "15", color: rp.tag_color }}
                    >
                      {rp.category}
                    </span>
                    <p className="text-[#dbe2fd] text-sm font-bold leading-snug group-hover:text-white transition-colors mb-2">
                      {rp.title}
                    </p>
                    <p className="text-[#464554] text-[10px]">{rp.read_time}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
