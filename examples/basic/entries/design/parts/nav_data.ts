import { DESTINATIONS } from "./destinations.js";
import type { NavNode } from "./nav.js";

export const NAV_TREE: readonly NavNode[] = [
  {
    key: "example",
    count: 3,
    depth: 0,
    kind: "collection",
    label: "Example",
    open: true,
  },
  {
    key: "screens",
    count: 2,
    depth: 1,
    kind: "collection",
    label: "Screens",
    open: true,
  },
  {
    key: "welcome",
    depth: 2,
    kind: "screen",
    label: "Welcome",
    to: DESTINATIONS.welcome,
  },
  {
    key: "details",
    depth: 2,
    kind: "screen",
    label: "Details",
    to: DESTINATIONS.details,
  },
  {
    key: "example-tour",
    depth: 1,
    kind: "flow",
    label: "Example tour",
    to: DESTINATIONS.tour,
  },
  {
    key: "design",
    count: 2,
    depth: 0,
    kind: "collection",
    label: "Design",
    open: true,
  },
  { key: "browse-shell", depth: 1, kind: "collection", label: "Browse shell" },
  { key: "changes", depth: 1, kind: "collection", label: "Changes" },
];
