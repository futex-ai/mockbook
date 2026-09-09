import { MockLink } from "mokabook";
import type { ReactNode } from "react";

import { NavTree, type NavNode } from "../../parts/nav.js";
import { Shell, type ArtboardViewport } from "../../parts/shell.js";

export type ChangeScenario = "all" | "component" | "screen" | "removed";

function nodes(scenario: ChangeScenario, active: string): NavNode[] {
  const reading = active === "Reading room";
  const screens: NavNode[] =
    scenario === "component"
      ? []
      : [
          {
            depth: 0,
            kind: "collection",
            label: "Screens",
            count:
              scenario === "screen" || scenario === "removed"
                ? 1
                : reading
                  ? 3
                  : 2,
            open: true,
          },
          {
            depth: 1,
            kind: "screen",
            label: scenario === "removed" ? "Farewell" : "Welcome",
            to:
              scenario === "removed"
                ? "design-component-removed-consumer"
                : scenario === "screen"
                  ? "design-component-inspection-direct-change"
                  : "design-component-inspection-details",
          },
          ...(scenario === "all"
            ? [
                {
                  depth: 1,
                  kind: "screen" as const,
                  label: "Details",
                  to: "design-component-inspection-consumer",
                },
              ]
            : []),
          ...(reading
            ? [
                {
                  depth: 1,
                  kind: "screen" as const,
                  label: "Reading room",
                  to: "design-component-empty",
                },
              ]
            : []),
        ];
  return [
    ...screens,
    {
      depth: 0,
      kind: "collection",
      label: "Components",
      count: scenario === "all" ? 4 : 1,
      open: true,
    },
    {
      depth: 1,
      kind: "component",
      label: "Action",
      to:
        scenario === "removed"
          ? "design-component-removed"
          : scenario === "all"
            ? "design-component-overview"
            : "design-component-affected",
    },
    ...(scenario === "all"
      ? [
          {
            depth: 1,
            kind: "component" as const,
            label: "Toolbar",
            to: "design-component-toolbar",
          },
          {
            depth: 1,
            kind: "component" as const,
            label: "Help hint",
            to: "design-component-help",
          },
          {
            depth: 1,
            kind: "component" as const,
            label: "Badge",
            to: "design-component-unused",
          },
        ]
      : []),
  ];
}

/** Existing shell and navigation composed around the component design scenario. */
export function ExplorerShell({
  active = "Action",
  children,
  scenario = "all",
  viewport,
}: {
  active?: string;
  children: ReactNode;
  scenario?: ChangeScenario;
  viewport: ArtboardViewport;
}) {
  const navProps = {
    activeLabel: active,
    changedCount: scenario === "screen" || scenario === "removed" ? 2 : 1,
    changedOnly: scenario !== "all",
    nodes: nodes(scenario, active),
  };
  return (
    <div className="ce-design">
      <Shell
        accessibleControls
        searchPlaceholder="Search catalogue…"
        viewport={viewport}
        colorScheme="light"
        nav={<NavTree {...navProps} />}
      >
        {viewport === "mobile" ? (
          <nav className="ce-mobile-location" aria-label="Catalogue shortcuts">
            <MockLink to="design-component-inspection-details">
              Screens
            </MockLink>
            <MockLink to="design-component-overview">Components</MockLink>
            <MockLink
              to={
                scenario === "removed"
                  ? "design-component-removed"
                  : scenario === "screen"
                    ? "design-component-inspection-direct-change"
                    : "design-component-affected"
              }
            >
              Changes{" "}
              <span className="ce-change-count">{navProps.changedCount}</span>
            </MockLink>
          </nav>
        ) : null}
        {children}
      </Shell>
    </div>
  );
}

/** Links outside the artboard connect owning pages without engineering copy inside it. */
export function DesignLinks({ children }: { children?: ReactNode }) {
  return (
    <nav className="ce-design-links" aria-label="Related design pages">
      <MockLink to="design-component-overview">Component explorer</MockLink>
      <MockLink to="design-component-variants">Saved variants</MockLink>
      <MockLink to="design-component-comparison">Comparisons</MockLink>
      <MockLink to="design-component-affected">Affected screens</MockLink>
      <MockLink to="design-component-inspection-details">
        Screen inspection
      </MockLink>
      <MockLink to="design-component-empty">
        Empty and unavailable states
      </MockLink>
      <MockLink to="design-component-unused">No consumers</MockLink>
      <MockLink to="design-component-removed">Removed variant</MockLink>
      {children}
    </nav>
  );
}
