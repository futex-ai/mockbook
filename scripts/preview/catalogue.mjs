import fs from "node:fs";
import path from "node:path";

import { publicationOptions } from "../../dist/publication/options.js";
import {
  NodeGitCommandRunner,
  RepositoryGitClient,
} from "../../dist/review/git.js";
import { fingerprintInputs, isComparisonPath } from "./inputs.mjs";
import { adaptBrowseDocument } from "../../dist/browse/document_adapter.js";
import {
  isInside,
  projectRealPath,
  toPosixPath,
} from "../../dist/config/paths.js";
import { isPublicStaticFile } from "../../dist/config/public_files.js";
import { readManifest } from "../../dist/registry/manifest.js";
import { createCatalogue } from "../../dist/server/catalogue.js";
import { computeCatalogueChanges } from "../../dist/server/changed.js";
import {
  loadBrowserClientModules,
  loadBrowserNavigationModules,
  loadShellFontAssets,
} from "../../dist/server/client_modules.js";
import { startCatalogueServer } from "../../dist/server/http.js";
import {
  captureComparison,
  previewComparisonProvider,
  publishComparison,
} from "./comparisons.mjs";

const markerName = ".mokabook-preview-artifact";
const liveUpdateScript =
  '<script src="/__mokabook/client/browser.js" type="module"></script>';

/** Publish the real catalogue shell and isolated Git comparisons together. */
export async function buildPreview(config, output, options = {}) {
  const capability = publicationOptions(options);
  assertSafeOutput(output, config.repoRoot);
  assertOwnedOutput(output);
  await fs.promises.mkdir(path.dirname(output), { recursive: true });
  const stage = await fs.promises.mkdtemp(
    path.join(path.dirname(output), ".mokabook-preview-stage-"),
  );
  try {
    const manifest = readManifest(config);
    const catalogue = createCatalogue(manifest);
    const base = capability.includeChanges
      ? (capability.base ?? config.review.base)
      : "";
    const fingerprint = capability.includeChanges
      ? await fingerprintInputs(config)
      : undefined;
    let git;
    if (capability.includeChanges) {
      const repository = new RepositoryGitClient(
        new NodeGitCommandRunner(config.repoRoot),
      );
      const commit = await repository.mergeBase(base, "HEAD");
      git = new Proxy(repository, {
        get(target, key) {
          if (key === "mergeBase") return async () => commit;
          const value = Reflect.get(target, key);
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
    }
    const changes = git
      ? await computeCatalogueChanges(config, base, git)
      : undefined;
    const changedRoutes = changes?.changedRoutes;
    if (capability.includeChanges && !changedRoutes)
      throw new Error("preview change detection failed");
    const review = git
      ? previewComparisonProvider(config, stage, base, git)
      : undefined;
    const server = await startCatalogueServer(config, {
      base,
      ...(changes ? { changes } : {}),
      ...(changedRoutes ? { changedRoutes } : {}),
      port: 0,
      ...(review ? { review } : {}),
    });
    let comparison;
    let removed = [];
    try {
      if (review) {
        comparison = await captureComparison(server.url);
        removed = changes.removedEntries.map(({ entry }) => entry);
      }
      await capturePage(server.url, "/", stage, "index.html");
      for (const entry of [...manifest.entries, ...removed]) {
        if (entry.kind === "collection") continue;
        await capturePage(
          server.url,
          `/view/${encodePath(entry.route)}`,
          stage,
          `view/${entry.route}`,
        );
      }
      await capturePage(
        server.url,
        "/preview-route-that-does-not-exist",
        stage,
        "404.html",
        404,
      );
      await captureAssets(server.url, stage);
    } finally {
      await server.close();
    }
    if (review && comparison)
      await publishComparison(review, comparison, stage);
    await copyPublicFiles(config, catalogue, stage);
    await writeText(
      stage,
      "_redirects",
      [
        ...(comparison ? [comparison.redirect] : []),
        redirects([
          ...manifest.entries,
          ...removed.filter((screen) => !catalogue.byId.has(screen.id)),
        ]),
      ].join("\n"),
    );
    if (comparison)
      await writeText(
        stage,
        "_headers",
        "/__mokabook/diffs/*\n  Cache-Control: no-store\n  X-Content-Type-Options: nosniff\n",
      );
    if (
      fingerprint !== undefined &&
      fingerprint !== (await fingerprintInputs(config))
    )
      throw new Error(
        "consumer inputs changed during publication; retry with stable inputs",
      );
    await writeText(stage, markerName, "schemaVersion=1\n");
    await installArtifact(stage, output);
  } catch (error) {
    await fs.promises.rm(stage, { force: true, recursive: true });
    throw error;
  }
}

async function captureAssets(serverUrl, stage) {
  for (const asset of shellAssets()) {
    const response = await fetch(`${serverUrl}${asset}`);
    if (!response.ok)
      throw new Error(`preview asset ${asset} returned ${response.status}`);
    await writeFile(
      stage,
      asset.slice(1),
      Buffer.from(await response.arrayBuffer()),
    );
  }
}

function shellAssets() {
  return [
    "/__mokabook/shell.css",
    ...[...loadBrowserClientModules().keys()]
      .filter((name) => name !== "browser.js" && name !== "live_updates.js")
      .map((name) => `/__mokabook/client/${name}`),
    ...[...loadBrowserNavigationModules().keys()].map(
      (name) => `/__mokabook/navigation/${name}`,
    ),
    ...[...loadShellFontAssets().keys()].map(
      (name) => `/__mokabook/fonts/${name}`,
    ),
  ];
}

async function capturePage(
  serverUrl,
  route,
  stage,
  relativePath,
  expectedStatus = 200,
) {
  const response = await fetch(`${serverUrl}${route}`);
  if (response.status !== expectedStatus) {
    throw new Error(
      `preview page ${route} returned ${response.status}, expected ${expectedStatus}`,
    );
  }
  const html = await response.text();
  if (!html.includes(liveUpdateScript)) {
    throw new Error(`preview page ${route} is missing its live-update script`);
  }
  await writeText(stage, relativePath, staticPage(html));
}

async function copyPublicFiles(config, catalogue, stage) {
  for (const candidate of await regularFiles(config.mockupsDir)) {
    if (
      !isPublicStaticFile(candidate, config) ||
      isComparisonPath(candidate, config)
    )
      continue;
    const relative = toPosixPath(path.relative(config.mockupsDir, candidate));
    const target = path.join(stage, "static", relative);
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    const content = await fs.promises.readFile(candidate);
    const extension = path.extname(candidate).toLowerCase();
    const adapted =
      extension === ".html" || extension === ".htm"
        ? Buffer.from(
            adaptBrowseDocument(content.toString("utf8"), relative, catalogue),
          )
        : content;
    await fs.promises.writeFile(target, adapted);
  }
}

async function regularFiles(root) {
  const files = [];
  const entries = await fs.promises.readdir(root, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const candidate = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...(await regularFiles(candidate)));
    else if (entry.isFile()) files.push(candidate);
  }
  return files;
}

function redirects(entries) {
  const lines = entries.flatMap((entry) =>
    entry.kind === "collection"
      ? []
      : [
          `/id/${encodeURIComponent(entry.id)} /view/${pagesPath(entry.route)} 302`,
        ],
  );
  return `${lines.join("\n")}\n`;
}

function staticPage(html) {
  return html
    .replace(liveUpdateScript, "")
    .replace(
      /(href|src|data-fragment-light|data-fragment-dark)="\/(static|view)\/([^"]+)\.html"/g,
      '$1="/$2/$3"',
    );
}

