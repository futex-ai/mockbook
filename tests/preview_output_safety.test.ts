import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { compileCatalogue } from "../dist/build/compile.js";
import { writeCompilation } from "../dist/build/transaction.js";
import { loadConfig } from "../dist/config/load.js";
import { buildPreview } from "../scripts/preview/catalogue.mjs";
import { createFixture, removeFixture } from "./helpers/fixture.js";

for (const includeChanges of [false, true]) {
  for (const link of ["context", "parent", "output"] as const) {
    test(`publication rejects an escaping ${link} symlink before writes (changes: ${includeChanges})`, async (context) => {
      const fixture = await createFixture();
      const outside = await createFixture();
      context.after(() => removeFixture(fixture));
      context.after(() => removeFixture(outside));
      const config = await loadConfig(fixture.root);
      await writeCompilation(await compileCatalogue(config), config);
      const contextRoot = path.join(fixture.root, ".context");
      const linked =
        link === "context" ? contextRoot : path.join(contextRoot, "linked");
      await fs.promises.mkdir(path.dirname(linked), { recursive: true });
      await fs.promises.symlink(outside.root, linked);
      const output =
        link === "output" ? linked : path.join(linked, "new/output");
      await fs.promises.writeFile(
        path.join(outside.root, ".mokabook-preview-artifact"),
        "schemaVersion=1\n",
      );
      const before = await fs.promises.readdir(outside.root, {
        recursive: true,
      });
      await assert.rejects(
        buildPreview(config, output, { includeChanges }),
        /preview output must be inside/,
      );
      assert.deepEqual(
        await fs.promises.readdir(outside.root, { recursive: true }),
        before,
      );
      assert.equal(
        await fs.promises.readFile(path.join(outside.root, "notes.md"), "utf8"),
        "# Fixture notes\n",
      );
    });
  }
}

test("publication accepts context and parent symlinks contained by the real repository", async (context) => {
  const fixture = await createFixture();
  const aliasRoot = await createFixture();
  context.after(() => removeFixture(fixture));
  context.after(() => removeFixture(aliasRoot));
  const rootAlias = path.join(aliasRoot.root, "repository");
  await fs.promises.symlink(fixture.root, rootAlias);
  const config = await loadConfig(rootAlias);
  await writeCompilation(await compileCatalogue(config), config);
  const artifacts = path.join(fixture.root, "artifacts");
  await fs.promises.mkdir(path.join(artifacts, "nested"), { recursive: true });
  await fs.promises.symlink("artifacts", path.join(fixture.root, ".context"));
  await fs.promises.symlink("nested", path.join(artifacts, "linked"));
  const output = path.join(rootAlias, ".context/linked/published");
  await buildPreview(config, output);
  assert.match(
    await fs.promises.readFile(
      path.join(artifacts, "nested/published/index.html"),
      "utf8",
    ),
    /<title>Mokabook<\/title>/,
  );
});
