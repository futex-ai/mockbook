import path from "node:path";

import { resolveExportOutput } from "../../dist/export/paths.js";
import { exportCatalogue } from "../../dist/export/run.js";
import { assertExportOwnership } from "../../dist/export/ownership.js";
import { isExportPublicName } from "../../dist/export/resource_policy.js";
import { comparisonMetadata } from "./comparisons.mjs";

const markerName = ".mokabook-preview-artifact";
const legacyOwnership = {
  marker: markerName,
  contents: "schemaVersion=1\n",
  accepts: (name) =>
    ["index.html", "404.html", "_headers", "_redirects"].includes(name) ||
    (name.startsWith("view/") && name.endsWith(".html")) ||
    (name.startsWith("static/") && isExportPublicName(name.slice(7))) ||
    /^__mokabook\/(?:shell\.css|client\/[^/]+\.js|navigation\/[^/]+\.js|fonts\/[^/]+|diffs\/__generations\/[A-Za-z0-9-]+\/.+)$/.test(
      name,
    ),
};

/** Keep the repository's Pages deployment policy outside the consumer exporter. */
export async function buildPreview(config, output) {
  const contextRoot = path.join(config.repoRoot, ".context");
  const confinedOutput = resolveExportOutput(config, output, contextRoot);
  try {
    await assertExportOwnership(confinedOutput, legacyOwnership);
  } catch (cause) {
    throw new Error(
      `refusing to replace unowned preview directory: ${output}`,
      { cause },
    );
  }
  try {
    return await exportCatalogue(config, {
      outDir: confinedOutput,
      adapter: {
        legacyOwnership,
        outputRoot: contextRoot,
        transform: pagesArtifact,
      },
    });
  } catch (cause) {
    throw new Error(
      "preview comparison failed or catalogue could not be exported",
      { cause },
    );
  }
}

/** Stage Pages URL normalization and metadata before atomic installation. */
function pagesArtifact(files, result) {
  const aliases = new Map();
  for (const [name, bytes] of files) {
    if (/^(?:view|static)\/.+\.html$/.test(name))
      aliases.set(name.slice(0, -5), name);
    if (name.endsWith(".html") && !name.startsWith("__mokabook/diffs/"))
      files.set(
        name,
        Buffer.from(bytes)
          .toString("utf8")
          .replace(
            /(href|src|data-fragment-light|data-fragment-dark)="\/(static|view)\/([^"]+)\.html"/g,
            '$1="/$2/$3"',
          ),
      );
  }
  const comparison = comparisonMetadata(result.comparisonUrl);
  const ids = Object.entries(result.idRoutes).map(
    ([id, route]) =>
      `/id/${encodeURIComponent(id)} ${route.replace(/\.html$/, "")} 302`,
  );
  files.set("_redirects", `${[comparison.redirect, ...ids].join("\n")}\n`);
  files.set("_headers", comparison.headers);
  files.set(markerName, legacyOwnership.contents);
  return aliases;
}
