# AetherFrame Architecture (Early Release)

## Modules
- **AetherFrame**: FastAPI + Celery orchestrator, Postgres, Redis, MinIO.
- **Reveris Noctis**: Typer CLI (API client); React UI stub (Vite preview).
- **LainTrace**: tracer stub (prints `laintrace-ready`), future Frida hooks.

## Data model
- Plugins: `id`, `name`, `version`, `description`, `created_at`
- Jobs: `id`, `target`, `status(pending|running|completed|failed)`, `result JSON`, timestamps, `plugin_id`

## Flows
1. CLI/UI creates plugin/job → FastAPI → DB.
2. FastAPI encola tarea Celery `aetherframe.process_job`.
3. Worker consume desde Redis, marca `running/completed` y guarda `result` + `elapsed_sec`.
4. Eventos (`job_started`, `job_completed`, `job_failed`) se guardan en DB y se muestran en UI/CLI.

## Services (dev)
- API: http://localhost:8000
- Redis: localhost:6379
- Postgres: localhost:5432 (aether/changeme/aetherdb)
- MinIO: http://localhost:9000 (console 9001)
- UI: http://localhost:3000

## Dev commands
```
docker compose -f infra/docker-compose.yml --env-file .env up -d
curl http://localhost:8000/status
python ReverisNoctis/cli/main.py status
```

## Metrics
- `/status` agrega counts y `avg_elapsed_sec`.
- `/metrics` expone gauges: `aether_jobs_total`, `aether_jobs_status_total{status=...}`.
