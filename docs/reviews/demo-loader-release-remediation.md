# Demo creation persistence and retry contract

The validation and onboarding demo loaders previously committed a new session and its
intermediate migration steps before calling INSERT-only `SqlSessionRepository.put()` again.
PostgreSQL rejected the duplicate UUID with SQLSTATE 23505. Only the final failed transaction
rolled back; prior migration state remained committed. Middleware returned a generic HTTP 503.

Both loaders now build the synthetic replay in a private, request-scoped repository using
the normal service and compare-and-swap operations. Rendering occurs before publication.
The authoritative repository receives one complete snapshot through insert-only `create()`.
Build, render, encoding, and failed INSERT transactions publish no intermediate state.
This staging repository is never a fallback for failed cloud persistence: a failed publication
returns failure and its private state is discarded.

`Idempotency-Key` is optional for API compatibility. A request without it means a new creation
intent and MUST NOT be automatically retried after an ambiguous response. Reusing a supplied
key with the same owner, endpoint, and scenario returns the existing session's current view,
without resetting progress or appending duplicate approvals. A changed scenario returns 409.
Distinct owners and endpoint kinds have separate intents. Concurrent keyed requests use the
same UUID; the loser of the atomic INSERT reads the winner. Neither can overwrite it.
The creation marker stores endpoint/scenario in the existing initial event attributes, not
the raw key, and requires no schema or legacy snapshot encoding change.

Browser loaders persist a key per pending endpoint/body intent in session storage. Errors
and page reloads retain it. Success clears it so another explicit load is a new intent.
Changing the scenario starts a new intent. Closing the tab or losing session storage loses
the pending key; callers must not claim replay safety without the original key.

Existing durable-session mutations retain their original CAS, owner checks, and PR #27
encoding compatibility. Creation replay never writes an existing durable session.

Web security changes pin transitive `sharp` to 0.35.5 and `source-map-js` to 1.2.2, including
sharp's matching platform packages/libvips. Security policies and thresholds are unchanged.
API source and web source/dependencies changed, so both production images need fresh builds,
smoke verification, and the repository's pinned Grype High gate before release.
