"""Build disposable demo state privately; publish once without intermediate SQL commits."""

import json

from fastapi import HTTPException

from .repository import InMemoryMigrationSessionRepository
from .service import DiscoverAssessService, creation_id


def create_demo(repository, owner, kind, scenario, key, build, render):
    # An absent key preserves the legacy API: each call is a NEW creation intent.
    # Browser loaders supply and retain a key until a successful response is received.
    intent = json.dumps(["demo-creation-v1", kind, key]) if key is not None else None
    sid = creation_id(owner, intent) if intent else None

    def replay(existing):
        marker = existing.events[0].attributes if existing.events else {}
        if marker.get("demo_kind") != kind or marker.get("demo_scenario") != scenario:
            raise HTTPException(409, "Creation key already used for another scenario.")
        return render(existing)

    if sid is not None:
        existing = repository.get(sid, owner)
        if existing is not None:
            return replay(existing)

    staged = DiscoverAssessService(InMemoryMigrationSessionRepository())
    session = build(staged, intent)
    session.events[0].attributes.update(demo_kind=kind, demo_scenario=scenario)
    response = render(session)  # Rendering/validation failure must precede publication too.
    try:
        repository.create(session)  # One insert-only transaction; never an upsert.
    except ValueError as error:
        existing = repository.get(session.id, owner) if intent else None
        if existing is None:
            raise HTTPException(409, "Demo creation conflicted; review before retrying.") from error
        return replay(existing)  # Concurrent keyed creation: return the winner, never overwrite.
    return response
