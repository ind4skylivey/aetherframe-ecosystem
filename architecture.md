# AetherFrame Architecture (Early Release)

## Modules
- **AetherFrame**: FastAPI + Celery orchestrator, Postgres, Redis, MinIO.
- **Reveris Noctis**: Typer CLI (API client); React UI stub pending.
- **LainTrace**: tracer stub (prints `laintrace-ready`), future Frida hooks.

## Data model
- Plugins: `id`, `name`, `version`, `description`, `created_at`
- Jobs: `id`, `target`, `status(pending|running|completed|failed)`, `result JSON`, timestamps, `plugin_id`

## Flows
1. CLI creates plugin/job → FastAPI → DB.
2. FastAPI encola tarea Celery `aetherframe.process_job`.
3. Worker consume desde Redis, marca `running/completed` y guarda `result`.

## Services (dev)
- API: http://localhost:8000
- Redis: localhost:6379
- Postgres: localhost:5432 (aether/changeme/aetherdb)
- MinIO: http://localhost:9000 (console 9001)

## Dev commands
```
docker compose -f infra/docker-compose.yml --env-file .env up -d
curl http://localhost:8000/status
python ReverisNoctis/cli/main.py status
```
