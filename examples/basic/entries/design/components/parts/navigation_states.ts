import type { NavigationState } from "../../parts/navigation_states.js";
import {
  COMPONENT_PAGES,
  INSPECTION_PAGES,
  type ComponentDesignDestination,
} from "./destinations.js";

/** Shared shell controls do not inherit unrelated Browse transitions. */
export const COMPONENT_NAVIGATION_STATES = {
  [COMPONENT_PAGES.default]: {},
  [COMPONENT_PAGES.disabled]: {},
  [COMPONENT_PAGES.comparison]: {},
  [COMPONENT_PAGES.affected]: {},
  [COMPONENT_PAGES.toolbar]: {},
  [COMPONENT_PAGES.hidden]: {},
  [COMPONENT_PAGES.unused]: {},
  [COMPONENT_PAGES.removed]: {},
  [INSPECTION_PAGES.details]: {},
  [INSPECTION_PAGES.highlight]: {},
  [INSPECTION_PAGES.nested]: {},
  [INSPECTION_PAGES["direct-change"]]: {},
  [INSPECTION_PAGES.consumer]: {},
  [INSPECTION_PAGES["toolbar-selection"]]: {},
  [INSPECTION_PAGES["help-selection"]]: {},
  [INSPECTION_PAGES.empty]: {},
  [INSPECTION_PAGES.unavailable]: {},
  [INSPECTION_PAGES["removed-consumer"]]: {},
} satisfies Record<ComponentDesignDestination, NavigationState>;
