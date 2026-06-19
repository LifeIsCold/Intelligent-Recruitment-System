# Intelligent Recruitment System

An AI-assisted recruitment platform that matches job seekers to open roles using CV parsing, skill extraction, and ML-based similarity scoring.

Built with **React**, **Laravel**, and a **Python FastAPI** scoring service.

---

## Features

- **Job seeker portal** — upload CVs (PDF/DOCX/text), browse jobs, view match scores
- **Recruiter portal** — post jobs, manage applications, review candidates
- **CV processing** — parse résumés and extract skills automatically
- **ML scoring** — rank candidates against job requirements using embedding similarity
- **Auth & profiles** — registration, login (Sanctum), profile editing, profile pictures
- **Notifications & saved jobs** — in-app alerts and bookmarked listings
- **Configurable scoring weights** — global, company, and per-job weight settings

---

## Architecture

```
Browser  →  Nginx (web)  →  /api/*  →  Laravel API (api)
                                              ↓
                                        ML Service (ml)  →  LM Studio (host)
```

| Service | Stack | Port (default) |
|---------|-------|----------------|
| `web` | React + Vite, served by Nginx | `3000` |
| `api` | Laravel 12, PHP 8.4, SQLite | internal `8000` |
| `ml` | Python FastAPI (CV scoring) | internal `8001` |

The frontend talks to the API through Nginx at `/api`. The ML service calls **LM Studio** on the host machine for embeddings.

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2
- Linux server (or Docker Desktop on macOS/Windows)
- **LM Studio** running locally with an embedding model (e.g. `text-embedding-bge-large-en-v1.5`) — required for CV scoring

---

## Quick Start (Docker on Linux)

### 1. Clone the repository

```bash
git clone https://github.com/LifeIsCold/Intelligent-Recruitment-System.git
cd Intelligent-Recruitment-System
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` if needed:

| Variable | Default | Description |
|----------|---------|-------------|
| `IRS_PORT` | `3000` | Public port for the web UI |
| `LM_STUDIO_URL` | `http://host.docker.internal:1234` | LM Studio API on the host |
| `APP_URL` | `http://localhost:3000` | Public app URL |

### 3. Start LM Studio

1. Open [LM Studio](https://lmstudio.ai/)
2. Load an embedding model (e.g. `text-embedding-bge-large-en-v1.5`)
3. Start the local server on port **1234**

### 4. Build and run

```bash
docker compose up --build -d
```

First build may take 15–30 minutes (Composer and npm dependency installs).

### 5. Open the app

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Frontend |
| http://localhost:3000/up | API health check |
| http://localhost:3000/api/test-python | ML service connectivity test |

---

## Common Commands

```bash
# Start in background
docker compose up -d

# View logs
docker compose logs -f

# Rebuild after code changes
docker compose up --build -d

# Stop and remove containers
docker compose down

# Stop and remove containers + volumes (resets database)
docker compose down -v
```

---

## Project Structure

```
Intelligent-Recruitment-System/
├── backend/recruitment-backend/   # Laravel API
├── frontend/recruitment-frontend/ # React SPA
├── ml-service/                    # Python CV scoring service
├── docker/                        # Dockerfiles, nginx config, entrypoint
├── docs/                          # MVP specs and diagrams
├── docker-compose.yml
└── .env.example
```

---

## Local Development (without Docker)

### Backend

```bash
cd backend/recruitment-backend
cp .env.example .env
composer install
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan serve
```

### Frontend

```bash
cd frontend/recruitment-frontend
npm install
npm run dev
```

Frontend dev server: http://localhost:5173  
API default: http://127.0.0.1:8000/api

### ML Service

```bash
cd ml-service
pip install -r requirements.txt
python cv_scoring_service.py
```

Service runs on http://localhost:8001

---

## User Roles

| Role | Access |
|------|--------|
| **Job seeker** | Upload CV, browse/apply for jobs, view match scores |
| **Recruiter** | Post jobs, manage applications, configure scoring weights |
| **Admin** | System management (planned) |

---

## Troubleshooting

### Docker build fails during `composer install`

Network timeouts to GitHub/Packagist are retried automatically (up to 10 attempts). If it still fails, rerun:

```bash
docker compose build api
```

### ML service shows `degraded` or scoring fails

- Confirm LM Studio is running on the host at port `1234`
- On Linux, `host.docker.internal` is mapped via Docker Compose — ensure the LM Studio server binds to `0.0.0.0`, not just `127.0.0.1`
- Check ML logs: `docker compose logs ml`

### API returns 502 or empty responses

```bash
docker compose logs api
docker compose restart api
```

### Reset the database

```bash
docker compose down -v
docker compose up -d
```

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, Vite, React Router, Axios |
| Backend | Laravel 12, Sanctum, SQLite |
| ML | FastAPI, pandas, numpy, LM Studio embeddings |
| DevOps | Docker, Nginx, PHP 8.4, Python 3.12 |

---

## License

This project is part of an academic / portfolio recruitment system. See repository settings for license details.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a Pull Request

---

**Repository:** [github.com/LifeIsCold/Intelligent-Recruitment-System](https://github.com/LifeIsCold/Intelligent-Recruitment-System)
