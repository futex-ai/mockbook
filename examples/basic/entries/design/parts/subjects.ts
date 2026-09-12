import type { CatalogueTag } from "./tags.js";

/** Product subjects depicted by the design catalogue, independent of link ids. */
export type ScreenSubject = "welcome" | "details" | "farewell";

interface SubjectMetadata {
  description: string;
  generated: string;
  rationale: string;
  schemes: string;
  source: string;
  tags: readonly CatalogueTag[];
  tour: boolean;
}

/** Inspector context for each pictured screen, including the retired example. */
export const SUBJECTS: Record<ScreenSubject, SubjectMetadata> = {
  welcome: {
    description: "A linked landing screen for the neutral fixture.",
    generated: "screens/welcome.html",
    rationale:
      "The landing screen anchors the example catalogue, so every cross-screen link starts from a known state.",
    schemes: "light, dark",
    source: "entries/catalogue.mockup.tsx",
    tags: ["forms", "onboarding"],
    tour: true,
  },
  details: {
    description: "Additional context for the example catalogue.",
    generated: "screens/details.html",
    rationale:
      "The Details screen completes the example tour and provides a return to Welcome.",
    schemes: "light, dark",
    source: "entries/catalogue.mockup.tsx",
    tags: ["forms"],
    tour: true,
  },
  farewell: {
    description: "Farewell was removed from the catalogue.",
    generated: "No current screen",
    rationale:
      "The empty state makes the removal clear while its recorded details remain available.",
    schemes: "light",
    source: "Previous version",
    tags: [],
    tour: false,
  },
};
