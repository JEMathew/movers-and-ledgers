# Optional operational-control source configuration

These index and deny-client rules files are source candidates only. No deployment,
database creation, IAM grant or Firestore activation is performed by this workstream.
The existing default backend remains `disabled`. An index appearing here does not mean
it exists in any project. Missing index/access/ADC/read deadlines yield UNAVAILABLE.

The proposed composite index serves owner_hash equality plus created_at descending,
limited to 20 reservations. Rules deny every direct browser/client read and write,
even for authenticated clients. Admin SDK access bypasses these rules and still needs
separately authorized service-account IAM, operational controls and release review.

Reservations contain pseudonymous owner hashes and bounded execution scalars only.
The API independently checks every returned event against its verified owner and returns
only capability, controlled state, created time and bounded reservation counts/budget.
Operational state does not establish an accounting approval, financial audit event,
actual inference, correctness, actual billing or migration/FPU outcome. Existing SQL
workflow evidence remains independent.

## Reviewable provisioning proposal

The API is now enabled and explicitly retained by the owner; see [drift record](api-drift-record.json). No database, rules/index deployment, IAM or runtime activation follows from that decision. [Full proposal](../../docs/security/firestore-provisioning-proposal.md) separates dormant setup from later IAM/runtime approvals. Candidate files: [database](database.proposed.json), [disabled seed](policy.proposed.json), [runtime role](runtime-role.proposed.json), [conditional binding](runtime-binding.proposed.json). All are data for review, not an applied configuration. Source `dac9815` selects the named database explicitly and conditions terminal updates on the observed version.

The [named target configuration](firebase.proposed.json) binds rules/indexes specifically to `movebooks-operations`. [Approval manifest](proposal-manifest.json) hashes the phase A and separately approved phase B files.
