# GrowthOS Deployment Guide

## Local Development

```bash
# From D:\CODE\OS\growthos\
.\start-dev.ps1
```

Then open: http://localhost:3000

---

## Step 1: Push to GitHub

```bash
# Create repo at github.com/new (private, name: growthos)
cd D:\CODE\OS\growthos
git remote add origin https://github.com/YOUR_USERNAME/growthos.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Frontend to Vercel

1. Go to vercel.com → **New Project** → Import from GitHub → select `growthos`
2. Set **Root Directory** to `frontend`
3. Framework: Next.js (auto-detected)
4. Add **Environment Variables**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zorivxsbpxlpumhlpwwg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_VEnP1YcB_jYER62SDpvjGg_B-IQQ5iy` |
| `NEXT_PUBLIC_BACKEND_URL` | `https://your-railway-url.railway.app` (fill after Step 3) |
| `NEXT_PUBLIC_APP_URL` | `https://your-vercel-url.vercel.app` |

5. Click **Deploy**

---

## Step 3: Deploy Backend to Railway

1. Go to railway.app → **New Project** → Deploy from GitHub → select `growthos`
2. Set **Root Directory** to `backend`
3. Add **Environment Variables** (Settings → Variables):

```
SUPABASE_URL=https://zorivxsbpxlpumhlpwwg.supabase.co
SUPABASE_ANON_KEY=sb_publishable_VEnP1YcB_jYER62SDpvjGg_B-IQQ5iy
SUPABASE_SERVICE_ROLE_KEY=<from supabase.com Settings → API>
SUPABASE_JWT_SECRET=c273313e-9096-423e-abbd-8f32bb560ae6
DATABASE_URL=postgresql://postgres.zorivxsbpxlpumhlpwwg:YOUR_DB_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
SECRET_KEY=<generate: python3 -c "import secrets; print(secrets.token_hex(32))">
FRONTEND_URL=https://your-vercel-url.vercel.app
ENVIRONMENT=production
ANTHROPIC_API_KEY=<your Anthropic API key>
SHOPIFY_API_KEY=<Shopify Partners app key>
SHOPIFY_API_SECRET=<Shopify Partners app secret>
SHOPIFY_REDIRECT_URI=https://YOUR_RAILWAY_URL/api/v1/oauth/shopify/callback
SHOPIFY_WEBHOOK_SECRET=<Shopify webhook secret>
META_APP_ID=<Meta/Facebook app ID>
META_APP_SECRET=<Meta app secret>
META_REDIRECT_URI=https://YOUR_RAILWAY_URL/api/v1/oauth/meta/callback
GOOGLE_CLIENT_ID=<Google OAuth client ID>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
GOOGLE_REDIRECT_URI=https://YOUR_RAILWAY_URL/api/v1/oauth/google/callback
GOOGLE_DEVELOPER_TOKEN=<Google Ads developer token>
WHATSAPP_API_URL=https://api.interakt.ai/v1
WHATSAPP_API_KEY=<Interakt API key>
RAZORPAY_KEY_ID=<Razorpay key ID>
RAZORPAY_KEY_SECRET=<Razorpay key secret>
SHIPROCKET_EMAIL=<Shiprocket account email>
SHIPROCKET_PASSWORD=<Shiprocket password>
RESEND_API_KEY=<Resend email API key>
```

4. Railway will auto-detect `railway.json` and build with Nixpacks

---

## Step 4: Run Database Migrations

Using Supabase CLI:

```bash
# Install CLI
npm install -g supabase

# Link to your project
supabase link --project-ref zorivxsbpxlpumhlpwwg

# Push all migrations
supabase db push
```

Or run each migration file manually in Supabase Dashboard → SQL Editor, in order:
- `supabase/migrations/20260701000001_*.sql`
- ... (all 10 migration files in sequence)

---

## Step 5: Update Vercel with Railway URL

After Railway deploys, copy the Railway URL and update Vercel:
- `NEXT_PUBLIC_BACKEND_URL` → your Railway URL

Then trigger a Vercel redeploy.

---

## Step 6: Verify Deployment

```bash
# Backend health check
curl https://YOUR_RAILWAY_URL/health
# Expected: {"status":"ok","version":"1.0.0","environment":"production"}

# Frontend — open in browser
# https://YOUR_VERCEL_URL
```

---

## GitHub Actions CI/CD

The `.github/workflows/ci.yml` runs on every push to `main` or `develop`:
- TypeScript typecheck + Next.js production build
- Python syntax check + import validation

Add these **GitHub Secrets** (Settings → Secrets → Actions):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BACKEND_URL`

---

## Quick Reference

| Service | URL |
|---------|-----|
| Frontend (local) | http://localhost:3000 |
| Backend (local) | http://localhost:8000 |
| API Docs (local) | http://localhost:8000/docs |
| Supabase Dashboard | https://supabase.com/dashboard/project/zorivxsbpxlpumhlpwwg |

## Demo Login

```
Email:    demo@growthos.ai
Password: demo123456
```

---

## Troubleshooting

### Railway build fails
- Ensure `backend/requirements.txt` is complete
- Check Railway build logs
- `railway.json` specifies `uvicorn` start command on `$PORT`

### Vercel build fails
- `NEXT_PUBLIC_*` vars must be set **before** building (they're inlined at build time)
- Set all env vars in Vercel Dashboard, then redeploy

### CORS errors in browser
- `FRONTEND_URL` in Railway must exactly match Vercel URL (no trailing slash)

### Database connection fails on Railway
- Use the **pooler** connection string (port 6543), not direct connection (port 5432)
- Supabase Dashboard → Settings → Database → Connection Pooling

### Health check failing
- `/health` endpoint is implemented in `backend/app/main.py`
- Railway allows 300s for health check (`healthcheckTimeout` in `railway.json`)
