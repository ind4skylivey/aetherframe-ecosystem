# AetherFrame Ecosystem

Monorepo scaffold for AetherFrame (backend), Reveris Noctis (UI/CLI), and LainTrace (tracing).

## Quickstart (staged flow)
- Copy `.env.example` to `.env` and adjust secrets.
- Build and start infra: `docker compose -f infra/docker-compose.yml --env-file .env up -d`.
- Services: FastAPI backend at 8000, Redis 6379, Postgres 5432, MinIO 9000/9001, Reveris CLI talks to API.

## Structure
- `AetherFrame/` — FastAPI + Celery orchestration layer
- `ReverisNoctis/` — React UI, Typer CLI, reporting
- `LainTrace/` — Frida-based tracer
- `infra/` — shared compose, scripts, CI/CD

Follow staged prompts in `prompts/` for full build-out.
