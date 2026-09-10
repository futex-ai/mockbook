import { useDesignStyle } from "../style_context.js";
import { useId, type CSSProperties } from "react";
import {
  CloseInspectorIcon,
  InspectorIcon,
} from "../../components/parts/inspector_icons.js";
import { DesignLink } from "../../parts/design_navigation.js";
import { ChevronIcon } from "../../parts/icons.js";
import type { InspectorProps } from "./inspector.js";

export function InspectorView({
  tabs,
  initial,
  presentation,
  sheetSize,
  legacyBehavior,
  legacyDestination,
  ...content
}: InspectorProps) {
  useDesignStyle("inspector");
  const group = useId();
  const open = initial !== "closed";
  if (presentation === "legacy") {
    if (legacyBehavior === "native")
      return (
        <details className="mbk-details" open={open}>
          <summary className="mbk-details-bar">Details</summary>
          {content.info}
        </details>
      );
    if (legacyBehavior === "evidence")
      return (
        <section className="mbk-details">
          <div className="mbk-details-bar">Details</div>
          {content.info}
        </section>
      );
    return (
      <section className="mbk-details">
        <DesignLink to={legacyDestination}>
          <div className="mbk-details-bar">
            <span className={open ? "chev open" : "chev"} aria-hidden="true">
              <ChevronIcon size={12} />
            </span>
            Details
            <span className="mbk-details-hint">
              {open
                ? "Description, rationale, source, related docs, and use cases"
                : "Show context for this screen"}
            </span>
          </div>
        </DesignLink>
        {open ? content.info : null}
      </section>
    );
  }
  return (
    <section className="ce-inspector" aria-label="Inspector">
      <input
        type="checkbox"
        role="switch"
        className="ce-sheet-expand"
        aria-label="Expanded inspector"
        title="Expand or collapse inspector"
        defaultChecked={sheetSize === "expanded"}
      />
      {tabs.map((tab, index) => (
        <details
          key={tab.id}
          name={`component-inspector-${group}`}
          data-panel={tab.id}
          open={initial === tab.id}
          style={{ "--tab-column": index + 1 } as CSSProperties}
        >
          <summary role="button" aria-label={tab.label} title={tab.label}>
            <InspectorIcon tab={tab.id} />
            <span
              className="ce-inspector-close"
              data-inspector-close=""
              aria-hidden="true"
              title="Close inspector"
            >
              <CloseInspectorIcon />
            </span>
          </summary>
          <section className="ce-inspector-panel" aria-label={tab.label}>
            {content[tab.id]}
          </section>
        </details>
      ))}
    </section>
  );
}
