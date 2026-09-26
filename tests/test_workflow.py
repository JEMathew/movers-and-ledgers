import pytest

from agents.contracts import LifecycleStage, WorkflowState
from agents.orchestrator.workflow import MigrationWorkflow, PolicyStop


def test_consequential_stage_needs_approval() -> None:
    state = WorkflowState(stage=LifecycleStage.PLAN)
    with pytest.raises(PolicyStop, match="human approval"):
        MigrationWorkflow().next_stage(state)


def test_approved_transition_is_versioned() -> None:
    state = WorkflowState(stage=LifecycleStage.PLAN)
    updated = MigrationWorkflow().next_stage(state, approved=True)
    assert updated.stage is LifecycleStage.MAP_APPROVE
    assert updated.revision == 2


def test_blocking_issues_prevent_migration() -> None:
    state = WorkflowState(stage=LifecycleStage.MAP_APPROVE, open_issues=["currency mismatch"])
    with pytest.raises(PolicyStop, match="blocking issues"):
        MigrationWorkflow().next_stage(state, approved=True)

