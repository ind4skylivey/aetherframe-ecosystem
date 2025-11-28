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
        finally:\n            db.close()\n\n    app.dependency_overrides[db_utils.get_session] = override_get_session\n\n    # Mock celery send_task to avoid redis\n    celery_app.send_task = lambda *args, **kwargs: None\n\n    with TestClient(app) as c:\n        yield c\n\n\n+def test_create_plugin_and_job(client):\n+    # create plugin\n+    resp = client.post(\"/plugins\", json={\"name\": \"p1\", \"version\": \"0.1.0\", \"description\": \"test\"})\n+    assert resp.status_code == 200\n+    plugin_id = resp.json()[\"id\"]\n+\n+    # create job\n+    resp = client.post(\"/jobs\", json={\"target\": \"sample.bin\", \"plugin_id\": plugin_id})\n+    assert resp.status_code == 200\n+    job = resp.json()\n+    assert job[\"target\"] == \"sample.bin\"\n+    assert job[\"plugin_id\"] == plugin_id\n+\n+    # status endpoint returns metrics\n+    status = client.get(\"/status\").json()\n+    assert status[\"metrics\"][\"jobs_total\"] >= 1\n+    assert status[\"metrics\"][\"plugins_total\"] >= 1\n*** End Patch
