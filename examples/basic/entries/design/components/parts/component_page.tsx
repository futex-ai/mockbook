import type { ArtboardViewport } from "../../parts/shell.js";
import { CompareGrid, MissingPane, Pane } from "../../parts/compare.js";
import { actionVariants } from "./action_props.js";
import {
  ComponentDetails,
  type ComponentPageState,
} from "./component_details.js";
import { ComponentLayout } from "./component_layout.js";
import { componentComparison } from "./comparison_fixtures.js";
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
  const evidence = componentComparison(state);
  return (
    <ComponentLayout
      design={COMPONENT_PAGES[state]}
      identity={COMPONENT_BY_STATE[state]}
      comparison={comparison || state === "added"}
      status={evidence?.status ?? "unmodified"}
      scenario={
        state === "removed"
          ? "removed"
          : state === "added"
            ? "added"
            : evidence
              ? "component"
              : "all"
      }
      viewport={viewport}
      variants={<VariantPicker state={state} />}
      inspector={<ComponentDetails state={state} />}
    >
      {(previewViewport) =>
        state === "added" ? (
          <div className="ce-component-comparison">
            <CompareGrid>
              <MissingPane
                side="before"
                label="Before"
                message="This component did not exist before."
              />
              <Pane side="after" label="Current">
                <ComponentCanvas viewport={previewViewport}>
                  <span className="ce-badge">New</span>
                </ComponentCanvas>
              </Pane>
            </CompareGrid>
          </div>
        ) : comparison ? (
          <ComponentComparison
            removed={state === "removed"}
            viewport={previewViewport}
          />
        ) : (
          <ComponentCanvas viewport={previewViewport}>
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
                {...actionVariants[
                  state === "disabled" ? "disabled" : "default"
                ].props}
              />
            )}
          </ComponentCanvas>
        )
      }
    </ComponentLayout>
  );
}
