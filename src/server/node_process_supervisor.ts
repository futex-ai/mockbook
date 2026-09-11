/** Node child-process adapters for the watched process supervisor. */
import { fork, type ChildProcess } from "node:child_process";

import {
  ReadyProcessSupervisor,
  type ChildFactory,
  type ChildHandle,
  type ProcessSupervisor,
  type ProcessSupervisorFactory,
} from "./supervisor.js";
import type { ChildCommand } from "./update_messages.js";

/** Node IPC child factory. */
export class NodeChildFactory implements ChildFactory {
  constructor(private readonly binPath: string) {}

  spawn(arguments_: readonly string[]): ChildHandle {
    return new NodeChildHandle(
      fork(this.binPath, [...arguments_], {
        stdio: ["inherit", "inherit", "inherit", "ipc"],
      }),
    );
  }
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

class NodeChildHandle implements ChildHandle {
  constructor(private readonly child: ChildProcess) {}

  forceKill(): void {
    if (this.child.exitCode === null && this.child.signalCode === null)
      this.child.kill("SIGKILL");
  }

  onError(callback: (error: Error) => void): void {
    this.child.once("error", callback);
  }

  onExit(callback: (code: number | null) => void): void {
    this.child.once("exit", callback);
  }

  onMessage(callback: (message: unknown) => void): void {
    this.child.on("message", callback);
  }

  send(message: ChildCommand): void {
    if (this.child.connected) this.child.send(message);
  }

  terminate(): void {
    if (this.child.exitCode === null && this.child.signalCode === null)
      this.child.kill("SIGTERM");
  }
}
