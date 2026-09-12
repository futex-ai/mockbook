/** Merge catalogue evidence without replacing live previews, props controls, or selections. */
import type { WorkspaceData } from "../server/shell/workspace_data.js";
import { copyChildren } from "./browse_evidence.js";
import { captureRegionScrolls, restoreRegionScrolls } from "./browse_state.js";
import { renderUsage } from "./inspector_panels.js";
import { renderWorkspaceEvidence } from "./workspace_evidence.js";
import { applyVariant, selectedVariant } from "./workspace_variants.js";

/** Validate the owning workspace before any part of a snapshot is applied. */
export function workspaceEvidence(
  doc: Document,
  next: Document,
): (() => void) | undefined {
  const root = doc.querySelector<HTMLElement>("[data-workspace]");
  const incoming = next.querySelector("[data-workspace-data]")?.textContent;
  if (!root && !incoming) return () => {};
  if (!root || !incoming) return;
  try {
    const previous = JSON.parse(
      root.querySelector("[data-workspace-data]")?.textContent ?? "",
    ) as WorkspaceData;
    const data = JSON.parse(incoming) as WorkspaceData;
    if (
      data.entry.id !== previous.entry.id ||
      data.entry.kind !== previous.entry.kind ||
      data.removed !== previous.removed
    )
      return;
    return () =>
      root.dispatchEvent(
        new doc.defaultView!.CustomEvent("mokabook:workspace-evidence", {
          detail: data,
        }),
      );
  } catch {
    return undefined;
  }
}

/** Keep on-demand usage matched to the documents already shown, not exhaustive render order. */
export function mergeWorkspaceEvidence(
  current: WorkspaceData,
  next: WorkspaceData,
): void {
  const views = current.views;
  const generation = current.previewGeneration;
  for (const key of [
    "status",
    "change",
    "comparison",
    "usageComplete",
    "previewGeneration",
    "renderCapability",
  ] as const)
    delete current[key];
  Object.assign(current, next);
  if (generation && generation === next.previewGeneration) {
    current.views = next.views.map((view) => {
      const retained = views.find(
        (previous) => previous.path === view.path,
      )?.usage;
      const merged = { ...view };
      delete merged.usage;
      return retained ? { ...merged, usage: retained } : merged;
    });
  }
}

/** Update only evidence-owned surfaces, leaving editable props and preview state intact. */
export function updateWorkspaceEvidence(
  root: HTMLElement,
  data: WorkspaceData,
  search: string,
): ReturnType<typeof selectedVariant> {
  const doc = root.ownerDocument;
  const scrolls = captureRegionScrolls(doc);
  const selected = selectedVariant(data, search);
  const selector = root.querySelector<HTMLSelectElement>(
    "[data-workspace-variant]",
  );
  if (selector) {
    const remaining = new Map(
      data.variants.map((variant) => [variant.value.id, variant]),
    );
    for (const option of [...selector.options]) {
      const variant = remaining.get(option.value);
      if (!variant) option.remove();
      else {
        option.textContent = `${variant.value.title}${variant.removed ? " · Removed" : ""}`;
        remaining.delete(option.value);
      }
    }
    for (const variant of remaining.values()) {
      const option = doc.createElement("option");
      option.value = variant.value.id;
      option.textContent = `${variant.value.title}${variant.removed ? " · Removed" : ""}`;
      selector.append(option);
    }
  }
  applyVariant(root, data, selected.variant, selected.error, {
    preservePreview: true,
  });
  const usage = doc.createElement("div");
  renderUsage(usage, data);
  copyChildren(root.querySelector('[data-inspector-panel="usage"]'), usage);
  const evidence = doc.createElement("div");
  renderWorkspaceEvidence(evidence, data, selected.variant?.value.id);
  const panel = root.querySelector<HTMLElement>("[data-workspace-evidence]");
  copyChildren(panel, evidence);
  if (panel) panel.hidden = evidence.hidden;
  const json = root.querySelector("[data-workspace-data]");
  if (json) json.textContent = JSON.stringify(data);
  restoreRegionScrolls(doc, scrolls);
  return selected;
}
