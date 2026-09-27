"""Application service coordinating synthetic fixtures, agents, and persistence."""

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
    WorkflowStatus,
)
from tools.mapping import MappingPolicyError
from tools.migration import stable_checksum

from .fixtures import load_sample_company
from .repository import InMemoryMigrationSessionRepository, MigrationSessionRepository


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
        session = self.orchestrator.create_plan(session)
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
        return session.mappings

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
        return session

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


session_repository = InMemoryMigrationSessionRepository()
discover_assess_service = DiscoverAssessService(session_repository)
