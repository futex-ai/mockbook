import type { CSSProperties } from "react";

import { DesignLink, useDesignNavigation } from "./design_navigation.js";
import { DESTINATIONS, type DesignDestination } from "./destinations.js";
import {
  FlowIcon,
  FolderIcon,
  FolderOpenIcon,
  PageIcon,
  ScreenIcon,
} from "./icons.js";
import { NavResizeHandle } from "./nav_resize.js";

/** One entry in the catalogue navigation tree. */
export interface NavNode {
  /** Optional child count shown for a collection. */
  count?: number;
  /** Nesting depth (0 = top level), used for indentation. */
  depth: number;
  kind: "collection" | "flow" | "page" | "screen";
  label: string;
  to?: DesignDestination;
  /** Whether a collection is expanded (screens and flows ignore this). */
  open?: boolean;
}

const NAV_TREE: readonly NavNode[] = [
  { count: 3, depth: 0, kind: "collection", label: "Example", open: true },
  { count: 2, depth: 1, kind: "collection", label: "Screens", open: true },
  { depth: 2, kind: "screen", label: "Welcome", to: DESTINATIONS.welcome },
  { depth: 2, kind: "screen", label: "Details", to: DESTINATIONS.details },
  { depth: 1, kind: "flow", label: "Example tour", to: DESTINATIONS.tour },
  { count: 2, depth: 0, kind: "collection", label: "Design", open: true },
  { depth: 1, kind: "collection", label: "Browse shell" },
  { depth: 1, kind: "collection", label: "Changes" },
];

/** Left padding applied to a top-level (depth 0) row, in pixels. */
const ROOT_INSET = 8;
/** Horizontal distance between nesting levels, in pixels. */
const INDENT_STEP = 16;
/** X offset of a level's guide line, aligned under that level's icon. */
const GUIDE_OFFSET = 15;

function navRowStyle(depth: number): CSSProperties {
  const level = Math.max(depth, 0);
  const style: Record<string, number | string> = {
    "--mbk-indent": `${level * INDENT_STEP}px`,
    paddingLeft: ROOT_INSET + level * INDENT_STEP,
  };
  if (level === 0) {
    return style as CSSProperties;
  }
  const images: string[] = [];
  const positions: string[] = [];
  const sizes: string[] = [];
  for (let ancestor = 0; ancestor < level; ancestor += 1) {
    images.push("linear-gradient(var(--mbk-guide), var(--mbk-guide))");
    positions.push(`${GUIDE_OFFSET + ancestor * INDENT_STEP}px 0`);
    sizes.push("1px 100%");
  }
  style.backgroundImage = images.join(", ");
  style.backgroundPosition = positions.join(", ");
  style.backgroundSize = sizes.join(", ");
  style.backgroundRepeat = "no-repeat";
  return style as CSSProperties;
}

function NavRow({
  activeLabel,
  node,
}: {
  activeLabel?: string | undefined;
  node: NavNode;
}) {
  const isActive =
    node.kind !== "collection" &&
    activeLabel !== undefined &&
    node.label === activeLabel;
  const className = isActive ? "mbk-nav-row active" : "mbk-nav-row";
  if (node.kind === "collection") {
    return (
      <span className={className} style={navRowStyle(node.depth)}>
        <span className="mbk-nav-ico folder" aria-hidden="true">
          {node.open ? <FolderOpenIcon /> : <FolderIcon />}
        </span>
        <span className="mbk-nav-label">{node.label}</span>
        {node.count !== undefined ? (
          <span className="mbk-nav-count">{node.count}</span>
        ) : null}
      </span>
    );
  }
  return (
    <DesignLink to={node.to}>
      <span
        className={className}
        style={navRowStyle(node.depth)}
        aria-current={isActive ? "page" : undefined}
      >
        <span
          className={node.kind === "flow" ? "mbk-nav-ico flow" : "mbk-nav-ico"}
          aria-hidden="true"
        >
          {node.kind === "flow" ? (
            <FlowIcon />
          ) : node.kind === "page" ? (
            <PageIcon />
          ) : (
            <ScreenIcon />
          )}
        </span>
        {node.label}
      </span>
    </DesignLink>
  );
}

interface NavTreeProps {
  changes?: boolean | undefined;
  activeLabel?: string | undefined;
  changedCount?: number | undefined;
  changedOnly?: boolean | undefined;
  /** Rows to draw instead of the whole catalogue, as a filter leaves them. */
  nodes?: readonly NavNode[] | undefined;
}

function CatalogueBody({
  changes = true,
  activeLabel,
  changedCount = 3,
  changedOnly,
  nodes,
}: NavTreeProps) {
  const navigation = useDesignNavigation();
  return (
    <>
      <div className="mbk-nav-head">
        Catalogue<span>Collapse all</span>
      </div>
      {changes ? (
        <div
          className="mbk-nav-filter"
          role="group"
          aria-label="Catalogue filter"
        >
          <DesignLink to={changedOnly ? navigation.all : undefined}>
            <span
              className={
                changedOnly ? "mbk-nav-filter-opt" : "mbk-nav-filter-opt active"
              }
            >
              All
            </span>
          </DesignLink>
          <DesignLink to={changedOnly ? undefined : navigation.changes}>
            <span
              className={
                changedOnly ? "mbk-nav-filter-opt active" : "mbk-nav-filter-opt"
              }
            >
              Changes
              <span className="mbk-nav-filter-count">{changedCount}</span>
            </span>
          </DesignLink>
        </div>
      ) : null}
      <div className="mbk-nav-scroll">
        {(nodes ?? NAV_TREE).map((node, index) => (
          <NavRow
            key={`${node.label}-${index}`}
            activeLabel={activeLabel}
            node={node}
          />
        ))}
      </div>
    </>
  );
}

/** Persistent desktop catalogue navigation. */
export function NavTree({
  changes,
  activeLabel,
  changedCount,
  changedOnly,
  nodes,
}: NavTreeProps) {
  return (
    <nav className="mbk-nav" aria-label="Catalogue">
      <CatalogueBody
        changes={changes}
        activeLabel={activeLabel}
        changedCount={changedCount}
        changedOnly={changedOnly}
        nodes={nodes}
      />
      <NavResizeHandle />
    </nav>
  );
}

/** Mobile catalogue navigation drawer, shown open. */
export function NavDrawer({
  changes,
  activeLabel,
  changedCount,
  changedOnly,
  nodes,
}: NavTreeProps) {
  return (
    <nav className="mbk-nav mbk-drawer" aria-label="Catalogue">
      <CatalogueBody
        changes={changes}
        activeLabel={activeLabel}
        changedCount={changedCount}
        changedOnly={changedOnly}
        nodes={nodes}
      />
    </nav>
  );
}
