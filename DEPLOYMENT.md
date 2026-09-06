# CyberRiskIQ Production Deployment & Hosting Guide

This guide walks through deploying **CyberRiskIQ** end-to-end on $0 free-tier cloud infrastructure using **Supabase (PostgreSQL + RLS)**, **Render / Fly.io (FastAPI Backend Container)**, and **Vercel / Netlify (React 18 + Vite Frontend)**.

---

## 🏗️ Architecture Overview

```
                                 ┌─────────────────────────────────┐
                                 │   Vercel / Netlify (Frontend)   │
                                 │   React 18 + Vite + ECharts     │
                                 └────────────────┬────────────────┘
                                                  │ HTTPS / REST (JWT + X-Org-ID)
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │   Render / Fly.io (Backend)     │
                                 │   FastAPI Python 3.11 Docker    │
                                 │   Authoritative Math Engines    │
                                 └────────────────┬────────────────┘
                                                  │ PostgreSQL Connection Pool
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │       Supabase (Database)       │
                                 │   PostgreSQL + Row Level Sec    │
                                 │   Multi-Tenant Scoped Schema    │
                                 └─────────────────────────────────┘
```

---

## 1. Database Setup (Supabase Free Tier)

1. Create a free account at [supabase.com](https://supabase.com).
2. Click **New Project**, select your nearest region, and save your database password.
3. In the Supabase Dashboard, navigate to the **SQL Editor**.
4. Open the migration file [`supabase/migrations/20260906000000_initial_schema.sql`](file:///c:/Users/Vivan/OneDrive/Documents/PROJECTS/CyberRiskIQ/supabase/migrations/20260906000000_initial_schema.sql) in this repository.
5. Paste the entire SQL file into the SQL Editor and click **Run**.
6. Retrieve your database connection string:
   - Go to **Project Settings** $\to$ **Database** $\to$ **Connection Pooling**.
   - Copy the **Session / Transaction Connection string** (e.g., `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`).

---

## 2. Backend Deployment (Render or Fly.io Docker)

### Option A: Render.com (Recommended for Blueprint 1-Click Deploy)

1. Create an account at [render.com](https://render.com).
2. Connect your GitHub repository (`CyberRiskIQ`).
3. Click **New +** $\to$ **Blueprint** and select `render.yaml`.
4. In the Environment Variables screen, provide:
   - `DATABASE_URL`: Your Supabase connection string from Step 1.
   - `ENVIRONMENT`: `production`
   - `JWT_SECRET`: Random secure 32+ character string.
5. Click **Apply**. Render will automatically build the `backend/Dockerfile` and deploy the service.
6. Note the generated public URL (e.g. `https://cyberriskiq-api.onrender.com`).

### Option B: Fly.io (Command Line CLI)

1. Install Fly CLI: `powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"`
2. Login: `fly auth login`
3. Launch app: `fly launch --no-deploy`
4. Set secrets:
   ```bash
   fly secrets set DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" JWT_SECRET="your-secure-secret"
   ```
5. Deploy: `fly deploy`

---

## 3. Frontend Deployment (Vercel / Netlify)

### Option A: Vercel (Recommended)

1. Create an account at [vercel.com](https://vercel.com).
2. Import your GitHub repository.
3. Set the build parameters:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_URL`: Your backend API URL (e.g. `https://cyberriskiq-api.onrender.com`)
5. Click **Deploy**. Vercel will build and host your frontend on global CDN.

### Option B: Netlify

1. Create an account at [netlify.com](https://netlify.com).
2. Click **Add new site** $\to$ **Import an existing project**.
3. Build command: `npm run build`, Publish directory: `dist`.
4. Set environment variable `VITE_API_URL` to your backend URL.
5. Click **Deploy Site**.

---

## ⚠️ Free-Tier Limitations & Cold-Start Behavior

| Platform | Free-Tier Plan Details | Cold-Start Impact | Mitigation / Recommendation |
| :--- | :--- | :--- | :--- |
| **Render Web Services** | 512 MB RAM, spins down after 15 min inactivity | 30–50 second wake-up on first HTTP request | Set up a free uptime monitor (e.g., [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com)) pinging `/api/health` every 10 min. |
| **Fly.io** | 3 shared CPU-1x machines with 256 MB RAM | 2–5 second auto-start when requested | Enabled in `fly.toml` with `auto_start_machines = true`. |
| **Supabase** | 500 MB database storage, 2 active projects | Database pauses after 1 week without queries | Keep active or run test pipelines regularly. |
| **Vercel / Netlify** | Global edge CDN, unlimited bandwidth on standard usage | 0s latency (Instant static edge delivery) | Edge caches assets (`/dist`). |

---

## 🔐 Environment Variables Reference

| Variable Name | Required? | Description / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** (Backend) | PostgreSQL connection string (Supabase) or `sqlite:///./cyberriskiq.db` (local dev) |
| `VITE_API_URL` | **Yes** (Frontend) | URL of FastAPI backend (e.g. `https://cyberriskiq-api.onrender.com` or empty in local proxy) |
| `JWT_SECRET` | **Yes** (Backend) | Secret token for signing and decoding session auth tokens |
| `PORT` | Optional (Backend) | Port to bind (default `8000`) |
| `ENVIRONMENT` | Optional (Backend) | `development` or `production` |
| `AI_API_KEY` | Optional (Backend) | Optional external LLM API key (e.g. Google Gemini / OpenAI) |

---

## 💻 Local Development Setup

To run the entire stack locally:

1. **Backend Server**:
   ```powershell
   .venv\Scripts\python.exe backend/run.py
   ```
   API docs available at: `http://localhost:8000/docs`

2. **Frontend Development Server**:
   ```powershell
   npm.cmd run dev
   ```
   Web UI accessible at: `http://localhost:5173`

3. **Running Full Test Suite**:
   ```powershell
   .venv\Scripts\python.exe -m unittest discover -s backend/tests
   node tests/test_engines.js
   ```
