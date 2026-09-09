import { screen } from "mokabook";

import { ExampleDocument } from "../document.js";
import { NavDrawer, NavTree, type NavNode } from "./parts/nav.js";
import { ScreenHead, Shell, type ArtboardViewport } from "./parts/shell.js";
import { EmptyState, Stage } from "./parts/stage.js";

const nodes: readonly NavNode[] = [
  { kind: "collection", label: "Example", count: 3, depth: 0, open: true },
  { kind: "screen", label: "Welcome", depth: 1 },
  { kind: "flow", label: "Example tour", depth: 1 },
  { kind: "page", label: "Getting started", depth: 1 },
];

function PageDetails({ removed = false }: { removed?: boolean }) {
  return (
    <section className="mbk-details">
      <div className="mbk-details-bar">Details</div>
      <div className="mbk-details-body">
        <div>
          <p>A handbook to accompany the example screens.</p>
          {removed ? <p>Location: Example › Handbook</p> : null}
        </div>
        <div className="mbk-meta">
          <p>
            Source: <code>entries/catalogue.mockup.tsx</code>
          </p>
          <p>
            Generated: <code>handbook.html</code>
          </p>
          <p>Tags: documents</p>
          <p>Related docs: Example notes</p>
        </div>
      </div>
    </section>
  );
}

function PageView({
  viewport,
  details = false,
  removed = false,
  drawer = false,
}: {
  viewport: ArtboardViewport;
  details?: boolean;
  removed?: boolean;
  drawer?: boolean;
}) {
  const label = removed ? "Getting started · Removed" : "Getting started";
  const tree = removed ? [{ kind: "page" as const, label, depth: 0 }] : nodes;
  const nav = (
    <NavTree
      activeLabel={label}
      changedOnly={removed}
      changedCount={1}
      nodes={tree}
    />
  );
  return (
    <Shell
      viewport={viewport}
      nav={nav}
      aside={
        viewport === "mobile" && drawer ? (
          <NavDrawer
            activeLabel={label}
            nodes={tree}
            changedOnly={removed}
            changedCount={1}
          />
        ) : null
      }
    >
      <ScreenHead
        comparisons={false}
        crumbs={removed ? ["Example", "Handbook"] : ["Example"]}
        idChip="example-handbook"
        title="Getting started"
        status={removed ? <span>Removed</span> : null}
      />
      {removed ? (
        <EmptyState
          title="Page removed"
          body="This document is no longer in the catalogue."
          linkLabel="Go to the catalogue home"
        />
      ) : (
        <Stage>
          <div
            style={{
              border: "1px solid #e3e5e0",
              borderRadius: 12,
              overflow: "auto",
              width: "100%",
            }}
          >
            <ExampleDocument />
          </div>
        </Stage>
      )}
      {details || removed ? <PageDetails removed={removed} /> : null}
    </Shell>
  );
}

function PageDesktop() {
  return <PageView viewport="desktop" />;
}
function PageMobile() {
  return <PageView viewport="mobile" />;
}
function PageDetailsDesktop() {
  return <PageView viewport="desktop" details />;
}
function PageDetailsMobile() {
  return <PageView viewport="mobile" details />;
}
function PageNavigationDesktop() {
  return <PageView viewport="desktop" drawer />;
}
function PageNavigationMobile() {
  return <PageView viewport="mobile" drawer />;
}
function RemovedPageDesktop() {
  return <PageView viewport="desktop" removed />;
}
function RemovedPageMobile() {
  return <PageView viewport="mobile" removed />;
}

/** Owning responsive page designs, shared before runtime presentation. */
export const pageScreens = [
  screen({
    id: "design-page-view",
    title: "Document page",
    description: "A whole document beside screens and flows in one hierarchy.",
    slug: "view",
    colorSchemes: ["light"],
    desktop: <PageDesktop />,
    mobile: <PageMobile />,
  }),
  screen({
    id: "design-page-details",
    title: "Document details",
    description: "Page metadata and the narrow catalogue drawer.",
    slug: "details",
    colorSchemes: ["light"],
    desktop: <PageDetailsDesktop />,
    mobile: <PageDetailsMobile />,
  }),
  screen({
    id: "design-page-navigation",
    title: "Document navigation",
    description:
      "A document in its declared collection, with the narrow catalogue drawer.",
    slug: "navigation",
    colorSchemes: ["light"],
    desktop: <PageNavigationDesktop />,
    mobile: <PageNavigationMobile />,
  }),
  screen({
    id: "design-page-removed",
    title: "Removed document",
    description:
      "A flat Changes row retains baseline context after its parents are deleted.",
    slug: "removed",
    colorSchemes: ["light"],
    desktop: <RemovedPageDesktop />,
    mobile: <RemovedPageMobile />,
  }),
];
