/** Resolved route targets shared by the served shell view modules. */

import type {
  ManifestEntry,
  ManifestLegacyPage,
  ManifestScreen,
  ManifestUseCase,
} from "../../registry/types.js";
import type { ManifestComponent } from "../../components/manifest_types.js";

/** A routed structured entry: a screen or a use case, never a collection. */
export type RoutedEntry = ManifestScreen | ManifestUseCase | ManifestComponent;

/** One resolved viewable destination: a structured entry or a legacy page. */
export type RouteTarget =
  | { kind: "entry"; entry: RoutedEntry }
  | { kind: "legacy"; page: ManifestLegacyPage };

/** Classify a catalogue lookup result into a renderable route target. */
export function toRouteTarget(
  value: ManifestEntry | ManifestLegacyPage,
): RouteTarget | undefined {
  if (!("kind" in value)) {
    return { kind: "legacy", page: value };
  }
  if (
    value.kind === "screen" ||
    value.kind === "use-case" ||
    value.kind === "component"
  ) {
    return { kind: "entry", entry: value };
  }
  return undefined;
}
