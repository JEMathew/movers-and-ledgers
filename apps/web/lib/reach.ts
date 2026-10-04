/** fetch rejects with a TypeError only when no HTTP response arrived: the API was not running,
 *  the address was wrong, or the browser blocked the request. The request never reached the
 *  service, so nothing it would have changed was changed. Any HTTP error still has a response. */
export async function reach(input: string, init: RequestInit | undefined, unreachable: string): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (caught) {
    if (caught instanceof TypeError) throw new Error(unreachable);
    throw caught;
  }
}

export const ASSESSMENT_UNREACHABLE = "MoveBooks couldn't reach the assessment service. Your migration was not changed.";
export const INTAKE_UNREACHABLE = "MoveBooks couldn't reach the file-checking service. Nothing was imported or changed.";
