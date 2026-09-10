import { defineComponent, type ComponentProps } from "mokabook";
import { libraryMetadata } from "../metadata.js";
import {
  flag,
  optionalFlag,
  previewViewport,
  scheme,
  schemeDestinations,
} from "../schemas.js";
import { ViewControlsView } from "./view-controls.view.js";

const propSchema = {
  kind: "object",
  properties: {
    selection: previewViewport,
    scheme,
    highlight: optionalFlag,
    unavailable: {
      schema: { kind: "enum", values: ["empty", "unavailable", "comparison"] },
      optional: true,
    },
    presentation: {
      schema: {
        kind: "enum",
        values: ["icons", "viewport-segments", "scheme-segments"],
      },
    },
    accessible: flag,
    destinations: schemeDestinations,
  },
} as const;
export type ViewControlsProps = ComponentProps<typeof propSchema, []>;
const sample = {
  selection: "desktop",
  scheme: "light",
  presentation: "icons",
  accessible: true,
  destinations: {},
} as const;
export const viewControls = defineComponent({
  ...libraryMetadata(
    "controls",
    "view-controls",
    "View controls",
    "Viewport, theme and component highlighting controls.",
  ),
  propSchema,
  controls: {
    selection: {
      kind: "select",
      label: "Viewport",
      options: previewViewport.schema.values.map((value) => ({
        label: value,
        value,
      })),
    },
    scheme: {
      kind: "select",
      label: "Theme",
      options: scheme.schema.values.map((value) => ({ label: value, value })),
    },
    highlight: { kind: "boolean", label: "Highlight components" },
    unavailable: {
      kind: "select",
      label: "Unavailable reason",
      options: propSchema.properties.unavailable.schema.values.map((value) => ({
        label: value,
        value,
      })),
    },
  },
  render: ViewControlsView,
  variants: [
    { id: "default", title: "Default", props: sample },
    {
      id: "both",
      title: "Both viewports",
      props: { ...sample, selection: "both" },
    },
    {
      id: "highlighted",
      title: "Highlighted",
      props: { ...sample, highlight: true },
    },
    {
      id: "unavailable",
      title: "Unavailable",
      props: { ...sample, highlight: false, unavailable: "empty" },
    },
  ],
});
