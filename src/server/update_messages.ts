import type {
  RuntimeMessage,
  RuntimeStartupMessage,
} from "./controls/runtime_ipc.js";
import type { ComponentChangeSnapshot } from "./component_changes.js";
/** Typed watched-server updates crossing the parent/child IPC boundary. */

import { isSafeCatalogueRoute } from "../config/paths.js";

/** Mutable running-server state published before clients reload. */
export interface CatalogueUpdate {
  /** Omit to retain state, use `null` when changed-route detection is unavailable. */
  changedRoutes?: readonly string[] | null;
  /** Omit to retain evidence, use `null` while fresh classification is unavailable. */
  componentChanges?: ComponentChangeSnapshot | null;
  /** Omit to allocate the next monotonically increasing update version. */
  version?: number;
}

/** Parent-to-child update command with an explicit changed-route snapshot. */
export interface ChildUpdateMessage {
  changedRoutes: readonly string[] | null;
  componentChanges: ComponentChangeSnapshot | null;
  type: "update";
  version: number;
}

/** Commands accepted by the watched server child. */
export type ChildCommand =
  | ChildUpdateMessage
  | RuntimeMessage
  | RuntimeStartupMessage
  | { type: "shutdown" };

/** Create an immutable IPC update payload from the latest route computation. */
export function childUpdateMessage(
  version: number,
  changedRoutes: readonly string[] | undefined,
  componentChanges?: ComponentChangeSnapshot,
): ChildUpdateMessage {
  return {
    changedRoutes: changedRoutes ? [...changedRoutes] : null,
    componentChanges: componentChanges ?? null,
    type: "update",
    version,
  };
}

/** Parse an untrusted IPC value as one complete watched-server update. */
export function parseChildUpdateMessage(
  value: unknown,
): ChildUpdateMessage | undefined {
  if (
    typeof value !== "object" ||
    value === null ||
    (value as { type?: unknown }).type !== "update"
  ) {
    return undefined;
  }
  const candidate = value as {
    changedRoutes?: unknown;
    componentChanges?: unknown;
    version?: unknown;
  };
  if (
    !Number.isSafeInteger(candidate.version) ||
    (candidate.version as number) <= 0 ||
    !isChangedRoutes(candidate.changedRoutes) ||
    !isComponentChanges(candidate.componentChanges)
  ) {
    return undefined;
  }
  return {
    changedRoutes: candidate.changedRoutes,
    componentChanges: candidate.componentChanges,
    type: "update",
    version: candidate.version as number,
  };
}

function isComponentChanges(
  value: unknown,
): value is ComponentChangeSnapshot | null {
  if (value === null) return true;
  if (typeof value !== "object" || value === null || !("baseline" in value))
    return false;
  const snapshot = value as {
    baseline?: unknown;
    changedRoutes?: unknown;
    result?: unknown;
  };
  return (
    typeof snapshot.baseline === "object" &&
    snapshot.baseline !== null &&
    (snapshot.changedRoutes === undefined ||
      (isChangedRoutes(snapshot.changedRoutes) &&
        snapshot.changedRoutes !== null)) &&
    (snapshot.result === undefined ||
      (typeof snapshot.result === "object" && snapshot.result !== null))
  );
}

function isChangedRoutes(value: unknown): value is readonly string[] | null {
  return (
    value === null ||
    (Array.isArray(value) &&
      value.every(
        (route) => typeof route === "string" && isSafeCatalogueRoute(route),
      ))
  );
}
