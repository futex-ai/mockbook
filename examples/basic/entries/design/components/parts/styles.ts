/** Shared styles and dependency identities for every component design collection. */
export const componentStyles = [
  "design.css",
  "design-stage.css",
  "design-review.css",
  "design-components.css",
  "design-component-inspection.css",
  "design-component-details.css",
  "design-component-inspector.css",
  "design-component-workspace.css",
  "design-component-view.css",
];

export const componentStyleDependencies = componentStyles.map(
  (stylesheet) => `examples/basic/generated/${stylesheet}`,
);
