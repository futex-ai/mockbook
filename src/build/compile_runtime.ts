/** Exhaustively compile the accepted graph with the ordinary Build pipeline. */
import type { ComponentRuntime } from "./component_runtime.js";
import { compileCatalogue, type Compilation } from "./compile.js";
import { evaluateBundle, rememberBundle } from "./consumer_bundle.js";

export async function compileRuntime(
  runtime: ComponentRuntime,
  checkpoint: () => Promise<void>,
): Promise<Compilation> {
  const graph = {
    ...evaluateBundle(runtime.bundle),
    entrySources: runtime.bundle.entrySources,
    sourceFiles: runtime.config.sourceFiles ?? [],
  };
  rememberBundle(graph, runtime.bundle);
  return compileCatalogue(runtime.config, { graph, checkpoint });
}
