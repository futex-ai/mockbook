import { MockLink } from "mokabook";

import { DetailsPanel } from "../../parts/details.js";
import { componentUses, usageViews } from "./fixtures.js";

export type ComponentPageState =
  | "default"
  | "disabled"
  | "comparison"
  | "affected"
  | "toolbar"
  | "hidden"
  | "unused"
  | "removed";

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

function UsedBy({ state }: { state: ComponentPageState }) {
  const uses =
    state === "toolbar" || state === "hidden"
      ? componentUses.slice(0, 1)
      : componentUses;
  const screens = uses.filter((use) => use.kind === "screen");
  const components = uses.filter((use) => use.kind === "component");
  return (
    <section className="ce-usage-section" aria-label="Used by">
      <h3>
        Used by{" "}
        <span>
          {state === "unused"
            ? "0"
            : `${screens.length} ${screens.length === 1 ? "screen" : "screens"}${components.length ? ` · ${components.length} component` : ""}`}
        </span>
      </h3>
      {state === "unused" ? (
        <p className="ce-empty-copy">No screens or components use Badge yet.</p>
      ) : (
        <ul className="ce-usage-list">
          {uses.map((use) => (
            <li key={use.title}>
              <MockLink
                to={
                  state === "toolbar"
                    ? "design-component-inspection-toolbar"
                    : state === "hidden"
                      ? "design-component-inspection-help"
                      : use.to
                }
              >
                {use.title}
                <span aria-hidden="true">↗</span>
              </MockLink>
              <span>
                {state === "toolbar" || state === "hidden"
                  ? "1 instance · Direct"
                  : `${use.count} ${use.count === 1 ? "instance" : "instances"} · ${use.via}`}{" "}
                · {usageViews.length} views
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AffectedScreens({ removed }: { removed: boolean }) {
  const screens = componentUses.filter((use) => use.kind === "screen");
  return (
    <section className="ce-affected" aria-label="Affected screens">
      <h3>
        Affected screens <span>{screens.length + (removed ? 1 : 0)}</span>
      </h3>
      <p>
        {removed
          ? "Current screens use Action. Former screens stay available to compare."
          : "These screens use Action. Their own content and props are unchanged."}
      </p>
      <ul className="ce-usage-list">
        {screens.map((use) => (
          <li key={use.title}>
            <MockLink to={use.to}>
              {use.title}
              <span aria-hidden="true">↗</span>
            </MockLink>
            <span>
              {use.via} · {use.count}{" "}
              {use.count === 1 ? "instance" : "instances"}
            </span>
          </li>
        ))}
        {removed ? (
          <li>
            <MockLink to="design-component-removed-consumer">
              Farewell <span>Removed</span>
            </MockLink>
            <span>Previously used the Compact variant</span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

export function ComponentDetails({ state }: { state: ComponentPageState }) {
  const name =
    state === "toolbar"
      ? "Toolbar"
      : state === "unused"
        ? "Badge"
        : state === "hidden"
          ? "Help hint"
          : "Action";
  return (
    <DetailsPanel open>
      <div className="ce-component-details">
        <section>
          <h3>About {name}</h3>
          <p>
            {state === "toolbar"
              ? "A shared prompt with a single next action."
              : state === "unused"
                ? "A short label that draws attention to something new."
                : state === "hidden"
                  ? "Contextual help that appears when a reader needs it."
                  : "A clear next step, shared across screens."}
          </p>
          {state === "toolbar" ? (
            <>
              <h3>Components</h3>
              <MockLink to="design-component-overview">
                Action · Main action ↗
              </MockLink>
              <p className="ce-muted">1 instance · Default variant</p>
            </>
          ) : state === "hidden" ? (
            <>
              <h3>Supplied props</h3>
              <dl className="ce-props">
                <div>
                  <dt>visible</dt>
                  <dd>
                    <code>false</code>
                  </dd>
                </div>
              </dl>
            </>
          ) : state === "unused" ? (
            <>
              <h3>Supplied props</h3>
              <dl className="ce-props">
                <div>
                  <dt>label</dt>
                  <dd>
                    <code>"New"</code>
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <>
              <h3>Supplied props</h3>
              <PropValues disabled={state === "disabled"} />
            </>
          )}
          <p className="ce-muted">
            Source <code>components/{name.replace(" ", "")}.tsx</code>
          </p>
          <details className="ce-slot-details">
            <summary>Source and references</summary>
            <dl className="ce-props">
              <div>
                <dt>Schemes</dt>
                <dd>Light, Dark</dd>
              </div>
              <div>
                <dt>Tags</dt>
                <dd>Components</dd>
              </div>
              <div>
                <dt>Related docs</dt>
                <dd>Component guide</dd>
              </div>
              <div>
                <dt>Dependencies</dt>
                <dd>
                  <code>components/{name.replace(" ", "")}.tsx</code>
                </dd>
              </div>
            </dl>
          </details>
        </section>
        <UsedBy state={state} />
        {state === "affected" ||
        state === "comparison" ||
        state === "removed" ? (
          <AffectedScreens removed={state === "removed"} />
        ) : null}
      </div>
    </DetailsPanel>
  );
}
