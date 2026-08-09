import os
from typing import Any

from dotenv import load_dotenv

load_dotenv()

_langfuse = None


def _get_langfuse():
    global _langfuse
    if _langfuse is not None:
        return _langfuse

    public_key = os.environ.get("LANGFUSE_PUBLIC_KEY")
    secret_key = os.environ.get("LANGFUSE_SECRET_KEY")

    if public_key and secret_key and public_key != "your_langfuse_public_key":
        try:
            from langfuse import Langfuse
            _langfuse = Langfuse(
                public_key=public_key,
                secret_key=secret_key,
                host=os.environ.get("LANGFUSE_HOST", "https://cloud.langfuse.com"),
            )
        except Exception:
            _langfuse = False
    else:
        _langfuse = False

    return _langfuse


def trace_agent_step(name: str, metadata: dict[str, Any] | None = None) -> None:
    """Record agent step via Langfuse when configured, otherwise no-op."""
    langfuse = _get_langfuse()
    if langfuse and langfuse is not False:
        try:
            trace = langfuse.trace(name=f"car-matchmaker-{name}")
            trace.event(name=name, metadata=metadata or {})
        except Exception:
            pass

    # OpenTelemetry-style console log for local debugging
