"""Celery tasks for job processing."""

from typing import Any, Dict

from aetherframe.core.celery_app import celery_app
from aetherframe.core import repository
from aetherframe.utils.db import get_session_factory
from aetherframe.core.models import JobStatus

SessionLocal = get_session_factory()


@celery_app.task(name="aetherframe.process_job")
def process_job(job_id: int, target: str) -> Dict[str, Any]:
    """Mock job processor; updates status and returns a placeholder result."""
    db = SessionLocal()
    try:
        repository.update_job_status(db, job_id, JobStatus.running)
        repository.create_event(db, "job_started", {"target": target}, job_id)

        result = {"target": target, "analysis": "placeholder", "status": "ok"}

        repository.update_job_status(db, job_id, JobStatus.completed, result)
        repository.create_event(db, "job_completed", result, job_id)
        return result
    except Exception as exc:  # pragma: no cover - minimal placeholder
        fail_payload = {"error": str(exc)}
        repository.update_job_status(db, job_id, JobStatus.failed, fail_payload)
        repository.create_event(db, "job_failed", fail_payload, job_id)
        raise
    finally:
        db.close()
