# flowjob: IT Job Search Engine

![Python 3.9](https://img.shields.io/badge/python-3.9-blue) ![React](https://img.shields.io/badge/React-18-61dafb) ![Vite](https://img.shields.io/badge/Vite-5-646cff) ![Playwright](https://img.shields.io/badge/playwright-1.52.0-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.3-blue) ![AWS](https://img.shields.io/badge/AWS-RDS-orange) ![AWS](https://img.shields.io/badge/AWS-Fargate-orange)

## 🚀 Overview

**flowjob** is a web application for collecting, processing and analyzing IT job offers from JustJoin.it. Users can build a skill profile (selecting skills they know and blocking ones they don't want) and instantly get ranked, personalized job matches.

1. Automatic retrieval and updating of the job offers database.
2. Interactive job search based on user skill profile.
3. Generation of a personalized CV for a specific job posting.
4. Presentation of market statistics via a dashboard.

---

## 🖥️ Frontend (flowjob UI)

The frontend is a **Vite + React** SPA with a dark "Terminal Nights" aesthetic.

**Stack:** React 18 · Framer Motion · React Router v6 · Sora font

**Directory:** `frontend-react/`

### Running locally

> Node.js is required. If not installed: [nodejs.org/en/download](https://nodejs.org/en/download)

```bash
cd frontend-react
npm install
npm run dev
# → http://localhost:5173
```

The Vite dev server proxies all `/api` requests to the FastAPI backend on `:8000`.

### Pages

| Route | Page | Description |
|---|---|---|
| `/` | Home | Hero, feature grid, split sections |
| `/register` | Register / Login | Split-layout with tab toggle |
| `/cv` | CV Builder | Bubble cloud skill selector with sidebar |
| `/jobs` | Job Board | Filtered job cards with match scores |

### Design System — "Terminal Nights"

| Token | Value | Usage |
|---|---|---|
| `--bg-deep` | `#0d1117` | App background |
| `--bg-surface` | `#161b22` | Cards, panels |
| `--accent-cyan` | `#00e5ff` | Primary CTA, 90%+ match |
| `--accent-amber` | `#ffd740` | 70–89% match |
| `--accent-red` | `#ff5370` | Anti-skills |

---

## ⚙️ Backend (FastAPI)

```bash
python3 -m uvicorn backend.main:app --reload --port 8000
```

**Endpoints used by the frontend:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/skills` | Returns all normalized skills with frequency |
| `GET` | `/api/jobs` | Returns job offers with requiredSkills |

---

## 🔧 Key Modules

### ✅ Scout *[(docs)](./src/scout/README.md)*
Playwright-based scraper that collects job offers from JustJoin.it and stores them in PostgreSQL. Runs automatically in AWS Fargate.

### 🛠️ Atlas *(In Progress)*
AI-powered service (AWS Bedrock / Claude) that normalizes and deduplicates skill names across job offers (e.g. `"React.js"`, `"ReactJS"` → `"React"`).

### ⏳ Job Search *(Active)*
React frontend + FastAPI backend that matches user skill profiles against job offers and ranks them by compatibility score.

### ⏳ CV Generation *(Planned)*
Generates a personalized CV tailored to a selected job posting, downloadable as PDF/DOCX.

### ⏳ Market Overview *(Planned)*
Dashboard with market analytics: most popular skills, salary vs. technology, job volume over time.

---

## 📁 Project Structure

```
flowjob/
├─ frontend-react/              # Vite + React frontend
│  ├─ src/
│  │  ├─ pages/                 # Home, Register, CVBuilder, JobBoard
│  │  ├─ components/            # Navbar, JobCard, FilterBar, Sparkles
│  │  ├─ services/              # api.js (fetch + localStorage auth)
│  │  └─ index.css              # Design system tokens + globals
│  ├─ vite.config.js            # Proxy /api → localhost:8000
│  └─ package.json
├─ frontend/                    # Legacy vanilla JS SPA (backup)
├─ backend/                     # FastAPI backend
├─ src/
│  ├─ scout/                    # Web scraper (Playwright)
│  ├─ atlas/                    # Skill normalization (AWS Bedrock)
│  └─ sql/                      # Database schema
├─ tests/                       # SQL test queries
├─ .env.example                 # Environment variables template
├─ requirements.txt             # Python dependencies
└─ README.md
```

---

*Built by Rafał Grajewski*