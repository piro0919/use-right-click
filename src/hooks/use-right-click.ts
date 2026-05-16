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
  /** The element that was clicked/touched */
  target: HTMLElement | null;
  /** The element the handler is attached to */
  currentTarget: HTMLElement | null;
} & Pick<MouseEvent, BaseKeys> &
  Partial<Pick<PointerEvent, PointerKeys>>;

export type UseRightClickOptions = {
  /** Long press threshold in milliseconds. Default: 400 */
  threshold?: number;
  /** Cancel long press if pointer moves more than this many pixels. Default: 25. Set to `false` to disable. */
  cancelOnMovement?: number | false;
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
    target: target instanceof HTMLElement ? target : null,
    currentTarget: currentTarget instanceof HTMLElement ? currentTarget : null,
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
};

export default function useRightClick({
  ref,
  onTrigger,
  options,
}: UseRightClickProps): UseRightClickResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { threshold, cancelOnMovement } = opts;

  const [context, setContext] = useState<RightClickContext | null>(null);
  const onTriggerRef = useRef(onTrigger);
  useEffect(() => {
    onTriggerRef.current = onTrigger;
  });

  const trigger = useCallback((e: MouseEvent | PointerEvent) => {
    setContext(buildContext(e, e.target, e.currentTarget));
    onTriggerRef.current?.(e);
  }, []);

  // Desktop: contextmenu
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handler = (e: MouseEvent) => {
      e.preventDefault();
      trigger(e);
    };

    el.addEventListener("contextmenu", handler);
    return () => el.removeEventListener("contextmenu", handler);
  }, [ref, trigger]);

  // Mobile / general pointer: long-press
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let startEvent: PointerEvent | null = null;

    const clear = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      startEvent = null;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      startEvent = e;
      timer = setTimeout(() => {
        if (startEvent) {
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

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", clear);
    el.addEventListener("pointercancel", clear);
    el.addEventListener("pointerleave", clear);

    return () => {
      clear();
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", clear);
      el.removeEventListener("pointercancel", clear);
      el.removeEventListener("pointerleave", clear);
    };
  }, [ref, threshold, cancelOnMovement, trigger]);

  const close = useCallback(() => setContext(null), []);

  return { context, close };
}
