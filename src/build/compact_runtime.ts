/** Worker transfer never includes unrelated rendered HTML or usage evidence. */
import type { ComponentRuntime } from "./component_runtime.js";

export function compactRuntime(runtime: ComponentRuntime): ComponentRuntime {
  if (runtime.manifest.schemaVersion === "live-index-1") return runtime;
  return {
    ...runtime,
    outputs: [],
    manifest: {
      ...runtime.manifest,
      schemaVersion: "live-index-1",
      entries: runtime.manifest.entries.map((entry) => {
        if (entry.kind === "screen") {
          const { componentViews: _usage, ...metadata } = entry;
          return metadata;
        }
        if (entry.kind === "component")
          return {
            ...entry,
            variants: entry.variants.map((variant) => ({
              ...variant,
              componentViews: [],
            })),
          };
        return entry;
      }),
    },
  };
}
