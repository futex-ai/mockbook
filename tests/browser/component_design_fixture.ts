import path from "node:path";
import { pathToFileURL } from "node:url";

import { repositoryRoot } from "../helpers/fixture.js";

export const componentDesignRoutes = [
  "overview",
  "inspector/component",
  "inspector/screen",
  "controls/overview",
  "controls/editing/edited",
  "controls/editing/unset",
  "controls/editing/variant",
  "controls/editing/reset",
  "controls/states/pending",
  "controls/states/invalid",
  "controls/states/error",
  "controls/states/comparison",
  "controls/published/default",
  "controls/published/variant",
  "pages/variants",
  "pages/comparison",
  "pages/affected",
  "pages/toolbar",
  "pages/help",
  "inspection/details",
  "inspection/highlight",
  "inspection/nested",
  "inspection/direct-change",
  "inspection/consumer",
  "inspection/selection/toolbar",
  "inspection/selection/help",
  "states/empty",
  "states/unavailable",
  "states/unused",
  "states/removed",
  "states/removed-consumer",
];

export function componentDesignUrl(route: string, viewport: string): string {
  return pathToFileURL(
    path.join(
      repositoryRoot,
      "examples/basic/generated/design/components",
      `${route}.${viewport}.html`,
    ),
  ).href;
}
