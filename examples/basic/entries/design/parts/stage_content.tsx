import type { ReactNode } from "react";

import { DesignLink } from "./design_navigation.js";
import type { DesignDestination } from "./destinations.js";

interface FlowStepProps {
  children: ReactNode;
  description: string;
  number: number;
  screenId: DesignDestination;
  title: string;
}

/** One ordered use-case step embedding an existing screen. */
export function FlowStep({
  children,
  description,
  number,
  screenId,
  title,
}: FlowStepProps) {
  return (
    <section className="flow-step">
      <div className="flow-step-head">
        <span className="flow-step-num">{number}</span>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
          <DesignLink to={screenId}>
            <span className="flow-step-link">
              This screen in the catalogue: #{screenId} →
            </span>
          </DesignLink>
        </div>
      </div>
      <div className="mbk-flow-screen">{children}</div>
    </section>
  );
}

interface EmptyStateProps {
  to: DesignDestination;
  body: string;
  code?: string;
  linkLabel: string;
  title: string;
}

/** Centered home, missing-route, or empty-result view. */
export function EmptyState({
  body,
  code,
  linkLabel,
  title,
  to,
}: EmptyStateProps) {
  return (
    <div className="mbk-empty">
      <h2>{title}</h2>
      <p>
        {body}
        {code ? (
          <>
            {" "}
            <code>{code}</code>
          </>
        ) : null}
      </p>
      <DesignLink to={to}>
        <span className="mbk-empty-link">{linkLabel}</span>
      </DesignLink>
    </div>
  );
}
