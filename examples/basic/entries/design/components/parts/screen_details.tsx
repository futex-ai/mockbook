import { MockLink } from "mokabook";

import { DetailsPanel } from "../../parts/details.js";
import { InstanceDetails } from "./instance_details.js";
import { welcomeInstances } from "./fixtures.js";
import type { ScreenPageState } from "./screen_preview.js";

function InstanceTree({ state }: { state: ScreenPageState }) {
  const nested = state === "nested";
  const toolbar = state === "toolbar-selection";
  const help = state === "help-selection";
  const actionCount = welcomeInstances.filter(
    (instance) => instance.component === "Action",
  ).length;
  return (
    <div className="ce-instance-tree" aria-label="Component instances">
      <details open={nested || toolbar}>
        <summary>
          Toolbar <span>1 instance</span>
        </summary>
        <MockLink
          to="design-component-inspection-toolbar"
          aria-current={toolbar ? "true" : undefined}
        >
          Main
        </MockLink>
        <div className="ce-nested-instance">
          <MockLink
            to="design-component-inspection-nested"
            aria-current={nested ? "true" : undefined}
          >
            Action · Toolbar action
          </MockLink>
        </div>
      </details>
      <details open>
        <summary>
          Action <span>{actionCount} instances</span>
        </summary>
        <MockLink
          to="design-component-inspection-nested"
          aria-current={nested ? "true" : undefined}
        >
          Toolbar action <small>Inside Main toolbar</small>
        </MockLink>
        <MockLink
          to="design-component-inspection-details"
          aria-current={!nested && !toolbar && !help ? "true" : undefined}
        >
          Footer action <small>Welcome</small>
        </MockLink>
      </details>
      <details open={help}>
        <summary>
          Help hint <span>1 instance</span>
        </summary>
        <MockLink
          to="design-component-inspection-help"
          aria-current={help ? "true" : undefined}
        >
          Help
        </MockLink>
        <p className="ce-muted">No visible region</p>
      </details>
    </div>
  );
}

export function ScreenDetails({ state }: { state: ScreenPageState }) {
  const unavailable = state === "unavailable";
  const empty = state === "empty";
  const consumer = state === "consumer";
  return (
    <DetailsPanel open>
      <div className="ce-screen-details">
        <section
          className="ce-usage-section"
          aria-label="Components in this view"
        >
          <h3>
            Components{" "}
            <span>
              {unavailable
                ? "Unavailable"
                : empty
                  ? "0"
                  : consumer
                    ? "1 instance"
                    : `${welcomeInstances.length} instances`}
            </span>
          </h3>
          {empty || unavailable ? (
            <p className="ce-empty-copy">
              {unavailable
                ? "Component inspection is unavailable for this screen."
                : "No registered components are used in this view."}
            </p>
          ) : consumer ? (
            <MockLink to="design-component-overview">
              Action · Continue ↗
            </MockLink>
          ) : (
            <InstanceTree state={state} />
          )}
        </section>
        {!empty && !unavailable ? (
          <InstanceDetails state={state} />
        ) : (
          <section>
            <h3>About this view</h3>
            <p>Reading room</p>
            <MockLink
              to={
                empty
                  ? "design-component-unavailable"
                  : "design-component-empty"
              }
            >
              {empty
                ? "View unavailable inspection"
                : "View an empty usage list"}
            </MockLink>
          </section>
        )}
      </div>
    </DetailsPanel>
  );
}
