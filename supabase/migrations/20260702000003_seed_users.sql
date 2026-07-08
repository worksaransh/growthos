-- =============================================================================
-- GrowthOS — Seed Users (All Account Types)
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Users created:
--   Super Admin  →  superadmin@growthos.ai   /  SuperAdmin@123
--   Demo         →  demo@growthos.ai         /  Demo@123456
--   Owner        →  owner@growthos.ai        /  Owner@123456
--   Admin        →  admin@growthos.ai        /  Admin@123456
--   Member       →  member@growthos.ai       /  Member@123456
--   Viewer       →  viewer@growthos.ai       /  Viewer@123456
-- =============================================================================

-- pgcrypto is required for crypt()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. AUTH USERS  (inserts directly into Supabase auth schema)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  reauthentication_token, email_change_confirm_status
)
VALUES

-- Super Admin (platform-level GrowthOS staff)
(
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'superadmin@growthos.ai',
  crypt('SuperAdmin@123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"super_admin"}'::jsonb,
  '{"full_name":"Super Admin","brand_name":"GrowthOS","role":"super_admin"}'::jsonb,
  NOW(), NOW(), '', '', '', '', '', '', 0
),

-- Demo (shared demo account shown on login page)
(
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'demo@growthos.ai',
  crypt('Demo@123456', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Demo User","brand_name":"GrowthOS Demo"}'::jsonb,
  NOW(), NOW(), '', '', '', '', '', '', 0
),

-- Owner (workspace owner — full control)
(
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'owner@growthos.ai',
  crypt('Owner@123456', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Arjun Sharma","brand_name":"Demo Brand Co"}'::jsonb,
  NOW(), NOW(), '', '', '', '', '', '', 0
),

-- Admin (team admin — all features, no billing)
(
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'admin@growthos.ai',
  crypt('Admin@123456', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Priya Singh","brand_name":"Demo Brand Co"}'::jsonb,
  NOW(), NOW(), '', '', '', '', '', '', 0
),

-- Member (read + write, no team management)
(
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'member@growthos.ai',
  crypt('Member@123456', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Rohan Mehta","brand_name":"Demo Brand Co"}'::jsonb,
  NOW(), NOW(), '', '', '', '', '', '', 0
),

-- Viewer (read-only access)
(
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'viewer@growthos.ai',
  crypt('Viewer@123456', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Neha Kapoor","brand_name":"Demo Brand Co"}'::jsonb,
  NOW(), NOW(), '', '', '', '', '', '', 0
)

ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  updated_at = NOW();


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. AUTH IDENTITIES  (required for email login to work)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001',
   'superadmin@growthos.ai',
   '{"sub":"00000000-0000-0000-0000-000000000001","email":"superadmin@growthos.ai"}'::jsonb,
   'email', NOW(), NOW(), NOW()),

  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000002',
   'demo@growthos.ai',
   '{"sub":"00000000-0000-0000-0000-000000000002","email":"demo@growthos.ai"}'::jsonb,
   'email', NOW(), NOW(), NOW()),

  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000003',
   'owner@growthos.ai',
   '{"sub":"00000000-0000-0000-0000-000000000003","email":"owner@growthos.ai"}'::jsonb,
   'email', NOW(), NOW(), NOW()),

  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000004',
   'admin@growthos.ai',
   '{"sub":"00000000-0000-0000-0000-000000000004","email":"admin@growthos.ai"}'::jsonb,
   'email', NOW(), NOW(), NOW()),

  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000005',
   'member@growthos.ai',
   '{"sub":"00000000-0000-0000-0000-000000000005","email":"member@growthos.ai"}'::jsonb,
   'email', NOW(), NOW(), NOW()),

  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000006',
   'viewer@growthos.ai',
   '{"sub":"00000000-0000-0000-0000-000000000006","email":"viewer@growthos.ai"}'::jsonb,
   'email', NOW(), NOW(), NOW())

ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. WORKSPACES
--    • Super Admin  → own workspace (platform tools)
--    • Demo         → own workspace (demo data)
--    • Owner        → main demo workspace (shared by Admin/Member/Viewer)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.workspaces (id, user_id, brand_name, timezone, currency, status)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'GrowthOS Platform', 'Asia/Kolkata', 'INR', 'active'),

  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
   'GrowthOS Demo', 'Asia/Kolkata', 'INR', 'active'),

  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003',
   'Demo Brand Co', 'Asia/Kolkata', 'INR', 'active')

ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. TEAM MEMBERS
--    Admin, Member, and Viewer are all members of Owner's workspace
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.team_members
  (id, workspace_id, user_id, email, role, status, joined_at)
VALUES
  -- Owner in their own workspace
  (gen_random_uuid(), '10000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000003',
   'owner@growthos.ai', 'owner', 'active', NOW()),

  -- Admin in Owner's workspace
  (gen_random_uuid(), '10000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000004',
   'admin@growthos.ai', 'admin', 'active', NOW()),

  -- Member in Owner's workspace
  (gen_random_uuid(), '10000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000005',
   'member@growthos.ai', 'member', 'active', NOW()),

  -- Viewer in Owner's workspace
  (gen_random_uuid(), '10000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000006',
   'viewer@growthos.ai', 'viewer', 'active', NOW())

ON CONFLICT (workspace_id, email) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- SUMMARY (run SELECT to verify)
-- ─────────────────────────────────────────────────────────────────────────────
/*
SELECT
  u.email,
  u.raw_user_meta_data->>'full_name'  AS name,
  u.raw_app_meta_data->>'role'        AS platform_role,
  w.brand_name                        AS workspace,
  tm.role                             AS team_role
FROM auth.users u
LEFT JOIN public.workspaces w  ON w.user_id = u.id
LEFT JOIN public.team_members tm ON tm.user_id = u.id
WHERE u.email LIKE '%growthos.ai'
ORDER BY u.created_at;
*/
