import type { ReactNode } from "react";

import { CompareGrid, MissingPane, Pane } from "../../parts/compare.js";
import type { ArtboardViewport } from "../../parts/shell.js";
import { toolbarPrompt } from "./fixtures.js";

/** The same synthetic Action is composed by component and consuming-screen designs. */
export function ActionExample({
  before = false,
  disabled = false,
  label = "Continue",
}: {
  before?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      className={`ce-action${before ? " ce-action--before" : ""}`}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

export function ToolbarExample() {
  return (
    <div className="ce-toolbar-example">
      <span>{toolbarPrompt}</span>
      <ActionExample />
    </div>
  );
}

/** Component canvases keep viewport context without phone or browser decoration. */
export function ComponentCanvas({
  children,
  viewport,
}: {
  children: ReactNode;
  viewport: ArtboardViewport;
}) {
  return (
    <section
      className={`ce-canvas ce-canvas--${viewport}`}
      aria-label={`${viewport === "mobile" ? "Mobile" : "Desktop"} component preview`}
    >
      <span className="ce-canvas-label">{viewport} · Light</span>
      <div className="ce-canvas-content">{children}</div>
    </section>
  );
}

export function ComponentComparison({
  removed = false,
  viewport,
}: {
  removed?: boolean;
  viewport: ArtboardViewport;
}) {
  return (
    <div className="ce-component-comparison">
      <p className="ce-caption">
        {removed
          ? "Compact variant removed"
          : "Default variant · Appearance changed"}
      </p>
      <CompareGrid>
        <Pane label="Before" side="before">
          <ComponentCanvas viewport={viewport}>
            <ActionExample before />
          </ComponentCanvas>
        </Pane>
        {removed ? (
          <MissingPane
            label="Current"
            side="after"
            message="This variant has been removed."
          />
        ) : (
          <Pane label="Current" side="after">
            <ComponentCanvas viewport={viewport}>
              <ActionExample />
            </ComponentCanvas>
          </Pane>
        )}
      </CompareGrid>
      <details className="ce-comparison-evidence">
        <summary>Comparison details</summary>
        <p>
          {removed
            ? "The saved Compact variant was removed. Default and Disabled are still available."
            : "The corners and spacing changed. The label and disabled value are unchanged."}
        </p>
      </details>
    </div>
  );
}
