# Model replacement before activation

17 October 2026. Documentation review only; no model request, credential change or runtime configuration change.

The configured historical model, `gemini-2.5-flash`, retires on **20 October 2026** in Google's Cloud platform. Google lists 3.8 Flash, 3.5 Flash-Lite and 3.1 Flash-Lite as replacements. [Official lifecycle table](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions).

| Evaluation candidate | Documented endpoint availability | Standard global text price per million tokens, input / output |
| --- | --- | --- |
| `gemini-3.5-flash-lite` | Global, US/EU multi-region; Mumbai also listed for model availability, but Standard PayGo lists global/US/EU | $0.30 / $2.50 |
| `gemini-3.8-flash` | Global and US/EU multi-region | Gross planning rates $1.50 / $7.50 from January 2027; current promotion lists $0.75 / $3.75 through December 2026 with credit conditions |
| `gemini-3.1-flash-lite` | Global and US/EU multi-region | $0.25 / $1.50 |

Sources: [3.5 Flash-Lite](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-5-flash-lite), [3.8 Flash](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-8-flash), [3.1 Flash-Lite](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-1-flash-lite), [Standard pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing). Output prices include response and reasoning. No caching, batch, promotional-credit entitlement or free allowance is assumed for approval bounds.

**Decision still required:** none of these three model pages lists Singapore Standard PayGo. The application's current `reasoning_location` accepts only `asia-southeast1`. A model-name-only substitution would therefore be unsupported. Do not silently broaden the location allowlist or move prompts to `global`. A global/multi-region endpoint is a separate processing-location decision and does not preserve a Singapore residency promise. No such promise is made by this Beta.

For the bounded explanation/independent-review contracts, evaluate 3.5 Flash-Lite first and retain 3.8 Flash as a comparison candidate. This is a cost/scope hypothesis, not a quality result. Existing ADK configuration uses temperature 0 and `thinking_budget=128`; 3.8 Flash documents temperature 1 and LOW/MEDIUM/HIGH thinking levels, so it is not a verified drop-in replacement.

Before requesting live approval, prepare the exact endpoint/model/config diff, SDK compatibility tests, prompt/tool/schema token bound and conservative two-call reservation calculation. Keep all tools read-only, projections synthetic, reviewer independent and model outputs non-authoritative. Apply current price bounds to every allowed generation attempt, including thinking/tool follow-up; the arbitrary existing $0.10 reservation is not proof of coverage. Live quality/latency/access remain untested and require a separately approved bounded inference run.

Current disposition: deterministic-only public revision unchanged; no automatic replacement, live benchmark, IAM grant or model activation.
