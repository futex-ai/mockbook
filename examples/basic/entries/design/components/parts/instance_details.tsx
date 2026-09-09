import { MockLink } from "mokabook";

import { PropValues } from "./prop_values.js";
import { toolbarPrompt } from "./fixtures.js";
import type { ScreenPageState } from "./screen_preview.js";

/** Selected instance data follows the component reached from the usage link. */
export function InstanceDetails({ state }: { state: ScreenPageState }) {
  const toolbar = state === "toolbar-selection";
  const help = state === "help-selection";
  const nested = state === "nested";
  const consumer = state === "consumer";
  const title = toolbar ? "Toolbar" : help ? "Help hint" : "Action";
  const label = toolbar
    ? "Main"
    : help
      ? "Help"
      : nested
        ? "Toolbar action"
        : consumer
          ? "Continue"
          : "Footer action";
  return (
    <section className="ce-selected-instance" aria-label="Selected instance">
      <h3>
        {title} <span>{label}</span>
      </h3>
      {toolbar || help ? (
        <dl className="ce-props" aria-label="Supplied props">
          <div>
            <dt>{toolbar ? "prompt" : "visible"}</dt>
            <dd>
              <code>{toolbar ? `"${toolbarPrompt}"` : "false"}</code>
            </dd>
          </div>
        </dl>
      ) : (
        <PropValues
          label={state === "direct-change" ? "Get started" : "Continue"}
        />
      )}
      {state === "direct-change" ? (
        <p className="ce-prop-change">
          <code>label</code> changed from <s>Continue</s> to Get started.
        </p>
      ) : null}
      <div className="ce-detail-links">
        <MockLink
          to={
            toolbar
              ? "design-component-toolbar"
              : help
                ? "design-component-help"
                : "design-component-overview"
          }
        >
          Open component ↗
        </MockLink>
        {toolbar || help || consumer ? (
          <button className="ce-text-button" type="button" disabled={help}>
            Highlight on screen
          </button>
        ) : (
          <MockLink
            to={
              nested
                ? "design-component-inspection-nested"
                : "design-component-inspection-highlight"
            }
          >
            Highlight on screen
          </MockLink>
        )}
      </div>
      {help ? <p className="ce-muted">No visible region</p> : null}
      <details className="ce-slot-details">
        <summary>Slots and ownership</summary>
        <p>
          Supplied by{" "}
          {nested ? "Main toolbar" : consumer ? "Details" : "Welcome"}. No slots
          supplied.
        </p>
      </details>
    </section>
  );
}
