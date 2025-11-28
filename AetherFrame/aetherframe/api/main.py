from fastapi import FastAPI

app = FastAPI(title="AetherFrame API", version="0.1.0")


@app.get("/health")
def health_check() -> dict:
    """Lightweight liveness probe."""
    return {"status": "ok"}


@app.get("/status")
def status() -> dict:
    """Readiness placeholder for future pipeline/queue checks."""
    return {"service": "aetherframe", "queues": {}, "plugins": []}
