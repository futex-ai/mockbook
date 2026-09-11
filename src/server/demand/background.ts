/** Bound background lifetime to one accepted source generation. */
import { Worker } from "node:worker_threads";
import type { ComponentRuntime } from "../../build/component_runtime.js";
import type { Compilation } from "../../build/compile.js";
import { timingArguments } from "../../diagnostics/timings.js";
import type { ComponentChangeSnapshot } from "../component_changes.js";

export class BackgroundCompilation {
  private readonly worker: Worker;
  private readonly pause = new Int32Array(new SharedArrayBuffer(4));
  private closed = false;
  readonly compilation: Promise<Compilation>;
  private rejectCompilation: (error: unknown) => void = () => {};
  private classification:
    | {
        resolve(value: ComponentChangeSnapshot | undefined): void;
        reject(error: unknown): void;
      }
    | undefined;
  constructor(runtime: ComponentRuntime, existing?: Compilation) {
    this.worker = new Worker(
      new URL("./background_worker.js", import.meta.url),
      {
        workerData: {
          runtime,
          pause: this.pause.buffer,
          debug: timingArguments().length > 0,
          ...(existing ? { existingManifest: existing.manifest } : {}),
        },
        execArgv: [],
        resourceLimits: { maxOldGenerationSizeMb: 1024 },
      },
    );
    this.compilation = new Promise((resolve, reject) => {
      this.rejectCompilation = reject;
      if (existing) resolve(existing);
      this.worker.on(
        "message",
        (message: {
          type: string;
          compilation: Compilation;
          snapshot?: ComponentChangeSnapshot;
          error?: string;
        }) => {
          if (this.closed) return;
          if (message.type === "compiled") resolve(message.compilation);
          if (message.type === "classified") {
            this.classification?.resolve(message.snapshot);
            this.classification = undefined;
          }
          if (message.type === "failed") reject(new Error(message.error));
        },
      );
      this.worker.on("error", (error) => {
        reject(error);
        this.classification?.reject(error);
      });
      this.worker.on("exit", () => {
        reject(new Error("Background renderer stopped"));
        this.classification?.reject(new Error("Background renderer stopped"));
      });
    });
    void this.compilation.catch(() => {});
  }
  foreground(active: boolean): void {
    Atomics.store(this.pause, 0, Number(active));
  }
  classify(base: string): Promise<ComponentChangeSnapshot | undefined> {
    if (this.closed) return Promise.resolve(undefined);
    return new Promise((resolve, reject) => {
      this.classification = { resolve, reject };
      this.worker.postMessage({ type: "classify", base });
    });
  }
  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    this.rejectCompilation(new Error("Background generation replaced"));
    this.classification?.resolve(undefined);
    this.classification = undefined;
    await this.worker.terminate();
  }
}
