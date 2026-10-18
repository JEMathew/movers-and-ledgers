import { describe, expect, it } from "vitest";
import { cents, initialPlayState, nearbyStation, OFFICE, pendingCents, playReducer, readyToCheck, stations, walkable, type Direction, type PlayState, type Station } from "./engine";

function collect(): PlayState {
  let state = playReducer(initialPlayState(), { type: "start" });
  for (const station of ["desk", "ledger", "cabinet", "laptop"] as Station[]) state = playReducer(state, { type: "inspect", station });
  return state;
}
describe("Play office movement and evidence", () => {
  it("requires starting and pauses every game action without losing evidence or position", () => {
    const initial = initialPlayState();
    expect(playReducer(initial, { type: "inspect", station: "desk" })).toBe(initial);
    const gathered = collect();
    const paused = playReducer(gathered, { type: "pause" });
    for (const action of [{ type: "move", direction: "left" }, { type: "inspect", station: "desk" }, { type: "close" }, { type: "balance", balance: "25" }, { type: "check" }] as const) expect(playReducer(paused, action)).toBe(paused);
    expect(playReducer(paused, { type: "pause" })).toEqual(gathered);
  });
  it("blocks furniture and walls, requires proximity for E, and collects each item once", () => {
    let state = playReducer(initialPlayState(), { type: "start" });
    state = playReducer(state, { type: "interact" });
    expect(state.active).toBeNull();
    expect(state.inspected).toEqual([]);
    for (let step = 0; step < 4; step++) state = playReducer(state, { type: "move", direction: "up" });
    expect(state.player).toEqual({ x: 4, y: 5 });
    expect(nearbyStation(state)).toBe("desk");
    state = playReducer(state, { type: "move", direction: "up" });
    expect(state.player).toEqual({ x: 4, y: 5 });
    state = playReducer(state, { type: "interact" });
    expect(state.active).toBe("desk");
    const frozen = playReducer(state, { type: "move", direction: "down" });
    expect(frozen.player).toEqual(state.player);
    state = playReducer(playReducer(state, { type: "close" }), { type: "interact" });
    expect(state.inspected).toEqual(["desk"]);
    expect(walkable({ x: 0, y: 5 })).toBe(false);
    expect(walkable({ x: 4, y: 1 })).toBe(false);
  });
  it("every object is reachable from the starting position through real walkable tiles", () => {
    const queue = [initialPlayState().player];
    const visited = new Set<string>();
    const directions: Direction[] = ["up", "down", "left", "right"];
    while (queue.length) {
      const point = queue.shift()!;
      const key = `${point.x},${point.y}`;
      if (visited.has(key)) continue;
      visited.add(key);
      for (const direction of directions) {
        const state = { ...initialPlayState(), started: true, player: point };
        const next = playReducer(state, { type: "move", direction }).player;
        if (!visited.has(`${next.x},${next.y}`)) queue.push(next);
      }
      expect(visited.size).toBeLessThanOrEqual(OFFICE.width * OFFICE.height);
    }
    for (const object of Object.values(stations)) expect(visited.has(`${object.approach.x},${object.approach.y}`)).toBe(true);
  });
  it("shortcut and spatial inspection collect the same evidence", () => {
    for (const station of Object.keys(stations) as Station[]) {
      const state = { ...initialPlayState(), started: true, player: stations[station].approach };
      expect(playReducer(state, { type: "interact" })).toEqual(playReducer(state, { type: "inspect", station }));
    }
  });
});
describe("1200 mapping readiness puzzle", () => {
  it("blocks checking without evidence, even with the correct number and mapping", () => {
    let state = playReducer(initialPlayState(), { type: "start" });
    state = playReducer(state, { type: "inspect", station: "laptop" });
    state = playReducer(state, { type: "balance", balance: "25.00" });
    state = playReducer(state, { type: "mapping", mapping: "clearing" });
    state = playReducer(state, { type: "check" });
    expect(readyToCheck(state)).toBe(false);
    expect(state.outcome).toBe("idle");
    expect(state.message).toContain("Readiness blocked");
  });
  it("requires both the reconciled amount and the asset meaning; failures retain evidence", () => {
    let state = collect();
    state = playReducer(state, { type: "balance", balance: "500" });
    state = playReducer(state, { type: "mapping", mapping: "clearing" });
    state = playReducer(state, { type: "check" });
    expect(state.outcome).toBe("failed");
    expect(state.message).toContain("Balance check failed");
    state = playReducer(state, { type: "balance", balance: "25" });
    state = playReducer(state, { type: "mapping", mapping: "bank" });
    state = playReducer(state, { type: "check" });
    expect(state.outcome).toBe("failed");
    expect(state.message).toContain("overstates cash by $25.00");
    state = playReducer(state, { type: "mapping", mapping: "sales" });
    state = playReducer(state, { type: "check" });
    expect(state.message).toContain("count revenue again");
    state = playReducer(state, { type: "mapping", mapping: "clearing" });
    state = playReducer(state, { type: "check" });
    expect(state.outcome).toBe("complete");
    expect(state.attempts).toBe(4);
    expect(state.inspected).toEqual(["desk", "ledger", "cabinet", "laptop"]);
    expect(pendingCents).toBe(2500);
    expect(playReducer(state, { type: "check" })).toBe(state);
    expect(playReducer(state, { type: "balance", balance: "99" })).toBe(state);
    expect(playReducer(state, { type: "restart" })).toEqual(initialPlayState());
  });
  it.each(["25.001", "-25", "2.5e1", "", "NaN", "Infinity", "$25", "25,00"])("rejects malformed USD %s", value => {
    expect(cents(value)).toBeNull();
  });
  it("uses integer cents for accepted USD decimals", () => {
    expect(cents("25")).toBe(2500);
    expect(cents(" 25.00 ")).toBe(2500);
    expect(cents("0.01")).toBe(1);
  });
});
