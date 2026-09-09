import type { ArtboardViewport } from "../../parts/shell.js";
import { actionVariants } from "./action_props.js";
import {
  ComponentDetails,
  type ComponentPageState,
} from "./component_details.js";
import { ComponentLayout } from "./component_layout.js";
import { VariantPicker } from "./controls.js";
import { COMPONENT_PAGES } from "./destinations.js";
import { COMPONENT_BY_STATE } from "./metadata.js";
import {
  ActionExample,
  ComponentCanvas,
  ComponentComparison,
  ToolbarExample,
} from "./preview.js";

/** Shared component-page composition; each owning screen exports both artboards. */
export function ComponentPage({
  state,
  viewport,
}: {
  state: ComponentPageState;
  viewport: ArtboardViewport;
}) {
  const comparison = state === "comparison" || state === "removed";
  const changed = comparison || state === "affected";
  return (
    <ComponentLayout
      design={COMPONENT_PAGES[state]}
      identity={COMPONENT_BY_STATE[state]}
      comparison={comparison}
      scenario={state === "removed" ? "removed" : changed ? "component" : "all"}
      viewport={viewport}
      variants={<VariantPicker state={state} />}
      inspector={<ComponentDetails state={state} />}
    >
      {comparison ? (
        <ComponentComparison
          removed={state === "removed"}
          viewport={viewport}
        />
      ) : (
        <ComponentCanvas viewport={viewport}>
          {state === "toolbar" ? (
            <ToolbarExample />
          ) : state === "hidden" ? (
            <p className="ce-empty-copy">
              This variant has no visible content.
            </p>
          ) : state === "unused" ? (
            <span className="ce-badge">New</span>
          ) : (
            <ActionExample
              {...actionVariants[state === "disabled" ? "disabled" : "default"]
                .props}
            />
          )}
        </ComponentCanvas>
      )}
    </ComponentLayout>
  );
}
