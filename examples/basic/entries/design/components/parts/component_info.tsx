import { COMPONENTS, type ComponentId } from "./metadata.js";

export function ComponentInfo({ identity }: { identity: ComponentId }) {
  const component = COMPONENTS[identity];
  return (
    <section>
      <h3>About {component.title}</h3>
      <p>{component.description}</p>
      <p className="ce-muted">
        Source <code>{component.source}</code>
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
              {component.dependencies.map((dependency) => (
                <code key={dependency}>{dependency}</code>
              ))}
            </dd>
          </div>
        </dl>
      </details>
    </section>
  );
}
