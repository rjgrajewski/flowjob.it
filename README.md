# flowjob: IT Job Search Engine

![Python 3.9](https://img.shields.io/badge/python-3.9-blue) ![React](https://img.shields.io/badge/React-18-61dafb) ![Vite](https://img.shields.io/badge/Vite-5-646cff) ![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688) ![Playwright](https://img.shields.io/badge/playwright-1.52.0-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.3-blue) ![AWS](https://img.shields.io/badge/AWS-RDS-orange) ![AWS](https://img.shields.io/badge/AWS-Fargate-orange)

## Overview

**flowjob** is a web application for collecting, processing and analyzing IT job offers from JustJoin.it. Users can register, complete an onboarding profile (personal details, education, experience), build a skill profile (selecting skills they know and blocking ones they don't want), and instantly get ranked, personalized job matches. The app also generates a downloadable PDF CV tailored to the user's profile.

1. Automatic retrieval and updating of the job offers database.
2. Interactive job search based on user skill profile.
3. Generation of a personalized PDF CV from the user's onboarding data and skill profile.
4. Presentation of market statistics via a dashboard *(planned)*.

---

## Frontend (Vite + React)

The frontend is a **Vite + React** SPA with a dark "Terminal Nights" aesthetic.

**Stack:** React 18 · Framer Motion · React Router v6 · @react-pdf/renderer · d3-force · Sora / Inter / Outfit fonts

**Directory:** `frontend-react/`

### Running locally

> Node.js 20.x and Python 3.9+ are required.

**One command (backend + frontend):**

```bash
npm install
npm run dev
# → Frontend: http://localhost:5173  (API /api/* proxied to backend :8000)
```

**Or separately:** `npm run dev:frontend` (Vite only), `npm run dev:backend` (FastAPI only).

The Vite dev server proxies all `/api` requests to the FastAPI backend on `:8000`.

### Pages

| Route | Page | Auth | Description |
|---|---|---|---|
| `/` | Home | — | Hero, feature grid, split sections |
| `/get-started` | Register / Login | — | Split-layout with tab toggle |
| `/onboarding` | Onboarding | Login | Multi-step profile form (personal info, education, experience) |
| `/my-skills` | CV Builder | Login + Onboarding | Bubble cloud skill selector with sidebar |
| `/my-cv` | My CV | Login + Onboarding | PDF CV preview and download (via @react-pdf/renderer) |
| `/jobs` | Job Board | Login + Onboarding | Filtered job cards with match scores |

Protected routes require authentication. Routes behind **Onboarding** additionally require the user to complete the onboarding profile first.

### Design System — "Terminal Nights"

| Token | Value | Usage |
|---|---|---|
| `--bg-deep` | `#0d1117` | App background |
| `--bg-surface` | `#161b22` | Cards, panels |
| `--bg-elevated` | `#1c2433` | Elevated panels, dropdowns |
| `--accent-cyan` | `#00e5ff` | Primary CTA, 90%+ match |
| `--accent-violet` | `#7c3aed` | Secondary accent, gradients |
| `--accent-green` | `#00e676` | Success indicators |
| `--accent-amber` | `#ffd740` | 70–89% match |
| `--accent-red` | `#ff5370` | Anti-skills, errors |
| `--text-primary` | `#e6edf3` | Main body text |
| `--text-secondary` | `#8b949e` | Muted text, labels |

---

## Backend (FastAPI)

Backend runs on port 8000 with JWT-based authentication. Use `npm run dev` from project root to start it together with the frontend, or:

```bash
npm run dev:backend
# or: python3 -m uvicorn backend.main:app --reload --port 8000
```

The backend uses a repository pattern (`backend/api/repository/`) with async `asyncpg` connection pooling.

### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/register` | — | Create a new account (email + password) |
| `POST` | `/api/login` | — | Authenticate and receive JWT token |
| `GET` | `/api/skills` | — | Returns all normalized skills with frequency. Accepts `?selected=` query param |
| `GET` | `/api/offers` | — | Returns job offers with required skills |
| `GET` | `/api/users/{id}/skills` | JWT | Get user's selected skills, anti-skills, highlighted skills |
| `POST` | `/api/users/{id}/skills` | JWT | Save user's skill profile |
| `GET` | `/api/users/{id}/onboarding` | JWT | Get onboarding data (profile, education, experience) |
| `POST` | `/api/users/{id}/onboarding` | JWT | Save onboarding data |

### Database Migrations

SQL migrations live in `src/sql/migrations/`. Run them via:

```bash
python3 backend/run_migration.py src/sql/migrations/005_user_onboarding.sql
```

---

## Key Modules

### Scout *[(docs)](./src/scout/README.md)*
Playwright-based scraper that collects job offers from JustJoin.it and stores them in PostgreSQL. Runs automatically in AWS Fargate on a daily schedule (EventBridge).

### Atlas *[(docs)](./src/atlas/README.md)* — Functional Beta
AI-powered service (AWS Bedrock / Claude) that normalizes and deduplicates skill names across job offers (e.g. `"React.js"`, `"ReactJS"` → `"React"`). Deployed as an AWS Lambda triggered by Scout after each successful scrape. See [infra docs](./infra/README.md) for deployment.

### Job Search — Active
React frontend + FastAPI backend that matches user skill profiles against job offers and ranks them by compatibility score.

### CV Generation — Active
Multi-step flow: users complete onboarding (personal info, education, experience), select skills in the CV Builder, then preview and download a PDF CV rendered client-side via `@react-pdf/renderer`.

### Market Overview *(Planned)*
Dashboard with market analytics: most popular skills, salary vs. technology, job volume over time.

---

## Project Structure

```
flowjob/
├─ frontend-react/              # Vite + React frontend
│  ├─ src/
│  │  ├─ pages/                 # Home, Register, Onboarding, CVBuilder, MyCV, JobBoard
│  │  ├─ components/            # Navbar, JobCard, FilterBar, CVEditorTabs, CustomSelect, ...
│  │  ├─ hooks/                 # useOffers, useSkills
│  │  ├─ services/              # api.js (fetch + localStorage auth)
│  │  └─ index.css              # Design system tokens + globals
│  ├─ vite.config.js            # Proxy /api → localhost:8000
│  └─ package.json
├─ backend/                     # FastAPI backend
│  ├─ main.py                   # App entry point, CORS, lifespan
│  ├─ database.py               # asyncpg pool (AWS RDS / Secrets Manager)
│  ├─ models.py                 # Pydantic request/response models
│  ├─ run_migration.py          # SQL migration runner
│  └─ api/
│     ├─ auth_utils.py          # JWT helpers
│     ├─ routers/               # auth, skills, offers, users
│     └─ repository/            # auth_repo, skills_repo, offers_repo, user_repo
├─ src/
│  ├─ scout/                    # Web scraper (Playwright)
│  ├─ atlas/                    # Skill normalization (AWS Bedrock)
│  └─ sql/
│     ├─ tables/                # offers, skills, offer_skills, users
│     ├─ views/                 # offers_parsed
│     └─ migrations/            # 001..008 incremental schema changes
├─ infra/                       # AWS SAM template for Atlas Lambda
│  ├─ template.yaml
│  ├─ deploy.sh
│  └─ README.md
├─ api/                         # Vercel serverless entrypoint
│  └─ index.py
├─ tests/                       # Test scripts and SQL queries
├─ vercel.json                  # Vercel deployment config
├─ .env.example                 # Environment variables template
├─ requirements.txt             # Python dependencies
└─ README.md
```

---

## Environment Variables

See `.env.example` for the full template:

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | yes | Secret key for signing JWT tokens |
| `AWS_ACCOUNT_ID` | yes | AWS account ID |
| `AWS_REGION` | yes | AWS region (e.g. `eu-central-1`) |
| `SECRET_ARN` | no | AWS Secrets Manager ARN (auto-loads DB credentials) |
| `AWS_DB_ENDPOINT` | yes | RDS database endpoint |
| `AWS_DB_NAME` | yes | Database name |
| `AWS_DB_USERNAME` | yes | Database username |
| `AWS_DB_PASSWORD` | yes | Database password |
| `CORS_ORIGINS` | no | Comma-separated allowed origins (default: `localhost:5173,localhost:8000`) |

---

## Deployment

- **Frontend + API proxy** — deployed to **Vercel** via `vercel.json` (Vite build + serverless `/api` rewrites).
- **Scout (scraper)** — runs on **AWS Fargate** as a scheduled ECS task.
- **Atlas (normalization)** — deployed as an **AWS Lambda** via SAM. See [infra/README.md](./infra/README.md).
- **Database** — **AWS RDS PostgreSQL 15.3**.

---

*Built by Rafal Grajewski*
