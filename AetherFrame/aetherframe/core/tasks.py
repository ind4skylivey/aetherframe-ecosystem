"""Celery tasks for job processing."""

from typing import Any, Dict
from sqlalchemy.orm import Session

from aetherframe.core.celery_app import celery_app
from aetherframe.core import repository
from aetherframe.utils.db import get_session_factory
from aetherframe.core.models import JobStatus

SessionLocal = get_session_factory()


@celery_app.task(name="aetherframe.process_job")
def process_job(job_id: int, target: str) -> Dict[str, Any]:
    """Mock job processor; updates status and returns a placeholder result."""
    db: Session = SessionLocal()
    try:
        repository.update_job_status(db, job_id, JobStatus.running)
        result = {"target": target, "analysis": "placeholder", "status": "ok"}
        repository.update_job_status(db, job_id, JobStatus.completed, result)
        return result
    except Exception as exc:  # pragma: no cover - minimal placeholder
        repository.update_job_status(db, job_id, JobStatus.failed, {"error": str(exc)})
        raise
    finally:
        db.close()
