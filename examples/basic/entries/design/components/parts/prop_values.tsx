export function PropValues({
  disabled = false,
  label = "Continue",
}: {
  disabled?: boolean;
  label?: string;
}) {
  return (
    <dl className="ce-props" aria-label="Supplied props">
      <div>
        <dt>label</dt>
        <dd>
          <code>"{label}"</code>
        </dd>
      </div>
      <div>
        <dt>disabled</dt>
        <dd>
          <code>{String(disabled)}</code>
        </dd>
      </div>
    </dl>
  );
}
