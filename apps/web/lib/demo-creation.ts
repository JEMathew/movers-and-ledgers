/** A lost response/reload retains the intent; a successful load permits another new demo. */
export function demoCreationKey(path: string, body?: object): string {
  const slot = `movebooks-demo-intent:${path}`;
  const fingerprint = JSON.stringify(body ?? {});
  const saved = sessionStorage.getItem(slot);
  if (saved) {
    try {
      const prior = JSON.parse(saved);
      if (prior.fingerprint === fingerprint && typeof prior.key === "string") return prior.key;
    } catch { /* Invalid local intent starts a new creation. */ }
  }
  const key = crypto.randomUUID();
  sessionStorage.setItem(slot, JSON.stringify({ fingerprint, key }));
  return key;
}

export function finishDemoCreation(path: string) {
  sessionStorage.removeItem(`movebooks-demo-intent:${path}`);
}
