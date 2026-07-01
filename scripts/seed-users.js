/**
 * GrowthOS — Demo & Admin User Seeder
 *
 * Run: node scripts/seed-users.js
 *
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load .env manually
function loadEnv() {
  const envPath = path.join(__dirname, "../.env");
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === "PASTE_SERVICE_ROLE_KEY_HERE") {
  console.error("\n❌ ERROR: Missing credentials in .env");
  console.error("   SUPABASE_URL:", SUPABASE_URL || "MISSING");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", SERVICE_ROLE_KEY ? "SET" : "MISSING");
  console.error("\n→ Get your Service Role Key from:");
  console.error("  https://supabase.com/dashboard/project/pmrmtajstxnjadrhdvmp/settings/api\n");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USERS = [
  {
    email: "admin@growthos.app",
    password: "Admin@GrowthOS2026",
    metadata: { full_name: "GrowthOS Admin", brand_name: "GrowthOS HQ", role: "admin" },
    brand_name: "GrowthOS HQ",
    label: "Admin",
  },
  {
    email: "saransh@growthos.app",
    password: "Demo@123456",
    metadata: { full_name: "Saransh Gulati", brand_name: "Luxor Office", role: "owner" },
    brand_name: "Luxor Office",
    label: "Owner Demo (Saransh)",
  },
  {
    email: "demo@growthos.app",
    password: "Demo@123456",
    metadata: { full_name: "Demo User", brand_name: "Urban Thread Co.", role: "member" },
    brand_name: "Urban Thread Co.",
    label: "Member Demo",
  },
];

async function createWorkspace(userId, brandName) {
  const { data, error } = await supabase
    .from("workspaces")
    .upsert(
      {
        user_id: userId,
        brand_name: brandName,
        timezone: "Asia/Kolkata",
        currency: "INR",
        status: "active",
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    console.warn(`   ⚠ Workspace: ${error.message}`);
    return null;
  }
  return data;
}

async function seedMetrics(workspaceId) {
  // Insert 30 days of demo metrics
  const rows = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const isWeekend = [0, 6].includes(date.getDay());
    const baseRev = 80000 + Math.random() * 170000 + (isWeekend ? 40000 : 0);
    const metaSpend = 18000 + Math.random() * 25000;
    const googleSpend = 12000 + Math.random() * 18000;
    const totalSpend = metaSpend + googleSpend;
    const netRev = Math.round(baseRev * 0.92);
    const orders = Math.floor(25 + Math.random() * 45);
    rows.push({
      workspace_id: workspaceId,
      metric_date: dateStr,
      gross_revenue: Math.round(baseRev),
      total_discounts: Math.round(3000 + Math.random() * 8000),
      total_refunds: Math.round(1000 + Math.random() * 4000),
      net_revenue: netRev,
      total_orders: orders,
      aov: Math.round(netRev / orders),
      meta_spend: Math.round(metaSpend),
      google_spend: Math.round(googleSpend),
      total_ad_spend: Math.round(totalSpend),
      blended_roas: parseFloat((netRev / totalSpend).toFixed(4)),
      meta_roas: parseFloat((3.2 + Math.random() * 2.0).toFixed(4)),
      google_roas: parseFloat((2.4 + Math.random() * 1.8).toFixed(4)),
      cac: Math.round(totalSpend / orders),
      gross_profit: Math.round(netRev * 0.45 - totalSpend),
      mer: parseFloat((0.8 + Math.random() * 0.9).toFixed(4)),
      is_complete: true,
    });
  }
  const { error } = await supabase.from("metrics_cache").upsert(rows, { onConflict: "workspace_id,metric_date" });
  if (error) console.warn(`   ⚠ Metrics: ${error.message}`);
  else console.log(`   ✓ ${rows.length} days of metrics seeded`);
}

async function seedNotifications(workspaceId) {
  const items = [
    { type: "success", category: "sync", title: "Shopify Sync Complete", message: "200 orders synced in 1.8s", is_read: false },
    { type: "warning", category: "ads", title: "ROAS Dropping", message: "Meta ROAS fell to 2.1x — below your 2.5x threshold", is_read: false },
    { type: "success", category: "revenue", title: "Revenue Milestone 🎉", message: "You crossed ₹50L in revenue this month!", is_read: false },
    { type: "info", category: "sync", title: "Google Ads Synced", message: "Daily ad spend data refreshed", is_read: true },
    { type: "warning", category: "orders", title: "High RTO Rate", message: "RTO rate hit 12% — above 8% target", is_read: false },
  ];
  const rows = items.map((n) => ({ ...n, workspace_id: workspaceId }));
  const { error } = await supabase.from("notifications").insert(rows);
  if (error) console.warn(`   ⚠ Notifications: ${error.message}`);
  else console.log(`   ✓ ${rows.length} notifications seeded`);
}

async function seedCustomers(workspaceId) {
  const customers = [
    { shopify_customer_id: "CUST-100", email: "priya@gmail.com", name: "Priya Sharma", city: "Mumbai", state: "Maharashtra", total_orders: 8, total_spent: 42800, avg_order_value: 5350, ltv: 65000, segment: "vip" },
    { shopify_customer_id: "CUST-101", email: "rahul@gmail.com", name: "Rahul Kumar", city: "Delhi", state: "Delhi", total_orders: 5, total_spent: 28500, avg_order_value: 5700, ltv: 42000, segment: "vip" },
    { shopify_customer_id: "CUST-102", email: "aisha@gmail.com", name: "Aisha Patel", city: "Ahmedabad", state: "Gujarat", total_orders: 3, total_spent: 14200, avg_order_value: 4733, ltv: 21000, segment: "loyal" },
    { shopify_customer_id: "CUST-103", email: "dev@gmail.com", name: "Dev Singh", city: "Bangalore", state: "Karnataka", total_orders: 3, total_spent: 16800, avg_order_value: 5600, ltv: 24000, segment: "loyal" },
    { shopify_customer_id: "CUST-104", email: "sneha@gmail.com", name: "Sneha Reddy", city: "Hyderabad", state: "Telangana", total_orders: 1, total_spent: 3200, avg_order_value: 3200, ltv: 3200, segment: "one_time" },
    { shopify_customer_id: "CUST-105", email: "aman@gmail.com", name: "Aman Tiwari", city: "Pune", state: "Maharashtra", total_orders: 2, total_spent: 8900, avg_order_value: 4450, ltv: 8900, segment: "dormant" },
    { shopify_customer_id: "CUST-106", email: "rohit@gmail.com", name: "Rohit Mehta", city: "Jaipur", state: "Rajasthan", total_orders: 6, total_spent: 31200, avg_order_value: 5200, ltv: 48000, segment: "vip" },
    { shopify_customer_id: "CUST-107", email: "anjali@gmail.com", name: "Anjali Gupta", city: "Kolkata", state: "West Bengal", total_orders: 2, total_spent: 9400, avg_order_value: 4700, ltv: 9400, segment: "at_risk" },
  ];
  const rows = customers.map((c) => ({
    ...c,
    workspace_id: workspaceId,
    first_order_at: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString(),
    last_order_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  }));
  const { error } = await supabase.from("customers").upsert(rows, { onConflict: "workspace_id,shopify_customer_id" });
  if (error) console.warn(`   ⚠ Customers: ${error.message}`);
  else console.log(`   ✓ ${rows.length} customers seeded`);
}

async function seedCrmLeads(workspaceId) {
  const leads = [
    { name: "Arjun Mehta", email: "arjun@startup.co", phone: "+919876543210", company: "TechStart India", source: "ads", status: "qualified", pipeline_stage: "proposal", deal_value: 85000, notes: "Interested in annual plan." },
    { name: "Nisha Kapoor", email: "nisha@brandco.in", phone: "+919988776655", company: "BrandCo", source: "referral", status: "contacted", pipeline_stage: "lead", deal_value: 45000, notes: "Referred by Priya." },
    { name: "Rohan Verma", email: "rohan@d2cbrand.com", phone: "+918877665544", company: "D2C Brand", source: "website", status: "new", pipeline_stage: "lead", deal_value: 30000, notes: "Filled contact form." },
    { name: "Simran Kaur", email: "simran@fashionco.in", phone: "+917766554433", company: "Fashion Co.", source: "ads", status: "won", pipeline_stage: "won", deal_value: 120000, notes: "Closed on annual plan." },
    { name: "Karan Patel", email: "karan@beautystore.in", phone: "+916655443322", company: "Beauty Store", source: "organic", status: "lost", pipeline_stage: "lost", deal_value: 0, notes: "Went with competitor." },
  ];
  const rows = leads.map((l) => ({ ...l, workspace_id: workspaceId }));
  const { error } = await supabase.from("crm_leads").insert(rows);
  if (error) console.warn(`   ⚠ CRM: ${error.message}`);
  else console.log(`   ✓ ${rows.length} CRM leads seeded`);
}

async function seedAutomation(workspaceId) {
  const rules = [
    { name: "Pause Low ROAS", description: "Notify when Meta ROAS drops below 2x", is_active: true, trigger_type: "roas_below", trigger_config: { threshold: 2.0, platform: "meta" }, action_type: "send_notification", action_config: { message: "Meta ROAS below 2x" }, trigger_count: 3 },
    { name: "Scale High ROAS", description: "Alert when ROAS exceeds 5x", is_active: true, trigger_type: "roas_above", trigger_config: { threshold: 5.0, platform: "meta" }, action_type: "send_notification", action_config: { message: "ROAS above 5x — consider scaling" }, trigger_count: 1 },
  ];
  const rows = rules.map((r) => ({ ...r, workspace_id: workspaceId }));
  const { error } = await supabase.from("automation_rules").insert(rows);
  if (error) console.warn(`   ⚠ Automation: ${error.message}`);
  else console.log(`   ✓ ${rows.length} automation rules seeded`);
}

async function seedProfitConfig(workspaceId) {
  const { error } = await supabase.from("profit_config").upsert({
    workspace_id: workspaceId,
    cogs_pct: 0.35,
    shipping_cost_per_order: 60,
    packaging_cost_per_order: 15,
    payment_gateway_pct: 0.02,
    tax_pct: 0.18,
  }, { onConflict: "workspace_id" });
  if (error) console.warn(`   ⚠ Profit config: ${error.message}`);
  else console.log(`   ✓ Profit config seeded`);
}

async function main() {
  console.log("\n🚀 GrowthOS User Seeder");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  for (const user of USERS) {
    console.log(`👤 Creating: ${user.label} (${user.email})`);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: user.metadata,
    });

    if (authError) {
      if (authError.message.includes("already been registered") || authError.message.includes("already exists")) {
        console.log(`   ℹ User already exists — updating password...`);
        // Get existing user
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users?.find((u) => u.email === user.email);
        if (existing) {
          await supabase.auth.admin.updateUserById(existing.id, {
            password: user.password,
            email_confirm: true,
            user_metadata: user.metadata,
          });
          console.log(`   ✓ Password reset to: ${user.password}`);
          // Create workspace for existing user
          const ws = await createWorkspace(existing.id, user.brand_name);
          if (ws && user.email === "saransh@growthos.app") {
            await seedMetrics(ws.id);
            await seedNotifications(ws.id);
            await seedCustomers(ws.id);
            await seedCrmLeads(ws.id);
            await seedAutomation(ws.id);
            await seedProfitConfig(ws.id);
          }
        }
      } else {
        console.error(`   ❌ Failed: ${authError.message}`);
      }
      continue;
    }

    const userId = authData.user.id;
    console.log(`   ✓ Auth user created (ID: ${userId})`);

    // Create workspace
    const ws = await createWorkspace(userId, user.brand_name);
    if (ws) {
      console.log(`   ✓ Workspace created: ${user.brand_name}`);
    }

    // Seed demo data for the main demo account
    if (user.email === "saransh@growthos.app" && ws) {
      console.log(`   📊 Seeding demo data...`);
      await seedMetrics(ws.id);
      await seedNotifications(ws.id);
      await seedCustomers(ws.id);
      await seedCrmLeads(ws.id);
      await seedAutomation(ws.id);
      await seedProfitConfig(ws.id);
    }

    console.log();
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Seeding complete!\n");
  console.log("Login credentials:");
  console.log("  Admin:  admin@growthos.app     / Admin@GrowthOS2026");
  console.log("  Owner:  saransh@growthos.app   / Demo@123456");
  console.log("  Member: demo@growthos.app       / Demo@123456");
  console.log("\n→ Open http://localhost:3000 and sign in\n");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
