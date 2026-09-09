import { MockLink } from "mokabook";

import type { ChangeStatus, ComparisonFixture } from "./comparison_fixtures.js";

const statusLabels = {
  unmodified: "Unmodified",
  added: "Added",
  changed: "Changed",
  removed: "Removed",
} as const;

export function ChangeStatusBadge({ status }: { status: ChangeStatus }) {
  return (
    <span
      className={`ce-change-status ce-${status}`}
      data-change-status={status}
    >
      {statusLabels[status]}
    </span>
  );
}

/** Factual evidence belongs to the inspector, with no generated visual narrative. */
export function ComparisonDetails({
  comparison,
}: {
  comparison?: ComparisonFixture | undefined;
}) {
  if (!comparison) return null;
  const prop = comparison.propChange;
  const reasons = {
    output: "Rendered output changed",
    inputs: "Supplied props changed",
    added: "Added since the comparison baseline",
    removed: "Removed since the comparison baseline",
    "variant-removed": "Saved variant removed",
  } as const;
  return (
    <section className="ce-comparison-evidence" aria-label="Comparison details">
      <h3>Comparison details</h3>
      <p className="ce-muted">Compared with the branch point on origin/main.</p>
      <dl className="ce-props">
        <div>
          <dt>Change</dt>
          <dd>{reasons[comparison.reason]}</dd>
        </div>
        {comparison.variant ? (
          <div>
            <dt>Saved variant</dt>
            <dd>{comparison.variant}</dd>
          </div>
        ) : null}
        {comparison.savedPropsUnchanged ? (
          <div>
            <dt>Saved props</dt>
            <dd>Unchanged</dd>
          </div>
        ) : null}
      </dl>
      {prop ? (
        <>
          <h4>{prop.instance}</h4>
          <table className="ce-prop-comparison" aria-label="Changed props">
            <thead>
              <tr>
                <th>Prop</th>
                <th>Before</th>
                <th>Current</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">
                  <code>{prop.prop}</code>
                </th>
                <td>
                  <code>{JSON.stringify(prop.before)}</code>
                </td>
                <td>
                  <code>{JSON.stringify(prop.after)}</code>
                </td>
              </tr>
            </tbody>
          </table>
        </>
      ) : null}
      {comparison.changedComponents?.length ? (
        <>
          <h4>Changed components used here</h4>
          <ul className="ce-usage-list">
            {comparison.changedComponents.map((component) => (
              <li key={component.to}>
                <MockLink to={component.to}>{component.title}</MockLink>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
