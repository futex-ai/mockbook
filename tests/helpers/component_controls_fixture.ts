import { componentEntrySource } from "./component_fixture.js";

export function controlsEntrySource(): string {
  return componentEntrySource({
    actionRender: `(props, context) => {
    if (props.label === "Fail") throw new Error("Consumer rejected this label");
    if (props.label === "Hang") { while (true) {} }
    const emphasis = { primary: { fontWeight: 700 }, quiet: { fontWeight: 400 } }[props.emphasis];
    return props.hidden ? null : <div><button data-viewport={context.viewport} data-scheme={context.colorScheme} data-radius={Object.is(props.radius, -0) ? "-0" : props.radius} style={{...emphasis, borderRadius: props.radius}} disabled={props.disabled}>{props.label}</button>{props.hint !== undefined ? <p data-hint>{props.hint}</p> : null}</div>;
  }`,
  })
    .replace(
      'label: { schema: { kind: "string" } }',
      'label: { schema: { kind: "string" } }, radius: { schema: { kind: "number", minimum: 0, maximum: 24 }, optional: true }, emphasis: { schema: { kind: "enum", values: ["primary", "quiet"] }, optional: true }, hint: { schema: { kind: "string" }, optional: true }',
    )
    .replace(
      'label: { kind: "text", maxLength: 80 }, disabled: { kind: "boolean" }',
      'label: { kind: "text", label: "Label", maxLength: 80 }, disabled: { kind: "boolean", label: "Disabled" }, radius: { kind: "number", label: "Corner radius", minimum: 0, maximum: 24, step: 1 }, emphasis: { kind: "select", label: "Emphasis", options: [{ label: "Primary", value: "primary" }, { label: "Quiet", value: "quiet" }] }, hint: { kind: "text", label: "Hint", maxLength: 80 }',
    )
    .replace(
      'props: { label: "Continue" }',
      'props: { label: "Continue", disabled: false, radius: 4, emphasis: "primary", hint: "Helpful hint" }',
    )
    .replace(
      'props: { label: "Continue", disabled: true }',
      'props: { label: "Continue", disabled: true, radius: 8, emphasis: "quiet" }',
    );
}
