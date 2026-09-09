/** Watched Serve coordinates transactional output, resource watches, and its child. */

import { fileURLToPath } from "node:url";

import { loadConsumerGraph } from "../build/load_graph.js";
import { compileCatalogue, type Compilation } from "../build/compile.js";
import type { ResolvedConfig } from "../config/types.js";
import { errorMessage } from "../errors.js";
import { computeChangedRoutes } from "./changed.js";
import {
  ResourceWatcher,
  type PreparedResourceWatch,
} from "./resource_watcher.js";
import type { RunningServe, ServeDependencies, ServeOptions } from "./serve.js";
import {
  closeWatched,
  prepareWatchedOutput,
  restartWithRecovery,
  watcherReadyBeforeShutdown,
} from "./serve_lifecycle.js";
import type { ProcessSupervisor } from "./supervisor.js";
import type { ConsumerWatcher, ConsumerWatcherFactory } from "./watcher.js";
import {
  classifyWatchPath,
  isPackageOwnedIgnoredWatchPath,
  NotificationGate,
  type RuntimeWatchAction,
  WatchActionQueue,
  WatchDebouncer,
  watchTargets,
} from "./watch_events.js";

/** Start the watched parent with injectable process and filesystem boundaries. */
export async function serveWatched(
  config: ResolvedConfig,
  options: ServeOptions,
  dependencies: ServeDependencies,
): Promise<RunningServe> {
  const {
    configLoader,
    watcherFactory,
    outputStore,
    processSupervisorFactory,
  } = dependencies;
  let closed = false;
  let signalShutdown: () => void = () => undefined;
  const shutdownStarted = new Promise<void>((resolve) => {
    signalShutdown = resolve;
  });
  const gate = new NotificationGate<string>();
  const failureGate = new NotificationGate<Error>();
  config.sourceFiles = (await loadConsumerGraph(config, false)).sourceFiles;
  let activeConfig = config;
  let watcher = createWatcher(watcherFactory, activeConfig, gate);
  const resources = new ResourceWatcher(
    watcherFactory,
    (candidate) => gate.notify(candidate),
    (error) => process.stderr.write(`${errorMessage(error)}\n`),
  );
  let activeCompilation: Compilation;
  const prepareOutput = (
    nextConfig: ResolvedConfig,
    compilation: Compilation,
  ) =>
    prepareWatchedOutput(
      nextConfig,
      compilation,
      resources,
      outputStore,
      shutdownStarted,
      () => closed,
    );
  let supervisor: ProcessSupervisor | undefined;
  let manifestSignature = "";
  let port: number;
  try {
    await watcher.ready();
    const initialCompilation = await compileCatalogue(config);
    const prepared = await prepareOutput(config, initialCompilation);
    try {
      prepared?.adopt();
    } finally {
      await prepared?.close();
    }
    activeCompilation = initialCompilation;
    manifestSignature = JSON.stringify(initialCompilation.manifest);
    const binPath = fileURLToPath(new URL("../cli/bin.js", import.meta.url));
    const baseArguments = [
      "__serve-child",
      "--config",
      config.configPath,
      ...(options.base !== undefined ? ["--base", options.base] : []),
    ];
    supervisor = processSupervisorFactory.create(
      binPath,
      baseArguments,
      options.port,
    );
    supervisor.onUnexpectedExit((error) => failureGate.notify(error));
    port = await supervisor.start();
  } catch (error) {
    await Promise.allSettled([
      watcher.close(),
      resources.close(),
      supervisor?.close(),
    ]);
    throw error;
  }
  const runningSupervisor = supervisor;
  let debouncer: WatchDebouncer | undefined;
  const notifyCandidate = (candidate: string): void => {
    debouncer?.notify(
      classifyWatchPath(candidate, activeConfig, resources.paths),
    );
  };
  const reconfigure = async (candidate?: ResolvedConfig): Promise<void> => {
    const nextConfig =
      candidate ?? (await configLoader.load(activeConfig.configPath));
    nextConfig.sourceFiles = (
      await loadConsumerGraph(nextConfig, false)
    ).sourceFiles;
    const replacementGate = new NotificationGate<string>();
    const replacement = createWatcher(
      watcherFactory,
      nextConfig,
      replacementGate,
    );
    let prepared: PreparedResourceWatch | undefined;
    let transferred = false;
    let replacementClosed = false;
    const closeReplacement = async (): Promise<void> => {
      if (replacementClosed) return;
      replacementClosed = true;
      await replacement.close();
    };
    try {
      const ready = await watcherReadyBeforeShutdown(
        replacement,
        shutdownStarted,
      );
      if (!ready || closed) {
        await closeReplacement();
        return;
      }
      const nextCompilation = await compileCatalogue(nextConfig);
      prepared = await prepareOutput(nextConfig, nextCompilation);
      if (!prepared || closed) {
        await closeReplacement();
        return;
      }
      const previous = watcher;
      activeConfig = nextConfig;
      activeCompilation = nextCompilation;
      manifestSignature = JSON.stringify(nextCompilation.manifest);
      watcher = replacement;
      transferred = true;
      debouncer?.close();
      debouncer = new WatchDebouncer(activeConfig.watch.debounceMs, (action) =>
        actionQueue.notify(action),
      );
      prepared.adopt();
      replacementGate.open(notifyCandidate);
      let closeError: unknown;
      try {
        await previous.close();
      } catch (error) {
        closeError = error;
      }
      if (!closed) await restartWithRecovery(runningSupervisor);
      if (closeError !== undefined) throw closeError;
    } catch (error) {
      if (!transferred) await closeReplacement();
      throw error;
    } finally {
      await prepared?.close();
    }
  };
  const processAction = async (action: RuntimeWatchAction): Promise<void> => {
    if (closed) return;
    if (action === "reconfigure") {
      await reconfigure();
      return;
    }
    if (action === "rebuild") {
      const graph = await loadConsumerGraph(activeConfig, false);
      const candidate = { ...activeConfig, sourceFiles: graph.sourceFiles };
      if (
        JSON.stringify(watchTargets(candidate)) !==
        JSON.stringify(watchTargets(activeConfig))
      ) {
        await reconfigure(candidate);
        return;
      }
      const nextCompilation = await compileCatalogue(candidate);
      const prepared = await prepareOutput(activeConfig, nextCompilation);
      if (!prepared) return;
      try {
        prepared.adopt();
        activeCompilation = nextCompilation;
        const nextSignature = JSON.stringify(nextCompilation.manifest);
        if (nextSignature === manifestSignature) {
          await publishUpdate();
        } else {
          manifestSignature = nextSignature;
          if (!closed) await restartWithRecovery(runningSupervisor);
        }
      } finally {
        await prepared.close();
      }
      return;
    }
    const prepared = await resources.prepare(
      activeConfig,
      activeCompilation,
      shutdownStarted,
      true,
    );
    if (!prepared) return;
    try {
      if (closed) return;
      prepared.adopt();
      if (action === "reload") await publishUpdate();
      else await restartWithRecovery(runningSupervisor);
    } finally {
      await prepared.close();
    }
  };
  const publishUpdate = async (): Promise<void> => {
    const base = options.base ?? activeConfig.review.base;
    const changedRoutes = await computeChangedRoutes(activeConfig, base);
    if (!closed) runningSupervisor.notifyUpdate(changedRoutes);
  };
  const actionQueue = new WatchActionQueue(processAction, (error) =>
    process.stderr.write(`${errorMessage(error)}\n`),
  );
  debouncer = new WatchDebouncer(activeConfig.watch.debounceMs, (action) =>
    actionQueue.notify(action),
  );
  failureGate.open((error) => {
    if (closed) return;
    process.stderr.write(`${errorMessage(error)}\n`);
    actionQueue.notify("restart");
  });
  gate.open(notifyCandidate);
  return {
    async close(): Promise<void> {
      if (closed) return;
      closed = true;
      signalShutdown();
      debouncer?.close();
      await closeWatched(
        actionQueue,
        () => watcher,
        resources,
        runningSupervisor,
      );
    },
    port,
    url: `http://127.0.0.1:${port}`,
  };
}

function createWatcher(
  factory: ConsumerWatcherFactory,
  config: ResolvedConfig,
  gate: NotificationGate<string>,
): ConsumerWatcher {
  const watcher = factory.create(watchTargets(config), (candidate) =>
    isPackageOwnedIgnoredWatchPath(candidate, config),
  );
  watcher.onChange((candidate) => gate.notify(candidate));
  watcher.onError((error) => process.stderr.write(`${errorMessage(error)}\n`));
  return watcher;
}
