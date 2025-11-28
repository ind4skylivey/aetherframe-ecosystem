import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from aetherframe.api.main import app
from aetherframe.utils import db as db_utils
from aetherframe.core.models import Base
from aetherframe.core.celery_app import celery_app


@pytest.fixture(scope="module")
def client():
    # Setup in-memory SQLite for fast tests
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    TestingSessionLocal = sessionmaker(bind=engine, expire_on_commit=False, future=True)
    Base.metadata.create_all(bind=engine)

    def override_get_session():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[db_utils.get_session] = override_get_session

    # Mock celery send_task to avoid redis
    celery_app.send_task = lambda *args, **kwargs: None

    with TestClient(app) as c:
        yield c


def test_create_plugin_and_job(client):
    resp = client.post("/plugins", json={"name": "p1", "version": "0.1.0", "description": "test"})
    assert resp.status_code == 200
    plugin_id = resp.json()["id"]

    resp = client.post("/jobs", json={"target": "sample.bin", "plugin_id": plugin_id})
    assert resp.status_code == 200
    job = resp.json()
    assert job["target"] == "sample.bin"
    assert job["plugin_id"] == plugin_id

    status = client.get("/status").json()
    assert status["metrics"]["jobs_total"] >= 1
    assert status["metrics"]["plugins_total"] >= 1
