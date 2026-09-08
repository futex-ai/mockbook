import { NavTree, type NavNode } from "./nav.js";

/** Comparison classification states depicted by the design mockups. */
export type ReviewState =
  "added" | "changed" | "ignored-only" | "removed" | "unchanged";

const CHANGED_NODES: readonly NavNode[] = [
  { depth: 0, kind: "collection", label: "Example", open: true },
  { depth: 1, kind: "collection", label: "Screens", open: true },
  { depth: 2, kind: "screen", label: "Welcome" },
  { depth: 2, kind: "screen", label: "Details" },
  { depth: 0, kind: "screen", label: "Farewell · Removed" },
];

/** Changes uses the same catalogue navigation and filter as All. */
export function ReviewNav({
  activeTitle,
}: {
  activeTitle?: string | undefined;
}) {
  return (
    <NavTree
      activeLabel={
        activeTitle === "Farewell" ? "Farewell · Removed" : activeTitle
      }
      changedOnly
      nodes={CHANGED_NODES}
    />
  );
}

/** Empty Changes retains the catalogue filter. */
export function EmptyReviewNav() {
  return <NavTree changedOnly changedCount={0} nodes={[]} />;
}

/** File evidence belongs in the secondary comparison details. */
export function SharedImpactCard() {
  return (
    <>
      <p>Changes to these files may affect this screen:</p>
      <ul>
        <li>generated/styles.css</li>
      </ul>
    </>
  );
}

/** Content exclusions belong in the secondary comparison details. */
export function IgnoredImpactCard() {
  return <p>Excluded content: example-nav.</p>;
}
