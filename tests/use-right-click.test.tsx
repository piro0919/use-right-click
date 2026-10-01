import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useRightClick, {
  type RightClickContext,
  type UseRightClickOptions,
} from "../src";

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

function Harness({
  onClick,
  onTrigger,
  options,
  store,
}: {
  onClick?: () => void;
  onTrigger?: (e: MouseEvent | PointerEvent) => void;
  options?: UseRightClickOptions;
  store: { latest: Snapshot };
}) {
  const ref = useRef<HTMLDivElement>(null);
  store.latest = useRightClick({ onTrigger, options, ref });
  return (
    <div data-testid="target" ref={ref}>
      <button data-testid="button" onClick={onClick} type="button">
        item
      </button>
      <svg aria-label="icon" role="img">
        <circle data-testid="circle" r="4" />
      </svg>
    </div>
  );
}

function pointerDown(el: Element, pointerType: string, button = 0): void {
  act(() => {
    el.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button,
        clientX: 10,
        clientY: 10,
        pointerType,
      }),
    );
  });
}

function contextMenu(el: Element): MouseEvent {
  const event = new MouseEvent("contextmenu", {
    bubbles: true,
    button: 2,
    cancelable: true,
  });
  act(() => {
    el.dispatchEvent(event);
  });
  return event;
}

function wait(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("long press by pointer type", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("ignores a held left mouse button by default", () => {
    vi.useFakeTimers();
    const store = captureState();
    const { getByTestId } = render(<Harness store={store} />);
    pointerDown(getByTestId("target"), "mouse");
    wait(1000);
    expect(store.latest.context).toBeNull();
  });

  it("opens on a held left mouse button with mouseLongPress", () => {
    vi.useFakeTimers();
    const store = captureState();
    const { getByTestId } = render(
      <Harness options={{ mouseLongPress: true }} store={store} />,
    );
    pointerDown(getByTestId("target"), "mouse");
    wait(500);
    expect(store.latest.context).toMatchObject({ pointerType: "mouse" });
  });

  it("never long-presses with another mouse button", () => {
    vi.useFakeTimers();
    const store = captureState();
    const { getByTestId } = render(
      <Harness options={{ mouseLongPress: true }} store={store} />,
    );
    pointerDown(getByTestId("target"), "mouse", 1);
    wait(1000);
    expect(store.latest.context).toBeNull();
  });

  it("opens on a pen long press", () => {
    vi.useFakeTimers();
    const store = captureState();
    const { getByTestId } = render(<Harness store={store} />);
    pointerDown(getByTestId("target"), "pen");
    wait(500);
    expect(store.latest.context).toMatchObject({ pointerType: "pen" });
  });
});

describe("after a long press", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("swallows the click that ends it, but not the next one", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    const store = captureState();
    const { getByTestId } = render(<Harness onClick={onClick} store={store} />);
    const button = getByTestId("button");
    pointerDown(button, "touch");
    wait(500);
    act(() => button.click());
    expect(onClick).not.toHaveBeenCalled();

    pointerDown(button, "touch");
    act(() => button.click());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("leaves a click alone when no long press happened", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    const store = captureState();
    const { getByTestId } = render(<Harness onClick={onClick} store={store} />);
    const button = getByTestId("button");
    pointerDown(button, "touch");
    wait(100);
    act(() => button.click());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not trigger twice when Android also fires contextmenu", () => {
    vi.useFakeTimers();
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const onTrigger = vi.fn();
    const store = captureState();
    const { getByTestId } = render(
      <Harness onTrigger={onTrigger} store={store} />,
    );
    const target = getByTestId("target");
    pointerDown(target, "touch");
    now = 400;
    wait(400);
    expect(onTrigger).toHaveBeenCalledTimes(1);

    now = 650;
    const echo = contextMenu(target);
    expect(onTrigger).toHaveBeenCalledTimes(1);
    // The platform menu stays suppressed.
    expect(echo.defaultPrevented).toBe(true);
  });

  it("still opens on a contextmenu well after the long press", () => {
    vi.useFakeTimers();
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const onTrigger = vi.fn();
    const store = captureState();
    const { getByTestId } = render(
      <Harness onTrigger={onTrigger} store={store} />,
    );
    const target = getByTestId("target");
    pointerDown(target, "touch");
    now = 400;
    wait(400);

    now = 5000;
    contextMenu(target);
    expect(onTrigger).toHaveBeenCalledTimes(2);
  });

  it("lets a native contextmenu that comes first cancel the pending long press", () => {
    vi.useFakeTimers();
    const onTrigger = vi.fn();
    const store = captureState();
    const { getByTestId } = render(
      <Harness
        onTrigger={onTrigger}
        options={{ threshold: 800 }}
        store={store}
      />,
    );
    const target = getByTestId("target");
    pointerDown(target, "touch");
    wait(500);
    contextMenu(target);
    wait(1000);
    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(store.latest.context).toMatchObject({ type: "contextmenu" });
  });
});

describe("targets", () => {
  it("keeps an SVG element as the target", () => {
    const store = captureState();
    const { getByTestId } = render(<Harness store={store} />);
    const circle = getByTestId("circle");
    contextMenu(circle);
    expect(store.latest.context?.target).toBe(circle);
    expect(store.latest.context?.currentTarget).toBe(getByTestId("target"));
  });
});
