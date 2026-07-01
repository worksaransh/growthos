-- =============================================================================
-- GrowthOS — Demo & Admin Seed Users
-- Run this AFTER phase1 and phase2 migrations
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Create users in auth.users (Supabase managed table)
-- Passwords are bcrypt hashed. Plain text passwords listed in comments.
-- -----------------------------------------------------------------------------

-- Admin User — password: Admin@GrowthOS2026
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    role,
    aud,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    is_super_admin
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'admin@growthos.app',
    crypt('Admin@GrowthOS2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"admin"}',
    '{"full_name":"GrowthOS Admin","brand_name":"GrowthOS HQ","role":"admin"}',
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    false
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = now();

-- Demo User 1 — Saransh (Owner) — password: Demo@123456
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    role,
    aud,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    is_super_admin
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'saransh@growthos.app',
    crypt('Demo@123456', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"owner"}',
    '{"full_name":"Saransh Gulati","brand_name":"Luxor Office","role":"owner"}',
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    false
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = now();

-- Demo User 2 — Brand Demo — password: Demo@123456
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    role,
    aud,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    is_super_admin
) VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'demo@growthos.app',
    crypt('Demo@123456', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"member"}',
    '{"full_name":"Demo User","brand_name":"Urban Thread Co.","role":"member"}',
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    false
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = now();

-- -----------------------------------------------------------------------------
-- STEP 2: Create identities for each user (required for Supabase auth)
-- -----------------------------------------------------------------------------

INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin@growthos.app',
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@growthos.app"}',
    'email',
    now(), now(), now()
),
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'saransh@growthos.app',
    '{"sub":"00000000-0000-0000-0000-000000000002","email":"saransh@growthos.app"}',
    'email',
    now(), now(), now()
),
(
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'demo@growthos.app',
    '{"sub":"00000000-0000-0000-0000-000000000003","email":"demo@growthos.app"}',
    'email',
    now(), now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- STEP 3: Create workspaces for each user
-- -----------------------------------------------------------------------------

INSERT INTO public.workspaces (id, user_id, brand_name, timezone, currency, status)
VALUES
(
    'aaaaaaaa-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'GrowthOS HQ',
    'Asia/Kolkata',
    'INR',
    'active'
),
(
    'aaaaaaaa-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Luxor Office',
    'Asia/Kolkata',
    'INR',
    'active'
),
(
    'aaaaaaaa-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'Urban Thread Co.',
    'Asia/Kolkata',
    'INR',
    'active'
)
ON CONFLICT (user_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- STEP 4: Seed profit_config with sensible defaults for demo accounts
-- -----------------------------------------------------------------------------

INSERT INTO public.profit_config (workspace_id, cogs_pct, shipping_cost_per_order, packaging_cost_per_order, payment_gateway_pct, tax_pct)
VALUES
('aaaaaaaa-0000-0000-0000-000000000002', 0.35, 60, 15, 0.02, 0.18),
('aaaaaaaa-0000-0000-0000-000000000003', 0.40, 75, 20, 0.02, 0.18)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- STEP 5: Seed demo metrics_cache data for dashboard (Saransh / Luxor Office)
-- 30 days of realistic D2C data
-- -----------------------------------------------------------------------------

INSERT INTO public.metrics_cache (
    workspace_id, metric_date,
    gross_revenue, total_discounts, total_refunds, net_revenue,
    total_orders, aov,
    meta_spend, google_spend, total_ad_spend,
    blended_roas, meta_roas, google_roas,
    cac, gross_profit, mer, is_complete
)
SELECT
    'aaaaaaaa-0000-0000-0000-000000000002',
    CURRENT_DATE - (n || ' days')::interval,
    -- Gross revenue: 80K–250K/day with weekend peaks
    ROUND((80000 + random() * 170000 + CASE WHEN extract(dow from CURRENT_DATE - (n||' days')::interval) IN (0,6) THEN 40000 ELSE 0 END)::numeric, 2),
    ROUND((3000 + random() * 8000)::numeric, 2),
    ROUND((1000 + random() * 4000)::numeric, 2),
    ROUND((72000 + random() * 155000)::numeric, 2),
    (25 + (random() * 45)::int),
    ROUND((2800 + random() * 1800)::numeric, 2),
    ROUND((18000 + random() * 25000)::numeric, 2),
    ROUND((12000 + random() * 18000)::numeric, 2),
    ROUND((30000 + random() * 43000)::numeric, 2),
    ROUND((2.8 + random() * 2.5)::numeric, 4),
    ROUND((3.2 + random() * 2.0)::numeric, 4),
    ROUND((2.4 + random() * 1.8)::numeric, 4),
    ROUND((700 + random() * 600)::numeric, 2),
    ROUND((35000 + random() * 80000)::numeric, 2),
    ROUND((0.8 + random() * 0.9)::numeric, 4),
    true
FROM generate_series(0, 29) AS n
ON CONFLICT (workspace_id, metric_date) DO NOTHING;

-- Seed demo orders for Saransh workspace (last 30 days)
INSERT INTO public.shopify_orders (
    workspace_id, shopify_order_id, shopify_order_number,
    order_status, financial_status, fulfillment_status,
    gross_revenue, discount_amount, refund_amount, net_revenue,
    currency, customer_id, customer_name, customer_email,
    source_channel, payment_gateway,
    order_created_at, order_updated_at
)
SELECT
    'aaaaaaaa-0000-0000-0000-000000000002',
    'DEMO-' || n,
    '#' || (5800 + n),
    'open',
    CASE WHEN random() > 0.1 THEN 'paid' ELSE 'refunded' END,
    CASE WHEN random() > 0.15 THEN 'fulfilled' ELSE 'unfulfilled' END,
    ROUND((800 + random() * 6000)::numeric, 2),
    ROUND((random() * 300)::numeric, 2),
    ROUND(CASE WHEN random() > 0.9 THEN (200 + random() * 800) ELSE 0 END::numeric, 2),
    ROUND((800 + random() * 5700)::numeric, 2),
    'INR',
    'CUST-' || (100 + (n % 80)),
    (ARRAY['Priya Sharma','Rahul Kumar','Aisha Patel','Dev Singh','Sneha Reddy','Aman Tiwari','Kavya Nair','Rohit Mehta','Anjali Gupta','Vikram Joshi'])[1 + (n % 10)],
    (ARRAY['priya@gmail.com','rahul@gmail.com','aisha@gmail.com','dev@gmail.com','sneha@gmail.com','aman@gmail.com','kavya@gmail.com','rohit@gmail.com','anjali@gmail.com','vikram@gmail.com'])[1 + (n % 10)],
    (ARRAY['meta','google','organic','direct','meta','meta','google','organic','direct','meta'])[1 + (n % 10)],
    CASE WHEN random() > 0.5 THEN 'razorpay' ELSE 'cashfree' END,
    CURRENT_TIMESTAMP - (random() * 30 || ' days')::interval,
    CURRENT_TIMESTAMP - (random() * 29 || ' days')::interval
FROM generate_series(1, 200) AS n
ON CONFLICT (workspace_id, shopify_order_id) DO NOTHING;

-- Seed demo ad_spend_daily (last 30 days)
INSERT INTO public.ad_spend_daily (
    workspace_id, platform, spend_date,
    spend, impressions, clicks, conversions,
    cpc, ctr, platform_account_id, currency
)
SELECT
    'aaaaaaaa-0000-0000-0000-000000000002',
    'meta',
    CURRENT_DATE - (n || ' days')::interval,
    ROUND((18000 + random() * 25000)::numeric, 2),
    (80000 + (random() * 120000)::int),
    (1200 + (random() * 2800)::int),
    (18 + (random() * 45)::int),
    ROUND((8 + random() * 12)::numeric, 4),
    ROUND((0.015 + random() * 0.025)::numeric, 6),
    'act_demo123456',
    'INR'
FROM generate_series(0, 29) AS n
ON CONFLICT (workspace_id, platform, spend_date) DO NOTHING;

INSERT INTO public.ad_spend_daily (
    workspace_id, platform, spend_date,
    spend, impressions, clicks, conversions,
    cpc, ctr, platform_account_id, currency
)
SELECT
    'aaaaaaaa-0000-0000-0000-000000000002',
    'google',
    CURRENT_DATE - (n || ' days')::interval,
    ROUND((12000 + random() * 18000)::numeric, 2),
    (40000 + (random() * 60000)::int),
    (600 + (random() * 1400)::int),
    (8 + (random() * 25)::int),
    ROUND((14 + random() * 18)::numeric, 4),
    ROUND((0.012 + random() * 0.018)::numeric, 6),
    '123-456-7890',
    'INR'
FROM generate_series(0, 29) AS n
ON CONFLICT (workspace_id, platform, spend_date) DO NOTHING;

-- Seed demo customers
INSERT INTO public.customers (
    workspace_id, shopify_customer_id,
    email, name, city, state,
    total_orders, total_spent, avg_order_value,
    first_order_at, last_order_at, ltv, segment
)
VALUES
('aaaaaaaa-0000-0000-0000-000000000002','CUST-100','priya@gmail.com','Priya Sharma','Mumbai','Maharashtra',8,42800,5350,now()-'180 days'::interval,now()-'2 days'::interval,65000,'vip'),
('aaaaaaaa-0000-0000-0000-000000000002','CUST-101','rahul@gmail.com','Rahul Kumar','Delhi','Delhi',5,28500,5700,now()-'120 days'::interval,now()-'5 days'::interval,42000,'vip'),
('aaaaaaaa-0000-0000-0000-000000000002','CUST-102','aisha@gmail.com','Aisha Patel','Ahmedabad','Gujarat',3,14200,4733,now()-'90 days'::interval,now()-'12 days'::interval,21000,'loyal'),
('aaaaaaaa-0000-0000-0000-000000000002','CUST-103','dev@gmail.com','Dev Singh','Bangalore','Karnataka',3,16800,5600,now()-'85 days'::interval,now()-'18 days'::interval,24000,'loyal'),
('aaaaaaaa-0000-0000-0000-000000000002','CUST-104','sneha@gmail.com','Sneha Reddy','Hyderabad','Telangana',1,3200,3200,now()-'25 days'::interval,now()-'25 days'::interval,3200,'one_time'),
('aaaaaaaa-0000-0000-0000-000000000002','CUST-105','aman@gmail.com','Aman Tiwari','Pune','Maharashtra',2,8900,4450,now()-'95 days'::interval,now()-'95 days'::interval,8900,'dormant'),
('aaaaaaaa-0000-0000-0000-000000000002','CUST-106','kavya@gmail.com','Kavya Nair','Chennai','Tamil Nadu',1,4800,4800,now()-'30 days'::interval,now()-'30 days'::interval,4800,'one_time'),
('aaaaaaaa-0000-0000-0000-000000000002','CUST-107','rohit@gmail.com','Rohit Mehta','Jaipur','Rajasthan',6,31200,5200,now()-'200 days'::interval,now()-'8 days'::interval,48000,'vip'),
('aaaaaaaa-0000-0000-0000-000000000002','CUST-108','anjali@gmail.com','Anjali Gupta','Kolkata','West Bengal',2,9400,4700,now()-'110 days'::interval,now()-'80 days'::interval,9400,'at_risk'),
('aaaaaaaa-0000-0000-0000-000000000002','CUST-109','vikram@gmail.com','Vikram Joshi','Chandigarh','Punjab',1,5100,5100,now()-'45 days'::interval,now()-'45 days'::interval,5100,'one_time')
ON CONFLICT (workspace_id, shopify_customer_id) DO NOTHING;

-- Seed demo notifications
INSERT INTO public.notifications (workspace_id, type, category, title, message, is_read)
VALUES
('aaaaaaaa-0000-0000-0000-000000000002','success','sync','Shopify Sync Complete','200 orders synced successfully in 1.8s',false),
('aaaaaaaa-0000-0000-0000-000000000002','warning','ads','ROAS Dropping','Meta ROAS fell to 2.1x — below your 2.5x threshold. Consider pausing underperforming ad sets.',false),
('aaaaaaaa-0000-0000-0000-000000000002','success','revenue','Revenue Milestone','You crossed ₹50L in revenue this month! 🎉',false),
('aaaaaaaa-0000-0000-0000-000000000002','info','sync','Google Ads Sync Complete','Daily ad spend data refreshed',true),
('aaaaaaaa-0000-0000-0000-000000000002','warning','orders','High RTO Rate','RTO rate reached 12% in the last 7 days — above 8% target',false);

-- Seed demo automation rules
INSERT INTO public.automation_rules (workspace_id, name, description, is_active, trigger_type, trigger_config, action_type, action_config, trigger_count)
VALUES
('aaaaaaaa-0000-0000-0000-000000000002','Pause Low ROAS Campaigns','Automatically pause Meta campaigns when ROAS drops below 2x',true,'roas_below','{"threshold":2.0,"platform":"meta","window_days":3}','send_notification','{"message":"Meta ROAS below 2x — review campaigns"}',3),
('aaaaaaaa-0000-0000-0000-000000000002','Scale High ROAS Campaigns','Increase budget by 20% when ROAS exceeds 5x for 3 days',true,'roas_above','{"threshold":5.0,"platform":"meta","window_days":3}','increase_budget','{"increase_pct":20}',1),
('aaaaaaaa-0000-0000-0000-000000000002','Daily Revenue Alert','Send notification if daily revenue drops below ₹50,000',true,'revenue_below','{"threshold":50000,"window":"daily"}','send_notification','{"message":"Revenue below ₹50K today — check orders"}',0)
ON CONFLICT DO NOTHING;

-- Seed demo CRM leads
INSERT INTO public.crm_leads (workspace_id, name, email, phone, company, source, status, pipeline_stage, deal_value, notes)
VALUES
('aaaaaaaa-0000-0000-0000-000000000002','Arjun Mehta','arjun@startup.co','+919876543210','TechStart India','ads','qualified','proposal',85000,'Interested in annual plan. Follow up after demo.'),
('aaaaaaaa-0000-0000-0000-000000000002','Nisha Kapoor','nisha@brandco.in','+919988776655','BrandCo','referral','contacted','lead',45000,'Referred by Priya Sharma. Looking for agency plan.'),
('aaaaaaaa-0000-0000-0000-000000000002','Rohan Verma','rohan@d2cbrand.com','+918877665544','D2C Brand','website','new','lead',30000,'Filled contact form. Runs Shopify store.'),
('aaaaaaaa-0000-0000-0000-000000000002','Simran Kaur','simran@fashionco.in','+917766554433','Fashion Co.','ads','won','won',120000,'Closed on annual enterprise plan.'),
('aaaaaaaa-0000-0000-0000-000000000002','Karan Patel','karan@beautystore.in','+916655443322','Beauty Store','organic','lost','lost',0,'Went with competitor. Price sensitivity.')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Summary of demo logins:
-- =============================================================================
-- ADMIN LOGIN
--   Email:    admin@growthos.app
--   Password: Admin@GrowthOS2026
--   Role:     Admin / Full Access
--
-- OWNER DEMO LOGIN (Saransh / Luxor Office — has full mock data)
--   Email:    saransh@growthos.app
--   Password: Demo@123456
--   Role:     Owner
--   Data:     30 days metrics, 200 orders, 10 customers, notifications, CRM leads
--
-- MEMBER DEMO LOGIN (Urban Thread Co.)
--   Email:    demo@growthos.app
--   Password: Demo@123456
--   Role:     Member
-- =============================================================================
