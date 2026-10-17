# Optional operational-control source configuration

The exact deny-client rules and owner/time index are provisioned in the dormant named database under explicit Phase A approval. [Execution record](phase-a-execution.json) identifies the resource, verification and historical deviation. No runtime IAM grant or application/model activation is performed.
The existing default backend remains `disabled`. Only the named resource in that execution record is verified; source files do not prove any other project configuration. Missing index/access/ADC/read deadlines yield UNAVAILABLE.

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

The API is now enabled and explicitly retained by the owner; see [drift record](api-drift-record.json). No database, rules/index deployment, IAM or runtime activation follows from that decision. [Full proposal](../../docs/security/firestore-provisioning-proposal.md) separates dormant setup from later IAM/runtime approvals. Candidate files: [database](database.proposed.json), [disabled seed](policy.proposed.json), [runtime role](runtime-role.proposed.json), [conditional binding](runtime-binding.proposed.json). The Phase A database/rules/index/false seed are applied and accepted; runtime role/binding remain proposed and unapplied. Source `dac9815` selects the named database explicitly and conditions terminal updates on the observed version.

The [named target configuration](firebase.proposed.json) binds rules/indexes specifically to `movebooks-operations`. [Approval manifest](proposal-manifest.json) hashes the phase A and separately approved phase B files.

Dormant Phase A closed 17 October 2026: deletion protection Enabled, Standard Native Singapore, rules Active, index Ready, both policy controls false. Local Phase B testing is authorized; cloud IAM, live test data, activation and deployment require separate approval.
