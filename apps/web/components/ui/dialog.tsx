"use client";

import { X } from "lucide-react";
import { cloneElement, useId, useLayoutEffect, useRef } from "react";
import type { KeyboardEvent, ReactElement, ReactNode, RefObject } from "react";

import { IconButton } from "./primitives";

export function Dialog({ open, onClose, title, description, children, fallbackFocusRef }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; fallbackFocusRef?: RefObject<HTMLElement | null> }) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  // Native modal state and focus must match the committed review state before
  // paint; a passive effect leaves an open-requested dialog temporarily hidden.
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
      const opener = returnFocus.current;
      const target = opener?.isConnected && opener !== document.body && !opener.hasAttribute("disabled")
        ? opener : fallbackFocusRef?.current;
      target?.focus();
    }
  }, [open, fallbackFocusRef]);
  function retainKeyboardFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const elements = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])',
    )).filter(element => element.getClientRects().length > 0);
    const first = elements[0];
    const last = elements.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first?.focus();
    }
  }
  return <dialog ref={ref} className="dialog" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onKeyDown={retainKeyboardFocus} onCancel={(event) => {event.preventDefault(); onClose();}} onClose={onClose}><div className="flex items-start justify-between gap-4"><div><h2 id={titleId} className="type-section">{title}</h2>{description && <p id={descriptionId} className="mt-2 type-body-secondary">{description}</p>}</div><IconButton label="Close dialog" icon={X} variant="ghost" onClick={onClose}/></div><div className="mt-6">{children}</div></dialog>;
}

export function Tooltip({ label, children }: { label: string; children: ReactElement<{ "aria-describedby"?: string }> }) {
  const id = useId();
  return <span className="tooltip">{cloneElement(children, { "aria-describedby": id })}<span role="tooltip" id={id} className="tooltip-content">{label}</span></span>;
}
