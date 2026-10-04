/** fetch rejects with a TypeError when no HTTP response arrived. For a read that is harmless:
 *  nothing could have changed. For a request that changes something, the browser cannot tell
 *  "never sent" from "done, but the response was lost", so it must not promise that nothing
 *  changed. Any HTTP error still has a response and is handled by the caller. */
export async function reach(input: string, init: RequestInit | undefined, unreachable: string): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (caught) {
    if (caught instanceof TypeError) throw new Error(changes(init) ? UNCONFIRMED : unreachable);
    throw caught;
  }
}

/** True for any request that may change server state. */
export const changes = (init?: RequestInit) => (init?.method ?? "GET").toUpperCase() !== "GET";

export const UNCONFIRMED = "We couldn't confirm whether this step completed. Your request may have been received. Try again or check your migration status.";
export const ASSESSMENT_UNREACHABLE = "MoveBooks couldn't reach the assessment service. Your migration was not changed.";
export const INTAKE_UNREACHABLE = "MoveBooks couldn't reach the file-checking service. Nothing was imported or changed.";
