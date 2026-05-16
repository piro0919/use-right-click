import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import useRightClick, { type RightClickContext } from "../src";

type Snapshot = { context: RightClickContext | null; close: () => void };

function captureState(): { latest: Snapshot } {
  return { latest: { context: null, close: () => undefined } };
}

function Target({ store }: { store: { latest: Snapshot } }) {
  const ref = useRef<HTMLDivElement>(null);
  const result = useRightClick({ ref });
  store.latest = result;
  return <div ref={ref} data-testid="target" />;
}

describe("useRightClick", () => {
  it("opens context on right-click (contextmenu)", () => {
    const store = captureState();
    const { getByTestId } = render(<Target store={store} />);
    act(() => {
      getByTestId("target").dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          clientX: 50,
          clientY: 80,
          button: 2,
        }),
      );
    });
    expect(store.latest.context).toMatchObject({
      clientX: 50,
      clientY: 80,
      type: "contextmenu",
    });
  });

  it("close() clears context", () => {
    const store = captureState();
    const { getByTestId } = render(<Target store={store} />);
    act(() => {
      getByTestId("target").dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          clientX: 10,
          clientY: 10,
        }),
      );
    });
    expect(store.latest.context).not.toBeNull();
    act(() => store.latest.close());
    expect(store.latest.context).toBeNull();
  });

  it("opens context after long-press (pointer)", () => {
    vi.useFakeTimers();
    const store = captureState();
    const { getByTestId } = render(<Target store={store} />);
    act(() => {
      getByTestId("target").dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          clientX: 30,
          clientY: 30,
          pointerType: "touch",
          button: 0,
        }),
      );
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(store.latest.context).not.toBeNull();
    vi.useRealTimers();
  });

  it("cancels long-press when pointer moves beyond threshold", () => {
    vi.useFakeTimers();
    const store = captureState();
    const { getByTestId } = render(<Target store={store} />);
    const target = getByTestId("target");
    act(() => {
      target.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          clientX: 0,
          clientY: 0,
          pointerType: "touch",
        }),
      );
    });
    act(() => {
      target.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          clientX: 100,
          clientY: 100,
          pointerType: "touch",
        }),
      );
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(store.latest.context).toBeNull();
    vi.useRealTimers();
  });
});
