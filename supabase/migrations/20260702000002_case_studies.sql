-- ─────────────────────────────────────────────────────────────────────────────
-- case_studies — super-admin managed, publicly readable
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.case_studies (
  id           text primary key,
  brand        text not null,
  category     text not null,
  logo         text not null default 'star',
  logo_color   text not null default '#c0c1ff',
  tagline      text not null,
  description  text not null,
  hero_metric  text not null,
  hero_label   text not null,
  gmv          text default '',
  featured     boolean not null default false,
  sort_order   integer default 0,
  metrics      jsonb not null default '[]'::jsonb,
  tags         text[] not null default '{}',
  results      text[] not null default '{}',
  quote        text default '',
  quote_name   text default '',
  quote_role   text default '',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- RLS
alter table public.case_studies enable row level security;

create policy "case_studies_public_read"
  on public.case_studies for select
  to anon, authenticated
  using (true);

create policy "case_studies_auth_write"
  on public.case_studies for all
  to authenticated
  using (true)
  with check (true);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger case_studies_updated_at
  before update on public.case_studies
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: 6 initial case studies
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.case_studies
  (id, brand, category, logo, logo_color, tagline, description, hero_metric, hero_label, gmv, featured, sort_order, metrics, tags, results, quote, quote_name, quote_role)
values

('glow-naturals', 'Glow Naturals', 'Skincare', 'spa', '#ddb7ff',
 'From 2.1x to 4.8x ROAS in 90 days',
 'Glow Naturals was scaling fast but bleeding margin. Meta spend had grown 3x but ROAS was declining. GrowthOS gave them SKU-level profit visibility and AI-powered ad optimisation that transformed their unit economics.',
 '4.8x', 'ROAS', '₹8Cr', true, 1,
 '[{"label":"Revenue Growth","value":"+68%","period":"in 90 days"},{"label":"ROAS Improvement","value":"2.1x → 4.8x","period":"blended"},{"label":"CAC Reduction","value":"-34%","period":"vs prev quarter"},{"label":"Net Margin","value":"+6.2pp","period":"improvement"}]'::jsonb,
 ARRAY['Skincare','Meta Ads','Profit Engine'],
 ARRAY['Identified 3 loss-making SKUs hidden by blended revenue reporting','Paused ₹4.2L/month in unprofitable ad spend within week 1','Launched UGC-first creative strategy recommended by Ads AI','Reduced return rate from 18% to 11% via WhatsApp post-purchase flow'],
 'GrowthOS showed me I was paying ₹840 to acquire a customer worth ₹620. We fixed that in 3 weeks.',
 'Priya Mehta', 'Founder, Glow Naturals'),

('apex-footwear', 'Apex Footwear', 'Fashion', 'steps', '#7bd0ff',
 '₹2.4Cr revenue recovered from abandoned carts',
 'Apex Footwear had a 76% cart abandonment rate with no automated recovery. GrowthOS''s WhatsApp automation and AI-driven segmentation turned their biggest revenue leak into a growth channel.',
 '₹2.4Cr', 'Recovered', '₹15Cr', true, 2,
 '[{"label":"Cart Recovery Rate","value":"28%","period":"from 0%"},{"label":"WhatsApp ROAS","value":"11.2x","period":"on recovery"},{"label":"Repeat Purchase Rate","value":"+42%","period":"via RFM"},{"label":"Revenue Recovered","value":"₹2.4Cr","period":"in 6 months"}]'::jsonb,
 ARRAY['Fashion','WhatsApp','RFM Segments'],
 ARRAY['3-step WhatsApp cart recovery sequence built in 20 minutes with AI','RFM segmentation identified 1,200 VIP customers for exclusive drops','Forecast Engine predicted stockouts 3 weeks early — zero lost sales','Shiprocket RTO rate dropped from 22% to 9% with COD verification flow'],
 'We were leaving ₹40L on the table every month. GrowthOS automated recovery and now WhatsApp is our highest-ROAS channel.',
 'Rohan Kapoor', 'Co-Founder, Apex Footwear'),

('pure-origins', 'Pure Origins', 'Health & Nutrition', 'eco', '#4ade80',
 'Scaled from ₹50L to ₹3Cr MRR in 12 months',
 'Pure Origins was a bootstrapped supplement brand with great products but zero data infrastructure. GrowthOS became their analytics team, CFO, and growth advisor — all in one platform.',
 '6x', 'Revenue Growth', '₹36Cr', false, 3,
 '[{"label":"MRR Growth","value":"₹50L → ₹3Cr","period":"12 months"},{"label":"Gross Margin","value":"68%","period":"maintained"},{"label":"LTV:CAC Ratio","value":"7.2x","period":"avg across channels"},{"label":"Team Size","value":"3 people","period":"no extra hires"}]'::jsonb,
 ARRAY['Health','Founder AI','Finance'],
 ARRAY['Founder AI replaced the need for a dedicated analyst for 12 months','P&L per SKU revealed protein powder had 3x the margin of supplements','Google Ads scaled to ₹80L/month spend at 3.9x ROAS with AI guidance','Automated reorder alerts prevented 4 major stockout events'],
 'I''m a 3-person team competing with companies 10x our size. GrowthOS is how we punch above our weight.',
 'Aisha Patel', 'Founder, Pure Origins'),

('urban-thread', 'Urban Thread Co', 'Apparel', 'checkroom', '#fb923c',
 'Google Ads efficiency improved 3.8x in 60 days',
 'Urban Thread Co was spending ₹25L/month on Google Ads with declining returns. The SEO & Ads AI found their winning keywords, killed waste, and rebuilt their campaign structure from scratch.',
 '3.8x', 'Efficiency Gain', '₹22Cr', false, 4,
 '[{"label":"Google Ads ROAS","value":"1.4x → 3.8x","period":"60 days"},{"label":"Wasted Spend Eliminated","value":"₹8.4L/mo","period":"identified"},{"label":"Organic Traffic","value":"+210%","period":"via SEO AI"},{"label":"Revenue per Visitor","value":"+67%","period":"improvement"}]'::jsonb,
 ARRAY['Apparel','Google Ads','SEO'],
 ARRAY['SEO AI identified 34 high-intent keywords competitors were missing','Google Search campaign restructured around product-level profitability','Shopping feed optimisation lifted CTR from 1.2% to 3.8%','Attribution model switched from last-click to data-driven — budget reallocation saved ₹3L/month'],
 'Our Google agency couldn''t explain why ROAS was dropping. GrowthOS diagnosed it in 4 minutes and fixed it in a week.',
 'Vikram Nair', 'CMO, Urban Thread Co'),

('bloom-co', 'Bloom & Co', 'Home Decor', 'local_florist', '#c0c1ff',
 'RTO rate cut from 31% to 8% in 45 days',
 'Bloom & Co was losing ₹12L/month to return-to-origin shipments — the hidden killer of D2C margins. GrowthOS''s RTO prediction model and WhatsApp COD verification transformed their operations.',
 '8%', 'RTO Rate', '₹9Cr', false, 5,
 '[{"label":"RTO Reduction","value":"31% → 8%","period":"45 days"},{"label":"Savings per Month","value":"₹12L","period":"in reverse logistics"},{"label":"COD Verification Rate","value":"94%","period":"via WhatsApp"},{"label":"NPS Improvement","value":"+28 points","period":"post-delivery"}]'::jsonb,
 ARRAY['Home Decor','RTO','WhatsApp','Shiprocket'],
 ARRAY['AI flagged high-RTO pincodes and restricted COD automatically','WhatsApp COD confirmation flow reduced fake orders by 78%','Shiprocket courier performance scoring switched to top-performing partners','NDR automation resolved 60% of delivery exceptions without human intervention'],
 'RTO was eating us alive. GrowthOS didn''t just show us the problem — it automated the solution.',
 'Neha Sharma', 'Operations Head, Bloom & Co'),

('zest-beverages', 'Zest Beverages', 'F&B', 'local_bar', '#fbbf24',
 'Subscription revenue grew 4x with AI cohort analysis',
 'Zest Beverages was struggling with high churn on their subscription boxes. GrowthOS''s cohort analysis and retention AI identified exactly when customers churned and why — enabling surgical intervention.',
 '4x', 'Subscription Growth', '₹6Cr', false, 6,
 '[{"label":"Subscription Revenue","value":"4x","period":"in 8 months"},{"label":"Churn Rate","value":"18% → 6%","period":"monthly"},{"label":"LTV Increase","value":"+₹2,400","period":"per customer"},{"label":"Win-back Rate","value":"34%","period":"of churned customers"}]'::jsonb,
 ARRAY['F&B','Retention','Cohort Analysis'],
 ARRAY['Cohort analysis revealed 87% of churn happened at day 47 post-signup','Personalised WhatsApp check-in at day 40 reduced churn by 62%','Win-back campaign with 15% discount recovered 34% of churned subscribers','Bundle recommendations increased average order value by ₹380'],
 'We thought we had a product problem. GrowthOS showed us it was a communication gap at a very specific moment in the customer journey.',
 'Arjun Singh', 'CEO, Zest Beverages')

on conflict (id) do nothing;
