import { compileCatalogue } from "../build/compile.js";
import {
  FileSystemGeneratedOutputStore,
  type GeneratedOutputStore,
} from "../build/output_store.js";
import { FileSystemConfigLoader, type ConfigLoader } from "../config/load.js";
import type { ResolvedConfig } from "../config/types.js";
import {
  NodeCatalogueServerFactory,
  type CatalogueServerFactory,
} from "./factory.js";
import { configuredServedReview } from "./review_routes.js";
import { computeChangedRoutes } from "./changed.js";
import {
  NodeProcessSupervisorFactory,
  type ProcessSupervisorFactory,
} from "./supervisor.js";
import {
  ChokidarWatcherFactory,
  type ConsumerWatcherFactory,
} from "./watcher.js";
import { serverLifecycle } from "./serve_lifecycle.js";
import { serveWatched } from "./serve_watched.js";

/** Public Serve options after CLI validation. */
export interface ServeOptions {
  base?: string;
  port: number;
  watch: boolean;
}

/** Closable Serve lifecycle returned to CLI and integration tests. */
export interface RunningServe {
  close(): Promise<void>;
  port: number;
  url: string;
}

/** Injectable runtime collaborators for Serve orchestration. */
export interface ServeDependencies {
  configLoader: ConfigLoader;
  outputStore: GeneratedOutputStore;
  processSupervisorFactory: ProcessSupervisorFactory;
  serverFactory: CatalogueServerFactory;
  watcherFactory: ConsumerWatcherFactory;
}

const DEFAULT_DEPENDENCIES: ServeDependencies = {
  configLoader: new FileSystemConfigLoader(),
  outputStore: new FileSystemGeneratedOutputStore(),
  processSupervisorFactory: new NodeProcessSupervisorFactory(),
  serverFactory: new NodeCatalogueServerFactory(),
  watcherFactory: new ChokidarWatcherFactory(),
};

/** Build a last-good snapshot and start watched or deterministic Browse. */
export async function serve(
  config: ResolvedConfig,
  options: ServeOptions,
  dependencies: ServeDependencies = DEFAULT_DEPENDENCIES,
): Promise<RunningServe> {
  if (!options.watch) {
    await dependencies.outputStore.write(
      await compileCatalogue(config),
      config,
    );
    const base = options.base ?? config.review.base;
    const changedRoutes = await computeChangedRoutes(config, base);
    const server = await dependencies.serverFactory.start(config, {
      base,
      ...(changedRoutes ? { changedRoutes } : {}),
      port: options.port,
      review: configuredServedReview(config, base),
    });
    return serverLifecycle(server);
  }
  return serveWatched(config, options, dependencies);
}
