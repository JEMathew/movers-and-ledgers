"""Application service coordinating synthetic fixtures, agents, and persistence."""

from uuid import UUID

from agents.assessment import AssessmentAgent
from agents.discovery import DiscoveryAgent
from domain.discovery_assessment.models import (
    DiscoveryResult,
    MigrationSession,
    ProductEvent,
    ProductEventName,
    ReadinessStatus,
    SessionStatus,
)

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
