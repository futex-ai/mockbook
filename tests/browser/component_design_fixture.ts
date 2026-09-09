import path from "node:path";
import { pathToFileURL } from "node:url";

import { repositoryRoot } from "../helpers/fixture.js";

export const componentDesignRoutes = [
  "overview",
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
