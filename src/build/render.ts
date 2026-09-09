import path from "node:path";

import { minimatch } from "minimatch";

import type {
  ColorScheme,
  ResolvedRegistryEntry,
  ScreenDefinition,
} from "../authoring/types.js";
import { encodeUrlPath, toPosixPath } from "../config/paths.js";
import { isPublicStaticFile } from "../config/public_files.js";
import type { ResolvedConfig } from "../config/types.js";
import { MokabookError, errorMessage } from "../errors.js";
import type { Renderer } from "../renderer/types.js";
import { serializeReviewSentinels } from "../renderer/sentinels.js";
import { fragmentRoute } from "../registry/manifest.js";
import type { ArtifactView } from "../registry/views.js";
import { effectiveColorSchemes, VIEWPORTS } from "../registry/views.js";
import { generatedHeader } from "./ownership.js";

/** Render every screen view to owned, linked static documents. */
export function renderFragments(
  entries: readonly ResolvedRegistryEntry[],
  renderer: Renderer,
  config: ResolvedConfig,
  fragmentViews: Map<string, ArtifactView>,
): Map<string, string> {
  const outputs = new Map<string, string>();
  const ordered = [
    ...entries.filter((entry) => entry.kind === "screen"),
    ...entries.filter((entry) => entry.kind === "page"),
  ];
  for (const entry of ordered) {
    if (entry.kind === "page") {
      let rendered: unknown;
      try {
        rendered = entry.render();
      } catch (error) {
        throw new MokabookError(
          "build-invalid",
          `page render failed for ${entry.id} (${entry.sourceRelativePath}): ${errorMessage(error)}`,
          { cause: error },
        );
      }
      if (
        typeof rendered !== "string" ||
        !/<html[\s>]/i.test(rendered) ||
        !/<\/html\s*>/i.test(rendered)
      ) {
        if (rendered instanceof Promise) void rendered.catch(() => undefined);
        throw new MokabookError(
          "build-invalid",
          `page render must return a complete HTML document synchronously for ${entry.id} (${entry.sourceRelativePath})`,
        );
      }
      addOutput(
        outputs,
        entry.route,
        `${generatedHeader(entry.sourceRelativePath)}${serializeReviewSentinels(rendered)}`,
      );
      fragmentViews.set(entry.route, {
        colorScheme: "light",
        viewport: "desktop",
      });
    }
    if (entry.kind !== "screen") continue;
    for (const viewport of VIEWPORTS) {
      for (const colorScheme of effectiveColorSchemes(
        entry,
        config.colorSchemes,
      )) {
        const route = fragmentRoute(entry.route, viewport, colorScheme);
        const stylesheets = stylesheetsFor(
          entry.route,
          route,
          colorScheme,
          config,
        );
        let rendered: string;
        try {
          rendered = renderer({
            colorScheme,
            entry: entry as ScreenDefinition,
            node: entry[viewport],
            stylesheets,
            viewport,
          });
        } catch (error) {
          throw new MokabookError(
            "build-invalid",
            `renderer failed for ${entry.id} (${viewport}, ${colorScheme}): ${errorMessage(error)}`,
            { cause: error },
          );
        }
        if (typeof rendered !== "string" || !/<html[\s>]/i.test(rendered)) {
          throw new MokabookError(
            "build-invalid",
            `renderer must return a complete HTML document for ${entry.id} (${viewport}, ${colorScheme})`,
          );
        }
        addOutput(
          outputs,
          route,
          `${generatedHeader(entry.sourceRelativePath)}${serializeReviewSentinels(rendered)}`,
        );
        fragmentViews.set(route, { colorScheme, viewport });
      }
    }
  }
  return outputs;
}

/** Add one output and fail on a route collision. */
export function addOutput(
  outputs: Map<string, string>,
  route: string,
  content: string,
): void {
  if (outputs.has(route)) {
    throw new MokabookError(
      "build-invalid",
      `generated route collision: ${route}`,
    );
  }
  outputs.set(route, content.endsWith("\n") ? content : `${content}\n`);
}

function stylesheetsFor(
  catalogueRoute: string,
  fragmentRoute: string,
  colorScheme: ColorScheme,
  config: ResolvedConfig,
): string[] {
  const rule = config.stylesheets.find((candidate) =>
    minimatch(catalogueRoute, candidate.match),
  );
  if (!rule) return [];
  const configured = [
    ...rule.stylesheets,
    ...(colorScheme === "light"
      ? (rule.lightStylesheets ?? [])
      : (rule.darkStylesheets ?? [])),
  ];
  return configured.map((stylesheet) => {
    if (/^https?:\/\//.test(stylesheet)) return stylesheet;
    const absolute = path.resolve(config.mockupsDir, stylesheet);
    if (!isPublicStaticFile(absolute, config)) {
      throw new MokabookError(
        "build-invalid",
        `stylesheet does not exist: ${stylesheet}`,
      );
    }
    const relative = path.posix.relative(
      path.posix.dirname(fragmentRoute),
      stylesheet,
    );
    const encoded = encodeUrlPath(relative);
    return encoded.startsWith(".") ? encoded : `./${encoded}`;
  });
}

/** Normalize an absolute source path for deterministic diagnostics. */
export function sourceLabel(
  config: ResolvedConfig,
  sourcePath: string,
): string {
  return toPosixPath(path.relative(config.repoRoot, sourcePath));
}
