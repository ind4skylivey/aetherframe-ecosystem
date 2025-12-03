# AetherFrame Ecosystem

Monorepo scaffold for AetherFrame (backend), Reveris Noctis (UI/CLI), and LainTrace (tracing).

## Quickstart (staged flow)
- Copy `.env.example` to `.env` and adjust secrets.
- Build and start infra: `docker compose -f infra/docker-compose.yml --env-file .env up -d`.
- Services: FastAPI backend at 8000, Redis 6379, Postgres 5432, MinIO 9000/9001, Reveris CLI talks to API.

> If your shell aliases docker->podman, export `DOCKER_HOST=unix:///var/run/docker.sock` before running compose.

## Structure
- `AetherFrame/` — FastAPI + Celery orchestration layer
- `ReverisNoctis/` — React UI, Typer CLI, reporting
- `LainTrace/` — Frida-based tracer
- `infra/` — shared compose, scripts, CI/CD

## Configuration
- CORS origins: set `AETHERFRAME_CORS_ORIGINS` (comma-separated) to allow extra frontends. Defaults to `http://localhost:3000,http://127.0.0.1:3000`.
- API host/port, Postgres/Redis/MinIO credentials, and worker concurrency are configurable via `.env` (see `.env.example`).
- To use an alternate database (e.g., tests), set `DB_URL`/`AETHERFRAME_DB_URL` (SQLite URL works).

## Host warnings / tuning
- Redis may log `vm.overcommit_memory=1` warning. Optional: `sudo sysctl -w vm.overcommit_memory=1` (persist with a file in `/etc/sysctl.d/`).
- Compose can warn about buildx; builds still succeed. To silence: install Docker Buildx (`docker buildx install`) or set `COMPOSE_DOCKER_CLI_BUILD=0` during builds.
- Run compose commands with `--env-file .env` to avoid env fallback warnings.

Follow staged prompts in `prompts/` for full build-out.

### Alembic
Run migrations inside the API container:
```
docker compose -f infra/docker-compose.yml --env-file .env exec -e PYTHONPATH=/app aetherframe-api alembic upgrade head
```

### UI & CLI
- UI (Vite preview) at http://localhost:3000
- CLI usage (from `ReverisNoctis`): `python cli/main.py status`, `add-plugin`, `add-job`, `events`.
