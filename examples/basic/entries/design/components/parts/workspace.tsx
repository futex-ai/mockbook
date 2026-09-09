import type { ReactNode } from "react";

import type { ArtboardViewport } from "../../parts/shell.js";
import { Stage } from "../../parts/stage.js";

/** Bounded sibling panes keep the title and inspector tabs out of scrolling content. */
export function PreviewWorkspace({
  inspector,
  render,
}: {
  inspector: ReactNode;
  render: (viewport: ArtboardViewport) => ReactNode;
}) {
  return (
    <section className="ce-workspace" aria-label="Preview and inspector">
      <div className="ce-preview-pane" aria-label="Preview pane">
        <Stage>
          <div className="ce-preview-set">
            {(["mobile", "desktop"] as const).map((viewport) => (
              <div
                key={viewport}
                className="ce-preview-view"
                data-preview-viewport={viewport}
              >
                {render(viewport)}
              </div>
            ))}
          </div>
        </Stage>
      </div>
      {inspector}
    </section>
  );
}
