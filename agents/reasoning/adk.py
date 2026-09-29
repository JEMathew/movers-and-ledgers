"""Ephemeral Google ADK runner. No cloud Agent Engine or business write tools."""

import json
import logging
import os
from uuid import uuid4

from pydantic import ValidationError

from .prompts import instruction
from .provider import ProviderFailure, ProviderResult, safe_shape, safe_validation_issues


def protect_sdk_telemetry():
    # Process-wide, fail-safe policy: do not restore unsafe SDK content logging
    # after a request. Only our allowlisted scalar application telemetry is used.
    os.environ["ADK_CAPTURE_MESSAGE_CONTENT_IN_SPANS"] = "false"
    os.environ["OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT"] = "false"
    for prefix in ("google_adk", "google.adk", "google.genai", "httpx", "httpcore"):
        logging.getLogger(prefix).setLevel(logging.CRITICAL + 1)
        for name, logger in list(logging.Logger.manager.loggerDict.items()):
            if name.startswith(prefix + ".") and isinstance(logger, logging.Logger):
                logger.setLevel(logging.CRITICAL + 1)


def vertex_client(settings):
    from google import genai
    from google.genai import types

    return genai.Client(
        vertexai=True,
        project=settings.reasoning_project,
        location=settings.reasoning_location,
        http_options=types.HttpOptions(
            base_url=f"https://{settings.reasoning_location}-aiplatform.googleapis.com",
            timeout=int(settings.reasoning_timeout_seconds * 1000),
            retry_options=types.HttpRetryOptions(attempts=1),
        ),
    )


async def run_advisor(context, model, settings, *, llm=None):
    from google.adk.agents import LlmAgent
    from google.adk.agents.run_config import RunConfig
    from google.adk.models.google_llm import Gemini
    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai import types

    from domain.reasoning.models import Advice

    protect_sdk_telemetry()

    class WireAdvice(Advice):
        # ADK's function-schema converter cannot encode Literal[bool]. The strict
        # authority literals are still required by the host's validate_advice gate.
        human_approval_required: bool
        financial_authority: bool

    calls, reads = 0, 0
    input_tokens, output_tokens, usage_reports = 0, 0, 0
    response_shape = {}
    finish_reason = None
    client = None
    if llm is None:
        # Explicit normal ADC; no API keys, browser credentials or secret material in prompts.
        client = vertex_client(settings)

        class ScopedGemini(Gemini):
            @property
            def api_client(self):
                return client

        llm = ScopedGemini(model=model)

    def read_evidence() -> dict:
        """Read only the host-supplied synthetic stage evidence. No lookup or mutation."""
        nonlocal reads
        reads += 1
        if reads > 2:
            raise ValueError("Evidence tool budget exceeded")
        return context.model_dump(mode="json")

    def before_model(callback_context, llm_request):
        nonlocal calls
        calls += 1
        if calls > 2:
            raise ValueError("Model call budget exceeded")
        # ADK's generated response tool uses field annotations only, dropping Field
        # constraints. Send the full strict wire schema instead; never relax host validation.
        for tool in llm_request.config.tools or []:
            for declaration in tool.function_declarations or []:
                if declaration.name == "set_model_response":
                    declaration.parameters = None
                    declaration.parameters_json_schema = WireAdvice.model_json_schema()

    def after_model(callback_context, llm_response):
        nonlocal input_tokens, output_tokens, usage_reports, response_shape, finish_reason
        # Enum membership only: never forward arbitrary provider error messages/codes.
        known_reasons = {reason.value for reason in types.FinishReason}
        observed = llm_response.finish_reason or llm_response.error_code
        finish_reason = observed if observed in known_reasons else None
        usage = llm_response.usage_metadata
        if usage:
            usage_reports += 1
            input_tokens += usage.prompt_token_count or 0
            output_tokens += (usage.candidates_token_count or 0) + (usage.thoughts_token_count or 0)
        # Inspect in memory before ADK validates/saves the final result. Retain shape only.
        parts = llm_response.content.parts if llm_response.content else []
        for part in parts or []:
            if part.function_call and part.function_call.name == "set_model_response":
                response_shape = safe_shape(part.function_call.args)
        text = "".join(p.text for p in parts or [] if p.text and not p.thought)
        if text and len(text.encode()) <= 16000:
            try:
                response_shape = safe_shape(json.loads(text))
            except ValueError:
                response_shape = {"$": "invalid_json"}

    agent = LlmAgent(
        name=f"movebooks_{context.capability.value}_advisor",
        model=llm,
        instruction=instruction(context.capability.value),
        tools=[read_evidence],
        output_schema=WireAdvice,
        output_key="advice",
        disallow_transfer_to_parent=True,
        disallow_transfer_to_peers=True,
        before_model_callback=before_model,
        after_model_callback=after_model,
        generate_content_config=types.GenerateContentConfig(
            temperature=0,
            max_output_tokens=2048,
            thinking_config=types.ThinkingConfig(include_thoughts=False, thinking_budget=128),
        ),
    )
    sessions = InMemorySessionService()
    user_id, session_id = "synthetic-advisor", str(uuid4())
    await sessions.create_session(
        app_name="movebooks_reasoning", user_id=user_id, session_id=session_id
    )
    runner = Runner(app_name="movebooks_reasoning", agent=agent, session_service=sessions)
    try:
        message = types.Content(role="user", parts=[types.Part(text=context.model_dump_json())])
        async for _event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=message,
            run_config=RunConfig(max_llm_calls=2),
        ):
            pass
        session = await sessions.get_session(
            app_name="movebooks_reasoning", user_id=user_id, session_id=session_id
        )
        output = session.state.get("advice")
        if output is None:
            raise ProviderFailure(
                ProviderResult(
                    "",
                    calls,
                    reads,
                    input_tokens if usage_reports else None,
                    output_tokens if usage_reports else None,
                    validation_issues=[
                        {"path": "$", "rule": "missing", "reason": "No structured final output"}
                    ],
                    response_shape=response_shape or {"$": "missing"},
                    usage_status="partial" if usage_reports else "unknown",
                    finish_reason=finish_reason,
                ),
                "missing_output",
            )
        return ProviderResult(
            json.dumps(output) if isinstance(output, dict) else output,
            calls,
            reads,
            input_tokens if usage_reports else None,
            output_tokens if usage_reports else None,
            response_shape=response_shape,
            finish_reason=finish_reason,
            usage_status=(
                "complete" if usage_reports == calls else "partial" if usage_reports else "unknown"
            ),
        )
    except ValidationError as error:
        raise ProviderFailure(
            ProviderResult(
                "",
                calls,
                reads,
                input_tokens if usage_reports else None,
                output_tokens if usage_reports else None,
                validation_issues=safe_validation_issues(error),
                response_shape=response_shape,
                finish_reason=finish_reason,
                usage_status="partial" if usage_reports else "unknown",
            )
        ) from None
    finally:
        await sessions.delete_session(
            app_name="movebooks_reasoning", user_id=user_id, session_id=session_id
        )
        await runner.close()
        if client is not None:
            await client.aio.aclose()
            client.close()
