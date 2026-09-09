import type { CSSProperties, ReactNode } from "react";

import {
  CloseInspectorIcon,
  InspectorIcon,
  type InspectorTab,
} from "./inspector_icons.js";

export interface InspectorPanel {
  id: InspectorTab;
  label: string;
  content: ReactNode;
}

/** Exclusive native disclosures keep icon panels usable in script-disabled frames. */
export function Inspector({
  panels,
  initial = "info",
}: {
  panels: readonly InspectorPanel[];
  initial?: InspectorTab | "closed";
}) {
  return (
    <section className="ce-inspector" aria-label="Inspector">
      <input
        type="checkbox"
        role="switch"
        className="ce-sheet-expand"
        aria-label="Expanded inspector"
        title="Expand or collapse inspector"
      />
      {panels.map((panel, index) => (
        <details
          key={panel.id}
          name="component-inspector"
          data-panel={panel.id}
          open={initial === panel.id}
          style={{ "--tab-column": index + 1 } as CSSProperties}
        >
          <summary role="button" aria-label={panel.label} title={panel.label}>
            <InspectorIcon tab={panel.id} />
            <span
              className="ce-inspector-close"
              data-inspector-close=""
              aria-hidden="true"
              title="Close inspector"
            >
              <CloseInspectorIcon />
            </span>
          </summary>
          <section className="ce-inspector-panel" aria-label={panel.label}>
            {panel.content}
          </section>
        </details>
      ))}
    </section>
  );
}
