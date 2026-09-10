import { useDesignStyle } from "../style_context.js";
import { useId } from "react";
import { ViewIcon } from "../../components/parts/view_icons.js";
import { SelectionControl } from "../../parts/selection_control.js";
import type { ViewControlsProps } from "./view-controls.js";

const reasons = {
  empty: "No registered components in this view",
  unavailable: "Component inspection is unavailable",
  comparison: "Highlighting is unavailable in comparisons",
} as const;
const viewportOptions = [
  ["mobile", "Mobile"],
  ["desktop", "Desktop"],
  ["both", "Both"],
] as const;
const schemeOptions = [
  ["light", "Light"],
  ["dark", "Dark"],
] as const;

export function ViewControlsView({
  selection,
  scheme,
  highlight,
  unavailable,
  presentation,
  accessible,
  destinations,
}: ViewControlsProps) {
  useDesignStyle("view-controls");
  const reasonId = useId();
  if (presentation !== "icons") {
    const schemeOnly = presentation === "scheme-segments";
    return (
      <span
        className="mbk-seg"
        role="group"
        aria-label={schemeOnly ? "Color scheme" : "Viewport"}
      >
        {schemeOnly
          ? schemeOptions.map(([key, label]) => (
              <SelectionControl
                key={key}
                active={key === scheme}
                accessible={accessible}
                label={label}
                to={key === scheme ? undefined : destinations[key]}
              />
            ))
          : viewportOptions.map(([key, label]) => (
              <SelectionControl
                key={key}
                active={key === selection}
                accessible={accessible}
                label={label}
              />
            ))}
      </span>
    );
  }
  const reason = unavailable ? reasons[unavailable] : undefined;
  return (
    <div
      className="ce-view-controls"
      role="toolbar"
      aria-label="Preview options"
    >
      <label
        className="ce-icon-control ce-viewport-control"
        title="Preview viewport"
      >
        <ViewIcon kind="mobile" />
        <ViewIcon kind="desktop" />
        <ViewIcon kind="both" />
        <ViewIcon kind="chevron" size={12} />
        <select
          className="ce-viewport-select"
          aria-label="Preview viewport"
          defaultValue={selection}
        >
          {viewportOptions.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label
        className="ce-icon-control ce-theme-control"
        title="Toggle light/dark mode"
      >
        <input
          type="checkbox"
          role="switch"
          className="ce-theme-toggle"
          aria-label="Dark mode"
          defaultChecked={scheme === "dark"}
        />
        <ViewIcon kind="light" />
        <ViewIcon kind="dark" />
      </label>
      {highlight === undefined ? null : (
        <label
          className="ce-icon-control ce-highlight-control"
          title={reason ?? "Highlight components"}
        >
          <input
            type="checkbox"
            role="switch"
            className="ce-highlight-toggle"
            aria-label="Highlight components"
            aria-describedby={reason ? reasonId : undefined}
            defaultChecked={highlight}
            disabled={reason !== undefined}
          />
          <ViewIcon kind="highlight" />
          {reason ? (
            <span id={reasonId} className="ce-control-description">
              {reason}
            </span>
          ) : null}
        </label>
      )}
    </div>
  );
}
