"use client";
import useRightClick, { type RightClickContext } from "@/hooks/use-right-click";
import { useRef, useEffect, type RefObject } from "react";
import { useOnClickOutside } from "usehooks-ts";
import styles from "./style.module.css";

export default function Page(): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { context, close, handlers } = useRightClick({
    ref,
    onTrigger: (e) => {
      console.log("Context menu triggered:", e);
    },
  });

  useOnClickOutside(menuRef as RefObject<HTMLElement>, close);

  // Close on ESC key
  useEffect(() => {
    if (!context) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [context, close]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>use-right-click</h1>
        <p className={styles.description}>
          React hook for custom context menus with desktop right-click and
          mobile long-press support.
        </p>
      </header>

      <section className={styles.demoSection}>
        <h2 className={styles.sectionTitle}>Demo</h2>
        <div ref={ref} className={styles.demoArea} {...handlers()}>
          <p className={styles.demoHint}>
            Right-click here (desktop) or long-press (mobile)
          </p>
        </div>

        {context && (
          <ContextMenu ref={menuRef} context={context} onClose={close} />
        )}
      </section>

      <section className={styles.infoSection}>
        <h2 className={styles.sectionTitle}>Context Info</h2>
        <div className={styles.infoCard}>
          <div className={styles.infoTitle}>Last Trigger</div>
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
            <p style={{ color: "#888" }}>
              Trigger the context menu to see event details
            </p>
          )}
        </div>
      </section>

      <section className={styles.codeSection}>
        <h2 className={styles.sectionTitle}>Usage</h2>
        <pre className={styles.codeBlock}>
          <code>{`import useRightClick from "use-right-click";

function MyComponent() {
  const ref = useRef<HTMLDivElement>(null);
  const { context, close, handlers } = useRightClick({
    ref,
    onTrigger: (e) => console.log(e),
    options: {
      threshold: 400,        // Long press duration (ms)
      cancelOnMovement: 25,  // Cancel if moved (px)
    },
  });

  return (
    <div ref={ref} {...handlers()}>
      {context && (
        <Menu x={context.clientX} y={context.clientY} onClose={close} />
      )}
    </div>
  );
}`}</code>
        </pre>
      </section>

      <footer className={styles.footer}>
        <a
          href="https://github.com/piro0919/use-right-click"
          className={styles.footerLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </a>
      </footer>
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
      className={styles.contextMenu}
      style={{
        left: context.clientX,
        top: context.clientY,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button className={styles.menuItem} onClick={() => handleAction("copy")}>
        Copy
      </button>
      <button className={styles.menuItem} onClick={() => handleAction("cut")}>
        Cut
      </button>
      <button className={styles.menuItem} onClick={() => handleAction("paste")}>
        Paste
      </button>
      <div className={styles.menuDivider} />
      <button
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
