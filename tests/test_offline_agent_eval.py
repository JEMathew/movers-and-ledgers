"""The offline Advisor/Reviewer evaluation must stay green: every scenario, no network."""

import offline_agent_eval


def test_offline_agent_evaluation_all_scenarios_pass():
    report = offline_agent_eval.run()
    failed = [r["scenario"] for r in report["results"] if not r["passed"]]
    assert not failed and report["total"] == 23 and report["model_calls_to_real_models"] == 0


def test_evaluation_harness_detects_a_wrong_expectation(monkeypatch):
    # Negative control: expecting an ungrounded output to be accepted must fail.
    monkeypatch.setattr(
        offline_agent_eval,
        "ADVISOR",
        {"control": (lambda d: d.update(evidence_references=["x"]), None, {"COMPLETED"})},
    )
    report = offline_agent_eval.run()
    assert {r["scenario"] for r in report["results"] if not r["passed"]} == {
        "planning:control",
        "mapping:control",
    }
