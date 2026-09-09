import type { ReactNode } from "react";

import type { ReviewState } from "./review.js";

interface CompareToolbarProps {
  accessible?: boolean | undefined;
  mode: "current" | "difference" | "overlay" | "side-by-side";
}

const MODE_LABELS: readonly {
  key: CompareToolbarProps["mode"];
  label: string;
}[] = [
  { key: "current", label: "Current" },
  { key: "side-by-side", label: "Side by side" },
  { key: "overlay", label: "Overlay" },
  { key: "difference", label: "Difference" },
];

/** Compact display options inside the normal screen. */
export function CompareToolbar({
  mode,
  accessible = false,
}: CompareToolbarProps) {
  const Control = accessible ? "button" : "span";
  return (
    <div className="mbk-cmp-toolbar">
      <span className="mbk-seg" role="group" aria-label="Comparison mode">
        {MODE_LABELS.map((option) => (
          <Control
            key={option.key}
            type={accessible ? "button" : undefined}
            aria-pressed={accessible ? option.key === mode : undefined}
            className={option.key === mode ? "active" : undefined}
          >
            {option.label}
          </Control>
        ))}
      </span>
      {mode !== "current" ? (
        <span className="mbk-cmp-refresh" aria-label="Refresh comparison">
          ↻
        </span>
      ) : null}
    </div>
  );
}

const STATE_LABELS: Record<ReviewState, string> = {
  added: "New screen",
  changed: "Screen changed",
  "ignored-only": "Only excluded content changed",
  removed: "Screen removed",
  unchanged: "No changes to this screen",
};

/** Comparison status and secondary evidence share the scrollable screen stage. */
export function ComparisonStage({
  children,
  evidence,
  state,
  viewport,
}: {
  children: ReactNode;
  evidence?: ReactNode;
  state: ReviewState;
  viewport: "mobile" | "desktop";
}) {
  return (
    <section className="mbk-comparison-stage">
      <h3>
        {viewport === "mobile" ? "Mobile" : "Desktop"} · {STATE_LABELS[state]}
      </h3>
      {children}
      <details className="mbk-comparison-details" open={evidence !== undefined}>
        <summary>Comparison details</summary>
        <p>Compared with the branch point on origin/main.</p>
        {evidence}
      </details>
    </section>
  );
}

/** The before/current comparison grid on the dotted stage. */
export function CompareGrid({
  children,
  difference,
}: {
  children: ReactNode;
  difference?: boolean;
}) {
  return (
    <div
      className="mbk-compare"
      data-compare-mode={difference ? "difference" : "side"}
    >
      {children}
    </div>
  );
}

interface PaneProps {
  children: ReactNode;
  label: string;
  side: "after" | "before";
}

/** One labeled before or current comparison pane. */
export function Pane({ children, label, side }: PaneProps) {
  return (
    <div className={`mbk-compare-side mbk-compare-side--${side}`}>
      <p className="mbk-compare-label">{label}</p>
      {children}
    </div>
  );
}

/** Explicit absence of a screen on one side. */
export function MissingPane({
  label,
  message,
  side,
}: {
  label: string;
  message: string;
  side: "after" | "before";
}) {
  return (
    <Pane label={label} side={side}>
      <div className="mbk-pane-missing">{message}</div>
    </Pane>
  );
}
