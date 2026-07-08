# GrowthOS — AI Operating System for D2C Brands

> **Turn every rupee into maximum profit.** GrowthOS connects your Shopify store, Meta Ads, and Google campaigns into one AI-powered command center. See your real numbers. Make faster decisions. Grow profitably.

---

## Screenshots

### Marketing Landing Page
![Landing Page](docs/screenshots/landing.png)

### Dashboard — Command Center
![Dashboard](docs/screenshots/dashboard.png)

### Profit Engine — P&L Breakdown
![Profit Engine](docs/screenshots/profit-engine.png)

### Founder AI — Co-founder Chat
![Founder AI](docs/screenshots/founder-ai.png)

### Ads Intelligence — Meta + Google
![Ads Intelligence](docs/screenshots/ads-intelligence.png)

### Integrations & API Keys
![Integrations](docs/screenshots/integrations.png)

### Super Admin — Platform Management
![Super Admin](docs/screenshots/superadmin.png)

### Admin Dashboard
![Admin](docs/screenshots/admin.png)

---

## Features

### Intelligence Modules
- **Profit Engine** — Real-time P&L, margin tracking, unit economics
- **Finance & P&L** — Full income statement, cash flow, working capital
- **Ads Intelligence** — Meta + Google ROAS, CPM, CTR, channel breakdown
- **Product Intel** — SKU performance, inventory health, sell-through rate
- **Customer Intel** — LTV, repeat rate, churn signals
- **RFM & Cohorts** — Customer segmentation, cohort retention analysis
- **Forecast Engine** — Revenue + demand forecasting with ML models
- **Attribution** — Multi-touch attribution across all channels
- **Creative Analytics** — Ad creative performance scoring
- **Budget Optimizer** — AI-driven spend allocation recommendations

### AI Modules (10 Specialists)
- Ads AI, SEO AI, Product AI, Finance AI, Pricing AI
- Automation AI, Decision AI, Forecast AI
- Founder AI — conversational business intelligence

### Integrations
| Platform | Type | Status |
|---|---|---|
| Shopify | E-commerce | Active |
| Meta Ads | Advertising | Active |
| Google Ads | Advertising | Active |
| WooCommerce | E-commerce | Active |
| Razorpay | Payments | Active |
| Shiprocket | Shipping | Active |
| TikTok Ads | Advertising | Coming Soon |
| Snapchat Ads | Advertising | Coming Soon |
| Bing Ads | Advertising | Coming Soon |
| Klaviyo | Marketing | Coming Soon |
| WhatsApp | Marketing | Active |

### Enterprise Multi-Tenant Architecture
- **Platform** → Organisations → Workspaces → Business Units → Commerce Accounts → Channels
- Multi-brand support: up to 10 brands per Enterprise account
- Brand switching with billing plan enforcement
- Super Admin dashboard — manage all tenants, plans, and brand allocations
- Role-based access: platform_admin → org_owner → workspace_admin → member

### Other Modules
- Marketing Automation with visual workflow builder
- CRM — customer profiles, lifecycle stages
- Operations — order pipeline, fulfillment tracking, RTO analytics
- Reports — scheduled PDF/Excel reports with email delivery
- Billing — plan management with upgrade flows
- Audit Logs — platform-wide activity trail
- Alerts — threshold-based notifications
- White Label — custom domain, brand colors, sender name
- Security — team access controls, API key management

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| State | Zustand, TanStack Query |
| Backend | FastAPI (Python 3.10+), uvicorn, asyncpg |
| Database | Supabase (PostgreSQL 15+) with RLS |
| Auth | Supabase Auth (JWT) |
| Charts | Recharts |
| UI | Custom design system (Stitch tokens) |
| AI | Anthropic Claude API |

---

## Project Structure

```
growthos/
├── frontend/                    # Next.js 14 application
│   ├── app/
│   │   ├── (auth)/             # Login, signup, password reset
│   │   ├── (dashboard)/        # App pages (protected)
│   │   │   ├── dashboard/      # Main SPA shell (40+ modules)
│   │   │   ├── settings/       # Integrations, profile, workspace
│   │   │   ├── admin/          # Admin dashboard, users, workspaces
│   │   │   └── superadmin/     # Platform super admin
│   │   ├── (marketing)/        # Public marketing site
│   │   └── (onboarding)/       # New user onboarding flow
│   ├── components/
│   │   ├── pages/              # 40+ page components
│   │   ├── shared/             # Sidebar, TopBar, switchers
│   │   ├── charts/             # Recharts wrappers
│   │   └── ui/                 # Primitives (Card, Modal, Toast…)
│   └── lib/
│       ├── api-client.ts        # All backend API calls
│       ├── hooks/               # TanStack Query hooks
│       └── store.ts             # Zustand global state
│
├── backend/                     # FastAPI application
│   └── app/
│       ├── api/v1/              # 40+ route modules
│       ├── core/                # Auth, DB, config, vault
│       ├── midleware/           # Auth middleware
│       ├── models/              # Pydantic models
│       └── repositories/        # DB query layer
│
└── supabase/
    └── migrations/              # All SQL migrations (ordered)
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase project (free tier works)

### 1. Clone

```bash
git clone https://github.com/worksaransh/growthos.git
cd growthos
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Add your Supabase URL + anon key to .env.local
npm run dev
# → http://localhost:3000
```

### 3. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Add DATABASE_URL, SUPABASE_JWT_SECRET, etc. to .env
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000
```

### 4. Database Migrations

Run all SQL files in `supabase/migrations/` in order via Supabase SQL Editor:

1. `20260702000001_initial_schema.sql`
2. `20260702000002_case_studies.sql`
3. `20260702000003_seed_users.sql`
4. `20260702000004_new_integrations.sql`
5. `20260707000001_fix_rls_and_workspace_fn.sql`
6. `20260708000001_enterprise_multi_tenant.sql`
7. `20260708000002_brand_limits_superadmin.sql`

### 5. Environment Variables

**`frontend/.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**`backend/.env`**
```env
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
SUPABASE_JWT_SECRET=your-jwt-secret
ANTHROPIC_API_KEY=sk-ant-...
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_REDIRECT_URI=http://localhost:8000/api/v1/oauth/meta/callback
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/oauth/google/callback
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
SHOPIFY_REDIRECT_URI=http://localhost:8000/api/v1/oauth/shopify/callback
```

---

## Billing Plans

| Plan | Brands | Price |
|---|---|---|
| Free | 1 | ₹0/mo |
| Starter | 2 | ₹4,999/mo |
| Growth | 5 | ₹8,299/mo |
| Scale | 10 | ₹14,999/mo |
| Enterprise | Custom (Super Admin allocated) | Contact sales |

---

## Super Admin

GrowthOS SaaS operators get a `/superadmin` dashboard to:
- View all organisations, plans, and brand usage
- Grant/change billing plans
- Override brand limits per organisation
- Manage platform admins (roles: admin, support, billing, super_admin)

Access is gated — your user must exist in the `platform_admins` table.

---

## API Docs

With the backend running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Deployment

| Service | Config File |
|---|---|
| Vercel (frontend) | `vercel.json` |
| Railway (backend) | `railway.toml` / `Procfile` |
| Supabase (database) | Hosted — apply migrations via SQL Editor |

---

## License

MIT — built by [Saransh Gulati](https://github.com/worksaransh)
