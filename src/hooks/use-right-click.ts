import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type RefObject,
} from "react";
import { useLongPress, LongPressEventType } from "use-long-press";

export { LongPressEventType };

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
  /** Cancel long press if finger moves more than this many pixels. Default: 25 */
  cancelOnMovement?: number | boolean;
  /** Detect long press on 'mouse' | 'touch' | 'pointer'. Default: 'pointer' (handles both mouse and touch) */
  detect?: LongPressEventType;
};

export type UseRightClickProps = {
  ref: RefObject<HTMLElement | null>;
  onTrigger?: (e: MouseEvent | PointerEvent) => void;
  options?: UseRightClickOptions;
};

export type UseRightClickResult = {
  /** Current context menu state. null when closed. */
  context: RightClickContext | null;
  /** Close the context menu */
  close: () => void;
  /** Spread on the target element to enable long-press triggering */
  handlers: ReturnType<typeof useLongPress>;
};

function buildContextFromNativeEvent(
  e: MouseEvent | PointerEvent,
  target: EventTarget | null,
  currentTarget: EventTarget | null
): RightClickContext {
  const isPointer = e instanceof PointerEvent;
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

    pointerType: isPointer ? e.pointerType : undefined,
    pressure: isPointer ? e.pressure : undefined,
    width: isPointer ? e.width : undefined,
    height: isPointer ? e.height : undefined,
  };
}

function firstTouchToMouseLikeEvent(
  e: TouchEvent,
  target: EventTarget | null,
  currentTarget: EventTarget | null
): RightClickContext {
  const t = e.changedTouches[0] ?? e.touches[0];
  // Build a minimal MouseEvent-like object from touch coordinates.
  // We keep modifiers and meta from the TouchEvent.
  const mouseLike = {
    clientX: t?.clientX ?? 0,
    clientY: t?.clientY ?? 0,
    pageX: t?.pageX ?? 0,
    pageY: t?.pageY ?? 0,
    screenX: t?.screenX ?? 0,
    screenY: t?.screenY ?? 0,
    altKey: e.altKey,
    ctrlKey: e.ctrlKey,
    metaKey: e.metaKey,
    shiftKey: e.shiftKey,
    button: 0,
    buttons: 1,
    type: e.type,
    timeStamp: e.timeStamp,
  } as unknown as MouseEvent;

  return buildContextFromNativeEvent(mouseLike, target, currentTarget);
}

const DEFAULT_OPTIONS: Required<UseRightClickOptions> = {
  threshold: 400,
  cancelOnMovement: 25,
  detect: LongPressEventType.Pointer,
};

export default function useRightClick({
  ref,
  onTrigger,
  options,
}: UseRightClickProps): UseRightClickResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [context, setContext] = useState<RightClickContext | null>(null);
  const onTriggerRef = useRef(onTrigger);
  useEffect(() => {
    onTriggerRef.current = onTrigger;
  });

  const bindLongPress = useLongPress(
    (event: React.MouseEvent | React.TouchEvent) => {
      // `use-long-press` can provide React SyntheticEvents. Use `nativeEvent`.
      const native = (event as any).nativeEvent as Event;

      if (native instanceof MouseEvent) {
        setContext(
          buildContextFromNativeEvent(
            native,
            native.target,
            native.currentTarget
          )
        );
        onTriggerRef.current?.(native);
        return;
      }

      if (native instanceof TouchEvent) {
        setContext(
          firstTouchToMouseLikeEvent(
            native,
            native.target,
            native.currentTarget
          )
        );
        // TouchEvent doesn't match MouseEvent|PointerEvent signature,
        // but we still want to notify the caller.
        // Cast to satisfy the type (coordinates are compatible).
        onTriggerRef.current?.(native as unknown as PointerEvent);
        return;
      }
    },
    {
      // Make sure we receive SyntheticEvents so we can access `nativeEvent`.
      captureEvent: true,
      threshold: opts.threshold,
      detect: opts.detect,
      // Avoid long-press via right mouse button
      filterEvents: (event) => {
        const e = (event as any).nativeEvent ?? event;
        return !(e instanceof MouseEvent && e.button === 2);
      },
      onStart: (event) => {
        // Prevent iOS native callout/context menu when possible.
        event.preventDefault?.();
      },
      cancelOnMovement: opts.cancelOnMovement,
    }
  );

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    const handler = (e: MouseEvent) => {
      e.preventDefault();

      setContext(buildContextFromNativeEvent(e, e.target, e.currentTarget));
      onTriggerRef.current?.(e);
    };

    el.addEventListener("contextmenu", handler);

    return () => el.removeEventListener("contextmenu", handler);
  }, [ref]);

  const close = useCallback(() => setContext(null), []);

  return { context, close, handlers: bindLongPress };
}
