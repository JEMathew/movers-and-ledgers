# Judge FAQ — MoveBooks AI

Short, evidence-linked answers. "Local" means run from this repository with the real API and a demo identity; it is not the deployed site.

**What problem does it solve?**
Moving a business from desktop accounting to a cloud product stalls on judgment calls: which account maps where, what to do when a batch fails, whether the books still balance, and whether the business can actually work afterwards. MoveBooks AI guides one synthetic business from a readiness check to a verified first invoice, with a person approving every consequential step.

**Is Gemini running in the product?**
Not in the public Beta. It runs deterministic agents only, and the AI panels say so ("deterministic fallback — not live AI"). The code includes a Gemini Advisor and an independent Reviewer built on Google ADK. The Advisor was validated live on `gemini-2.5-flash` on 29 Sep: all five capabilities accepted after prompt fixes ([record](../reviews/live-gemini-adk.md)). That model is now retiring. The Reviewer has not run live. A bounded run on `gemini-3.5-flash-lite` is prepared and awaits approval ([guide](../release/LIVE-GEMINI-RUN.md)).

**How many agents are there?**
13 registered roles, 7 ADK agent definitions, 2 model-capable pathways invoked by the API (Advisor, Reviewer, both gated off in the Beta) and **0 verified autonomous agents**. The workflow is run by deterministic stage agents; AI only explains and challenges.

**What stops the AI from changing the books?**
- Its only tool is read-only (`read_evidence`). It has no write path to financial state.
- Its output must match a strict schema with `human_approval_required: true` and `financial_authority: false`.
- It may cite only the evidence it was given.
- Narrative that tries to approve, post or bypass a rule is rejected.

Anything that fails these checks becomes a labelled fallback. Under all 23 offline scenarios the business state (session data apart from the advisory records) is unchanged ([evaluation](final-experience/evidence/agents/offline-agent-eval.json)).

**Is the Reviewer really independent?**
Yes. It builds its own context from source evidence and never receives the Advisor's output. A canary string planted in stored Advisor output never appears in the Reviewer's context (offline evaluation). On the ambiguous account `1200 · Misc Clearing` it returns CHALLENGED. It cannot clear an account: a model answer of "no contradiction" for that account is rejected.

**What happens when something goes wrong mid-migration?**
A controlled duplicate stops the batch. Completed checkpoints stay intact. A person approves the remedy, and only the failed batch is retried. This is shown in the video and checked in the journey (`duplicate_resolution_authorized_checkpoint_retry_and_completion`).

**How do you know the migrated books are right?**
Seventeen deterministic reconciliation checks (counts, relationships, balances, documents) must pass before configuration can be applied. The first invoice is then verified against its approved contract and exact accounting effect: USD 100.00 + 7.25 tax = 107.25.

**Can a returning user find their migration on another device?**
Yes, locally. An owner-scoped list (`GET /v1/migration-sessions`) feeds a picker. The journey checks switching, restoration after reload, and a fresh browser with no local memory. On the deployed site this still needs the candidate deployment and a real two-account sign-in check.

**What is deployed today?**
The public Beta at https://movebooks-si.web.app (earlier release). The integration candidate, with the picker, listing and proxy fix, is built and tested locally and has a release runbook ([runbook](../release/RELEASE-RUNBOOK.md)), but it is not deployed.

**Is any real customer data used?**
No. Only synthetic businesses. Hosted uploads are disabled; "Try Your Data" validates test packages in the browser only.

**How was it tested?**
- Backend: 663 passed, 0 failed (with the optional Google libraries installed).
- Web: 696 tests, plus typecheck, lint and a production build.
- End-to-end journey: 21/21 checks.
- Offline agent evaluation: 23/23.
- Proxy smoke test: 7/7.
- npm and pip dependency audits: 0 known vulnerabilities.

Container image scans run in Cloud Shell and are pending. See the [evidence manifest](final-experience/EVIDENCE-MANIFEST.md).

**How do I reproduce the journey?**
Start the API (`services/api/start.py`) and the web dev server in demo mode, then run `docs/submission/browser-journey/final-journey.cjs`, setting `PLAYWRIGHT_TEST` and `CHROMIUM` to your local installs. Each run creates fresh synthetic migrations through the UI.
