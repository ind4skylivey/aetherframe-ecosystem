import typer

app = typer.Typer(help="Reveris Noctis CLI placeholder")


@app.command()
def ping():
    """Basic connectivity check."""
    typer.echo("reveris-ok")


if __name__ == "__main__":
    app()
