import type { ReactNode } from "react";

import { DesignLink, useDesignNavigation } from "./design_navigation.js";
import { DESTINATIONS } from "./destinations.js";
import { ChevronIcon, FlowIcon } from "./icons.js";
import { SUBJECTS, type ScreenSubject } from "./subjects.js";
import { TagChips } from "./tag_filter.js";

function MetaRow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="mbk-meta-row">
      <span className="mbk-meta-k">{label}</span>
      <span className="mbk-meta-v">{children}</span>
    </div>
  );
}

function DetailsBody({
  activeTag,
  subject,
}: {
  activeTag?: string | undefined;
  subject: ScreenSubject;
}) {
  const metadata = SUBJECTS[subject];
  return (
    <div className="mbk-details-body">
      <div>
        <p className="mbk-details-desc">{metadata.description}</p>
        <p className="mbk-details-rationale">
          <span className="k">Why this screen — </span>
          {metadata.rationale}
        </p>
      </div>
      <div className="mbk-meta">
        <MetaRow label="Source">
          <code className="mbk-code">{metadata.source}</code>
        </MetaRow>
        <MetaRow label="Generated">
          <code className="mbk-code">{metadata.generated}</code>
        </MetaRow>
        <MetaRow label="Schemes">{metadata.schemes}</MetaRow>
        <MetaRow label="Tags">
          <TagChips activeTag={activeTag} tags={metadata.tags} />
        </MetaRow>
        {subject !== "farewell" ? (
          <MetaRow label="Related docs">
            <span className="mbk-meta-link">Example notes</span>
          </MetaRow>
        ) : null}
        {metadata.tour ? (
          <MetaRow label="Used by">
            <span className="mbk-chips">
              <DesignLink to={DESTINATIONS.tour}>
                <span className="mbk-chip flow">
                  <FlowIcon size={11} />
                  Example tour
                </span>
              </DesignLink>
            </span>
          </MetaRow>
        ) : null}
      </div>
    </div>
  );
}

type DetailsPanelProps = {
  /** Tag drawn as the selected chip because it is the current search term. */
  activeTag?: string | undefined;
  open?: boolean;
} & (
  | { subject: ScreenSubject; children?: never }
  | { subject?: never; children: ReactNode }
);

/** The collapsible details inspector at the foot of the stage. */
export function DetailsPanel({
  activeTag,
  children,
  open,
  subject,
}: DetailsPanelProps) {
  const navigation = useDesignNavigation();
  if (subject === undefined) {
    return (
      <details className="mbk-details" open={open}>
        <summary className="mbk-details-bar">Details</summary>
        {children}
      </details>
    );
  }
  return (
    <section className="mbk-details">
      <DesignLink to={navigation.inspector}>
        <div className="mbk-details-bar">
          <span className={open ? "chev open" : "chev"} aria-hidden="true">
            <ChevronIcon size={12} />
          </span>
          Details
          <span className="mbk-details-hint">
            {open
              ? "Description, rationale, source, related docs, and use cases"
              : "Show context for this screen"}
          </span>
        </div>
      </DesignLink>
      {open ? <DetailsBody activeTag={activeTag} subject={subject} /> : null}
    </section>
  );
}
