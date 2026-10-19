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

- No copy says or implies that AI advice is running today ("AI advises", "agents coordinate"). The one exception
  is the attribution line below.
- Scripted examples (design files, prototypes) are labelled "Example of planned behaviour. Not live model output."
- Every Advisor or Reviewer surface repeats that the person approves every change and that advice never changes
  the books.

## Attribution

Owner decision (19 Oct 2026): the landing page and the signed-in workspace show the exact line
"Built on Google Cloud and powered by Gemini AI". It is approved Phase 1 copy, rendered by
`apps/web/components/v2/Attribution.tsx`, and it does not depend on `AI_ASSISTANCE_STATUS`.

- One quiet line. No supporting text, badges or official logos.
- It does not change the Advisor or Reviewer status. Those surfaces keep the Planned badge, and
  `AI_ASSISTANCE_STATUS` stays `planned`.
- Hosted live Gemini inference is not active in Phase 1. Technical documentation and release reports say so,
  and none of them cite runtime model evidence.
