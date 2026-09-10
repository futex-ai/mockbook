import { defineComponent, type ComponentProps } from "mokabook";
import { libraryMetadata } from "../metadata.js";
import { destination, text } from "../schemas.js";
import { InspectorView } from "./inspector.view.js";

const propSchema = {
  kind: "object",
  properties: {
    tabs: {
      schema: {
        kind: "array",
        maxItems: 4,
        items: {
          kind: "object",
          properties: {
            id: {
              schema: {
                kind: "enum",
                values: ["info", "components", "props", "usage"],
              },
            },
            label: text,
          },
        },
      },
    },
    initial: {
      schema: {
        kind: "enum",
        values: ["info", "components", "props", "usage", "closed"],
      },
    },
    presentation: { schema: { kind: "enum", values: ["tabs", "legacy"] } },
    sheetSize: { schema: { kind: "enum", values: ["compact", "expanded"] } },
    legacyBehavior: {
      schema: { kind: "enum", values: ["linked", "native", "evidence"] },
    },
    legacyDestination: destination,
  },
} as const;
const slots = ["info", "components", "props", "usage"] as const;
export type InspectorProps = ComponentProps<typeof propSchema, typeof slots>;
const sample = {
  tabs: [
    { id: "info", label: "Details" },
    { id: "props", label: "Props" },
    { id: "usage", label: "Usage" },
  ],
  initial: "info",
  presentation: "tabs",
  sheetSize: "compact",
  legacyBehavior: "native",
  info: <p>A shared action with an optional destination and hint.</p>,
  props: (
    <dl className="ce-props">
      <div>
        <dt>label</dt>
        <dd>
          <code>Continue</code>
        </dd>
      </div>
    </dl>
  ),
  usage: <p>Used by Welcome and Details.</p>,
} as const;
export const inspector = defineComponent({
  ...libraryMetadata(
    "inspector",
    "inspector",
    "Footer tabs panel",
    "The shared inspector: icon tabs, panel content and responsive sizing.",
  ),
  propSchema,
  slots,
  controls: {
    initial: {
      kind: "select",
      label: "Initial tab",
      options: (["info", "props", "usage", "closed"] as const).map((value) => ({
        label: value,
        value,
      })),
    },
    presentation: {
      kind: "select",
      label: "Presentation",
      options: [
        { label: "Tabs", value: "tabs" },
        { label: "Legacy details", value: "legacy" },
      ],
    },
    sheetSize: {
      kind: "select",
      label: "Mobile sheet",
      options: [
        { label: "Compact", value: "compact" },
        { label: "Expanded", value: "expanded" },
      ],
    },
  },
  render: InspectorView,
  variants: [
    { id: "details", title: "Details", props: sample },
    { id: "props", title: "Props", props: { ...sample, initial: "props" } },
    { id: "closed", title: "Closed", props: { ...sample, initial: "closed" } },
    {
      id: "legacy-details",
      title: "Legacy details",
      props: { ...sample, presentation: "legacy" },
    },
  ],
});
