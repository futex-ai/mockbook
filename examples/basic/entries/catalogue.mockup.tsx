import { Badge } from "@firna/ui/badge";
import { Button } from "@firna/ui/button";
import { Input } from "@firna/ui/input";
import {
  defineCollection,
  defineScreen,
  definePage,
  defineUseCase,
  MockLink,
  ReviewIgnore,
  reviewMaterialKey,
} from "mokabook";

import { renderExampleDocument } from "./document.js";

const metadata = {
  dependencies: ["examples/basic/generated/styles.css"],
  relatedDocs: ["examples/basic/notes.md"],
};

/**
 * Firna needs handlers to render enabled controls without warnings. The
 * generated MockLink anchors navigate natively; these callbacks never run.
 */
const noop = (): void => undefined;

function Welcome({ compact }: { compact: boolean }) {
  return (
    <main id="welcome" className="example-screen">
      <ReviewIgnore
        id="example-nav"
        materialKey={reviewMaterialKey({ compact })}
      >
        <nav>{compact ? "Menu" : "Example navigation"}</nav>
      </ReviewIgnore>
      <header className="example-head">
        <h1>Welcome to Mokabook</h1>
        <Badge tone="primary">Example</Badge>
      </header>
      <Input
        aria-label="Workspace name"
        onChangeText={noop}
        placeholder="Name this workspace"
        value=""
      />
      <MockLink asChild fragment="details" to="example-details">
        <Button onPress={noop} tone="primary">
          View details
        </Button>
      </MockLink>
      <MockLink fragment="details" to="example-details">
        Open the details screen
      </MockLink>
      <p>
        <MockLink to="example-handbook" fragment="next-steps">
          Read the handbook
        </MockLink>
      </p>
      <p>
        <MockLink to="design-browse-home">
          See the Mokabook shell design
        </MockLink>
      </p>
    </main>
  );
}

function Details({ compact }: { compact: boolean }) {
  return (
    <main id="details" className="example-screen">
      <header className="example-head">
        <h1>{compact ? "Details" : "Example catalogue details"}</h1>
        <Badge tone="neutral">Synthetic</Badge>
      </header>
      <p>This screen is synthetic and belongs only to the package example.</p>
      <MockLink asChild to="example-welcome">
        <Button onPress={noop} tone="secondary">
          Return to welcome
        </Button>
      </MockLink>
      <MockLink to="example-welcome">Return to welcome</MockLink>
    </main>
  );
}

export const mockups = [
  defineCollection({
    ...metadata,
    childIds: ["example-screens", "example-tour", "example-handbook"],
    description: "Synthetic examples for the reusable Mokabook package.",
    id: "example",
    title: "Example",
  }),
  defineCollection({
    ...metadata,
    childIds: ["example-welcome", "example-details"],
    description: "Synthetic screens used to exercise the reusable framework.",
    id: "example-screens",
    title: "Screens",
  }),
  defineScreen({
    ...metadata,
    address: "example.test/welcome",
    description: "A linked landing screen for the neutral fixture.",
    desktop: <Welcome compact={false} />,
    id: "example-welcome",
    mobile: <Welcome compact />,
    route: "screens/welcome.html",
    tags: ["forms", "onboarding"],
    title: "Welcome",
    useCaseIds: ["example-tour"],
  }),
  defineScreen({
    ...metadata,
    address: "example.test/details",
    description: "A second synthetic screen proving cross-screen links.",
    desktop: <Details compact={false} />,
    id: "example-details",
    mobile: <Details compact />,
    route: "screens/details.html",
    tags: ["forms"],
    title: "Details",
    useCaseIds: ["example-tour"],
  }),
  definePage({
    ...metadata,
    id: "example-handbook",
    title: "Getting started",
    description: "A handbook to accompany the example screens.",
    route: "handbook.html",
    tags: ["documents"],
    render: renderExampleDocument,
  }),
  defineUseCase({
    ...metadata,
    description: "An ordered journey that reuses both canonical screens.",
    id: "example-tour",
    route: "user-flows/example-tour.html",
    steps: [{ screenId: "example-welcome" }, { screenId: "example-details" }],
    title: "Example tour",
  }),
];
