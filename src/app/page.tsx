"use client";
import { useEffect, useRef } from "react";
import useRightClick, { type RightClickContext } from "@/hooks/use-right-click";
import styles from "./style.module.css";

export default function Page(): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { context, close } = useRightClick({
    ref,
    onTrigger: (e) => {
      console.log("Context menu triggered:", e);
    },
  });

  // Close on outside click + ESC key
  useEffect(() => {
    if (!context) return;

    const handlePointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) close();
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [context, close]);

  return (
    // 面はページ全体。囲った枠の中だけで試させると、どこでも効くことが伝わらない
    <div className={styles.container} ref={ref}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.title}>use-right-click</h1>
          <p className={styles.description}>
            React hook for custom context menus with desktop right-click and
            mobile long-press support.
          </p>
          <div className={styles.install}>npm i use-right-click</div>
        </header>

        <div className={styles.hint}>
          <span className={styles.hintDot} />
          Right-click anywhere on this page — or long-press on a touch screen.
        </div>

        <h2 className={styles.sectionTitle}>Last trigger</h2>
        {context ? (
          <div className={styles.infoGrid}>
            <InfoItem label="clientX" value={context.clientX} />
            <InfoItem label="clientY" value={context.clientY} />
            <InfoItem label="type" value={context.type} />
            <InfoItem label="button" value={context.button} />
            <InfoItem
              label="target"
              value={context.target?.tagName.toLowerCase() ?? "null"}
            />
            <InfoItem label="modifiers" value={formatModifiers(context)} />
          </div>
        ) : (
          <p className={styles.infoEmpty}>
            Nothing yet. The event details land here.
          </p>
        )}

        <h2 className={styles.sectionTitle}>Usage</h2>
        <pre className={styles.codeBlock}>
          <code>{`import useRightClick from "use-right-click";

function MyComponent() {
  const ref = useRef<HTMLDivElement>(null);
  const { context, close } = useRightClick({
    ref,
    onTrigger: (e) => console.log(e),
    options: {
      threshold: 400,        // Long press duration (ms)
      cancelOnMovement: 25,  // Cancel if moved (px)
    },
  });

  return (
    <div ref={ref}>
      {context && (
        <Menu x={context.clientX} y={context.clientY} onClose={close} />
      )}
    </div>
  );
}`}</code>
        </pre>

        <footer className={styles.footer}>
          <a
            className={styles.footerLink}
            href="https://github.com/piro0919/use-right-click"
            rel="noopener noreferrer"
            target="_blank"
          >
            View on GitHub
          </a>
        </footer>
      </div>

      {context && (
        <ContextMenu context={context} onClose={close} ref={menuRef} />
      )}
    </div>
  );
}

function ContextMenu({
  context,
  onClose,
  ref,
}: {
  context: RightClickContext;
  onClose: () => void;
  ref: React.Ref<HTMLDivElement>;
}) {
  const handleAction = (action: string) => {
    console.log(`Action: ${action}`);
    onClose();
  };

  return (
    <div
      ref={ref}
      role="menu"
      className={styles.contextMenu}
      style={{
        left: context.clientX,
        top: context.clientY,
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={styles.menuItem}
        onClick={() => handleAction("copy")}
      >
        Copy
      </button>
      <button
        type="button"
        className={styles.menuItem}
        onClick={() => handleAction("cut")}
      >
        Cut
      </button>
      <button
        type="button"
        className={styles.menuItem}
        onClick={() => handleAction("paste")}
      >
        Paste
      </button>
      <div className={styles.menuDivider} />
      <button
        type="button"
        className={styles.menuItem}
        onClick={() => handleAction("delete")}
      >
        Delete
      </button>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.infoItem}>
      <div className={styles.infoLabel}>{label}</div>
      <div className={styles.infoValue}>{String(value)}</div>
    </div>
  );
}

function formatModifiers(context: RightClickContext): string {
  const mods: string[] = [];
  if (context.ctrlKey) mods.push("ctrl");
  if (context.altKey) mods.push("alt");
  if (context.shiftKey) mods.push("shift");
  if (context.metaKey) mods.push("meta");
  return mods.length > 0 ? mods.join("+") : "none";
}
