import "@testing-library/jest-dom/vitest";

if (typeof globalThis.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    pressure: number;
    width: number;
    height: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? "";
      this.pressure = init.pressure ?? 0;
      this.width = init.width ?? 0;
      this.height = init.height ?? 0;
    }
  }
  // @ts-expect-error polyfill in test env
  globalThis.PointerEvent = PointerEventPolyfill;
}
