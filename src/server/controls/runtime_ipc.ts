/** Last-good runtime transfer over the watched child's private IPC channel. */
import type { ComponentRuntime } from "../../build/component_runtime.js";

export interface RuntimeMessage {
  type: "component-runtime";
  runtime: ComponentRuntime;
}
export function parseRuntimeMessage(
  value: unknown,
): RuntimeMessage | undefined {
  if (
    !value ||
    typeof value !== "object" ||
    !("type" in value) ||
    value.type !== "component-runtime" ||
    !("runtime" in value)
  )
    return;
  const runtime = value.runtime as ComponentRuntime | undefined;
  if (
    !runtime ||
    typeof runtime.generation !== "string" ||
    typeof runtime.bundle?.code !== "string" ||
    !Array.isArray(runtime.outputs) ||
    !runtime.config ||
    !runtime.manifest
  )
    return;
  return { type: "component-runtime", runtime };
}
export function receiveComponentRuntime(): Promise<ComponentRuntime> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      process.off("message", message);
      process.off("disconnect", disconnected);
    };
    const disconnected = () => {
      cleanup();
      reject(new Error("Parent disconnected before runtime transfer"));
    };
    const message = (value: unknown) => {
      const parsed = parseRuntimeMessage(value);
      if (parsed) {
        cleanup();
        resolve(parsed.runtime);
      }
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Consumer runtime transfer timed out"));
    }, 10_000);
    process.on("message", message);
    process.once("disconnect", disconnected);
    process.send?.({ type: "component-runtime-request" });
  });
}
