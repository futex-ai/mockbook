import type { DesignDestination } from "./destinations.js";
import { DESTINATIONS } from "./destinations.js";
import { DetailsPanel } from "./details.js";
import { MiniWelcome } from "./mini_screens.js";
import { NavTree, type NavNode } from "./nav.js";
import { WelcomeHead } from "./screen_heads.js";
import { Shell, type ArtboardViewport } from "./shell.js";
import { BrowserFrame, PhoneFrame, Stage } from "./stage.js";
import type { CatalogueTag } from "./tags.js";

function taggedTree(tag: CatalogueTag): readonly NavNode[] {
  const count = tag === "forms" ? 2 : 1;
  return [
    {
      key: "example",
      count,
      depth: 0,
      kind: "collection",
      label: "Example",
      open: true,
    },
    {
      key: "screens",
      count,
      depth: 1,
      kind: "collection",
      label: "Screens",
      open: true,
    },
    {
      key: "welcome",
      depth: 2,
      kind: "screen",
      label: "Welcome",
      to: DESTINATIONS.welcome,
    },
    ...(tag === "forms"
      ? [
          {
            key: "details",
            depth: 2,
            kind: "screen" as const,
            label: "Details",
            to: DESTINATIONS.details,
          },
        ]
      : []),
  ];
}

/** Shared depiction of a Welcome search state for its owning artboards. */
export function TagScreen({
  design,
  tag,
  picker = false,
  viewport,
}: {
  design: DesignDestination;
  tag?: CatalogueTag;
  picker?: boolean;
  viewport: ArtboardViewport;
}) {
  return (
    <Shell
      design={design}
      activeTag={tag}
      viewport={viewport}
      nav={
        <NavTree
          activeLabel="Welcome"
          nodes={tag ? taggedTree(tag) : undefined}
        />
      }
      searchValue={tag ? `tag:${tag}` : undefined}
      tagPickerOpen={picker}
    >
      <WelcomeHead active={viewport} />
      <Stage>
        {viewport === "desktop" ? (
          <BrowserFrame address="example.test/welcome" label="Desktop">
            <MiniWelcome />
          </BrowserFrame>
        ) : (
          <PhoneFrame label="Mobile" small>
            <MiniWelcome compact />
          </PhoneFrame>
        )}
      </Stage>
      {viewport === "desktop" ? (
        <DetailsPanel subject="welcome" activeTag={tag} open />
      ) : null}
    </Shell>
  );
}
