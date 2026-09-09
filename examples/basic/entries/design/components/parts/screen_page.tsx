import { MockLink } from "mokabook";

import { MissingPane, Pane, CompareGrid } from "../../parts/compare.js";
import { ScreenHead, type ArtboardViewport } from "../../parts/shell.js";
import { Stage } from "../../parts/stage.js";
import { HighlightToggle, ViewControls } from "./controls.js";
import { DesignLinks, ExplorerShell } from "./navigation.js";
import { ScreenDetails } from "./screen_details.js";
import { ConsumerFrame, type ScreenPageState } from "./screen_preview.js";

export function ScreenPage({
  state,
  viewport,
}: {
  state: ScreenPageState;
  viewport: ArtboardViewport;
}) {
  const removed = state === "removed-consumer";
  const title =
    state === "empty" || state === "unavailable"
      ? "Reading room"
      : state === "consumer"
        ? "Details"
        : removed
          ? "Farewell"
          : "Welcome";
  const highlighting = state === "highlight" || state === "nested";
  return (
    <>
      <ExplorerShell
        active={title}
        scenario={
          removed ? "removed" : state === "direct-change" ? "screen" : "all"
        }
        viewport={viewport}
      >
        <ScreenHead
          accessibleControls
          title={title}
          crumbs={["Example", "Screens"]}
          idChip={`example-${title.toLowerCase().replace(" ", "-")}`}
          comparisonMode={removed ? "side-by-side" : "current"}
          action={<ViewControls viewport={viewport} />}
        />
        <div className="ce-inspection-toolbar">
          <HighlightToggle
            active={highlighting}
            unavailable={
              removed || state === "unavailable" || state === "empty"
            }
          />
          {highlighting ? (
            <span className="ce-muted">
              {state === "nested"
                ? "Action · Toolbar action"
                : "Select a component"}{" "}
              · Esc to exit
            </span>
          ) : null}
        </div>
        {state === "direct-change" ? (
          <div className="ce-change-context">
            Welcome’s action label changed.{" "}
            <MockLink to="design-component-affected">
              Action also changed ↗
            </MockLink>
          </div>
        ) : null}
        <Stage>
          {removed ? (
            <div className="ce-removed-screen">
              <p>Screen removed</p>
              <CompareGrid>
                <Pane side="before" label="Before">
                  <ConsumerFrame state={state} viewport={viewport} />
                </Pane>
                <MissingPane
                  side="after"
                  label="Current"
                  message="Farewell has been removed."
                />
              </CompareGrid>
              <MockLink to="design-component-removed">
                Back to Action’s affected screens
              </MockLink>
            </div>
          ) : (
            <ConsumerFrame state={state} viewport={viewport} />
          )}
        </Stage>
        {!removed ? <ScreenDetails state={state} /> : null}
      </ExplorerShell>
      <DesignLinks>
        <MockLink to="design-component-inspection-direct-change">
          Independent screen change
        </MockLink>
        <MockLink to="design-component-inspection-highlight">
          Highlight regions
        </MockLink>
        <MockLink to="design-component-inspection-nested">
          Nested selection
        </MockLink>
      </DesignLinks>
    </>
  );
}
