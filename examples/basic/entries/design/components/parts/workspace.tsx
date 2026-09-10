import type { ReactNode } from "react";
import { DesignInstances } from "../../library/composition.js";

import { NavResizeHandle } from "../../parts/nav_resize.js";
import type { ArtboardViewport } from "../../parts/shell.js";
import { Stage } from "../../parts/stage.js";

/** A bounded preview shares space with the desktop inspector or sits behind a mobile sheet. */
export function PreviewWorkspace({
  inspector,
  render,
}: {
  inspector: ReactNode;
  render: (viewport: ArtboardViewport) => ReactNode;
}) {
  return (
    <section className="ce-workspace" aria-label="Preview and inspector">
      <div className="ce-preview-region">
        <div
          className="ce-preview-sizer"
          aria-hidden="true"
          title="Resize inspector"
        />
        <div className="ce-preview-pane" aria-label="Preview pane">
          <Stage>
            <div className="ce-preview-set">
              {(["mobile", "desktop"] as const).map((viewport) => (
                <div
                  key={viewport}
                  className="ce-preview-view"
                  data-preview-viewport={viewport}
                >
                  <DesignInstances name={viewport}>
                    {render(viewport)}
                  </DesignInstances>
                </div>
              ))}
            </div>
          </Stage>
        </div>
        <div className="ce-inspector-resize" aria-hidden="true">
          <NavResizeHandle />
        </div>
      </div>
      <div className="ce-inspector-dock">{inspector}</div>
    </section>
  );
}
