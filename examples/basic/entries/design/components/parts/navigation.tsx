import { MockLink } from "mokabook";
import type { ReactNode } from "react";

import { NavTree, type NavNode } from "../../parts/nav.js";
import { Shell, type ArtboardViewport } from "../../parts/shell.js";
import {
  COMPONENT_PAGES,
  INSPECTION_PAGES,
  type ComponentDesignDestination,
} from "./destinations.js";

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
                ? INSPECTION_PAGES["removed-consumer"]
                : scenario === "screen"
                  ? INSPECTION_PAGES["direct-change"]
                  : INSPECTION_PAGES.details,
          },
          ...(scenario === "all"
            ? [
                {
                  depth: 1,
                  kind: "screen" as const,
                  label: "Details",
                  to: INSPECTION_PAGES.consumer,
                },
              ]
            : []),
          ...(reading
            ? [
                {
                  depth: 1,
                  kind: "screen" as const,
                  label: "Reading room",
                  to: INSPECTION_PAGES.empty,
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
          ? COMPONENT_PAGES.removed
          : scenario === "all"
            ? COMPONENT_PAGES.default
            : COMPONENT_PAGES.affected,
    },
    ...(scenario === "all"
      ? [
          {
            depth: 1,
            kind: "component" as const,
            label: "Toolbar",
            to: COMPONENT_PAGES.toolbar,
          },
          {
            depth: 1,
            kind: "component" as const,
            label: "Help hint",
            to: COMPONENT_PAGES.hidden,
          },
          {
            depth: 1,
            kind: "component" as const,
            label: "Badge",
            to: COMPONENT_PAGES.unused,
          },
        ]
      : []),
  ];
}

/** Existing shell and navigation composed around the component design scenario. */
export function ExplorerShell({
  active = "Action",
  children,
  design,
  scenario = "all",
  viewport,
}: {
  active?: string;
  children: ReactNode;
  design: ComponentDesignDestination;
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
        design={design}
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
