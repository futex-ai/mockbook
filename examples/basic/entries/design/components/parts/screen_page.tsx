import { MockLink } from "mokabook";

import { MissingPane, Pane, CompareGrid } from "../../parts/compare.js";
import { ScreenHead, type ArtboardViewport } from "../../parts/shell.js";
import { ViewControls } from "./view_controls.js";
import { PreviewWorkspace } from "./workspace.js";
import { SCREENS, screenIdentity } from "./metadata.js";
import { INSPECTION_PAGES } from "./destinations.js";
import { ExplorerShell } from "./navigation.js";
import { ScreenDetails } from "./screen_details.js";
import { screenComparison } from "./comparison_fixtures.js";
import { ConsumerFrame, type ScreenPageState } from "./screen_preview.js";

export function ScreenPage({
  state,
  viewport,
}: {
  state: ScreenPageState;
  viewport: ArtboardViewport;
}) {
  const removed = state === "removed-consumer";
  const comparison = screenComparison(state);
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
          comparisons={comparison !== undefined}
          status={comparison?.status ?? "unmodified"}
          action={
            <ViewControls
              viewport={viewport}
              highlight={{
                active: highlighting,
                unavailable: removed
                  ? "comparison"
                  : state === "unavailable" || state === "empty"
                    ? state
                    : undefined,
              }}
            />
          }
        />
        <PreviewWorkspace
          inspector={<ScreenDetails state={state} />}
          render={(previewViewport) =>
            removed ? (
              <div className="ce-removed-screen">
                <p>Screen removed</p>
                <CompareGrid>
                  <Pane side="before" label="Before">
                    <ConsumerFrame state={state} viewport={previewViewport} />
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
              <ConsumerFrame state={state} viewport={previewViewport} />
            )
          }
        />
      </ExplorerShell>
    </>
  );
}
