/** Restart supervision retains ownership until each child's cleanup completes. */

import type { ComponentRuntime } from "../build/component_runtime.js";

import { MokabookError } from "../errors.js";
import { bindTimings, timeSync } from "../diagnostics/timings.js";
import { ManagedChild, type ChildShutdownTimings } from "./child_lifecycle.js";
import { NodeChildFactory, type ChildFactory } from "./child_process.js";
import type { ComponentChangeSnapshot } from "./component_changes.js";
import { componentRuntimeMessage } from "./controls/runtime_ipc.js";
import { childUpdateMessage } from "./update_messages.js";

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

/** Node child-process supervisor factory. */
export class NodeProcessSupervisorFactory implements ProcessSupervisorFactory {
  create(
    binPath: string,
    baseArguments: readonly string[],
    requestedPort: number,
  ): ProcessSupervisor {
    return new ReadyProcessSupervisor(
      new NodeChildFactory(binPath),
      baseArguments,
      requestedPort,
    );
  }
}

/** Child supervisor that waits for readiness and retains a resolved port. */
export class ReadyProcessSupervisor implements ProcessSupervisor {
  #child: ManagedChild | undefined;
  #unexpectedExit: ((error: Error) => void) | undefined;
  #resolvedPort: number | undefined;
  #updateVersion = 0;
  #runtime: ComponentRuntime | undefined;

  constructor(
    private readonly factory: ChildFactory,
    private readonly baseArguments: readonly string[],
    private readonly requestedPort: number,
    private readonly shutdownTimings?: ChildShutdownTimings,
  ) {}

  async start(): Promise<number> {
    if (this.#child)
      throw new MokabookError(
        "server-failed",
        "server child is already running",
      );
    const resolvedPort = this.#resolvedPort;
    this.#updateVersion++;
    const runtime = this.#runtime;
    const handle = this.factory.spawn([
      ...this.baseArguments,
      ...(runtime ? ["--retained-runtime"] : []),
      "--port",
      String(resolvedPort ?? this.requestedPort),
      ...(resolvedPort === undefined ? [] : ["--strict-port"]),
      "--update-version",
      String(this.#updateVersion),
    ]);
    let started = false;
    const child = new ManagedChild(
      handle,
      (error) => {
        if (!started || this.#child !== child) return;
        if (child.exited) this.#child = undefined;
        else void this.stop(child);
        this.#unexpectedExit?.(error);
      },
      this.shutdownTimings,
    );
    this.#child = child;
    child.onMessage(
      bindTimings((message: unknown) => {
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === "component-runtime-startup-request" &&
          runtime
        )
          timeSync("child.send-startup", () =>
            child.send({
              type: "component-runtime-startup",
              config: runtime.config,
              manifest: runtime.manifest,
            }),
          );
        if (
          message &&
          typeof message === "object" &&
          "type" in message &&
          message.type === "component-runtime-request" &&
          runtime
        ) {
          this.#updateVersion++;
          timeSync("child.send-runtime", () =>
            child.send(componentRuntimeMessage(runtime, this.#updateVersion)),
          );
        }
      }),
    );
    try {
      const readyPort = await child.ready;
      if (child.failure) throw child.failure;
      if (child.stopping || child.exited)
        throw new MokabookError(
          "server-failed",
          "server child stopped during startup",
        );
      this.#resolvedPort = readyPort;
      started = true;
      return readyPort;
    } catch (error) {
      await this.stop(child);
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
    const child = this.#child;
    if (!child || child.stopping || child.exited) return;
    this.#updateVersion++;
    child.send(
      childUpdateMessage(this.#updateVersion, changedRoutes, componentChanges),
    );
  }

  onUnexpectedExit(callback: (error: Error) => void): void {
    this.#unexpectedExit = callback;
  }

  async close(): Promise<void> {
    if (this.#child) await this.stop(this.#child);
  }

  private async stop(child: ManagedChild): Promise<void> {
    await child.close();
    if (this.#child === child) this.#child = undefined;
  }
}
