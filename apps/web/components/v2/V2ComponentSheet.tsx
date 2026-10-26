import { journeyStepFor } from "../journey/journey";
import { AiStatusBadge, GuideNote, MoneyFigure, NextStepPanel, PlannedExample, StatusChip } from "./primitives";
import { StageBar } from "./StageBar";
import { RecoveryNotice, StageHeader, WorkflowSummary } from "./Workflow";
import { Attribution } from "./Attribution";
import { v2Stages } from "./stages";
import { V2_STATUS_LABEL, V2_STATUS_RECOVERY, type V2MappingStatus } from "./mapping-status";

const STATES: V2MappingStatus[] = ["needs_review", "blocked", "rejected", "approved", "changed", "low_risk"];

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: "grid", gap: 16, paddingTop: 32, borderTop: "1px solid var(--v2-rule)" }}>
      <h2 style={{ margin: 0, fontSize: "1.375rem", lineHeight: 1.2 }}>{title}</h2>
      {children}
    </section>
  );
}

/**
 * Internal component sheet for the approved A+B design (Phase 1). Values shown are labelled samples for visual
 * review only; product screens read every value from the API (docs/v2/phase1/contract-reconciliation.md).
 */
export function V2ComponentSheet() {
  const preparing = v2Stages(journeyStepFor("MAPPING"), "MAPPING", "Now: map and approve") ?? [];
  const finished = v2Stages(journeyStepFor("VERIFIED_FIRST_PRODUCTIVE_USE"), "VERIFIED_FIRST_PRODUCTIVE_USE") ?? [];
  return (
    <div className="mb-v2" data-testid="v2-component-sheet">
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 32px 72px", display: "grid", gap: 32 }}>
        <header style={{ display: "grid", gap: 10, maxWidth: 760 }}>
          <p className="v2-quiet" style={{ margin: 0, fontSize: "0.9rem" }}>Internal · V2 component sheet · used by the product screens</p>
          <h1 style={{ margin: 0, fontSize: "2.25rem", lineHeight: 1.15, letterSpacing: "-0.015em" }}>Clear Ledger components with Companion guidance</h1>
          <p className="v2-ink-2" style={{ margin: 0 }}>Every amount and count below is a labelled sample for visual review. In the product each one is read from the API.</p>
        </header>

        <Group title="Stage bar">
          <StageBar stages={preparing} />
          <StageBar stages={finished} />
        </Group>

        <Group title="Mapping states and recovery">
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
            {STATES.map((state) => (
              <div key={state} className={`v2-card${state === "blocked" ? " v2-card-blocked" : ""}`} style={{ display: "grid", gap: 8, padding: 18, alignContent: "start" }}>
                <span><StatusChip status={state} /></span>
                <span className="v2-ink-2" style={{ fontSize: "0.95rem" }}><span className="sr-only">{V2_STATUS_LABEL[state]}: </span>{V2_STATUS_RECOVERY[state]}</span>
              </div>
            ))}
          </div>
        </Group>

        <Group title="Guide sentence and the one next step">
          <GuideNote>Your books passed the readiness check and the rules have proposed where every record goes. Before anything moves, two mappings need your judgement.</GuideNote>
          <NextStepPanel title="Review the 2 mappings that need you" action={<button type="button" className="v2-button v2-button-primary">Review mappings</button>}>
            <p className="v2-ink-2" style={{ margin: 0 }}>Sample counts. Then approve the low-risk mappings in one step; each is still recorded on its own.</p>
          </NextStepPanel>
        </Group>

        <Group title="Workflow screen: stage, done, waiting on you, next step, evidence, recovery">
          <StageHeader stage={2} step="migrate and resolve" title="Fix one paused batch" guide="One batch paused. Completed batches are kept; review the proposed fix before the batch runs again." />
          <WorkflowSummary
            recovery={<RecoveryNotice title="A batch paused" action={<button type="button" className="v2-button v2-button-secondary">Help with this step</button>}><p>Possible duplicate customer (sample). Nothing already moved is undone.</p></RecoveryNotice>}
            next={{ title: "Review the proposed fix", detail: "Approve or reject it. Retry the batch only after a decision.", action: <button type="button" className="v2-button v2-button-primary">Review the fix</button> }}
            done={["Understand and Prepare done", "7 of 8 batches moved (sample)"]}
            outstanding={[{ label: "1 proposed fix needs your decision", tone: "blocked" }]}
            evidence={{ href: "#", detail: "Every rule check and decision, with who made it and when." }} />
        </Group>

        <Group title="Attribution (one quiet line)">
          <Attribution />
          <p className="v2-ink-2" style={{ margin: 0 }}>Owner-approved technology attribution; it does not indicate that AI assistance is live.</p>
        </Group>

        <Group title="Money figures">
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
            <MoneyFigure strong label="First invoice (sample)" amount="107.25" currency="USD" caption="Posted and verified: 107.25 = 100.00 + 7.25 tax" />
            <MoneyFigure label="Trial balance difference (sample)" amount="0.00" currency="USD" caption="17 of 17 checks matched" />
            <MoneyFigure label="Missing from the API response" amount="" currency="USD" />
          </div>
        </Group>

        <Group title="Second opinions (planned)">
          <div className="v2-card v2-card-ai" style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.125rem" }}>Want a second opinion?</h3>
              <AiStatusBadge withDetail />
            </div>
            <p className="v2-ink-2" style={{ margin: 0 }}>When switched on, you can ask on request. Both read only this migration&apos;s records, can&apos;t change anything, and never decide for you.</p>
            <PlannedExample><strong>Advisor suggests: escalate.</strong> The match is below the confidence needed to approve without review.</PlannedExample>
          </div>
        </Group>

        <Group title="Actions">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <button type="button" className="v2-button v2-button-primary">Approve as Other current asset</button>
            <button type="button" className="v2-button v2-button-secondary">Change mapping</button>
            <button type="button" className="v2-button v2-button-quiet">Reject</button>
          </div>
          <p className="v2-ink-2" style={{ margin: 0 }}>You approve every change. Advice never changes your books.</p>
        </Group>
      </div>
    </div>
  );
}
