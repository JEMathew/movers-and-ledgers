import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DiscoverAssessExperience } from "./DiscoverAssessExperience";

const HARBOR = "11111111-1111-4111-8111-111111111111";
const names: Record<string, string> = { "northstar-supplies": "Northstar Supplies", "harbor-light-migrate-demo": "Harbor Light Books" };
const discoveryFor = (sample: string) => ({ fixture_version: `${sample}-v1`, sample_company_id: sample, company_name: names[sample], synthetic: true, tools_called: [], profiles: [], findings: [] });
const assessment = { readiness: "READY", policy_version: "discover-assess-readiness-v1", blocker_count: 0, warning_count: 0, ready_areas: [], unresolved_areas: [], recommended_next_actions: [], decision_basis: [], target_assumptions: [], score: null };
const HARBOR_OUTCOME = "Harbor Light Books is ready to plan its migration.";
const NORTHSTAR_OUTCOME = "Northstar Supplies is ready to plan its migration.";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** A server that, like the API, creates at most one migration per creation key. It can commit a
 *  create and then lose the response, which is what the user sees as an unconfirmed start. */
function server({ dropFirstCreate }: { dropFirstCreate: boolean }) {
  const byKey = new Map<string, { id: string; sample: string }>();
  const samples = new Map<string, string>([[HARBOR, "harbor-light-migrate-demo"]]);
  const keys: string[] = [];
  let drop = dropFirstCreate;
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(String(input)).pathname.replace(/^\/v1/, "");
    if (path === "/migration-sessions" && init?.method === "POST") {
      const key = (init.headers as Record<string, string>)["Idempotency-Key"];
      const sample = JSON.parse(String(init.body)).sample_company_id as string;
      keys.push(key);
      // Without a key every request creates a new migration, as the API does.
      let session = key ? byKey.get(key) : undefined;
      if (!session) {
        session = { id: `00000000-0000-4000-8000-${String(samples.size).padStart(12, "0")}`, sample };
        byKey.set(key ?? session.id, session);
        samples.set(session.id, sample);
      }
      if (drop) { drop = false; throw new TypeError("Failed to fetch"); } // committed, response lost
      return json({ id: session.id }, 201);
    }
    const [, id, step] = path.match(/^\/migration-sessions\/([^/]+)\/?(.*)$/) ?? [];
    const sample = samples.get(id);
    if (!sample) return json({ detail: "Migration session not found" }, 404);
    if (step === "") return json({ id, sample_company_id: sample, workflow_status: "ASSESSED", discovery: discoveryFor(sample), assessment, activity: [] });
    if (step === "discovery") return json(discoveryFor(sample));
    if (step === "assessment") return json(assessment);
    if (step === "activity") return json([]);
    return json({}, 404);
  });
  return { fetch, keys, sessions: () => byKey.size };
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); sessionStorage.clear(); window.history.replaceState(null, "", "/"); });

describe("starting an assessment is idempotent", () => {
  it("recovers the Northstar migration after a lost create response, never Harbor", async () => {
    // Harbor is open from a deep link.
    sessionStorage.setItem("movebooks-migration-session", HARBOR);
    window.history.replaceState(null, "", `/assess?session=${HARBOR}`);
    const api = server({ dropFirstCreate: true });
    vi.stubGlobal("fetch", api.fetch);
    render(<DiscoverAssessExperience />);
    expect(await screen.findByText(HARBOR_OUTCOME)).toBeVisible();

    // The user starts Northstar; the server creates it but the response is lost.
    fireEvent.change(screen.getByRole("combobox", { name: "Sample business" }), { target: { value: "northstar-supplies" } });
    fireEvent.click(screen.getByRole("button", { name: /Start a New Assessment/ }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("We Couldn't Confirm This Step");
    expect(alert).not.toHaveTextContent(/not changed|Nothing was/);
    expect(api.sessions()).toBe(1);
    // Harbor is not shown or offered while the Northstar start is unconfirmed.
    expect(screen.queryByText(HARBOR_OUTCOME)).not.toBeInTheDocument();
    expect(window.location.search).toBe("");

    // Changing the selector afterwards does not change what Try Again continues.
    fireEvent.change(screen.getByRole("combobox", { name: "Sample business" }), { target: { value: "harbor-light-migrate-demo" } });
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(await screen.findByText(NORTHSTAR_OUTCOME)).toBeVisible();

    // The same key was replayed, the original Northstar migration was adopted, nothing was duplicated.
    expect(api.keys).toHaveLength(2);
    expect(api.keys[1]).toBe(api.keys[0]);
    expect(api.sessions()).toBe(1);
    const northstar = "00000000-0000-4000-8000-000000000001";
    expect(window.location.search).toBe(`?session=${northstar}`);
    expect(sessionStorage.getItem("movebooks-migration-session")).toBe(northstar);
    expect(screen.queryByText(HARBOR_OUTCOME)).not.toBeInTheDocument();
    const creates = api.fetch.mock.calls.filter(([url, init]) => init?.method === "POST" && String(url).endsWith("/v1/migration-sessions"));
    expect(creates.map(([, init]) => JSON.parse(String(init!.body)).sample_company_id)).toEqual(["northstar-supplies", "northstar-supplies"]);
  });

  it("recovers a fresh assessment the same way, with no orphan", async () => {
    window.history.replaceState(null, "", "/assess");
    const api = server({ dropFirstCreate: true });
    vi.stubGlobal("fetch", api.fetch);
    render(<DiscoverAssessExperience />);
    fireEvent.click(screen.getByRole("button", { name: /Check If My Books Are Ready to Migrate/ }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(await screen.findByText(NORTHSTAR_OUTCOME)).toBeVisible();
    expect(api.keys[1]).toBe(api.keys[0]);
    expect(api.sessions()).toBe(1);
  });

  it("uses a new key for each explicitly started assessment", async () => {
    window.history.replaceState(null, "", "/assess");
    const api = server({ dropFirstCreate: false });
    vi.stubGlobal("fetch", api.fetch);
    render(<DiscoverAssessExperience />);
    fireEvent.click(screen.getByRole("button", { name: /Check If My Books Are Ready to Migrate/ }));
    expect(await screen.findByText(NORTHSTAR_OUTCOME)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Start a New Assessment/ }));
    await screen.findByText(NORTHSTAR_OUTCOME);
    await vi.waitFor(() => expect(api.keys).toHaveLength(2));
    expect(api.keys[1]).not.toBe(api.keys[0]);
    expect(api.keys.every(key => /^[A-Za-z0-9._:-]{1,120}$/.test(key))).toBe(true);
    await vi.waitFor(() => expect(api.sessions()).toBe(2));
    // The key is a request detail only; it never appears on the page.
    expect(document.body).not.toHaveTextContent(api.keys[0]);
  });
});
