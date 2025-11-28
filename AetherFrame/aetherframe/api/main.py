from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from aetherframe.utils.db import get_session
from aetherframe.core import repository
from aetherframe.core.schemas import JobCreate, JobRead, PluginCreate, PluginRead
from aetherframe.utils.config import get_settings
from aetherframe.core.celery_app import celery_app
from aetherframe.core.models import Base, Job
from aetherframe.utils.db import get_engine

settings = get_settings()
app = FastAPI(title="AetherFrame API", version="0.1.0")

# Ensure tables exist on startup (lightweight for dev)
engine = get_engine()
Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check() -> dict:
    """Lightweight liveness probe."""
    return {"status": "ok"}


@app.get("/status")
def status() -> dict:
    """Report readiness and broker connectivity."""
    try:
        pong = celery_app.control.ping(timeout=1.0)
    except Exception:
        pong = None
    return {
        "service": "aetherframe",
        "env": settings.environment,
        "celery": "up" if pong else "down",
    }


@app.post("/plugins", response_model=PluginRead)
def create_plugin(payload: PluginCreate, db: Session = Depends(get_session)):
    return repository.create_plugin(db, payload.name, payload.version, payload.description)


@app.get("/plugins", response_model=list[PluginRead])
def list_plugins(db: Session = Depends(get_session)):
    return repository.list_plugins(db)


@app.post("/jobs", response_model=JobRead)
def create_job(payload: JobCreate, db: Session = Depends(get_session)):
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
