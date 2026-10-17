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
