"""Pydantic schemas."""

from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel
from .models import JobStatus


class PluginCreate(BaseModel):
    name: str
    version: str = "0.1.0"
    description: Optional[str] = None


class PluginRead(PluginCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class JobCreate(BaseModel):
    target: str
    plugin_id: Optional[int] = None


class JobRead(BaseModel):
    id: int
    target: str
    status: JobStatus
    result: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    plugin_id: Optional[int] = None

    class Config:
        orm_mode = True


class EventCreate(BaseModel):
    event_type: str
    payload: Dict[str, Any]
    job_id: Optional[int] = None


class EventRead(BaseModel):
    id: int
    event_type: str
    payload: Dict[str, Any]
    created_at: datetime
    job_id: Optional[int] = None

    class Config:
        orm_mode = True
