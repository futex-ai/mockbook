import assert from "node:assert/strict";
import test from "node:test";

import {
  DetailsDisclosurePreference,
  type DetailsPreferenceStorage,
} from "../dist/client/browse_details.js";
import { applyNavVisibility } from "../dist/client/browse_navigation_state.js";
import { handleTagChipClick, syncTagChips } from "../dist/client/tag_filter.js";
import { asDocument, asElement, FakeNode } from "./helpers/fake_dom.js";

test("details preference restores and updates explicit disclosure", () => {
  const storage = new FakeStorage("closed");
  const preference = new DetailsDisclosurePreference(storage);
  const first = { open: true } as HTMLDetailsElement;
  preference.apply(fakeDocument(first));
  assert.equal(first.open, false);

  preference.remember(true);
  assert.equal(storage.value, "open");
  const second = { open: false } as HTMLDetailsElement;
  preference.apply(fakeDocument(second));
  assert.equal(second.open, true);
});

test("details preference keeps its in-memory state without storage", () => {
  const preference = new DetailsDisclosurePreference(new FailingStorage());
  const initial = { open: true } as HTMLDetailsElement;
  preference.apply(fakeDocument(initial));
  assert.equal(initial.open, true);

  preference.remember(false);
  const replacement = { open: true } as HTMLDetailsElement;
  preference.apply(fakeDocument(replacement));
  assert.equal(replacement.open, false);
});

test("details preference records a completed activation before later tasks", async () => {
  const storage = new FakeStorage("closed");
  const preference = new DetailsDisclosurePreference(storage);
  const details = { open: false } as HTMLDetailsElement;

  preference.rememberActivation(details);
  details.open = true;
  await Promise.resolve();

  assert.equal(storage.value, "open");
});

test("a tag chip enters its term and filters the catalogue", () => {
  const shell = tagShell();

  assert.equal(
    handleTagChipClick(shell.doc, asElement(shell.formsGlyph)),
    true,
  );

  assert.equal(shell.search.value, "tag:forms");
  assert.equal(shell.search.dispatched[0]?.type, "input");
  assert.equal(shell.search.dispatched[0]?.bubbles, true);
  assert.equal(shell.welcomeRow.hidden, false);
  assert.equal(shell.detailsRow.hidden, false);
  assert.equal(shell.glossaryRow.hidden, true);
  assert.equal(shell.forms.classList.contains("active"), true);
  assert.equal(shell.onboarding.classList.contains("active"), false);
});

test("clicking the active chip clears only its tag term", () => {
  const shell = tagShell();
  shell.search.value = "welcome tag:forms";

  handleTagChipClick(shell.doc, asElement(shell.onboarding));
  assert.equal(shell.search.value, "welcome tag:onboarding");
  assert.equal(shell.forms.classList.contains("active"), false);
  assert.equal(shell.onboarding.classList.contains("active"), true);

  handleTagChipClick(shell.doc, asElement(shell.onboarding));
  assert.equal(shell.search.value, "welcome");
  assert.equal(shell.onboarding.classList.contains("active"), false);
});

test("chip state and clicks elsewhere follow the entered query", () => {
  const shell = tagShell();
  shell.search.value = "TAG:Onboarding";

  syncTagChips(shell.doc);
  assert.equal(shell.onboarding.classList.contains("active"), true);
  assert.equal(shell.forms.classList.contains("active"), false);

  shell.search.value = "";
  syncTagChips(shell.doc);
  assert.equal(shell.onboarding.classList.contains("active"), false);
  assert.equal(
    handleTagChipClick(shell.doc, asElement(shell.welcomeRow)),
    false,
  );
  assert.equal(shell.search.dispatched.length, 0);
});

/** The served details chips over one filtered catalogue column. */
interface TagShell {
  detailsRow: FakeNode;
  doc: Document;
  forms: FakeNode;
  formsGlyph: FakeNode;
  glossaryRow: FakeNode;
  onboarding: FakeNode;
  search: FakeNode;
  welcomeRow: FakeNode;
}

function tagShell(): TagShell {
  const search = new FakeNode("input", { "data-mokabook-search": "" });
  const formsGlyph = new FakeNode("svg", { "aria-hidden": "true" });
  const forms = new FakeNode(
    "button",
    { "data-mokabook-tag": "forms" },
    "forms",
  ).append(formsGlyph);
  const onboarding = new FakeNode(
    "button",
    { "data-mokabook-tag": "onboarding" },
    "onboarding",
  );
  const welcomeRow = navRow(
    "screens/welcome.html",
    "Welcome",
    "forms onboarding",
  );
  const detailsRow = navRow("screens/details.html", "Details", "forms");
  const glossaryRow = navRow("docs/glossary.html", "Glossary");
  const root = new FakeNode("div").append(
    search,
    new FakeNode("details", { "data-mokabook-details": "" }).append(
      forms,
      onboarding,
    ),
    new FakeNode("details", {
      "data-nav-collection": "collection:screens",
    }).append(welcomeRow, detailsRow),
    new FakeNode("details", {
      "data-nav-collection": "collection:docs",
    }).append(glossaryRow),
  );
  const doc = asDocument(root);
  search.onDispatch = () => {
    applyNavVisibility(doc, "reveal-matches");
    syncTagChips(doc);
  };
  return {
    detailsRow,
    doc,
    forms,
    formsGlyph,
    glossaryRow,
    onboarding,
    search,
    welcomeRow,
  };
}

function navRow(route: string, label: string, tags?: string): FakeNode {
  return new FakeNode(
    "a",
    {
      "data-nav-row": "",
      "data-route": route,
      href: `/view/${route}`,
      ...(tags === undefined ? {} : { "data-tags": tags }),
    },
    label,
  );
}

function fakeDocument(details: HTMLDetailsElement): Document {
  return {
    querySelector(selector: string) {
      assert.equal(selector, "[data-mokabook-details]");
      return details;
    },
  } as unknown as Document;
}

class FakeStorage implements DetailsPreferenceStorage {
  key: string | undefined;

  constructor(public value: string | null) {}

  getItem(key: string): string | null {
    this.key = key;
    return this.value;
  }

  setItem(key: string, value: string): void {
    assert.equal(key, this.key);
    this.value = value;
  }
}

class FailingStorage implements DetailsPreferenceStorage {
  getItem(): string | null {
    throw new Error("storage unavailable");
  }

  setItem(): void {
    throw new Error("storage unavailable");
  }
}
