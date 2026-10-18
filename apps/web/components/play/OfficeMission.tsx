"use client";
import Link from "next/link";
import { useEffect, useReducer, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { initialPlayState, nearbyStation, playReducer, readyToCheck, stations, type Direction, type Mapping, type PlayAction, type Station } from "./engine";
import styles from "./OfficeMission.module.css";

const heroPixels = ["....hhhh....", "...hhhhhh...", "...hhsshh...", "...sesse....", "....ssss....", ".....ss.....", "...wwbwww...", "..swwbwws...", "..swwbwws...", "..swwbwws...", "...nnnnn....", "...nn.nn....", "...nn.nn....", "...nn.nn....", "..kk..kk....", "..kk..kk...."];
const palette: Record<string, string> = { h: "#422b25", s: "#e7b284", e: "#2b3238", w: "#f5e4c4", b: "#377c84", n: "#2e4355", k: "#182733" };
function Accountant({ partner = false }: { partner?: boolean }) {
  return <span className={styles.sprite} aria-hidden="true">{heroPixels.flatMap((row, y) => [...row].map((cell, x) => <i key={`${x}-${y}`} style={{ backgroundColor: partner && cell === "w" ? "#d3a45c" : palette[cell] ?? "transparent" }} />))}</span>;
}
function percent(n: number, dimension: number) { return `${100 * n / dimension}%`; }
function objectPosition(station: Station): CSSProperties {
  const s = stations[station];
  return { left: percent(s.x, 18), top: percent(s.y, 12), width: percent(s.width, 18), height: percent(s.height, 12) };
}
const stationCopy: Record<Station, { title: string; speaker: string }> = {
  desk: { title: "A letter on Eli’s desk", speaker: "Mara · bookkeeping partner" },
  ledger: { title: "The clearing ledger", speaker: "Eli · staff accountant" },
  cabinet: { title: "The settlement file", speaker: "Mara · bookkeeping partner" },
  laptop: { title: "A mapping worth checking", speaker: "Eli · staff accountant" },
};
export function OfficeMission() {
  const [state, dispatch] = useReducer(playReducer, undefined, initialPlayState);
  const [muted, setMuted] = useState(true);
  const scene = useRef<HTMLDivElement>(null);
  const documentHeading = useRef<HTMLHeadingElement>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const nearby = nearbyStation(state);
  const complete = state.outcome === "complete";
  useEffect(() => {
    if (state.active && !state.paused) documentHeading.current?.focus();
  }, [state.active, state.paused]);
  useEffect(() => {
    if (!state.started || state.paused) return;
    const suspend = () => { if (document.hidden) dispatch({ type: "pause" }); };
    document.addEventListener("visibilitychange", suspend);
    return () => document.removeEventListener("visibilitychange", suspend);
  }, [state.started, state.paused]);
  useEffect(() => () => { void audioContext.current?.close().catch(() => {}); }, []);
  function tone(force = false) {
    if ((muted && !force) || state.paused) return;
    try {
      const Audio = window.AudioContext;
      if (!Audio) return;
      const context = audioContext.current ?? new Audio();
      audioContext.current = context;
      void context.resume().catch(() => {});
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = 440;
      gain.gain.setValueAtTime(0.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + 0.12);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch { /* Optional audio never blocks gameplay. */ }
  }
  function act(action: PlayAction) {
    dispatch(action);
    if (action.type === "inspect" || action.type === "interact" || action.type === "check") tone();
    if (action.type === "start" || action.type === "close") scene.current?.focus();
  }
  function handleKey(event: KeyboardEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("input, select, textarea, a, button")) return;
    const key = event.key.toLowerCase();
    const directions: Record<string, Direction> = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right" };
    if (directions[key]) { event.preventDefault(); act({ type: "move", direction: directions[key] }); }
    else if (key === "e" || key === " ") { event.preventDefault(); act({ type: "interact" }); }
    else if (key === "p") { event.preventDefault(); act({ type: "pause" }); }
    else if (key === "escape") { event.preventDefault(); act({ type: state.active ? "close" : "pause" }); }
  }
  return <section className={styles.game} aria-label="The clearing question opening mission" onKeyDown={handleKey}>
    <header className={styles.toolbar}>
      <div><p className={styles.kicker}>Mission 01 · Harbor Light Books</p><h2>The clearing question</h2></div>
      <div className={styles.tools}><span className={styles.sample}>Sample books · practice only</span><button type="button" onClick={() => { if (muted) tone(true); else void audioContext.current?.suspend().catch(() => {}); setMuted(!muted); }} aria-pressed={!muted}>{muted ? "Sound: off" : "Sound: on"}</button><button type="button" disabled={!state.started} onClick={() => { act({ type: "pause" }); void audioContext.current?.suspend().catch(() => {}); }}>{state.paused ? "Resume" : "Pause"}</button></div>
    </header>
    <div className={styles.layout}>
      <div className={styles.worldColumn}>
        <div ref={scene} className={styles.world} tabIndex={0} role="group" aria-label={`Navigable office. Eli at column ${state.player.x}, row ${state.player.y}. ${nearby ? `${stations[nearby].name} nearby. Press E to inspect.` : "Walk with arrow keys or W A S D; press E to inspect a nearby object."}`} aria-describedby="play-controls">
          <div className={styles.backWall} aria-hidden="true"><span className={styles.window}><i /><i /><i /><i /></span><span className={styles.clock} /><span className={styles.wallSign}>HARBOR LIGHT<br /><b>BOOKKEEPING</b></span><span className={styles.picture} /></div>
          <div className={styles.rug} aria-hidden="true" /><div className={styles.plant} aria-hidden="true"><i /><i /><i /><b /></div><div className={styles.partner} aria-hidden="true"><Accountant partner /><span>Mara</span></div><div className={styles.door} aria-hidden="true"><span>EXIT</span></div>
          {(Object.keys(stations) as Station[]).map(station => <button key={station} type="button" tabIndex={-1} aria-label={`Inspect ${stations[station].name.toLowerCase()} in the office`} disabled={!state.started || state.paused} className={`${styles.object} ${styles[station]} ${nearby === station && !state.active ? styles.nearby : ""}`} style={objectPosition(station)} onClick={() => act({ type: "inspect", station })}><span className={styles.objectArt} aria-hidden="true">{station === "desk" ? <><i className={styles.paper} /><i className={styles.mug} /><i className={styles.lamp} /></> : station === "ledger" ? <><i className={styles.book} /><i className={styles.pencil} /></> : station === "cabinet" ? <><i /><i /><i /></> : <><i className={styles.screen} /><i className={styles.keyboard} /></>}</span><span className={styles.objectLabel}>{stations[station].name}{state.inspected.includes(station) ? " ✓" : ""}</span></button>)}
          <div className={styles.player} style={{ left: percent(state.player.x, 18), top: percent(state.player.y, 12) }} data-facing={state.facing} aria-hidden="true"><Accountant /><span>Eli</span></div>
          {!state.started && <div className={styles.sceneCaption}>A small office. One unresolved account.<br /><span>Your first migration starts here.</span></div>}
          {state.paused && <div className={styles.pauseOverlay}><p>Mission paused</p><span>Your evidence and position are saved for this visit.</span><button type="button" onClick={() => { act({ type: "pause" }); scene.current?.focus(); }}>Resume mission</button></div>}
        </div>
        <div className={styles.sceneFooter}><p id="play-controls"><kbd>↑ ↓ ← →</kbd> / <kbd>W A S D</kbd> Walk <span>·</span> <kbd>E</kbd> Inspect <span>·</span> <kbd>P</kbd> Pause</p><p>{state.started ? state.active ? "Reading evidence · close it to walk" : nearby ? `${stations[nearby].name} nearby · press E` : "Walk up to an object to investigate" : "Start the mission to explore"}</p></div>
        <div className={styles.touchControls} aria-label="Touch movement controls"><button type="button" aria-label="Walk up" disabled={!state.started || state.paused || !!state.active} onClick={() => act({ type: "move", direction: "up" })}>↑</button><div><button type="button" aria-label="Walk left" disabled={!state.started || state.paused || !!state.active} onClick={() => act({ type: "move", direction: "left" })}>←</button><button type="button" disabled={!state.started || state.paused || !!state.active} onClick={() => act({ type: "interact" })}>Inspect</button><button type="button" aria-label="Walk right" disabled={!state.started || state.paused || !!state.active} onClick={() => act({ type: "move", direction: "right" })}>→</button></div><button type="button" aria-label="Walk down" disabled={!state.started || state.paused || !!state.active} onClick={() => act({ type: "move", direction: "down" })}>↓</button></div>
        <details className={styles.shortcuts}><summary>Object shortcuts · keyboard, touch & screen reader</summary><p>Go straight to an object and inspect it. The evidence and puzzle are the same for every control.</p><div>{(Object.keys(stations) as Station[]).map(station => <button key={station} type="button" disabled={!state.started || state.paused} onClick={() => act({ type: "inspect", station })}>Inspect {stations[station].name.toLowerCase()}{state.inspected.includes(station) ? " · collected" : ""}</button>)}</div></details>
      </div>
      <aside className={styles.casePanel} aria-label="Mission notebook">
        {!state.started ? <><p className={styles.kicker}>Opening mission · about 4 minutes</p><h3>A fresh start for the books</h3><p>You’re Eli, the accountant at Harbor Light Books. The old bookkeeping system is getting harder to maintain. Before a move, you need to understand one account the import preview cannot explain.</p><blockquote>“We need dependable books for next month’s close. Check the records before we choose where anything goes.”<cite>Mara · bookkeeping partner</cite></blockquote><ol><li>Investigate the office.</li><li>Collect the accounting evidence.</li><li>Test your mapping for 1200 · Misc Clearing.</li></ol><button type="button" className={styles.primary} onClick={() => act({ type: "start" })}>Start mission</button></> : <>
          <div className={styles.progress}><span>Evidence collected</span><strong>{["desk", "ledger", "cabinet"].filter(s => state.inspected.includes(s as Station)).length} / 3</strong></div>
          <ul className={styles.evidenceList}>{(["desk", "ledger", "cabinet"] as Station[]).map(station => <li key={station}><span aria-hidden="true">{state.inspected.includes(station) ? "✓" : "○"}</span> {station === "desk" ? "Business reason" : station === "ledger" ? "Account activity" : "Settlement evidence"}<span className={styles.srOnly}>: {state.inspected.includes(station) ? "collected" : "missing"}</span></li>)}</ul>
          {state.active ? <article className={styles.document}><p className={styles.kicker}>{stationCopy[state.active].speaker}</p><h3 ref={documentHeading} tabIndex={-1}>{stationCopy[state.active].title}</h3>
            {state.active === "desk" && <><p>“Our legacy system’s maintenance support ends on 31 October. Last week’s bank export needed another manual repair. Let’s assess a move before the next close.”</p><div className={styles.evidenceCard}><strong>Engagement note · fictional scenario</strong><p>Harbor Light Books LLC · USD<br />Account 1200 · Misc Clearing<br />Type: Asset · ending debit $25.00</p></div><p>“An account name won’t tell us what’s inside. The ledger and settlement file should.”</p></>}
            {state.active === "ledger" && <><p>“These are customer card receipts passing through our payment processor. Sales were already recorded when the receipts arrived.”</p><table><caption>1200 · Misc Clearing · USD</caption><thead><tr><th>Activity</th><th>Debit</th><th>Credit</th></tr></thead><tbody><tr><td>Card receipts</td><td>500.00</td><td>—</td></tr><tr><td>Transfer to bank</td><td>—</td><td>475.00</td></tr><tr><th>Ending balance</th><td>25.00</td><td>—</td></tr></tbody></table><p className={styles.note}>Ledger ref: HL-1200. No opening balance or fees in this practice period.</p></>}
            {state.active === "cabinet" && <><p>“Here’s the processor’s settlement statement, filed with the bank receipt.”</p><dl className={styles.settlement}><div><dt>Card receipts received</dt><dd>$500.00</dd></div><div><dt>Settled into Operating Bank</dt><dd>$475.00</dd></div><div><dt>Pending next-day payout</dt><dd>$25.00</dd></div></dl><p>The bank receipt confirms $475.00 arrived. The processor still holds $25.00 for Harbor Light. It is an asset, but it is not yet bank cash.</p><p className={styles.note}>Evidence refs: SETTLE-01 · BANK-01</p></>}
            {state.active === "laptop" && <><p>The legacy import preview suggests <strong>Operating Bank</strong> for 1200 · Misc Clearing. Its name match has no settlement evidence.</p><p className={styles.note}>Scripted practice suggestion. No AI call or financial write.</p>{!readyToCheck(state) && <p className={styles.blocked}>Readiness locked. Collect all three evidence items before running the check.</p>}<form onSubmit={event => { event.preventDefault(); act({ type: "check" }); }}><fieldset disabled={state.paused || complete}><legend>Reconcile, then map</legend><label htmlFor="play-balance">Amount still held by the processor (USD)</label><input id="play-balance" inputMode="decimal" autoComplete="off" placeholder="0.00" value={state.balance} onChange={event => act({ type: "balance", balance: event.target.value })} /><label htmlFor="play-mapping">Destination for 1200 · Misc Clearing</label><select id="play-mapping" value={state.mapping} onChange={event => act({ type: "mapping", mapping: event.target.value as Mapping })}><option value="">Choose an account</option><option value="bank">Operating Bank · Bank asset</option><option value="clearing">Processor Clearing · Other Current Asset</option><option value="sales">Book Sales · Income</option></select><button type="submit" className={styles.primary} disabled={!readyToCheck(state)}>Run readiness check</button></fieldset></form>{complete && <div className={styles.success}><strong>Mission complete · Demo unlocked</strong><p>You kept $25.00 in an asset clearing account until payout. The bank stays at $475.00 and no sales are counted twice.</p><Link href="/simulator" className={styles.primary}>Explore Demo →</Link><p className={styles.note}>Continue into Understand → Prepare → Move → Verify → Start. This mission has not approved or migrated any books.</p></div>}</>}
            <button type="button" className={styles.back} disabled={state.paused} onClick={() => act({ type: "close" })}>Close evidence & return to office</button>
          </article> : <div className={styles.nextTask}><p className={styles.kicker}>{complete ? "A good place to start" : "Your next move"}</p><h3>{complete ? "You’ve earned a closer look" : "Investigate the office"}</h3><p>{complete ? "Reopen the laptop to explore the full migration demo, or revisit the evidence." : readyToCheck(state) ? "You have the evidence. Head to the laptop and test a mapping for 1200 · Misc Clearing." : "Start with the letter on the desk. Find the ledger and filing cabinet to understand what clearing actually holds."}</p>{complete && <Link href="/simulator" className={styles.primary}>Explore Demo →</Link>}</div>}
        </>}
        <div className={`${styles.dialogue} ${state.outcome === "failed" ? styles.failed : complete ? styles.passed : ""}`} role="status" aria-live="polite" aria-atomic="true"><span>{state.outcome === "failed" ? "Check failed · revise and retry" : complete ? "Readiness passed" : "Eli’s notebook"}</span><p>{state.message}</p></div>
        {state.started && <button type="button" className={styles.restart} onClick={() => act({ type: "restart" })}>Restart mission</button>}
      </aside>
    </div>
  </section>;
}
