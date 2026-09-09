/** Shared, typed fixture inputs for saved examples and controls designs. */
export interface ActionProps {
  label: string;
  disabled: boolean;
  cornerRadius: number;
  emphasis: "strong" | "quiet";
  hint?: string;
}

export type ActionVariant = "default" | "disabled";

/** Each named variant supplies a complete preset; temporary edits never mutate it. */
export const actionVariants: Record<
  ActionVariant,
  { title: string; props: ActionProps }
> = {
  default: {
    title: "Default",
    props: {
      label: "Continue",
      disabled: false,
      cornerRadius: 8,
      emphasis: "strong",
      hint: "Go to the next step",
    },
  },
  disabled: {
    title: "Disabled",
    props: {
      label: "Continue",
      disabled: true,
      cornerRadius: 8,
      emphasis: "strong",
      hint: "The next step is unavailable",
    },
  },
};

export function ActionPropValues({ props }: { props: ActionProps }) {
  return (
    <dl className="ce-props" aria-label="Supplied props">
      {Object.entries({ ...props, hint: props.hint }).map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>
            <code>
              {value === undefined ? "Not set" : JSON.stringify(value)}
            </code>
          </dd>
        </div>
      ))}
    </dl>
  );
}
