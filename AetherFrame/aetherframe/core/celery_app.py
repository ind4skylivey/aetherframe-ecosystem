from celery import Celery
import os

BROKER_URL = f"redis://{os.getenv('REDIS_HOST', 'redis')}:{os.getenv('REDIS_PORT', '6379')}/0"
BACKEND_URL = BROKER_URL

celery_app = Celery("aetherframe", broker=BROKER_URL, backend=BACKEND_URL)


@celery_app.task
def ping() -> str:
    """Simple health task."""
    return "pong"
