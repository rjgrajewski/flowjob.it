## Cursor Cloud specific instructions

### Overview

**flowjob** is an IT job search engine that scrapes offers from JustJoin.it, normalizes skills via AI, and matches users to jobs. It has two main services for local dev: a **FastAPI backend** (port 8000) and a **Vite+React frontend** (port 5173).

### Services

| Service | Port | Start command |
|---------|------|---------------|
| Backend (FastAPI) | 8000 | `npm run dev:backend` |
| Frontend (Vite React) | 5173 | `npm run dev:frontend` |
| Both together | 8000 + 5173 | `npm run dev` |

### Running

- `npm run dev` starts both backend and frontend concurrently via the root `package.json`.
- The frontend Vite dev server proxies `/api/*` requests to the backend at `localhost:8000`.

### Database

- The backend connects to PostgreSQL via `asyncpg` with `sslmode=require` (hardcoded in `backend/database.py`).
- Connection uses env vars: `AWS_DB_ENDPOINT`, `AWS_DB_NAME`, `AWS_DB_USERNAME`, `AWS_DB_PASSWORD`.
- These are injected as secrets in the Cloud Agent environment pointing to a remote AWS RDS instance.
- If `SECRET_ARN` env var is set, the backend will attempt to load credentials from AWS Secrets Manager first.
- Schema DDL lives in `src/sql/tables/` and migrations in `src/sql/migrations/`.

### Lint / Type checking

- Python: `python3 -m mypy backend/ --ignore-missing-imports` (pre-existing type errors exist; do not treat them as blockers).
- No ESLint config for the frontend; Vite build (`npm run build`) serves as the main frontend check.

### Build

- Frontend build: `npm run build` (runs `vite build` in the frontend workspace).

### Gotchas

- Node.js 20.x is required (see `engines` in `package.json`). Use `nvm use 20` before running npm commands.
- Python packages install to `~/.local/bin`; ensure `PATH` includes it (already configured in `~/.bashrc`).
- The `.env` file at repo root is loaded by `python-dotenv`; however, injected environment secrets take precedence over `.env` values.
