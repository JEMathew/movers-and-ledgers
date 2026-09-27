"""Private, owner-authorized artifacts. Not an automatic raw-upload persistence path."""

import hashlib
from typing import Literal
from uuid import UUID

ArtifactKind = Literal["safe-summary", "report", "controlled-package"]


def object_name(owner, workspace, artifact, kind):
    if not owner or kind not in {"safe-summary", "report", "controlled-package"}:
        raise ValueError("Invalid artifact scope")
    # Never use filenames, emails, paths or accounting names supplied by a browser.
    prefix = hashlib.sha256(owner.encode()).hexdigest()
    return f"owners/{prefix}/{UUID(str(workspace))}/{kind}/{UUID(str(artifact))}"


class StorageUnavailable(RuntimeError):
    pass


class MemoryArtifacts:
    def __init__(self):
        self.objects = {}

    def put(self, name, data):
        if name in self.objects:
            raise StorageUnavailable("Artifact already exists")
        self.objects[name] = bytes(data)

    def get(self, name):
        return self.objects[name]

    def delete(self, name):
        self.objects.pop(name, None)


class GoogleArtifacts:
    def __init__(self, project, bucket, client=None):
        if client is None:
            from google.cloud import storage

            client = storage.Client(project=project)
        self.bucket = client.bucket(bucket)

    def ready(self):
        self.bucket.reload(timeout=5, retry=None)
        policy = self.bucket.iam_configuration
        if (
            not policy.uniform_bucket_level_access_enabled
            or policy.public_access_prevention != "enforced"
        ):
            raise StorageUnavailable("Private bucket policy required")

    def put(self, name, data):
        try:
            self.ready()
            self.bucket.blob(name).upload_from_string(
                data,
                content_type="application/octet-stream",
                if_generation_match=0,
                timeout=10,
                retry=None,
            )
        except Exception:
            raise StorageUnavailable("Artifact write unavailable") from None

    def get(self, name):
        try:
            self.ready()
            return self.bucket.blob(name).download_as_bytes(timeout=10, retry=None)
        except Exception:
            raise StorageUnavailable("Artifact read unavailable") from None

    def delete(self, name):
        try:
            self.ready()
            blob = self.bucket.blob(name)
            blob.reload(timeout=5, retry=None)
            blob.delete(if_generation_match=blob.generation, timeout=10, retry=None)
        except Exception:
            raise StorageUnavailable("Artifact deletion unavailable") from None


class ArtifactService:
    """Only authorized owner access; no public URLs, signed bearer URLs, or list APIs."""

    def __init__(self, repository, storage):
        self.repository, self.storage = repository, storage

    def scope(self, owner, workspace, artifact, kind):
        if self.repository.get(UUID(str(workspace)), owner) is None:
            raise PermissionError("Workspace unavailable")
        return object_name(owner, workspace, artifact, kind)

    def put(self, owner, workspace, artifact, kind, data, *, consent=False):
        name = self.scope(owner, workspace, artifact, kind)
        if not consent or len(data) > 2 * 1024 * 1024:
            raise ValueError("Explicit artifact retention consent and bounded content required")
        if kind == "controlled-package":
            raise ValueError("Cloud package retention is not enabled in this slice")
        self.storage.put(name, data)
        return name

    def get(self, owner, workspace, artifact, kind):
        return self.storage.get(self.scope(owner, workspace, artifact, kind))

    def delete(self, owner, workspace, artifact, kind):
        self.storage.delete(self.scope(owner, workspace, artifact, kind))
