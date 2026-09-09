import { defineConfig } from "mokabook";

import { componentStyles } from "./entries/design/components/parts/styles.js";

export default defineConfig({
  colorSchemes: ["light", "dark"],
  entriesDir: "entries",
  mockupsDir: "generated",
  moduleResolution: {
    aliases: { "react-native": "react-native-web" },
    conditions: ["react-native", "import", "module", "default"],
    loaders: { ".js": "jsx" },
    mainFields: ["react-native", "module", "main"],
    resolveExtensions: [
      ".web.tsx",
      ".web.ts",
      ".web.js",
      ".tsx",
      ".ts",
      ".js",
      ".jsx",
      ".json",
    ],
  },
  renderer: "renderer.tsx",
  repoRoot: "../..",
  review: {
    outDir: ".context/basic-review",
    sharedImpact: [
      "examples/basic/generated/design-review.css",
      "examples/basic/generated/design-stage.css",
      "examples/basic/generated/design.css",
      "examples/basic/renderer.tsx",
      "examples/basic/generated/styles.css",
    ],
  },
  stylesheets: [
    {
      match: "design/components/controls/**",
      stylesheets: [...componentStyles, "design-component-controls.css"],
    },
    {
      match: "design/components/**",
      stylesheets: componentStyles,
    },
    {
      match: "design/review/**",
      stylesheets: ["design.css", "design-stage.css", "design-review.css"],
    },
    { match: "design/**", stylesheets: ["design.css", "design-stage.css"] },
    { match: "**/*.html", stylesheets: ["styles.css"] },
  ],
  watch: {
    rules: [
      {
        action: "reload",
        paths: [
          "examples/basic/generated/design-components.css",
          "examples/basic/generated/design-component-inspection.css",
          "examples/basic/generated/design-component-details.css",
          "examples/basic/generated/design-component-inspector.css",
          "examples/basic/generated/design-component-controls.css",
          "examples/basic/generated/design-component-workspace.css",
          "examples/basic/generated/design-component-view.css",
          "examples/basic/generated/design-review.css",
          "examples/basic/generated/design-stage.css",
          "examples/basic/generated/design.css",
          "examples/basic/generated/styles.css",
        ],
      },
    ],
  },
});
