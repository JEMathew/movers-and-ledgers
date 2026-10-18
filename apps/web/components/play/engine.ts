/** Play-only fixture and reducer. No migration, identity, storage or API dependencies. */
export type Station = "desk" | "ledger" | "cabinet" | "laptop";
export type Direction = "up" | "down" | "left" | "right";
export type Mapping = "bank" | "clearing" | "sales";
export type Point = { x: number; y: number };
export const OFFICE = { width: 18, height: 12 };
export const stations: Record<Station, { name: string; x: number; y: number; width: number; height: number; approach: Point }> = {
  desk: { name: "Desk", x: 2, y: 3, width: 4, height: 2, approach: { x: 4, y: 5 } },
  ledger: { name: "Ledger", x: 8, y: 4, width: 2, height: 2, approach: { x: 8, y: 6 } },
  cabinet: { name: "Filing cabinet", x: 14, y: 2, width: 2, height: 3, approach: { x: 14, y: 5 } },
  laptop: { name: "Laptop", x: 12, y: 8, width: 3, height: 2, approach: { x: 13, y: 7 } },
};
export const evidenceStations: Station[] = ["desk", "ledger", "cabinet"];
export const receiptsCents = 50_000;
export const settledCents = 47_500;
export const pendingCents = receiptsCents - settledCents;
export type PlayState = {
  started: boolean; paused: boolean; player: Point; facing: Direction;
  inspected: Station[]; active: Station | null; mapping: Mapping | "";
  balance: string; attempts: number; outcome: "idle" | "failed" | "complete";
  message: string;
};
export function initialPlayState(): PlayState {
  return { started: false, paused: false, player: { x: 4, y: 9 }, facing: "up", inspected: [], active: null, mapping: "", balance: "", attempts: 0, outcome: "idle", message: "Eli: Before we move the books, I need to know what is still in clearing." };
}
export type PlayAction =
  | { type: "start" | "pause" | "close" | "interact" | "check" | "restart" }
  | { type: "move"; direction: Direction }
  | { type: "inspect"; station: Station }
  | { type: "mapping"; mapping: Mapping }
  | { type: "balance"; balance: string };
export function walkable(point: Point): boolean {
  return point.x > 0 && point.x < OFFICE.width - 1 && point.y > 1 && point.y < OFFICE.height - 1
    && !Object.values(stations).some(s => point.x >= s.x && point.x < s.x + s.width && point.y >= s.y && point.y < s.y + s.height)
    && !(point.x === 10 && point.y === 2);
}
function distance(point: Point, station: Station) {
  const s = stations[station];
  const dx = Math.max(s.x - point.x, 0, point.x - (s.x + s.width - 1));
  const dy = Math.max(s.y - point.y, 0, point.y - (s.y + s.height - 1));
  return dx + dy;
}
export function nearbyStation(state: PlayState): Station | undefined {
  return (Object.keys(stations) as Station[]).find(station => distance(state.player, station) <= 1);
}
export function readyToCheck(state: PlayState): boolean {
  return evidenceStations.every(station => state.inspected.includes(station));
}
function inspect(state: PlayState, station: Station, approach = false): PlayState {
  return { ...state, active: station, player: approach ? stations[station].approach : state.player,
    inspected: state.inspected.includes(station) ? state.inspected : [...state.inspected, station],
    message: station === "laptop" ? "Eli: The import preview suggests Bank. Let’s test it against the actual records." : `Evidence collected: ${stations[station].name}.` };
}
/** Parse USD as integer cents. Reject exponents, negatives and fractional cents. */
export function cents(value: string): number | null {
  const match = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(value.trim());
  return match ? Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0")) : null;
}
export function playReducer(state: PlayState, action: PlayAction): PlayState {
  if (action.type === "restart") return initialPlayState();
  if (action.type === "start") return { ...state, started: true };
  if (action.type === "pause") return state.started ? { ...state, paused: !state.paused } : state;
  if (!state.started || state.paused) return state;
  if (action.type === "close") return { ...state, active: null };
  if (action.type === "move") {
    if (state.active) return state;
    const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[action.direction];
    const next = { x: state.player.x + delta[0], y: state.player.y + delta[1] };
    return { ...state, facing: action.direction, player: walkable(next) ? next : state.player };
  }
  if (action.type === "interact") {
    const station = nearbyStation(state);
    return station ? inspect(state, station) : { ...state, message: "Eli: I need to stand next to a desk, ledger, cabinet or laptop. Or use the object shortcuts below." };
  }
  if (action.type === "inspect") return inspect(state, action.station, true);
  if (state.outcome === "complete") return state;
  if (action.type === "mapping") return { ...state, mapping: action.mapping, outcome: "idle" };
  if (action.type === "balance") return { ...state, balance: action.balance, outcome: "idle" };
  if (action.type === "check") {
    if (state.active !== "laptop") return state;
    if (!readyToCheck(state)) return { ...state, message: "Readiness blocked: collect the desk notice, ledger and settlement file before checking a mapping." };
    const amount = cents(state.balance);
    let message: string;
    if (amount === null) message = "Check failed: enter a USD amount with at most two decimal places, such as 10.50.";
    else if (amount !== pendingCents) message = "Balance check failed. Reconcile $500.00 in receipts with $475.00 already settled. What remains with the processor?";
    else if (!state.mapping) message = "Mapping check incomplete: select a destination account before running the check.";
    else if (state.mapping === "bank") message = "Bank reconciliation failed: $25.00 is still held by the processor. Mapping it to Operating Bank overstates cash by $25.00; it has not reached the bank.";
    else if (state.mapping === "sales") message = "Account-type check failed: the receipts already recorded sales. Mapping the remaining $25.00 to Book Sales would count revenue again. The source is an asset.";
    else return { ...state, attempts: state.attempts + 1, outcome: "complete", message: "Mission complete. $25.00 stays in Processor Clearing, an Other Current Asset, until settlement. Evidence and account meaning support the mapping. Explore Demo unlocked." };
    return { ...state, attempts: state.attempts + 1, outcome: "failed", message };
  }
  return state;
}
