# Knowledge agent

Provides versioned, inspectable migration-failure definitions and remediation guardrails to the
Resolution Agent. The current Beta uses a repository-backed catalog with no external retrieval or
model dependency; its interface remains compatible with a future governed Vertex AI Search path.

Retrieves versioned canonical accounting definitions, migration rules, mapping rules, and feature
compatibility references. In the current slice this is a lightweight interface over repository-owned
knowledge. A future Vertex AI Search / Agent Search adapter may replace it without changing agent or
tool contracts. Retrieved text is reference material, never authorization or financial truth.
