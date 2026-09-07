import assert from "node:assert/strict";
import test from "node:test";

import { navigationConstraintChanges } from "../dist/client/browse_navigation_state.js";
import {
  clearTagTerm,
  parseSearchQuery,
  rowMatchesQuery,
  setTagTerm,
} from "../dist/client/search_query.js";

const welcome = {
  route: "screens/welcome.html",
  tags: ["forms", "onboarding"],
  text: "Welcome",
};
const details = {
  route: "screens/details.html",
  tags: ["forms"],
  text: "Details",
};
const glossary = {
  route: "docs/glossary.html",
  tags: [],
  text: "Glossary",
};

test("active-row constraint changes clear only controls that hide it", () => {
  assert.deepEqual(
    navigationConstraintChanges({
      changed: false,
      changedOnly: true,
      query: "welcome",
      route: "screens/details.html",
      text: "Details",
    }),
    { clearQuery: true, showAll: true },
  );
  assert.deepEqual(
    navigationConstraintChanges({
      changed: true,
      changedOnly: true,
      query: "details",
      route: "screens/details.html",
      text: "Details",
    }),
    { clearQuery: false, showAll: false },
  );
  assert.deepEqual(
    navigationConstraintChanges({
      changed: false,
      changedOnly: false,
      query: "screens/details",
      route: "screens/details.html",
      text: "Something else",
    }),
    { clearQuery: false, showAll: false },
  );
});

test("search queries split tag terms from free text in any order", () => {
  assert.deepEqual(parseSearchQuery(""), { freeText: "", tags: [] });
  assert.deepEqual(parseSearchQuery("welcome screen"), {
    freeText: "welcome screen",
    tags: [],
  });
  assert.deepEqual(parseSearchQuery("tag:forms welcome"), {
    freeText: "welcome",
    tags: ["forms"],
  });
  assert.deepEqual(parseSearchQuery("welcome tag:forms"), {
    freeText: "welcome",
    tags: ["forms"],
  });
  assert.deepEqual(parseSearchQuery("tag:forms tag:onboarding"), {
    freeText: "",
    tags: ["forms", "onboarding"],
  });
});

test("search query parsing lowercases tags and collapses whitespace", () => {
  assert.deepEqual(parseSearchQuery("  TAG:Forms   Welcome  Screen  "), {
    freeText: "Welcome Screen",
    tags: ["forms"],
  });
  assert.deepEqual(parseSearchQuery("Tag:ONBOARDING"), {
    freeText: "",
    tags: ["onboarding"],
  });
  assert.deepEqual(parseSearchQuery("welcome\ttag:forms\nscreen"), {
    freeText: "welcome screen",
    tags: ["forms"],
  });
});

test("a tag prefix without a value stays free text verbatim", () => {
  assert.deepEqual(parseSearchQuery("tag: welcome"), {
    freeText: "tag: welcome",
    tags: [],
  });
  assert.deepEqual(parseSearchQuery("TAG:"), { freeText: "TAG:", tags: [] });
});

test("rows match only when every tag term is declared on the row", () => {
  assert.equal(rowMatchesQuery(parseSearchQuery(""), glossary), true);
  assert.equal(rowMatchesQuery(parseSearchQuery("tag:forms"), welcome), true);
  assert.equal(rowMatchesQuery(parseSearchQuery("tag:forms"), details), true);
  assert.equal(rowMatchesQuery(parseSearchQuery("tag:forms"), glossary), false);
  assert.equal(
    rowMatchesQuery(parseSearchQuery("tag:forms tag:onboarding"), welcome),
    true,
  );
  assert.equal(
    rowMatchesQuery(parseSearchQuery("tag:forms tag:onboarding"), details),
    false,
  );
  assert.equal(
    rowMatchesQuery(parseSearchQuery("TAG:Forms"), {
      route: "screens/legacy.html",
      tags: ["Forms"],
      text: "Legacy",
    }),
    true,
  );
});

test("an unmatched tag term hides a row free text alone would match", () => {
  assert.equal(rowMatchesQuery(parseSearchQuery("details"), details), true);
  assert.equal(
    rowMatchesQuery(parseSearchQuery("tag:onboarding details"), details),
    false,
  );
});

test("free text matches row text or route regardless of term order", () => {
  assert.equal(rowMatchesQuery(parseSearchQuery("WELCOME"), welcome), true);
  assert.equal(
    rowMatchesQuery(parseSearchQuery("screens/welcome"), welcome),
    true,
  );
  assert.equal(rowMatchesQuery(parseSearchQuery("glossary"), welcome), false);
  assert.equal(
    rowMatchesQuery(parseSearchQuery("welcome screen"), welcome),
    false,
  );
  assert.equal(
    rowMatchesQuery(parseSearchQuery("tag:forms welcome"), welcome),
    true,
  );
  assert.equal(
    rowMatchesQuery(parseSearchQuery("welcome tag:forms"), welcome),
    true,
  );
  assert.equal(
    rowMatchesQuery(parseSearchQuery("tag:forms welcome"), details),
    false,
  );
});

test("setting a tag term keeps free text and leaves exactly one tag", () => {
  assert.equal(
    setTagTerm("tag:onboarding welcome", "forms"),
    "welcome tag:forms",
  );
  assert.equal(setTagTerm("", "forms"), "tag:forms");
  assert.equal(setTagTerm("   ", "forms"), "tag:forms");
  assert.equal(setTagTerm("welcome", "forms"), "welcome tag:forms");
  assert.equal(setTagTerm("tag:forms", "forms"), "tag:forms");
  assert.equal(
    setTagTerm("  TAG:Onboarding  Welcome   Screen tag:forms ", "onboarding"),
    "Welcome Screen tag:onboarding",
  );
});

test("clearing a tag term removes only that tag term", () => {
  assert.equal(clearTagTerm("welcome tag:forms", "forms"), "welcome");
  assert.equal(
    clearTagTerm("tag:onboarding welcome tag:forms", "forms"),
    "tag:onboarding welcome",
  );
  assert.equal(
    clearTagTerm("  welcome   TAG:Forms  details ", "forms"),
    "welcome details",
  );
  assert.equal(
    clearTagTerm("welcome tag:forms", "onboarding"),
    "welcome tag:forms",
  );
  assert.equal(
    clearTagTerm("welcome tag:forms-wide", "forms"),
    "welcome tag:forms-wide",
  );
  assert.equal(clearTagTerm("tag:forms", "forms"), "");
  assert.equal(
    clearTagTerm(setTagTerm("welcome", "forms"), "forms"),
    "welcome",
  );
});
