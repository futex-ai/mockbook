import assert from "node:assert/strict";
import test from "node:test";

import { braceExpand, minimatch } from "minimatch";

test("catalogue globs retain ordinary brace alternatives and padded ranges", () => {
  assert.deepEqual(braceExpand("screens/{account,billing}/step-{01..03}.tsx"), [
    "screens/account/step-01.tsx",
    "screens/account/step-02.tsx",
    "screens/account/step-03.tsx",
    "screens/billing/step-01.tsx",
    "screens/billing/step-02.tsx",
    "screens/billing/step-03.tsx",
  ]);
  assert.equal(
    minimatch(
      "screens/billing/step-02.tsx",
      "screens/{account,billing}/**/*.tsx",
    ),
    true,
  );
});

test("glob expansion bounds total padded output, not just result count", () => {
  const first = `${"0".repeat(256)}1`;
  const expanded = braceExpand(`{${first}..100000}`);

  assert.equal(expanded[0], first);
  assert.ok(expanded.length > 1);
  assert.ok(
    expanded.reduce((length, value) => length + value.length, 0) <= 4_000_000,
    "padded sequences must respect the dependency's aggregate expansion budget",
  );
});
