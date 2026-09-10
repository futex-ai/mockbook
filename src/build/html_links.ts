import fs from "node:fs";
import path from "node:path";

import {
  isPrivateStaticPath,
  isPublicStaticFile,
} from "../config/public_files.js";
import { isSafeRepositoryPath } from "../config/paths.js";
import type { ResolvedConfig } from "../config/types.js";
import { MokabookError } from "../errors.js";
import {
  extractCssReferences,
  extractHtmlReferences,
} from "../html_references.js";
import {
  fragmentViolation,
  htmlResource,
  type ParsedResource,
  type ResourceReference,
} from "../html_link_validation.js";
import { pendingGeneratedOrphanRoutes } from "./ownership.js";

interface ReferenceResult {
  target?: string;
  violation?: string;
}

/** Validate navigation links and transitive local resources in generated HTML. */
export function validateHtmlLinks(
  outputs: ReadonlyMap<string, string>,
  config: ResolvedConfig,
): void {
  const pendingOrphans = new Set(
    pendingGeneratedOrphanRoutes(config, outputs.keys()),
  );
  const parsed = new Map<string, ParsedResource>();
  for (const [route, content] of outputs) {
    if (isPrivateStaticPath(path.resolve(config.mockupsDir, route), config))
      continue;
    parsed.set(route, htmlResource(extractHtmlReferences(content)));
  }
  const pending = [...parsed.keys()].sort();
  const visited = new Set<string>();
  const violations: string[] = [];
  while (pending.length > 0) {
    const route = pending.shift();
    if (!route || visited.has(route)) continue;
    visited.add(route);
    const resource = parsed.get(route);
    if (!resource) continue;
    for (const reference of resource.references) {
      const result = validateReference(
        reference,
        route,
        resource,
        parsed,
        config,
        pendingOrphans,
      );
      if (result.violation) violations.push(`${route}: ${result.violation}`);
      if (
        result.target &&
        !visited.has(result.target) &&
        !pending.includes(result.target)
      ) {
        const targetResource = loadResource(
          result.target,
          outputs,
          config,
          pendingOrphans,
        );
        if (targetResource) {
          parsed.set(result.target, targetResource);
          pending.push(result.target);
          pending.sort();
        }
      }
    }
  }
  if (violations.length > 0) {
    throw new MokabookError(
      "build-invalid",
      `document links and resources are invalid:\n${violations
        .sort()
        .map((item) => `- ${item}`)
        .join("\n")}`,
    );
  }
}

function validateReference(
  item: ResourceReference,
  sourceRoute: string,
  source: ParsedResource,
  parsed: Map<string, ParsedResource>,
  config: ResolvedConfig,
  pendingOrphans: ReadonlySet<string>,
): ReferenceResult {
  const reference = item.value;
  if (reference === "" || /^(?:https?:|mailto:|tel:|data:)/i.test(reference)) {
    return {};
  }
  if (reference.startsWith("mock:")) {
    return { violation: `unresolved id link ${reference}` };
  }
  if (reference.startsWith("/")) {
    return { violation: `root-absolute link is not portable: ${reference}` };
  }
  if (reference.startsWith("#") || reference.startsWith("?")) {
    const violation = item.checkFragment
      ? fragmentViolation(reference, source.anchors)
      : undefined;
    return violation ? { violation } : {};
  }
  const [withoutHash] = reference.split("#", 2);
  const rawPath = (withoutHash ?? "").split("?", 1)[0] ?? "";
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    return { violation: `invalid URL encoding: ${reference}` };
  }
  if (decodedPath.startsWith("/") || decodedPath.startsWith("\\")) {
    return { violation: `root-absolute link is not portable: ${reference}` };
  }
  const rawTarget = path.posix.normalize(
    path.posix.join(path.posix.dirname(sourceRoute), decodedPath),
  );
  if (
    rawTarget === ".." ||
    rawTarget.startsWith("../") ||
    !isSafeRepositoryPath(rawTarget)
  ) {
    return { violation: `link escapes mockupsDir: ${reference}` };
  }
  const target = rawTarget.replace(/^\.\//, "");
  if (isPrivateStaticPath(path.resolve(config.mockupsDir, target), config))
    return { violation: `missing target ${reference} (protected file)` };
  let targetResource = parsed.get(target);
  if (!targetResource) {
    targetResource = loadResource(target, new Map(), config, pendingOrphans);
    if (!targetResource) return { violation: `missing target ${reference}` };
    parsed.set(target, targetResource);
  }
  const violation = item.checkFragment
    ? fragmentViolation(reference, targetResource.anchors)
    : undefined;
  if (violation) return { violation };
  return { target };
}

function loadResource(
  route: string,
  outputs: ReadonlyMap<string, string>,
  config: ResolvedConfig,
  pendingOrphans: ReadonlySet<string>,
): ParsedResource | undefined {
  const candidate = path.resolve(config.mockupsDir, route);
  if (isPrivateStaticPath(candidate, config)) return undefined;
  const generated = outputs.get(route);
  if (generated !== undefined)
    return htmlResource(extractHtmlReferences(generated));
  if (pendingOrphans.has(route)) return undefined;
  if (!isPublicStaticFile(candidate, config)) return undefined;
  const extension = path.posix.extname(route).toLowerCase();
  if (extension !== ".css" && extension !== ".html" && extension !== ".htm") {
    return { anchors: new Set(), references: [] };
  }
  const content = fs.readFileSync(candidate, "utf8");
  return extension === ".css"
    ? {
        anchors: new Set(),
        references: extractCssReferences(content).map((value) => ({
          checkFragment: false,
          value,
        })),
      }
    : htmlResource(extractHtmlReferences(content));
}