async function installArtifact(stage, output) {
  if (!fs.existsSync(output)) {
    await fs.promises.rename(stage, output);
    return;
  }
  const backup = await fs.promises.mkdtemp(
    path.join(path.dirname(output), ".mokabook-preview-backup-"),
  );
  await fs.promises.rmdir(backup);
  await fs.promises.rename(output, backup);
  try {
    await fs.promises.rename(stage, output);
  } catch (error) {
    await fs.promises.rename(backup, output);
    throw error;
  }
  await fs.promises.rm(backup, { force: true, recursive: true });
}

function assertOwnedOutput(output) {
  if (fs.existsSync(output) && !fs.existsSync(path.join(output, markerName))) {
    throw new Error(`refusing to replace unowned preview directory: ${output}`);
  }
}

function assertSafeOutput(output, repoRoot) {
  const contextRoot = path.join(repoRoot, ".context");
  const realRepoRoot = fs.realpathSync(repoRoot);
  const realContextRoot = projectRealPath(contextRoot);
  const realOutput = projectRealPath(output);
  if (
    !isInside(contextRoot, output) ||
    !isInside(realRepoRoot, realContextRoot) ||
    !isInside(realRepoRoot, realOutput) ||
    !isInside(realContextRoot, realOutput) ||
    realOutput === realContextRoot
  ) {
    throw new Error(`preview output must be inside ${contextRoot}`);
  }
}

function encodePath(value) {
  return value.split("/").map(encodeURIComponent).join("/");
}

function pagesPath(value) {
  return encodePath(value).replace(/\.html$/, "");
}

async function writeText(root, relative, content) {
  await writeFile(root, relative, Buffer.from(content));
}

async function writeFile(root, relative, content) {
  const target = path.join(root, relative);
  await fs.promises.mkdir(path.dirname(target), { recursive: true });
  await fs.promises.writeFile(target, content);
}
