// Design contracts only. No collector, browser event submission, storage or
// measured values. Protected lifecycle/success events remain server-owned.
export const surfaceEvents = {
  landing_cta_clicked: { source: "landing", trigger: "Explicit primary or secondary CTA", owner: "Product", metric: "Unique eligible landing visits entering Product / eligible landing visits", fields: ["cta", "destination"] },
  core_product_entered: { source: "product", trigger: "Explicit entry to the governed workflow", owner: "Product", metric: "Eligible visits entering workflow / eligible Product visits", fields: ["entry_surface", "scenario"] },
  simulator_started: { source: "simulator", trigger: "Server confirms creation of a journey attributed to Simulator", owner: "Product", metric: "Eligible simulator journeys started / eligible simulator visits", fields: ["scenario", "journey_reference"] },
  simulator_completed: { source: "server", trigger: "Server verifies FPU for a Simulator-attributed journey, once", owner: "Migration", metric: "Verified eligible simulator journeys / eligible started journeys in matured cohort", fields: ["scenario", "journey_reference", "verification_reference"] },
  learn_topic_opened: { source: "learn", trigger: "User expands a topic", owner: "UX", metric: "Unique topic opens / eligible Learn visits; diagnostic only", fields: ["topic"] },
  play_started: { source: "play", trigger: "User starts the learning exercise", owner: "UX", metric: "Exercise starts / eligible Play visits", fields: ["scenario"] },
  play_completed: { source: "play", trigger: "All three teaching steps complete; not migration success", owner: "UX", metric: "Completed exercises / started exercises; comprehension unmeasured", fields: ["scenario", "exercise_version"] },
  trust_view_opened: { source: "trust", trigger: "Authorized evidence snapshot loads", owner: "Trust", metric: "Successful authorized reads / attempted authorized reads", fields: ["stage"] },
  feedback_submitted: { source: "future_intake_server", trigger: "Persisted accepted case only; never local draft preparation", owner: "Support", metric: "Accepted reports / eligible submission attempts", fields: ["category", "report_type", "case_reference"] },
  support_opened: { source: "support", trigger: "User opens a help topic", owner: "Support", metric: "Help visits by stage; not inferred issue resolution", fields: ["topic", "stage"] },
} as const;
