"""Application service coordinating synthetic fixtures, agents, and persistence."""

from collections import Counter
from uuid import UUID

from agents.assessment import AssessmentAgent
from agents.discovery import DiscoveryAgent
from agents.mapping.specialists import records_for_area
from agents.orchestrator import MigrateResolveOrchestrator, PlanMapApproveOrchestrator
from domain.discovery_assessment.models import (
    DiscoveryResult,
    MigrationSession,
    ProductEvent,
    ProductEventName,
    ReadinessStatus,
    SessionStatus,
)
from domain.migration_resolution.models import (
    MigrationExecution,
    ResolutionDecision,
    ResolutionProposal,
)
from domain.planning_mapping.models import (
    MappingArea,
    MappingDecision,
    MappingProposal,
    MappingState,
    MigrationPlan,
    ReconsiderationRequest,
    ReconsiderationReview,
    WorkflowStatus,
)
from movebooks_api.runtime.persistence import session_repository as make_repository
from movebooks_api.settings import get_settings
from tools.mapping import MappingPolicyError, supported_targets
from tools.migration import stable_checksum

from .fixtures import load_sample_company
from .repository import InMemoryMigrationSessionRepository as InMemoryMigrationSessionRepository
from .repository import MigrationSessionRepository


def mapping_review(session: MigrationSession) -> dict[str, int] | None:
    """Authoritative mapping review counts, or None before mappings exist.

    Uses the plan-approval rule (mapping_ready_for_handoff): only APPROVED or MODIFIED
    mappings are reviewed; every other state is still pending.
    """
    if not session.mappings:
        return None
    reviewed = {MappingState.APPROVED, MappingState.MODIFIED}
    return {
        "total": len(session.mappings),
        "pending": sum(mapping.state not in reviewed for mapping in session.mappings),
    }


def journey_evidence(session: MigrationSession) -> dict:
    """What the shared journey needs beyond the workflow status. Every stage read carries the
    same evidence, so no page infers mapping or readiness state on its own."""
    return {
        "mapping_review": mapping_review(session),
        "readiness_blockers": session.assessment.blocker_count if session.assessment else 0,
    }


class MigrationSessionNotFoundError(LookupError):
    pass


class SampleCompanyNotFoundError(LookupError):
    pass


class DiscoveryRequiredError(RuntimeError):
    pass


