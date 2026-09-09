import { MockLink } from "mokabook";

import { MissingPane, Pane, CompareGrid } from "../../parts/compare.js";
import { ScreenHead, type ArtboardViewport } from "../../parts/shell.js";
import { Stage } from "../../parts/stage.js";
import { HighlightToggle, ViewControls } from "./controls.js";
import { SCREENS, screenIdentity } from "./metadata.js";
import { INSPECTION_PAGES } from "./destinations.js";
import { ExplorerShell } from "./navigation.js";
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
  const identity = screenIdentity(state);
  const { title, id } = SCREENS[identity];
  const highlighting = state === "highlight" || state === "nested";
  return (
    <>
      <ExplorerShell
        design={INSPECTION_PAGES[state]}
        active={identity}
        scenario={
          removed ? "removed" : state === "direct-change" ? "screen" : "all"
        }
        viewport={viewport}
      >
        <ScreenHead
          accessibleControls
          title={title}
          crumbs={["Example", "Screens"]}
          idChip={id}
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
    </>
  );
}
