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
  The historical Gemini attribution exception was removed by the owner on 20 October 2026.
- Scripted examples (design files, prototypes) are labelled "Example of planned behaviour. Not live model output."
- Every Advisor or Reviewer surface repeats that the person approves every change and that advice never changes
  the books.

## Attribution

Owner decision (20 Oct 2026), superseding the historical attribution exception:

- The marketing homepage `/` shows exactly "Built on Google Cloud", once beneath the MoveBooks AI wordmark.
- All other shared-header routes omit provider attribution, preserving header dimensions.
- No Google Cloud/Gemini logos, powered-by claim, endorsement, sponsorship or partnership implication.
- Do not substitute "Built with Google Gemini" without a separately verified permissible basis and approval.
- `apps/web/components/v2/Attribution.tsx` owns the fixed marketing copy; `Nav` restricts its placement.
- This factual infrastructure statement does not certify live inference. The Advisor and Reviewer keep their
  Planned badges; `AI_ASSISTANCE_STATUS` and its live-activation requirements above remain unchanged.
- Hosted live Gemini inference is not active in Phase 1; do not cite branding as runtime model evidence.

Usage basis: Google's April 2026 customer co-branding guidance, pages 5–7:
https://services.google.com/fh/files/misc/external_customer_co_branding_eligibility.pdf
