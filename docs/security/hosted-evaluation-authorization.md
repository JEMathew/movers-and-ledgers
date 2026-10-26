# Hosted four-attempt authorization — local implementation, not activated

Owner authorization:21October2026 attachment `a005750a-74b2-4ff4-a205-d5d4ba0bfb2d`.
Subsequent owner clarification explicitly leaves hosted A/B testing BLOCKED until two eligible
existing Firebase users and synthetic provenance are established; production must remain unchanged.
The operator email is not a test identity. No real authorization document has been initialized.

## Application boundary

The existing explicit paired mapping action supplies a request-local transport authority. It is
bound to the authenticated Firebase subject, migration workspace, selected mapping, and exact
Cloud Run revision. Admission follows the existing owner lookup and synthetic clearing-case
projection. The new claim precedes daily quota reservation and generation. Standalone cloud
reasoning/reviewer calls outside this pair return a safe fallback; they cannot spend this limited
authorization. Existing local/deterministic behavior, role projections, response schemas, owner
isolation, financial controls and the old Cloud Shell harness/consumed ledger remain unchanged.

The existing Firestore owner/global daily reservations remain in force. This new nonrenewable
authorization additionally permits only one approved owner/workspace/mapping and at most four
attempts in its lifetime, at most two per role. That is also a stricter per-owner/workspace ceiling
for this authorization. It is not an ongoing public-user budget or approval to reset daily limits.

## Durable state

Existing database `movebooks-operations`, collection `movebooks_model_controls`, document
`authorization-overnight-20261021-a005750a-74b2-4ff4-a205-d5d4ba0bfb2d`.

The runtime never creates this document. After all prerequisites pass, the operator must create
it exactly once using create-only semantics, with an immutable acceptance evidence SHA, exact
revision and SHA-256 projections of the approved subject/workspace/mapping. Missing document,
missing evidence, malformed counters or mismatched scope/revision fail closed. No deployment
flag supplies an alternative authorization ID. A future allowance requires separate owner
authorization and a reviewed implementation; deleting/resetting this document is prohibited.

State: `APPROVED -> CLAIMED -> COMPLETED` or `HALTED`. Atomic transactions reread the kill
switch and consume an attempt before every model dispatch. A claim is exclusive across
instances. A new process/request cannot reclaim it. In-flight attempts have no expiring lease:
crashes, uncertain transport results and control timeouts consume capacity rather than refunding
it. Existing completed application results can still be read/replayed without new inference.
An immutable sanitized attempt document accompanies each received response. An ambiguous
request remains identifiable by its persisted reservation even when response metadata is absent.

## Wire and cost controls

The pinned google-genai2.28.0/google-adk1.39.1 transport is intercepted after serialization.
Only the approved global Vertex generateContent URL is allowed. Streaming, synchronous
generation, external/paid tools, uncounted fields and non-text contexts fail closed.
The countTokens request includes actual contents, system instruction, function schemas and
generation configuration, including prior tool turns/signatures. Counting failure or more than
50,000 tokens denies generation. Both HTTP operations force one SDK attempt; output2048,
LOW thinking and one candidate are enforced. Existing ADK two-call/role and request deadlines
remain in force. The kill switch is reread after counting and before generation reservation.

The conditional planning estimate is4*(50,000*0.30+2,048*2.50)/1,000,000 = **USD0.08048**.
[Google Cloud standard global pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)
lists these input/output rates and includes reasoning in output pricing.
[Google GenerateContent thinking documentation](https://ai.google.dev/gemini-api/docs/generate-content/thinking)
describes the output cap as including thoughts. Endpoint/model applicability, free countTokens,
prices and all billable-output bounds must be verified in the actual hosted preflight before
the document's proof flags may be true. No flag or mock test constitutes that verification.
No paid call is allowed if the complete expected bound cannot be established belowUSD0.20.

Telemetry keeps available prompt/candidate/thinking counts, latency, request/response hashes,
sanitized response ID/version and a reported-usage estimate. Missing thinking stays unknown;
complete billing remains UNVERIFIED. Reported counts exceeding the validated bounds halt the
authorization. No prompt, credentials, financial text or private reasoning is logged here.

## Remaining release gates

- Eligible A/B users, normal interactive sign-in and synthetic provenance; no token extraction.
- Native private admission/transaction/kill-switch and owner-isolation proof on existing resources.
- Native bounded migration/FPU and compatible fallback acceptance.
- One separately initialized authorization, verified model/endpoint/cost configuration and no prior claim.
- Track A-owned public disclosures: current approved policies explicitly state Gemini is unavailable.
  Do not edit them here or publicly enable behavior that contradicts them.
- Four attempts cover the entire workflow, including post-release probes. If staging consumes
  four, zero remain for panelist requests; never replace the ledger to imply public availability.

Local doubles and a disposable anonymous loopback Firestore emulator validate negative paths,
exclusive claims, restart persistence, four-attempt exhaustion, immutable evidence, kill switch,
safe contention denial and actual paired application orchestration. This does not prove native
Cloud Run, Firebase authentication, IAM or live model behavior. The old598 API image lacks these
new controls; it remains a compatible feature-off fallback, not the live candidate.
