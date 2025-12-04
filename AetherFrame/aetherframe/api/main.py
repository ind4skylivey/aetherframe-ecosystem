from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from statistics import mean
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi.openapi.docs import get_swagger_ui_html

from aetherframe.utils.db import get_session
from aetherframe.core import repository
from aetherframe.core.schemas import JobCreate, JobRead, PluginCreate, PluginRead, EventCreate, EventRead
from aetherframe.utils.config import get_settings
from aetherframe.core.celery_app import celery_app
from aetherframe.core.models import Base, Job, Plugin, Event
from aetherframe.utils.db import get_engine
from fastapi.responses import PlainTextResponse
from aetherframe.utils.license import enforce_or_raise

settings = get_settings()

static_dir = Path(__file__).parent / "static"
app = FastAPI(
    title="AetherFrame API",
    version="0.1.0",
    docs_url=None,  # we'll serve custom docs to force CSS
    swagger_ui_parameters={"defaultModelsExpandDepth": -1},
)

# Ensure tables exist on startup (lightweight for dev)
engine = get_engine()
Base.metadata.create_all(bind=engine)

# Static for Swagger theme
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/docs", include_in_schema=False)
def custom_docs():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title="AetherFrame API",
        swagger_favicon_url="https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/2728.svg",
        swagger_ui_parameters={
            "syntaxHighlight.theme": "obsidian",
            "customCssUrl": "/static/swagger-theme.css",
            "defaultModelsExpandDepth": -1,
        },
    )

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict:
    """Lightweight liveness probe."""
    return {"status": "ok"}


@app.get("/status")
def status(db: Session = Depends(get_session)) -> dict:
    """Report readiness, broker connectivity, and aggregate metrics."""
    try:
        pong = celery_app.control.ping(timeout=1.0)
    except Exception:
        pong = None

    jobs = db.query(Job).all()
    plugins_count = db.query(Plugin).count()
    events_count = db.query(Event).count()

    status_counts = {
        "pending": 0,
        "running": 0,
        "completed": 0,
        "failed": 0,
    }
    elapsed = []
    for j in jobs:
        status_counts[j.status.value] = status_counts.get(j.status.value, 0) + 1
        if isinstance(j.result, dict) and j.result.get("elapsed_sec") is not None:
            elapsed.append(float(j.result["elapsed_sec"]))

    return {
        "service": "aetherframe",
        "env": settings.environment,
        "celery": "up" if pong else "down",
        "metrics": {
            "jobs_total": len(jobs),
            "plugins_total": plugins_count,
            "events_total": events_count,
            "jobs_by_status": status_counts,
            "avg_elapsed_sec": round(mean(elapsed), 4) if elapsed else None,
        },
    }


@app.post("/plugins", response_model=PluginRead)
def create_plugin(payload: PluginCreate, db: Session = Depends(get_session)):
    enforce_or_raise()
    name = payload.name.strip()
    version = payload.version.strip()
    if not name or not version:
        raise HTTPException(status_code=422, detail="name and version must not be empty")
    description = payload.description.strip() if payload.description else None
    return repository.create_plugin(db, name, version, description)


@app.get("/plugins", response_model=list[PluginRead])
def list_plugins(db: Session = Depends(get_session)):
    return repository.list_plugins(db)


@app.post("/jobs", response_model=JobRead)
def create_job(payload: JobCreate, db: Session = Depends(get_session)):
    enforce_or_raise()
    job = repository.create_job(db, payload.target, payload.plugin_id)
    # Enqueue background processing
    celery_app.send_task("aetherframe.process_job", args=[job.id, job.target])
    return job


@app.get("/jobs", response_model=list[JobRead])
def list_jobs(db: Session = Depends(get_session)):
    return repository.list_jobs(db)


@app.get("/jobs/{job_id}", response_model=JobRead)
def get_job(job_id: int, db: Session = Depends(get_session)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.post("/events", response_model=EventRead)
def create_event(payload: EventCreate, db: Session = Depends(get_session)):
    enforce_or_raise()
    return repository.create_event(db, payload.event_type, payload.payload, payload.job_id)


@app.get("/events", response_model=list[EventRead])
def list_events(db: Session = Depends(get_session)):
    return repository.list_events(db)


@app.get("/metrics", response_class=PlainTextResponse)
def metrics(db: Session = Depends(get_session)):
    """Prometheus-style minimal metrics."""
    jobs = db.query(Job).all()
    status_counts = {"pending": 0, "running": 0, "completed": 0, "failed": 0}
    for j in jobs:
        status_counts[j.status.value] = status_counts.get(j.status.value, 0) + 1

    lines = [
        "# HELP aether_jobs_total Total jobs",
        "# TYPE aether_jobs_total gauge",
        f"aether_jobs_total {len(jobs)}",
    ]
    for k, v in status_counts.items():
        lines.append(f'aether_jobs_status_total{{status="{k}"}} {v}')
    return "\n".join(lines) + "\n"


@app.get("/")
def root() -> dict:
    """Friendly landing instead of 404."""
    return {
        "service": "aetherframe",
        "docs": "/docs",
        "health": "/health",
        "status": "/status",
        "metrics": "/metrics",
        "plugins": "/plugins",
        "jobs": "/jobs",
        "events": "/events",
    }
