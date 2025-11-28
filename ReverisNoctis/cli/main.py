import os
import typer
import requests

API_BASE = os.getenv("REVERIS_API_BASE", "http://localhost:8000")

app = typer.Typer(help="Reveris Noctis CLI")


def _url(path: str) -> str:
    return f"{API_BASE}{path}"


@app.command()
def status():
    """Show backend status."""
    r = requests.get(_url("/status"), timeout=5)
    r.raise_for_status()
    typer.echo(r.json())


@app.command()
def plugins():
    """List plugins."""
    r = requests.get(_url("/plugins"), timeout=5)
    r.raise_for_status()
    for p in r.json():
        typer.echo(f"{p['id']}: {p['name']} {p['version']} - {p.get('description') or ''}")


@app.command()
def add_plugin(name: str, version: str = "0.1.0", description: str = ""):
    """Register a plugin."""
    payload = {"name": name, "version": version, "description": description or None}
    r = requests.post(_url("/plugins"), json=payload, timeout=5)
    r.raise_for_status()
    typer.echo(r.json())


@app.command()
def jobs():
    """List jobs."""
    r = requests.get(_url("/jobs"), timeout=5)
    r.raise_for_status()
    for j in r.json():
        typer.echo(f"{j['id']}: {j['status']} target={j['target']} plugin_id={j.get('plugin_id')}")


@app.command()
def add_job(target: str, plugin_id: int = typer.Option(None, "--plugin-id")):
    """Submit a new job."""
    payload = {"target": target, "plugin_id": plugin_id}
    r = requests.post(_url("/jobs"), json=payload, timeout=5)
    r.raise_for_status()
    typer.echo(r.json())


@app.command()
def ping():
    """Basic connectivity check."""
    typer.echo("reveris-ok")


if __name__ == "__main__":
    app()
