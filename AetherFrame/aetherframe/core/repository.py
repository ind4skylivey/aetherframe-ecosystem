"""Data access layer."""

from sqlalchemy.orm import Session
from typing import List, Optional

from .models import Job, JobStatus, Plugin, Event


def create_plugin(db: Session, name: str, version: str, description: str | None) -> Plugin:
    plugin = Plugin(name=name, version=version, description=description)
    db.add(plugin)
    db.commit()
    db.refresh(plugin)
    return plugin


def list_plugins(db: Session) -> List[Plugin]:
    return db.query(Plugin).order_by(Plugin.created_at.desc()).all()


def get_plugin(db: Session, plugin_id: int) -> Optional[Plugin]:
    return db.query(Plugin).filter(Plugin.id == plugin_id).first()


def create_job(db: Session, target: str, plugin_id: Optional[int]) -> Job:
    job = Job(target=target.strip(), plugin_id=plugin_id)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def list_jobs(db: Session) -> List[Job]:
    return db.query(Job).order_by(Job.created_at.desc()).all()


def update_job_status(db: Session, job_id: int, status: JobStatus, result=None) -> Optional[Job]:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        return None
    job.status = status
    if result is not None:
        job.result = result
    db.commit()
    db.refresh(job)
    return job


def create_event(db: Session, event_type: str, payload, job_id: Optional[int]) -> Event:
    ev = Event(event_type=event_type, payload=payload, job_id=job_id)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


def list_events(db: Session) -> List[Event]:
    return db.query(Event).order_by(Event.created_at.desc()).all()
