"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type BaseKeys =
  | "clientX"
  | "clientY"
  | "pageX"
  | "pageY"
  | "screenX"
  | "screenY"
  | "altKey"
  | "ctrlKey"
  | "metaKey"
  | "shiftKey"
  | "button"
  | "buttons"
  | "type"
  | "timeStamp";

type PointerKeys = "pointerType" | "pressure" | "width" | "height";

/**
 * Context information captured when the context menu is triggered.
 * Contains position, target element, modifier keys, and pointer details.
 */
export type RightClickContext = {
  /** The element that was clicked/touched. An `Element`, so SVG targets are kept. */
  target: Element | null;
  /** The element the handler is attached to */
  currentTarget: Element | null;
} & Pick<MouseEvent, BaseKeys> &
  Partial<Pick<PointerEvent, PointerKeys>>;

export type UseRightClickOptions = {
  /** Long press threshold in milliseconds. Default: 400 */
  threshold?: number;
  /** Cancel long press if pointer moves more than this many pixels. Default: 25. Set to `false` to disable. */
  cancelOnMovement?: number | false;
  /**
   * Also open on a long press of the left mouse button. Default: `false` — a
   * long press is a touch and pen gesture, and holding the mouse button is how a
   * drag or a text selection starts.
   */
  mouseLongPress?: boolean;
};

export type UseRightClickProps = {
  ref: RefObject<HTMLElement | null>;
  onTrigger?: (e: MouseEvent | PointerEvent) => void;
  options?: UseRightClickOptions;
};

export type UseRightClickResult = {
  /** Current context menu state. `null` when closed. */
  context: RightClickContext | null;
  /** Close the context menu */
  close: () => void;
};

function buildContext(
  e: MouseEvent | PointerEvent,
  target: EventTarget | null,
  currentTarget: EventTarget | null,
): RightClickContext {
  const isPointer =
    typeof PointerEvent !== "undefined" && e instanceof PointerEvent;
  return {
    clientX: e.clientX,
    clientY: e.clientY,
    pageX: e.pageX,
    pageY: e.pageY,
    screenX: e.screenX,
    screenY: e.screenY,
    target: target instanceof Element ? target : null,
    currentTarget: currentTarget instanceof Element ? currentTarget : null,
    altKey: e.altKey,
    ctrlKey: e.ctrlKey,
    metaKey: e.metaKey,
    shiftKey: e.shiftKey,
    button: e.button,
    buttons: e.buttons,
    type: e.type,
    timeStamp: e.timeStamp,
    pointerType: isPointer ? (e as PointerEvent).pointerType : undefined,
    pressure: isPointer ? (e as PointerEvent).pressure : undefined,
    width: isPointer ? (e as PointerEvent).width : undefined,
    height: isPointer ? (e as PointerEvent).height : undefined,
  };
}

const DEFAULT_OPTIONS: Required<UseRightClickOptions> = {
  threshold: 400,
  cancelOnMovement: 25,
  mouseLongPress: false,
};

/**
 * Android Chrome fires its own `contextmenu` for a long press, a little after ours
 * when `threshold` is shorter than the platform's. One arriving this soon after a
 * long press opened the menu is that echo, not a second request.
 */
const NATIVE_CONTEXTMENU_ECHO_MS = 1000;

export default function useRightClick({
  ref,
  onTrigger,
  options,
}: UseRightClickProps): UseRightClickResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { threshold, cancelOnMovement, mouseLongPress } = opts;

  const [context, setContext] = useState<RightClickContext | null>(null);
  const onTriggerRef = useRef(onTrigger);
  useEffect(() => {
    onTriggerRef.current = onTrigger;
  });

  const trigger = useCallback((e: MouseEvent | PointerEvent) => {
    setContext(buildContext(e, e.target, e.currentTarget));
    onTriggerRef.current?.(e);
  }, []);

  // Both gestures share state: the native contextmenu has to know whether a
  // long press just opened the menu, and cancel one that is still pending.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let startEvent: PointerEvent | null = null;
    let longPressedAt: null | number = null;
    let suppressClick = false;

    const clear = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      startEvent = null;
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      if (
        longPressedAt !== null &&
        performance.now() - longPressedAt < NATIVE_CONTEXTMENU_ECHO_MS
      ) {
        // The platform's own long-press menu, right after ours. Already handled.
        longPressedAt = null;
        return;
      }
      // A native long-press menu that came before our timer: let it stand in.
      clear();
      trigger(e);
    };

    const onPointerDown = (e: PointerEvent) => {
      clear();
      suppressClick = false;
      if (e.pointerType === "mouse" && (!mouseLongPress || e.button !== 0)) {
        return;
      }
      startEvent = e;
      timer = setTimeout(() => {
        if (startEvent) {
          longPressedAt = performance.now();
          suppressClick = true;
          // Don't preventDefault here — the synthetic event will be the original pointerdown.
          trigger(startEvent);
        }
        clear();
      }, threshold);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!startEvent || cancelOnMovement === false) return;
      const dx = e.clientX - startEvent.clientX;
      const dy = e.clientY - startEvent.clientY;
      if (dx * dx + dy * dy > cancelOnMovement * cancelOnMovement) clear();
    };

    // Releasing a long press also produces a click. It belongs to the gesture that
    // opened the menu, not to whatever sits under the finger.
    const onClick = (e: MouseEvent) => {
      if (!suppressClick) return;
      suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener("contextmenu", onContextMenu);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", clear);
    el.addEventListener("pointercancel", clear);
    el.addEventListener("pointerleave", clear);
    el.addEventListener("click", onClick, true);

    return () => {
      clear();
      el.removeEventListener("contextmenu", onContextMenu);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", clear);
      el.removeEventListener("pointercancel", clear);
      el.removeEventListener("pointerleave", clear);
      el.removeEventListener("click", onClick, true);
    };
  }, [ref, threshold, cancelOnMovement, mouseLongPress, trigger]);

  const close = useCallback(() => setContext(null), []);

  return { context, close };
}
