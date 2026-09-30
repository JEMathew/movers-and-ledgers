"""Cloud-only, non-blocking dependency warm-up. Verifies no token and grants nothing.

The first `/v1/identity` on a cold instance otherwise pays the Firebase Admin import and
app construction inside the request. Warm-up failures are ignored here because the request
path performs the same construction again and fails closed on any error.
"""

import threading

from movebooks_api.auth import firebase_identity


def warm_cloud_dependencies(settings, identity=firebase_identity):
    if not settings.cloud:
        return None

    def work():
        if settings.identity_mode == "firebase":
            try:
                identity(settings.google_project)
            except Exception:
                pass
        if settings.storage_backend == "gcs":
            try:
                import google.cloud.storage  # noqa: F401
            except Exception:
                pass

    thread = threading.Thread(target=work, name="movebooks-warmup", daemon=True)
    thread.start()
    return thread
