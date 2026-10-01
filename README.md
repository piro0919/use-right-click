# use-right-click

React hook for custom context menus with desktop right-click and mobile long-press support.

[Demo](https://use-right-click.kkweb.io/)

## Installation

```bash
npm install use-right-click
```

## Usage

Attach the `ref` to the element that should open the menu. The hook listens on
it directly; there is nothing to spread.

```tsx
import useRightClick from "use-right-click";
import { useRef } from "react";

function MyComponent() {
  const ref = useRef<HTMLDivElement>(null);
  const { context, close } = useRightClick({
    ref,
    onTrigger: (e) => console.log("Context menu triggered:", e),
  });

  return (
    <div ref={ref}>
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

`useRightClick` is also available as a named export.

## API

### `useRightClick(props): UseRightClickResult`

#### Props

| Property | Type | Description |
|----------|------|-------------|
| `ref` | `RefObject<HTMLElement \| null>` | The element that opens the menu |
| `onTrigger` | `(e: MouseEvent \| PointerEvent) => void` | Optional callback when the menu opens |
| `options` | `UseRightClickOptions` | Optional configuration |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `threshold` | `number` | `400` | Long press duration in milliseconds |
| `cancelOnMovement` | `number \| false` | `25` | Cancel the long press if the pointer moves more than this many pixels. `false` never cancels |
| `mouseLongPress` | `boolean` | `false` | Also open on a long press of the left mouse button. Off by default: holding the mouse button starts a drag or a text selection |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `context` | `RightClickContext \| null` | Current context menu state, `null` when closed |
| `close` | `() => void` | Close the context menu |

### `RightClickContext`

Contains event information when the menu opens:

- `clientX`, `clientY` - Viewport coordinates
- `pageX`, `pageY` - Page coordinates
- `screenX`, `screenY` - Screen coordinates
- `target` - The `Element` that was clicked or touched, SVG elements included
- `currentTarget` - The element the `ref` points at
- `altKey`, `ctrlKey`, `metaKey`, `shiftKey` - Modifier keys
- `button`, `buttons` - Mouse button info
- `type`, `timeStamp` - Event metadata
- `pointerType`, `pressure`, `width`, `height` - Pointer event info (long press only)

## Behavior

- **Right-click** opens the menu through the `contextmenu` event, and the
  browser's own menu is suppressed.
- **Long press** with touch or pen opens it after `threshold` ms, using Pointer
  Events. A mouse only does this with `mouseLongPress: true`.
- **The click that ends a long press is swallowed**, so lifting the finger does
  not also activate whatever is under it.
- **One gesture, one `onTrigger`.** Android Chrome fires its own `contextmenu`
  for a long press too. One that arrives within a second of a long press is
  treated as the same gesture; one that arrives before the long-press timer
  cancels it and opens the menu instead.

## Features

- No runtime dependencies
- Desktop right-click and touch/pen long-press
- Configurable long-press threshold and movement tolerance
- Full event context including position, modifiers, and pointer details
- TypeScript support with full type definitions

## License

MIT
