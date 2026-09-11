import type { ComponentRuntime } from "../build/component_runtime.js";

import { MokabookError, errorMessage } from "../errors.js";
import type { ComponentChangeSnapshot } from "./component_changes.js";
import { componentRuntimeMessage } from "./controls/runtime_ipc.js";
import { childUpdateMessage, type ChildCommand } from "./update_messages.js";

interface ReadyMessage {
  port: number;
  type: "ready";
}

/** Child-process handle used by the restart supervisor. */
export interface ChildHandle {
  forceKill(): void;
  onError(callback: (error: Error) => void): void;
  onExit(callback: (code: number | null) => void): void;
  onMessage(callback: (message: unknown) => void): void;
  send(message: ChildCommand): void;
  terminate(): void;
}

/** Time allowed for each watched-child shutdown stage. */
export interface ChildShutdownTimings {
  /** Time allowed for the IPC shutdown request. */
  gracefulMilliseconds: number;
  /** Time allowed for SIGTERM before SIGKILL. */
  terminateMilliseconds: number;
}

const DEFAULT_SHUTDOWN_TIMINGS: ChildShutdownTimings = {
  gracefulMilliseconds: 2_000,
  terminateMilliseconds: 2_000,
};
const CHILD_READINESS_TIMEOUT_MILLISECONDS = 60_000;

/** Factory seam for unit-testing child lifecycle ordering. */
export interface ChildFactory {
  spawn(arguments_: readonly string[]): ChildHandle;
}

/** Restartable child interface used by watched Serve. */
export interface ProcessSupervisor {
  /** Stage the next child's graph, or update a child whose catalogue is unchanged. */
  replaceComponentRuntime(
    runtime: ComponentRuntime,
    delivery: "stage" | "live",
  ): void;
  close(): Promise<void>;
  notifyUpdate(
    changedRoutes: readonly string[] | undefined,
    componentChanges?: ComponentChangeSnapshot,
  ): void;
  /** Register the watched-runtime handler for a post-readiness child failure. */
  onUnexpectedExit(callback: (error: Error) => void): void;
  restart(): Promise<number>;
  start(): Promise<number>;
}

/** Factory seam for selecting the watched child-process implementation. */
export interface ProcessSupervisorFactory {
  create(
    binPath: string,
    baseArguments: readonly string[],
    requestedPort: number,
  ): ProcessSupervisor;
}

/** Child supervisor that waits for readiness and retains a resolved port. */
export class ReadyProcessSupervisor implements ProcessSupervisor {
  #child: ChildHandle | undefined;
  #unexpectedExit: ((error: Error) => void) | undefined;
  #resolvedPort: number | undefined;
  #updateVersion = 0;
  #runtime: ComponentRuntime | undefined;

  constructor(
    private readonly factory: ChildFactory,
    private readonly baseArguments: readonly string[],
    private readonly requestedPort: number,
    private readonly shutdownTimings: ChildShutdownTimings = DEFAULT_SHUTDOWN_TIMINGS,
  ) {}

