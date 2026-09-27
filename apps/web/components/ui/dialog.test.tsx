import { fireEvent, render, screen, within } from "@testing-library/react";
import { useLayoutEffect, useRef, useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { Dialog } from "./dialog";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});
afterEach(() => vi.restoreAllMocks());

describe("Dialog lifecycle", () => {
  it("synchronizes native modal visibility before the committed open state can paint", () => {
    const observed = vi.fn();
    function Harness({ open }: { open: boolean }) {
      const host = useRef<HTMLDivElement>(null);
      // A layout observer sees the completed DOM commit, before passive effects.
      // The modal must already be open when its governed review state is shown.
      useLayoutEffect(() => {
        observed(host.current?.querySelector("dialog")?.open);
      }, [open]);
      return <div ref={host}><Dialog open={open} onClose={() => {}} title="Review proposed resolution">Evidence</Dialog></div>;
    }
    const { rerender } = render(<Harness open={false} />);
    expect(observed).toHaveBeenLastCalledWith(false);
    rerender(<Harness open />);
    expect(observed).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole("dialog", { name: "Review proposed resolution" })).toBeVisible();
    rerender(<Harness open={false} />);
    expect(observed).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("preserves focus wrapping, native Escape cancellation, and return to the opener", () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Review proposal</button><Dialog open={open} onClose={() => setOpen(false)} title="Review proposed resolution" description="Human approval required"><button>Reject and block</button><button>Approve resolution</button></Dialog></>;
    }
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "Review proposal" });
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole("dialog", { name: "Review proposed resolution" });
    expect(dialog).toHaveAccessibleDescription("Human approval required");
    const first = within(dialog).getByRole("button", { name: "Close dialog" });
    const last = within(dialog).getByRole("button", { name: "Approve resolution" });
    // jsdom has no layout; give the real focus-loop predicate visible controls.
    const rect = new DOMRect(0, 0, 100, 30);
    const rects = Object.assign([rect], { item: (index: number) => index === 0 ? rect : null });
    for (const button of within(dialog).getAllByRole("button")) {
      vi.spyOn(button, "getClientRects").mockReturnValue(rects);
    }
    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
    // Escape on a native dialog dispatches cancel (not a synthetic keydown).
    const cancel = new Event("cancel", { cancelable: true, bubbles: true });
    fireEvent(dialog, cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
