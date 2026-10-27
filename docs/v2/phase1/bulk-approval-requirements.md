# Bulk low-risk mapping approval: inspection and consent requirements

Status: requirements only. Phase 1 does not ship bulk approval; Phase 2 implements it behind the V2 flag.
Owner condition (19 Oct 2026): define explicit inspection and consent requirements before implementation.

## What the API supports today

- There is no batch decision endpoint. Each mapping is decided through its own call:
  `POST /v1/migration-sessions/{session_id}/mappings/{mapping_id}/approve` (also `/reject`, `/modify`),
  and every call is authorised for the session owner and recorded in the server audit trail with actor and time.
- `apply_mapping_decision` (tools/mapping/controls.py) refuses a second final decision on a mapping and refuses
  approve or reject on a `BLOCKED` mapping (a blocked mapping can only be modified to a compatible target).
- Plan approval (`PlanApproval`) records the list of `mapping_decision_ids` and a manifest checksum.

Bulk approval is therefore a UI convenience over N individual, individually audited approvals. It must never bypass
or weaken any server rule, and it needs no change to financial logic.

## Eligibility (computed from the API response at the moment of consent, never from a hard-coded list)

A mapping is eligible only if all of the following hold:

1. `risk == "LOW"`.
2. `state` is `AUTO_ACCEPTABLE` or `REVIEW_REQUIRED` (not `BLOCKED`, `REJECTED`, `APPROVED`, `MODIFIED`, `PROPOSED`).
3. `selected_target == recommended_target` (the person has not started changing it).
4. The area is not `tax_configuration` (tax mappings are always decided one by one, whatever their risk).
5. It has no open reconsideration.

`MEDIUM` and `HIGH` mappings are never eligible. The eligible count shown in the UI is derived from this rule; the
Harbor Light sample happens to give 10 today, but the number must never be written into the code or copy.

## Inspection (before consent is possible)

- The bulk panel lists every eligible mapping in full: source label, source value where present, selected target,
  risk, confidence as a percentage, and area. No item is hidden behind a count or a collapsed group.
- Each row links to the same evidence view used for single decisions.
- The person can remove any item from the set (it then needs an individual decision). The set size updates.
- The approve control is disabled until the list has been displayed in full (rendered, not merely fetched).

## Consent

- An explicit, unticked checkbox: "I have reviewed these {n} mappings and approve each one as shown."
- The primary button names the exact count and action: "Approve {n} mappings". Count in the button, the checkbox
  sentence and the visible list must be equal; if they differ the button stays disabled.
- No default-on consent, no auto-submit, no consent carried over between sessions or sets.

## Execution

- The client re-fetches the mappings immediately before submitting and aborts if any item in the set changed
  (`version`, `state`, `selected_target`), showing which ones.
- Approvals are sent one at a time, in the listed order, each with the comment
  `Bulk approval set {setId}: reviewed {n} low-risk mappings` so the audit trail shows the batch context per item.
- On the first failure the client stops, shows which items were approved and which were not, and leaves the rest
  for individual review. Nothing is retried automatically and nothing already approved is silently undone.
- Success copy reports the result per item ("10 approved, each recorded separately"), never a single aggregate.

## Reversal

- An approved mapping is reversed through the existing reconsideration flow, item by item. There is no "undo all".

## Acceptance tests (Phase 2)

1. Eligibility: given a fixture with LOW/MEDIUM/HIGH, tax, blocked, rejected and modified items, only rule-matching
   items are offered.
2. Consent: the button is disabled until the checkbox is ticked and the list is fully rendered; count mismatch keeps it
   disabled.
3. Stale data: a changed item between display and submit aborts with a named list.
4. Partial failure: a mocked 409 on item k stops at k, reports k-1 approved, and sends no further calls.
5. Audit: each request carries the set comment; the server audit shows N separate decisions with the same actor.
6. Accessibility: the panel passes axe; the checkbox and button are reachable and labelled by keyboard.
