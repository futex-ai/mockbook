import { ScreenHead, type ArtboardViewport } from "../../parts/shell.js";
import { Stage } from "../../parts/stage.js";
import {
  ComponentDetails,
  type ComponentPageState,
} from "./component_details.js";
import { VariantPicker, ViewControls } from "./controls.js";
import { DesignLinks, ExplorerShell } from "./navigation.js";
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
  const title =
    state === "toolbar"
      ? "Toolbar"
      : state === "unused"
        ? "Badge"
        : state === "hidden"
          ? "Help hint"
          : "Action";
  return (
    <>
      <ExplorerShell
        active={title}
        scenario={
          state === "removed" ? "removed" : changed ? "component" : "all"
        }
        viewport={viewport}
      >
        <ScreenHead
          accessibleControls
          title={title}
          crumbs={["Example", "Components"]}
          idChip={title.toLowerCase().replace(" ", "-")}
          action={<ViewControls viewport={viewport} />}
          comparisonMode={comparison ? "side-by-side" : "current"}
        />
        <VariantPicker state={state} />
        <Stage>
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
                <ActionExample disabled={state === "disabled"} />
              )}
            </ComponentCanvas>
          )}
        </Stage>
        <ComponentDetails state={state} />
      </ExplorerShell>
      <DesignLinks />
    </>
  );
}
