from dataclasses import dataclass
from functools import lru_cache
from typing import Protocol

from fastapi import Header, HTTPException, status

from .settings import get_settings


@dataclass(frozen=True)
class Principal:
    subject: str
    email: str


class IdentityVerifier(Protocol):
    def verify(self, token: str) -> Principal: ...


class DemoIdentity:
    def verify(self, token: str) -> Principal:
        if token != "demo-user":
            raise ValueError("Invalid demo identity")
        return Principal("demo-user", "demo@movebooks.local")


class FirebaseIdentity:
    def __init__(self, project: str):
        import firebase_admin
        from firebase_admin import auth

        self.app = firebase_admin.initialize_app(options={"projectId": project}, name=project)
        self.verify_token = auth.verify_id_token

    def verify(self, token: str) -> Principal:
        claims = self.verify_token(token, app=self.app, check_revoked=True)
        subject = claims.get("uid")
        if not isinstance(subject, str) or not 1 <= len(subject) <= 128:
            raise ValueError("Missing identity subject")
        # Email/roles from a request body never grant workspace authority.
        return Principal(f"firebase:{subject}", claims.get("email", ""))


@lru_cache
def firebase_identity(project):
    return FirebaseIdentity(project)


async def require_principal(authorization: str | None = Header(default=None)) -> Principal:
    """Authentication seam for a Google/Firebase-compatible token verifier.

    The development-only demo token is deliberately rejected in production.
    """
    settings = get_settings()
    if authorization and authorization.startswith("Bearer ") and len(authorization) <= 8192:
        token = authorization[7:]
        try:
            if (
                settings.identity_mode == "demo"
                and not settings.cloud
                and settings.demo_identity_enabled
            ):
                return DemoIdentity().verify(token)
            if settings.identity_mode == "firebase":
                from starlette.concurrency import run_in_threadpool

                return await run_in_threadpool(
                    firebase_identity(settings.google_project).verify, token
                )
        except Exception:
            # Revoked/expired/wrong-audience tokens and verification outages fail closed.
            # SDK error messages and token values must never reach logs or the client.
            pass
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Valid Google-compatible identity required",
        headers={"WWW-Authenticate": "Bearer"},
    )