class DiscoverAssessService:
    def __init__(self, repository: MigrationSessionRepository) -> None:
        self.repository = repository
        self.discovery_agent = DiscoveryAgent()
        self.assessment_agent = AssessmentAgent()
        self.orchestrator = PlanMapApproveOrchestrator()
        self.migration_orchestrator = MigrateResolveOrchestrator()

    def create_session(self, owner_subject: str, sample_company_id: str) -> MigrationSession:
        fixture = load_sample_company(sample_company_id)
        if fixture is None:
            raise SampleCompanyNotFoundError(sample_company_id)
        session = MigrationSession(
            owner_subject=owner_subject,
            sample_company_id=sample_company_id,
            company_name=str(fixture["company"]["display_name"]),
            source_checksum=stable_checksum(fixture["datasets"]),
        )
        session.events.append(
            ProductEvent(
                migration_session_id=session.id,
                name=ProductEventName.ASSESSMENT_STARTED,
                attributes={"sample_company_id": sample_company_id},
            )
        )
        return self.repository.put(session)

    def get_session(self, owner_subject: str, session_id: UUID) -> MigrationSession:
        session = self.repository.get(session_id, owner_subject)
        if session is None:
            raise MigrationSessionNotFoundError(str(session_id))
        return session

    @staticmethod
    def source_for(session: MigrationSession) -> dict | None:
        if session.source_kind == "user_upload":
            return session.uploaded_source
        return load_sample_company(session.sample_company_id)

    def discover(self, owner_subject: str, session_id: UUID) -> MigrationSession:
        session = self.get_session(owner_subject, session_id)
        if session.discovery is not None:
            return session
        original = session.model_copy(deep=True)
        fixture = self.source_for(session)
        if fixture is None:
            raise SampleCompanyNotFoundError(session.sample_company_id)
        session.events.append(
            ProductEvent(migration_session_id=session.id, name=ProductEventName.DISCOVERY_STARTED)
        )
        discovery, activity = self.discovery_agent.run(session.id, fixture)
        session.discovery = discovery
        session.activity.extend(activity)
        session.stage = "assess"
        session.status = SessionStatus.DISCOVERED
        session.workflow_status = WorkflowStatus.DISCOVERED
        session.events.append(
            ProductEvent(
                migration_session_id=session.id,
                name=ProductEventName.DISCOVERY_COMPLETED,
                attributes={"finding_count": len(discovery.findings)},
            )
        )
        session.events.extend(
            ProductEvent(
                migration_session_id=session.id,
                name=ProductEventName.FINDING_GENERATED,
                attributes={"finding_id": finding.id, "category": finding.category.value},
            )
            for finding in discovery.findings
        )
        return self.repository.put_if_unchanged(original, session)

    def get_discovery(self, owner_subject: str, session_id: UUID) -> DiscoveryResult:
        session = self.get_session(owner_subject, session_id)
        if session.discovery is None:
            raise DiscoveryRequiredError("Discovery has not run for this session")
        return session.discovery

    def assess(self, owner_subject: str, session_id: UUID) -> MigrationSession:
        session = self.get_session(owner_subject, session_id)
        if session.assessment is not None:
            return session
        original = session.model_copy(deep=True)
        if session.discovery is None:
            raise DiscoveryRequiredError("Run discovery before assessment")
        assessment, activity = self.assessment_agent.run(session.id, session.discovery)
        session.assessment = assessment
        session.activity.append(activity)
        session.stage = "assess"
        session.status = (
            SessionStatus.BLOCKED
            if assessment.readiness is ReadinessStatus.BLOCKED
            else SessionStatus.ASSESSED
        )
        session.workflow_status = WorkflowStatus.ASSESSED
        event_name = (
            ProductEventName.ASSESSMENT_BLOCKED
            if assessment.readiness is ReadinessStatus.BLOCKED
            else ProductEventName.ASSESSMENT_COMPLETED
        )
        session.events.append(
            ProductEvent(
                migration_session_id=session.id,
                name=event_name,
                attributes={
                    "readiness": assessment.readiness.value,
                    "blocker_count": assessment.blocker_count,
                    "warning_count": assessment.warning_count,
                },
            )
        )
        return self.repository.put_if_unchanged(original, session)

    def plan(self, owner_subject: str, session_id: UUID) -> MigrationSession:
        session = self.get_session(owner_subject, session_id)
        if session.plan is not None:
            return session
        original = session.model_copy(deep=True)
        session = self.orchestrator.create_plan(session, self.source_for(session))
        return self.repository.put_if_unchanged(original, session)

    def approve_plan(self, owner_subject: str, session_id: UUID, plan_id: UUID) -> MigrationSession:
        session = self.get_session(owner_subject, session_id)
        original = session.model_copy(deep=True)
        if session.plan is not None and session.plan.approval is None:
            from tools.mapping.controls import lookup_mapping_rule, validate_mapping_compatibility

            fixture = self.source_for(session)
            if fixture is None:
                raise SampleCompanyNotFoundError(session.sample_company_id)
            if session.source_checksum and session.source_checksum != stable_checksum(
                fixture["datasets"]
            ):
                raise MappingPolicyError("Source evidence changed; review a fresh assessment.")
            expected = Counter(
                (area, str(record.get("id") or record.get("key")))
                for area in MappingArea
                for record in records_for_area(fixture, area)
            )
            if expected != Counter((m.area, m.source_id) for m in session.mappings):
                raise MappingPolicyError("Every source object needs exactly one reviewed mapping.")
            for mapping in session.mappings:
                if mapping.decided_by != owner_subject or mapping.decided_at is None:
                    raise MappingPolicyError("Every mapping needs an authenticated owner decision.")
                source = next(
                    (
                        record
                        for record in records_for_area(fixture, mapping.area)
                        if str(record.get("id") or record.get("key")) == mapping.source_id
                    ),
                    None,
                )
                if source is None or validate_mapping_compatibility(mapping, source):
                    raise MappingPolicyError("Mapping evidence must pass deterministic checks.")
                if mapping.area in {
                    MappingArea.GENERAL_CONFIGURATION,
                    MappingArea.PRODUCTS_SERVICES,
                } and (
                    mapping.selected_target != lookup_mapping_rule(mapping.area, source)["target"]
                ):
                    raise MappingPolicyError(
                        "The synthetic adapter cannot apply a changed product or configuration "
                        "treatment. Review the supported scope before approving."
                    )
        session = self.orchestrator.approve_plan(session, owner_subject, plan_id)
        return self.repository.put_if_unchanged(original, session)

    def get_plan(self, owner_subject: str, session_id: UUID) -> MigrationPlan:
        session = self.get_session(owner_subject, session_id)
        if session.plan is None:
            raise DiscoveryRequiredError("Migration plan has not been generated")
        return session.plan

    def map(self, owner_subject: str, session_id: UUID) -> MigrationSession:
        session = self.get_session(owner_subject, session_id)
        if session.mappings:
            return session
        original = session.model_copy(deep=True)
        fixture = self.source_for(session)
        if fixture is None:
            raise SampleCompanyNotFoundError(session.sample_company_id)
        session = self.orchestrator.create_mappings(session, fixture)
        return self.repository.put_if_unchanged(original, session)

    def get_mappings(self, owner_subject: str, session_id: UUID) -> list[MappingProposal]:
        session = self.get_session(owner_subject, session_id)
        if not session.mappings:
            raise DiscoveryRequiredError("Mapping proposals have not been generated")
        return self.with_supported_targets(session).mappings

    def with_supported_targets(self, session: MigrationSession) -> MigrationSession:
        """A read-only response copy in which mappings stored before supported_targets
        existed carry targets derived with the same compatibility rules as fresh mappings.

        The stored session is never changed, so persisted mapping shapes and executed
        manifest checksums stay exactly as they were.
        """
        if all(mapping.supported_targets for mapping in session.mappings):
            return session
        fixture = self.source_for(session)
        if fixture is None:
            return session
        mappings = []
        for mapping in session.mappings:
            record = (
                None
                if mapping.supported_targets
                else next(
                    (
                        item
                        for item in records_for_area(fixture, MappingArea(mapping.area))
                        if str(item.get("id") or item.get("key")) == mapping.source_id
                    ),
                    None,
                )
            )
            mappings.append(
                mapping
                if record is None
                else mapping.model_copy(
                    update={"supported_targets": supported_targets(mapping, record)}
                )
            )
        return session.model_copy(update={"mappings": mappings})

    def decide_mapping(
        self,
        owner_subject: str,
        session_id: UUID,
        mapping_id: UUID,
        decision: MappingDecision,
    ) -> MigrationSession:
        session = self.get_session(owner_subject, session_id)
        original = session.model_copy(deep=True)
        mapping = next((item for item in session.mappings if item.id == mapping_id), None)
        if mapping is None:
            raise MigrationSessionNotFoundError(str(mapping_id))
        fixture = self.source_for(session)
        if fixture is None:
            raise SampleCompanyNotFoundError(session.sample_company_id)
        record = next(
            (
                item
                for item in records_for_area(fixture, MappingArea(mapping.area))
                if str(item.get("id") or item.get("key")) == mapping.source_id
            ),
            None,
        )
        if record is None:
            raise MappingPolicyError("Source record for this mapping is unavailable.")
        session = self.orchestrator.decide_mapping(
            session, mapping_id, decision, owner_subject, record
        )
        return self.repository.put_if_unchanged(original, session)

    def reconsider_mapping(
        self,
        owner_subject: str,
        session_id: UUID,
        mapping_id: UUID,
        request: ReconsiderationRequest | ReconsiderationReview,
        reconsideration_id: UUID | None = None,
    ) -> MigrationSession:
        from agents.orchestrator.mapping_reconsideration import (
            request_reconsideration,
            review_reconsideration,
        )

        session = self.get_session(owner_subject, session_id)
        original = session.model_copy(deep=True)
        mapping = next((m for m in session.mappings if m.id == mapping_id), None)
        if mapping is None:
            raise MigrationSessionNotFoundError(str(mapping_id))
        fixture = self.source_for(session)
        if fixture is None:
            raise SampleCompanyNotFoundError(session.sample_company_id)
        source = next(
            (r for r in records_for_area(fixture, mapping.area)
             if str(r.get("id") or r.get("key")) == mapping.source_id),
            None,
        )
        if source is None:
            raise MappingPolicyError("Source record for this mapping is unavailable.")
        if reconsideration_id is None:
            changed = request_reconsideration(session, mapping, request, owner_subject, source)
        else:
            changed = review_reconsideration(
                session, mapping, reconsideration_id, request,
                owner_subject, source, self.orchestrator,
            )
        return self.repository.put_if_unchanged(original, session) if changed else session

    def add_event(
        self,
        owner_subject: str,
        session_id: UUID,
        name: ProductEventName,
        attributes: dict[str, str | int | bool],
    ) -> ProductEvent:
        if name is not ProductEventName.CONTINUE_TO_PLAN_SELECTED:
            raise ValueError("Only customer navigation events may be submitted")
        session = self.get_session(owner_subject, session_id)
        original = session.model_copy(deep=True)
        event = ProductEvent(
            migration_session_id=session.id,
            name=name,
            attributes=attributes,
        )
        session.events.append(event)
        self.repository.put_if_unchanged(original, session)
        return event

    def create_migration_demo_session(self, owner_subject: str) -> MigrationSession:
        """Create a reviewed, synthetic manifest for the Migrate → Resolve demonstration."""
        session = self.create_session(owner_subject, "harbor-light-migrate-demo")
        session = self.discover(owner_subject, session.id)
        session = self.assess(owner_subject, session.id)
        session = self.plan(owner_subject, session.id)
        session = self.map(owner_subject, session.id)
        for mapping in list(session.mappings):
            session = self.decide_mapping(
                owner_subject,
                session.id,
                mapping.id,
                MappingDecision(
                    decision=MappingState.APPROVED,
                    comment="Reviewed synthetic demonstration manifest",
                ),
            )
        assert session.plan is not None
        return self.approve_plan(owner_subject, session.id, session.plan.id)

    def start_migration(
        self, owner_subject: str, session_id: UUID, idempotency_key: str
    ) -> MigrationSession:
        session = self.get_session(owner_subject, session_id)
        original = session.model_copy(deep=True)
        fixture = self.source_for(session)
        if fixture is None:
            raise SampleCompanyNotFoundError(session.sample_company_id)
        session = self.migration_orchestrator.start(session, fixture, idempotency_key)
        return self.repository.put_if_unchanged(original, session)

    def get_execution(self, owner_subject: str, session_id: UUID) -> MigrationExecution:
        session = self.get_session(owner_subject, session_id)
        if session.execution is None:
            raise DiscoveryRequiredError("Migration execution has not started")
        return session.execution

    def decide_resolution(
        self,
        owner_subject: str,
        session_id: UUID,
        resolution_id: UUID,
        decision: ResolutionDecision,
    ) -> MigrationSession:
        session = self.get_session(owner_subject, session_id)
        original = session.model_copy(deep=True)
        session = self.migration_orchestrator.decide_resolution(
            session, resolution_id, decision, owner_subject
        )
        return self.repository.put_if_unchanged(original, session)

    def get_resolutions(self, owner_subject: str, session_id: UUID) -> list[ResolutionProposal]:
        return self.get_execution(owner_subject, session_id).resolutions

    def retry_migration(self, owner_subject: str, session_id: UUID) -> MigrationSession:
        session = self.get_session(owner_subject, session_id)
        original = session.model_copy(deep=True)
        fixture = self.source_for(session)
        if fixture is None:
            raise SampleCompanyNotFoundError(session.sample_company_id)
        session = self.migration_orchestrator.retry(session, fixture)
        return self.repository.put_if_unchanged(original, session)


session_repository = make_repository(get_settings())
discover_assess_service = DiscoverAssessService(session_repository)
