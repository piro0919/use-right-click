# Changelog

## Unreleased

### Changed

- **BREAKING:** a long press opens the menu for touch and pen only. A held left
  mouse button used to open it too, which got in the way of dragging and text
  selection. Set `mouseLongPress: true` to bring it back.
- **BREAKING (types):** `RightClickContext.target` and `currentTarget` are
  `Element | null` instead of `HTMLElement | null`. SVG targets used to come back
  as `null`; they are kept now. Code that reads HTML-only properties such as
  `dataset` needs a narrowing check.

### Fixed

- The click that ends a long press is swallowed, so lifting the finger no longer
  also activates the item under it.
- Android Chrome's own `contextmenu` right after a long press no longer calls
  `onTrigger` a second time. One that arrives before the long-press timer cancels
  the timer and opens the menu itself.
- The built files start with `"use client"`. The source had it, but esbuild drops
  in-file directives when bundling.
- `peerDependencies.react` is back to `>=18`. A Renovate range bump had raised it
  to `>=19.2.8` in 1.0.1, though the hook needs nothing newer than React 16.8 and
  the tests pass on React 18.
- The README described the 0.x API — `handlers()`, the `detect` option and the
  `use-long-press` dependency — all removed in 1.0.0. It now documents the real
  one.

### Added

- `mouseLongPress` option.
- `engines.node` (`>=18`) and an explicit `"type": "commonjs"`. CI checks the
  packed package with `publint --strict` and `attw` (`pnpm check:package`),
  checks that `dist` starts with `"use client"`, runs the tests on Node 22 and 24
  and on React 18, and checks the build loads on Node 18 and 20.

## 1.0.1

### Changed

- `author` and `funding` metadata, and development dependency updates.
  `peerDependencies.react` went out as `>=19.2.8` by mistake (see Unreleased).

## 1.0.0

### Changed

- **BREAKING:** long press is detected with Pointer Events inside the hook, and
  the `use-long-press` dependency is gone. The hook attaches its listeners
  through `ref`, so the `handlers` return value is removed — attach the `ref`
  and nothing else. `LongPressEventType` and the `detect` option are removed.
- `cancelOnMovement` takes `number | false`.

## 0.1.1

No notes were kept for this release.

## 0.1.0

Initial release: `useRightClick` with right-click and long-press (through
`use-long-press`).
