"""Application service coordinating synthetic fixtures, agents, and persistence."""

from uuid import UUID

from agents.assessment import AssessmentAgent
from agents.discovery import DiscoveryAgent
from agents.mapping.specialists import records_for_area
from agents.orchestrator import PlanMapApproveOrchestrator
from domain.discovery_assessment.models import (
    DiscoveryResult,
    MigrationSession,
    ProductEvent,
    ProductEventName,
    ReadinessStatus,
    SessionStatus,
)
from domain.planning_mapping.models import (
    MappingArea,
    MappingDecision,
    MappingProposal,
    MigrationPlan,
    WorkflowStatus,
)
from tools.mapping import MappingPolicyError

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

    def create_session(self, owner_subject: str, sample_company_id: str) -> MigrationSession:
        fixture = load_sample_company(sample_company_id)
        if fixture is None:
            raise SampleCompanyNotFoundError(sample_company_id)
        session = MigrationSession(
            owner_subject=owner_subject,
            sample_company_id=sample_company_id,
            company_name=str(fixture["company"]["display_name"]),
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

    def discover(self, owner_subject: str, session_id: UUID) -> MigrationSession:
        session = self.get_session(owner_subject, session_id)
        fixture = load_sample_company(session.sample_company_id)
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
        return self.repository.put(session)

    def get_discovery(self, owner_subject: str, session_id: UUID) -> DiscoveryResult:
        session = self.get_session(owner_subject, session_id)
        if session.discovery is None:
            raise DiscoveryRequiredError("Discovery has not run for this session")
        return session.discovery

    def assess(self, owner_subject: str, session_id: UUID) -> MigrationSession:
        session = self.get_session(owner_subject, session_id)
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
        return self.repository.put(session)

    def plan(self, owner_subject: str, session_id: UUID) -> MigrationSession:
        session = self.get_session(owner_subject, session_id)
        if session.plan is not None:
            return session
        session = self.orchestrator.create_plan(session)
        return self.repository.put(session)

    def get_plan(self, owner_subject: str, session_id: UUID) -> MigrationPlan:
        session = self.get_session(owner_subject, session_id)
        if session.plan is None:
            raise DiscoveryRequiredError("Migration plan has not been generated")
        return session.plan

    def map(self, owner_subject: str, session_id: UUID) -> MigrationSession:
        session = self.get_session(owner_subject, session_id)
        if session.mappings:
            return session
        fixture = load_sample_company(session.sample_company_id)
        if fixture is None:
            raise SampleCompanyNotFoundError(session.sample_company_id)
        session = self.orchestrator.create_mappings(session, fixture)
        return self.repository.put(session)

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
        mapping = next((item for item in session.mappings if item.id == mapping_id), None)
        if mapping is None:
            raise MigrationSessionNotFoundError(str(mapping_id))
        fixture = load_sample_company(session.sample_company_id)
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
        return self.repository.put(session)

    def add_event(
        self,
        owner_subject: str,
        session_id: UUID,
        name: ProductEventName,
        attributes: dict[str, str | int | bool],
    ) -> ProductEvent:
        session = self.get_session(owner_subject, session_id)
        event = ProductEvent(
            migration_session_id=session.id,
            name=name,
            attributes=attributes,
        )
        session.events.append(event)
        self.repository.put(session)
        return event


session_repository = InMemoryMigrationSessionRepository()
discover_assess_service = DiscoverAssessService(session_repository)
