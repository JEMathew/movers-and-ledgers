from dataclasses import dataclass

from fastapi import Header, HTTPException, status

from .settings import get_settings


@dataclass(frozen=True)
class Principal:
    subject: str
    email: str


async def require_principal(authorization: str | None = Header(default=None)) -> Principal:
    """Authentication seam for a Google/Firebase-compatible token verifier.

    The development-only demo token is deliberately rejected in production.
    """
    settings = get_settings()
    if settings.env != "production" and settings.demo_identity_enabled:
        if authorization == "Bearer demo-user":
            return Principal(subject="demo-user", email="demo@movebooks.local")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Valid Google-compatible identity required",
        headers={"WWW-Authenticate": "Bearer"},
    )

