import { beforeEach, expect, it } from "vitest";
import { demoCreationKey, finishDemoCreation } from "./demo-creation";

beforeEach(() => sessionStorage.clear());

it("retains a creation key over errors and reloads, until success", () => {
  const path = "/onboarding-demo-sessions";
  const key = demoCreationKey(path, { scenario: "clean" });
  expect(demoCreationKey(path, { scenario: "clean" })).toBe(key);
  finishDemoCreation(path);
  expect(demoCreationKey(path, { scenario: "clean" })).not.toBe(key);
});

it("separates changed scenarios and endpoints", () => {
  const key = demoCreationKey("/validation-demo-sessions", { scenario: "clean" });
  expect(demoCreationKey("/validation-demo-sessions", { scenario: "ar_discrepancy" })).not.toBe(key);
  expect(demoCreationKey("/onboarding-demo-sessions", { scenario: "clean" })).not.toBe(key);
});

it("replaces malformed local intent", () => {
  sessionStorage.setItem("movebooks-demo-intent:/validation-demo-sessions", "broken");
  expect(demoCreationKey("/validation-demo-sessions", { scenario: "clean" })).toBeTruthy();
});
