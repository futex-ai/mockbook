/** Synthetic component usage shared by the design screens, never product data. */
export const toolbarPrompt = "Ready for your next step?";

export const componentUses = [
  {
    title: "Welcome",
    kind: "screen",
    count: 2,
    via: "Direct and via Toolbar",
    to: "design-component-inspection-details",
  },
  {
    title: "Details",
    kind: "screen",
    count: 1,
    via: "Direct",
    to: "design-component-inspection-consumer",
  },
  {
    title: "Toolbar",
    kind: "component",
    count: 1,
    via: "Default variant",
    to: "design-component-toolbar",
  },
] as const;

/** Recorded contexts represented by each usage row in this mockup scenario. */
export const usageViews = [
  "Mobile · Light",
  "Mobile · Dark",
  "Desktop · Light",
  "Desktop · Dark",
] as const;

/** Logical instances in the depicted Welcome view, including a null render. */
export const welcomeInstances = [
  { component: "Toolbar", label: "Main", id: "main", parent: null },
  {
    component: "Action",
    label: "Toolbar action",
    id: "toolbar-action",
    parent: "main",
  },
  {
    component: "Action",
    label: "Footer action",
    id: "footer-action",
    parent: null,
  },
  { component: "Help hint", label: "Help", id: "help", parent: null },
] as const;

export const componentDesignDocs = [
  "docs/protocol/mokabook-component-design.md",
  "docs/protocol/mokabook-component-explorer.md",
];
