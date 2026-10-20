"use client";

import { useEffect, useRef, useState } from "react";
import { authHeaders, cloudIdentity, prepareGoogleIdentity } from "./identity";

/** Read-only advisory POST lifecycle. Identity never grants financial authority. */
export function useAdvisoryRequest<T>(scope: string, unavailable: string) {
  const [result, setResult] = useState<T>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(() => !cloudIdentity());
  const active = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const isCurrent = useRef<() => boolean>(() => !cloudIdentity());
  const requestIds = useRef(new Map<string, string>());

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    let subject: string | null | undefined;
    isCurrent.current = () => !cloudIdentity();
    const clear = () => {
      revision.current += 1;
      active.current?.abort(); active.current = null;
      requestIds.current.clear();
      setResult(undefined); setError(""); setBusy(false);
    };
    clear();
    if (cloudIdentity()) {
      setReady(false);
      void prepareGoogleIdentity().then(runtime => {
        if (disposed) return;
        unsubscribe = runtime.subscribe(user => {
          if (disposed) return;
          const next = user?.uid ?? null;
          if (subject !== next) { clear(); subject = next; }
          isCurrent.current = () => next !== null && runtime.auth.currentUser?.uid === next;
          setReady(next !== null);
        });
      }).catch(() => {
        if (disposed) return;
        clear(); isCurrent.current = () => false;
        setReady(false); setError(unavailable);
      });
    } else setReady(true);
    return () => {
      disposed = true; unsubscribe?.();
      revision.current += 1; isCurrent.current = () => false;
      active.current?.abort(); active.current = null;
    };
  }, [scope, unavailable]);

  async function request(path: string, contextCurrent: () => boolean) {
    if (active.current || !isCurrent.current() || !contextCurrent()) return;
    const controller = new AbortController();
    active.current = controller;
    const started = revision.current;
    const current = () => revision.current === started && isCurrent.current() && contextCurrent();
    const requestId = requestIds.current.get(path) ?? crypto.randomUUID();
    requestIds.current.set(path, requestId);
    setBusy(true); setError(""); setResult(undefined);
    const deadline = window.setTimeout(() => controller.abort(), 75_000);
    try {
      const headers = await authHeaders();
      if (controller.signal.aborted || !current()) return;
      const response = await fetch(path, {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId }), signal: controller.signal,
      });
      if (!response.ok) throw new Error("unavailable");
      const value: T = await response.json();
      if (!controller.signal.aborted && current()) {
        setResult(value);
        // A later explicit request may concern changed evidence. Only uncertain
        // transport retries retain an ID; the server owns context deduplication.
        requestIds.current.delete(path);
      }
    } catch {
      if (current()) setError(unavailable);
    } finally {
      window.clearTimeout(deadline);
      if (active.current === controller) { active.current = null; setBusy(false); }
    }
  }
  return { result, busy, error, ready, request };
}
