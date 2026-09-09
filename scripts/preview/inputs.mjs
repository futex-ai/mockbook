import crypto from "node:crypto";
import path from "node:path";

import {
  publicationFiles,
  publicationInput,
  readPublicationFile,
} from "../../dist/publication/files.js";
import { MANIFEST_NAME, parseManifest } from "../../dist/registry/manifest.js";

/** Capture metadata and its exact input digest together, including private helpers. */
export async function capturePublicationInputs(config, excludedRoots) {
  const files = new Map();
  for (const [root, publicRoot] of [
    [config.repoRoot, false],
    [config.mockupsDir, true],
  ])
    for (const file of await publicationFiles(
      config,
      root,
      excludedRoots,
      publicRoot,
    ))
      files.set(file.path, file);
  const manifestFile = path.join(config.mockupsDir, MANIFEST_NAME);
  const input = await publicationInput(manifestFile, config.repoRoot);
  const manifestBytes = await readPublicationFile(input, config.repoRoot);
  const manifest = parseManifest(JSON.parse(manifestBytes.toString("utf8")));
  files.set(manifestFile, input);
  for (const source of [
    ...manifest.sourceFiles,
    ...(config.configSourceFiles ?? []),
  ]) {
    const file = await publicationInput(
      path.resolve(config.repoRoot, source),
      config.repoRoot,
    );
    files.set(file.path, file);
  }
  const hash = crypto.createHash("sha256");
  for (const [name, file] of [...files].sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    hash.update(path.relative(config.repoRoot, name));
    hash.update("\0");
    hash.update(file.kind);
    hash.update("\0");
    if (file.link !== undefined) hash.update(file.link);
    hash.update("\0");
    if (file.kind === "file")
      hash.update(
        name === manifestFile
          ? manifestBytes
          : await readPublicationFile(file, config.repoRoot),
      );
    hash.update("\0");
  }
  return { fingerprint: hash.digest("hex"), manifest };
}
