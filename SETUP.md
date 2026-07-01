# GrowthOS — Local Setup Guide

## Step 1 — Get Remaining Supabase Credentials

Go to → https://supabase.com/dashboard/project/pmrmtajstxnjadrhdvmp

### A. Service Role Key
Settings → API → `service_role` key (secret) → Copy

### B. JWT Secret
Settings → API → JWT Settings → JWT Secret → Copy

### C. Database URL
Settings → Database → Connection string → **Transaction** tab → Copy
(looks like: `postgresql://postgres.pmrmtajstxnjadrhdvmp:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`)

Open `D:\CODE\OS\growthos\.env` and paste those 3 values.

---

## Step 2 — Install Supabase CLI (run once in PowerShell as Admin)

```powershell
winget install Supabase.CLI
```

Or with Scoop:
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Verify:
```powershell
supabase --version
```

---

## Step 3 — Login & Link Project

Open PowerShell in `D:\CODE\OS\growthos` and run:

```powershell
# Login (opens browser)
supabase login

# Link to your project
supabase link --project-ref pmrmtajstxnjadrhdvmp
# It will ask for DB password → enter the one you set when creating the project

# Push migrations to Supabase
supabase db push
```

This runs both migration files automatically:
- `20260101000001_phase1_schema.sql`
- `20260101000002_phase2_schema.sql`

---

## Step 4 — Start Backend

Open **Terminal 1** in `D:\CODE\OS\growthos`:

```powershell
# Activate Python virtual environment
.venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Start FastAPI
uvicorn backend.app.main:app --reload --port 8000
```

✅ Expected output:
```
INFO     Application startup complete.
INFO     APScheduler started — hourly sync jobs registered
INFO     Uvicorn running on http://0.0.0.0:8000
```

Test: open http://localhost:8000/health

---

## Step 5 — Start Frontend

Open **Terminal 2** in `D:\CODE\OS\growthos\frontend`:

```powershell
# Install dependencies (first time only)
npm install

# Start Next.js
npm run dev
```

✅ Expected output:
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

---

## Step 6 — Open App

→ http://localhost:3000

1. Click **Sign up**
2. Enter your name, brand name, email, password
3. You'll go to onboarding → enter brand name → skip integrations for now
4. Dashboard loads ✅

---

## Troubleshooting

| Error | Fix |
|---|---|
| `relation "workspaces" does not exist` | Run `supabase db push` again |
| `Invalid JWT` or `401` on API calls | Check `SUPABASE_JWT_SECRET` in `.env` matches Supabase dashboard |
| `connection refused` on backend | Make sure `DATABASE_URL` in `.env` is the Transaction string from Supabase |
| Frontend blank white screen | Check `frontend/.env.local` has correct URL and anon key |
| `supabase: command not found` | Restart terminal after installing CLI |
| Backend crashes on start | Run `.venv\Scripts\activate` first before uvicorn |

---

## Project Ref
- **Project ID:** `pmrmtajstxnjadrhdvmp`
- **URL:** `https://pmrmtajstxnjadrhdvmp.supabase.co`
- **Dashboard:** `https://supabase.com/dashboard/project/pmrmtajstxnjadrhdvmp`