  async start(): Promise<number> {
    if (this.#child)
      throw new MokabookError(
        "server-failed",
        "server child is already running",
      );
    const resolvedPort = this.#resolvedPort;
    const port = resolvedPort ?? this.requestedPort;
    this.#updateVersion += 1;
    const runtime = this.#runtime;
    const child = this.factory.spawn([
      ...this.baseArguments,
      ...(this.#runtime ? ["--retained-runtime"] : []),
      "--port",
      String(port),
      ...(resolvedPort === undefined ? [] : ["--strict-port"]),
      "--update-version",
      String(this.#updateVersion),
    ]);
    this.#child = child;
    child.onMessage((message) => {
      if (
        message &&
        typeof message === "object" &&
        "type" in message &&
        message.type === "component-runtime-startup-request" &&
        runtime
      )
        child.send({
          config: runtime.config,
          manifest: runtime.manifest,
          type: "component-runtime-startup",
        });
      if (
        message &&
        typeof message === "object" &&
        "type" in message &&
        message.type === "component-runtime-request" &&
        runtime
      ) {
        this.#updateVersion += 1;
        child.send(componentRuntimeMessage(runtime, this.#updateVersion));
      }
    });
    try {
      const readyPort = await waitForReady(child, (error) => {
        if (this.#child !== child) return;
        this.#child = undefined;
        child.terminate();
        this.#unexpectedExit?.(error);
      });
      this.#resolvedPort = readyPort;
      return readyPort;
    } catch (error) {
      if (this.#child === child) this.#child = undefined;
      child.terminate();
      throw error;
    }
  }

  async restart(): Promise<number> {
    await this.close();
    return this.start();
  }

  replaceComponentRuntime(
    runtime: ComponentRuntime,
    delivery: "stage" | "live",
  ): void {
    this.#runtime = runtime;
    if (delivery === "live")
      this.#child?.send(componentRuntimeMessage(runtime));
  }

  notifyUpdate(
    changedRoutes: readonly string[] | undefined,
    componentChanges?: ComponentChangeSnapshot,
  ): void {
    if (!this.#child) return;
    this.#updateVersion += 1;
    this.#child.send(
      childUpdateMessage(this.#updateVersion, changedRoutes, componentChanges),
    );
  }

  onUnexpectedExit(callback: (error: Error) => void): void {
    this.#unexpectedExit = callback;
  }

  async close(): Promise<void> {
    const child = this.#child;
    if (!child) return;
    this.#child = undefined;
    await stopChild(child, this.shutdownTimings);
  }
}

function stopChild(
  child: ChildHandle,
  timings: ChildShutdownTimings,
): Promise<void> {
  return new Promise((resolve) => {
    let exited = false;
    let forceTimer: ReturnType<typeof setTimeout> | undefined;
    const terminateTimer = setTimeout(() => {
      child.terminate();
      if (exited) return;
      forceTimer = setTimeout(() => {
        child.forceKill();
      }, timings.terminateMilliseconds);
      forceTimer.unref();
    }, timings.gracefulMilliseconds);
    terminateTimer.unref();
    child.onExit(() => {
      if (exited) return;
      exited = true;
      clearTimeout(terminateTimer);
      if (forceTimer) clearTimeout(forceTimer);
      resolve();
    });
    child.send({ type: "shutdown" });
  });
}

function waitForReady(
  child: ChildHandle,
  onUnexpectedFailure: (error: Error) => void,
): Promise<number> {
  return new Promise((resolve, reject) => {
    let state: "failed" | "ready" | "waiting" = "waiting";
    const timer = setTimeout(
      () => fail(new Error("server child readiness timed out")),
      CHILD_READINESS_TIMEOUT_MILLISECONDS,
    );
    timer.unref();
    const fail = (error: Error): void => {
      if (state !== "waiting") return;
      state = "failed";
      clearTimeout(timer);
      reject(serverFailure(error));
    };
    child.onError((error) => {
      if (state === "ready") onUnexpectedFailure(serverFailure(error));
      else fail(error);
    });
    child.onExit((code) => {
      if (state === "ready") {
        onUnexpectedFailure(
          serverFailure(
            new Error(`server child exited unexpectedly (${String(code)})`),
          ),
        );
      } else {
        fail(
          new Error(`server child exited before readiness (${String(code)})`),
        );
      }
    });
    child.onMessage((message) => {
      if (!isReady(message) || state !== "waiting") return;
      state = "ready";
      clearTimeout(timer);
      resolve(message.port);
    });
  });
}

function serverFailure(error: Error): MokabookError {
  return new MokabookError("server-failed", errorMessage(error), {
    cause: error,
  });
}

function isReady(message: unknown): message is ReadyMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as { type?: unknown }).type === "ready" &&
    Number.isInteger((message as { port?: unknown }).port)
  );
}
