import { MockLink } from "mokabook";

import { ComponentInfo } from "./component_info.js";
import { UsedBy, AffectedScreens } from "./component_usage.js";
import { toolbarPrompt } from "./fixtures.js";
import { Inspector } from "./inspector.js";
import { CONTROLS_PAGES } from "./destinations.js";
import { COMPONENT_BY_STATE } from "./metadata.js";
import { ActionPropValues, actionVariants } from "./action_props.js";

export type ComponentPageState =
  | "default"
  | "disabled"
  | "comparison"
  | "affected"
  | "toolbar"
  | "hidden"
  | "unused"
  | "removed"
  | "closed";

export function ComponentChildren({ toolbar = false }: { toolbar?: boolean }) {
  return (
    <section>
      <h3>
        Components <span>{toolbar ? "1 instance" : "0"}</span>
      </h3>
      {toolbar ? (
        <>
          <MockLink to="design-component-overview">
            Action · Main action ↗
          </MockLink>
          <p className="ce-muted">1 instance · Default variant</p>
        </>
      ) : (
        <p className="ce-empty-copy">
          No registered components are used in this view.
        </p>
      )}
    </section>
  );
}

function ComponentProps({ state }: { state: ComponentPageState }) {
  return (
    <section>
      <h3>Supplied props</h3>
      {state === "toolbar" || state === "hidden" || state === "unused" ? (
        <dl className="ce-props" aria-label="Supplied props">
          <div>
            <dt>
              {state === "toolbar"
                ? "prompt"
                : state === "hidden"
                  ? "visible"
                  : "label"}
            </dt>
            <dd>
              <code>
                {state === "toolbar"
                  ? `"${toolbarPrompt}"`
                  : state === "hidden"
                    ? "false"
                    : '"New"'}
              </code>
            </dd>
          </div>
        </dl>
      ) : (
        <ActionPropValues
          props={
            actionVariants[state === "disabled" ? "disabled" : "default"].props
          }
        />
      )}
      {COMPONENT_BY_STATE[state] === "action" && state !== "removed" ? (
        <MockLink
          to={
            state === "disabled"
              ? CONTROLS_PAGES.variant
              : CONTROLS_PAGES.default
          }
        >
          Edit props ↗
        </MockLink>
      ) : null}
    </section>
  );
}

export function ComponentDetails({ state }: { state: ComponentPageState }) {
  const changed =
    state === "affected" || state === "comparison" || state === "removed";
  const initial =
    state === "closed"
      ? "closed"
      : changed || state === "unused"
        ? "usage"
        : state === "disabled" || state === "hidden"
          ? "props"
          : "info";
  return (
    <Inspector
      initial={initial}
      panels={[
        {
          id: "info",
          label: "Info",
          content: <ComponentInfo identity={COMPONENT_BY_STATE[state]} />,
        },
        {
          id: "components",
          label: "Components",
          content: <ComponentChildren toolbar={state === "toolbar"} />,
        },
        {
          id: "props",
          label: "Props",
          content: <ComponentProps state={state} />,
        },
        {
          id: "usage",
          label: "Usage",
          content: (
            <>
              <UsedBy state={state} />
              {changed ? (
                <AffectedScreens removed={state === "removed"} />
              ) : null}
            </>
          ),
        },
      ]}
    />
  );
}
