# MSE-2 SSED Evening – CampusHub Docker Exam

## Project Structure
```
MSE-2-SSED-Evening/
├── frontend/
│   ├── Dockerfile          # Multi-stage: Node builder → Nginx runner
│   ├── nginx.conf          # SPA routing + /api/ proxy to backend
│   ├── .dockerignore
│   ├── package.json
│   └── public/index.html   # (starter app)
├── backend/
│   ├── Dockerfile          # Node 18-alpine, production deps only
│   ├── .dockerignore
│   ├── package.json
│   └── server.js           # Express + PostgreSQL + Redis + /health
├── docker-compose.yml          # Build-based compose (dev/exam)
├── docker-compose.deploy.yml   # Image-based compose (uses Docker Hub images)
├── .github/
│   └── workflows/
│       └── cd.yml          # GitHub Actions CI/CD pipeline
└── README.md
```

## Tasks Completed

### Task 1 – Frontend Dockerfile (`frontend/Dockerfile`)
- Stage 1: `node:18-alpine AS builder` → `npm install` → `npm run build`
- Stage 2: `nginx:alpine AS runner` → copies `/app/dist` → serves on port 80
- `/api/` requests proxied to `http://backend:5000/` via `nginx.conf`

### Task 2 – Backend Dockerfile (`backend/Dockerfile`)
- `node:18-alpine`, production-only dependencies (`npm ci --only=production`)
- Runs `server.js` on port 5000
- Health check: `curl -f http://localhost:5000/health`

### Task 3 – docker-compose.yml (Build-based)
- **frontend** – built from `./frontend`, port `80:80`, depends on healthy backend
- **backend** – built from `./backend`, port `5000:5000`, depends on healthy postgres + redis
- **postgres** – `postgres:15-alpine`, volume `postgres_data`, **no host port exposed**
- **redis** – `redis:7-alpine`, **no host port exposed**
- All on custom bridge network `app-network`

### Task 4 – docker-compose.deploy.yml (Image-based)
- Same stack but uses `${DOCKERHUB_USERNAME}/frontend:latest` and `${DOCKERHUB_USERNAME}/backend:latest`
- No `build:` blocks

### Task 5 – GitHub Actions CI/CD (`.github/workflows/cd.yml`)
- Triggers on `push` / `pull_request` to `main`
- Steps:
  1. Checkout
  2. Docker Buildx setup
  3. Build frontend image → tag `v1` + `latest` → push to Docker Hub
  4. Build backend image → tag `v1` + `latest` → push to Docker Hub
  5. Docker Hub login via `DOCKERHUB_USERNAME` + `DOCKERHUB_TOKEN` secrets
  6. Deploy using `docker-compose.deploy.yml`
  7. Verify all services healthy

## Required GitHub Secrets
| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN`    | Docker Hub access token (not password) |
| `POSTGRES_PASSWORD`  | Postgres password |

## Running Locally
```bash
# Build and start all services
docker compose up --build

# Access
# Frontend:  http://localhost
# Backend:   http://localhost:5000/health
# API data:  http://localhost:5000/api/data
```

## Deploying with published images
```bash
export DOCKERHUB_USERNAME=yourusername
docker compose -f docker-compose.deploy.yml up
```
