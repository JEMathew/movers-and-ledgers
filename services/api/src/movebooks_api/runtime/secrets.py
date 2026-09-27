"""No startup secret preload or token cache; version aliases allow operator rotation."""

import re
from typing import Protocol

from pydantic import SecretStr


class SecretUnavailable(RuntimeError):
    pass


class SecretProvider(Protocol):
    def get(self, name: str) -> SecretStr: ...


class LocalSecrets:
    def get(self, name: str) -> SecretStr:
        raise SecretUnavailable("Secret unavailable; local deterministic mode needs no credentials")


class GoogleSecrets:
    def __init__(self, project, allowed_names, client=None):
        if client is None:
            from google.cloud import secretmanager

            client = secretmanager.SecretManagerServiceClient()
        self.client, self.project, self.allowed_names = client, project, frozenset(allowed_names)

    def get(self, name):
        if name not in self.allowed_names or not re.fullmatch(r"[a-zA-Z0-9_-]{1,100}", name):
            raise SecretUnavailable("Secret unavailable")
        try:
            result = self.client.access_secret_version(
                request={"name": f"projects/{self.project}/secrets/{name}/versions/latest"},
                timeout=5,
                retry=None,
            )
            return SecretStr(result.payload.data.decode())
        except Exception:
            raise SecretUnavailable("Secret unavailable") from None
