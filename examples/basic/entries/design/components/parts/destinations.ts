import type { ComponentPageState } from "./component_details.js";
import type { ScreenPageState } from "./screen_preview.js";

/** Each component page selects its authored navigation state explicitly. */
export const COMPONENT_PAGES = {
  default: "design-component-overview",
  disabled: "design-component-variants",
  comparison: "design-component-comparison",
  affected: "design-component-affected",
  toolbar: "design-component-toolbar",
  hidden: "design-component-help",
  unused: "design-component-unused",
  removed: "design-component-removed",
} as const satisfies Record<ComponentPageState, string>;

/** Screen inspection states remain separate from the existing Browse subjects. */
export const INSPECTION_PAGES = {
  details: "design-component-inspection-details",
  highlight: "design-component-inspection-highlight",
  nested: "design-component-inspection-nested",
  "direct-change": "design-component-inspection-direct-change",
  consumer: "design-component-inspection-consumer",
  "toolbar-selection": "design-component-inspection-toolbar",
  "help-selection": "design-component-inspection-help",
  empty: "design-component-empty",
  unavailable: "design-component-unavailable",
  "removed-consumer": "design-component-removed-consumer",
} as const satisfies Record<ScreenPageState, string>;

export type ComponentDesignDestination =
  | (typeof COMPONENT_PAGES)[keyof typeof COMPONENT_PAGES]
  | (typeof INSPECTION_PAGES)[keyof typeof INSPECTION_PAGES];
