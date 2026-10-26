# Gemini Advisor and Reviewer: status labelling rule

Owner condition (19 Oct 2026): keep the Advisor and Reviewer labelled as planned until real authenticated inference
is activated and verified.

## Rule

- Every surface that mentions, previews or hosts the Advisor or the independent Reviewer shows a status badge.
- The badge value comes from one constant, `AI_ASSISTANCE_STATUS` in `apps/web/components/v2/ai-status.ts`.
  In Phase 1 it is `"planned"` and is not derived from any runtime response.
- Allowed values: `planned` ("Planned"), `prototype` ("Prototype", only inside clickable prototypes),
  `live` ("Live"). The product never shows `live` in Phase 1.
- Changing the constant to `live` is not a code-review decision. It requires a separate release acceptance gate
  that records: model mode and pinned model set on the API; model controls on Firestore with the policy enabled;
  the API service account's Vertex AI grant; a passed kill-switch drill; a canary on named test accounts; and a
  verified authenticated call from the hosted product (not a local harness).
- A unit test fails if the constant is anything other than `planned` on this branch.

## Copy

- No copy says or implies that AI advice is running today ("AI advises", "agents coordinate").
  The homepage-only owner-approved marketing exception below does not establish live capability.
- Scripted examples (design files, prototypes) are labelled "Example of planned behaviour. Not live model output."
- Every Advisor or Reviewer surface repeats that the person approves every change and that advice never changes
  the books.

## Attribution

Owner scope lock and subsequent local implementation approval (20 October 2026):

- The marketing homepage `/` must show both official Google Cloud and Google Gemini graphical logos (not Gemini Enterprise), alongside exactly "Built on Google Cloud · Built with Google Gemini", once in the approved branding area.
- Other shared-header routes omit provider attribution. Preserve established product identity and geometry.
- Local implementation for owner review is authorized. Public usage permission and qualifying Gemini-use evidence remain OPEN; public availability/non-commercial hackathon status do not prove permission.
- No powered-by, endorsement, sponsorship or partnership claim. No alteration of official asset appearance.
- `Attribution.tsx` owns the exact copy/assets; `Nav` restricts placement. Tests assert exact text and both original asset hashes.
- This exception does not certify live inference. Planned badges, `AI_ASSISTANCE_STATUS`, financial controls and all live-activation requirements above remain unchanged.
- Public release remains BLOCKED until the owner resolves applicable permission and evidence gates; keep the entire requirement intact.

External-reference assessment and current acceptance: `docs/ux/v2-owner-scope-acceptance.md`.
