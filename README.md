# AetherFrame Ecosystem

Offensive-security friendly orchestration stack: FastAPI + Celery + Postgres + Redis + MinIO backend (AetherFrame), Vite/React UI + Typer CLI (Reveris Noctis), and tracing/agent layer (LainTrace). Built for red team automation, pluginized job processing, and quick observability.

## Why this repo
- Single monorepo keeps API, UI/CLI, and tracer aligned for fast iteration.
- Docker Compose out-of-the-box: stand up API, worker, Redis, Postgres, MinIO, UI.
- Batteries included: Prometheus-style metrics, CORS, input validation, Alembic migrations, non-root worker.

## Quickstart
1) Copy `.env.example` to `.env` and set secrets.
2) Use Docker (if your shell aliases `docker` to podman: `export DOCKER_HOST=unix:///var/run/docker.sock`).
3) Bring everything up:
```
docker compose -f infra/docker-compose.yml --env-file .env up -d
```
4) Visit: API `http://localhost:8000`, UI `http://localhost:3000`, MinIO console `http://localhost:9001`.

## Services (monorepo layout)
- `AetherFrame/` — FastAPI API, Celery worker, SQLAlchemy + Alembic, Prometheus `/metrics`.
- `ReverisNoctis/` — Vite/React UI, Typer CLI for plugins/jobs/events.
- `LainTrace/` — tracer/agent component (Frida-oriented).
- `infra/` — shared compose definitions.
- `prompts/` — bootstrap guides and roadmap.

## Configuration
- CORS: `AETHERFRAME_CORS_ORIGINS` (comma-separated, default `http://localhost:3000,http://127.0.0.1:3000`).
- DB: override with `DB_URL`/`AETHERFRAME_DB_URL` (SQLite URLs work for tests).
- API/worker/minio/postgres/redis hosts, ports, and creds from `.env` (see `.env.example`).
- Worker concurrency: `AETHERFRAME_WORKER_CONCURRENCY`.

## Database migrations
Run inside the API container (ensures correct PYTHONPATH):
```
docker compose -f infra/docker-compose.yml --env-file .env exec -e PYTHONPATH=/app aetherframe-api alembic upgrade head
```

## CLI & UI
- UI (preview): `http://localhost:3000`
- CLI from `ReverisNoctis/`:
```
python cli/main.py status
python cli/main.py add-plugin --name test --version 0.1.0
python cli/main.py add-job --target sample.bin --plugin-id 1
python cli/main.py events
```

## Ops notes
- Redis may warn about `vm.overcommit_memory`; optional: `sudo sysctl -w vm.overcommit_memory=1`.
- Buildx warnings are safe; to silence, install buildx or set `COMPOSE_DOCKER_CLI_BUILD=0`.
- Always pass `--env-file .env` to compose to avoid env fallback noise.

## Roadmap snapshot
- More API tests (validation/metrics), configurable CORS, DB URL override ✅
- Hardening: rate limits, payload length checks, metrics persistence.
- CI guardrails: migrations up-to-date check, backend + UI builds.
- Pre-release tags tracked in `CHANGELOG.md`; progress tracked in `prompts/aetherframe_roadmap.md`.
