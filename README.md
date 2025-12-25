# use-right-click

React hook for custom context menus with desktop right-click and mobile long-press support.

[Demo](https://use-right-click.kkweb.io/)

## Installation

```bash
npm install use-right-click
```

## Usage

```tsx
import useRightClick from "use-right-click";
import { useRef } from "react";

function MyComponent() {
  const ref = useRef<HTMLDivElement>(null);
  const { context, close, handlers } = useRightClick({
    ref,
    onTrigger: (e) => console.log("Context menu triggered:", e),
  });

  return (
    <div ref={ref} {...handlers()}>
      {context && (
        <div
          style={{
            position: "fixed",
            left: context.clientX,
            top: context.clientY,
          }}
        >
          <button onClick={close}>Close</button>
        </div>
      )}
    </div>
  );
}
```

## API

### `useRightClick(props): UseRightClickResult`

#### Props

| Property | Type | Description |
|----------|------|-------------|
| `ref` | `RefObject<HTMLElement \| null>` | Reference to the target element |
| `onTrigger` | `(e: MouseEvent \| PointerEvent) => void` | Optional callback when context menu is triggered |
| `options` | `UseRightClickOptions` | Optional configuration |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `threshold` | `number` | `400` | Long press duration in milliseconds |
| `cancelOnMovement` | `number \| boolean` | `25` | Cancel if finger moves more than this many pixels |
| `detect` | `LongPressEventType` | `"pointer"` | Event type to detect: `"mouse"`, `"touch"`, or `"pointer"` |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `context` | `RightClickContext \| null` | Current context menu state, `null` when closed |
| `close` | `() => void` | Function to close the context menu |
| `handlers` | `() => EventHandlers` | Spread on target element for long-press support |

### `RightClickContext`

Contains event information when context menu is triggered:

- `clientX`, `clientY` - Viewport coordinates
- `pageX`, `pageY` - Page coordinates
- `screenX`, `screenY` - Screen coordinates
- `target` - The element that was clicked/touched
- `currentTarget` - The element the handler is attached to
- `altKey`, `ctrlKey`, `metaKey`, `shiftKey` - Modifier keys
- `button`, `buttons` - Mouse button info
- `type`, `timeStamp` - Event metadata
- `pointerType`, `pressure`, `width`, `height` - Pointer event info (when available)

## Features

- Desktop right-click support via `contextmenu` event
- Mobile long-press support via `use-long-press`
- Configurable long-press threshold and movement tolerance
- Full event context including position, modifiers, and pointer details
- TypeScript support with full type definitions

## License

MIT
