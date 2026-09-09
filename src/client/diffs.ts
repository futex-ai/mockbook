/** Lazy comparison requests, with cancellation when a user leaves the screen. */

import type { ReviewResult } from "../review/types.js";
import { renderDiff, type DiffMode, type LoadedDiff } from "./diff_views.js";

/** Install one delegated controller on the persistent catalogue document. */
export function installDiffs(
  doc: Document,
  win: Window & typeof globalThis,
): { reset(): void; update(): void } {
  let request: AbortController | undefined;
  let loaded: LoadedDiff | undefined;
  let screen: HTMLElement | undefined;
  let mode: DiffMode = "current";

  const reset = (): void => {
    request?.abort();
    request = undefined;
    loaded = undefined;
    screen = undefined;
    mode = "current";
  };
  const display = (): void => {
    if (!screen?.isConnected) return;
    const stage = screen.querySelector<HTMLElement>("[data-diff-stage]");
    const current = screen.querySelector<HTMLElement>("[data-current-screen]");
    const refresh = screen.querySelector<HTMLElement>("[data-diff-refresh]");
    if (!stage || !current) return;
    current.hidden = mode !== "current";
    stage.hidden = mode === "current";
    if (refresh) refresh.hidden = mode === "current" || loaded === undefined;
    for (const button of screen.querySelectorAll("[data-diff-mode]")) {
      button.setAttribute(
        "aria-pressed",
        String(button.getAttribute("data-diff-mode") === mode),
      );
    }
    if (mode === "current") {
      stage.replaceChildren();
    } else if (loaded) {
      renderDiff(doc, stage, loaded, screen.dataset["diffScreen"] ?? "", mode);
    }
  };
  const load = async (refresh: boolean): Promise<void> => {
    const target = screen;
    const stage = target?.querySelector<HTMLElement>("[data-diff-stage]");
    if (!target || !stage) return;
    request?.abort();
    const pending = new win.AbortController();
    request = pending;
    stage.setAttribute("aria-busy", "true");
    stage.textContent = "Loading comparison…";
    try {
      const response = await win.fetch(
        `/__mokabook/diffs/review.json${refresh ? "?refresh=1" : ""}`,
        {
          signal: pending.signal,
          headers: { accept: "application/json" },
        },
      );
      if (!response.ok) {
        const failure = (await response.json()) as { details?: unknown };
        throw new Error(
          typeof failure.details === "string"
            ? failure.details
            : "Comparison unavailable",
        );
      }
      const result = (await response.json()) as ReviewResult;
      if (
        pending.signal.aborted ||
        !target.isConnected ||
        screen !== target ||
        mode === "current"
      )
        return;
      loaded = { result, url: response.url };
      display();
    } catch (error) {
      if (
        pending.signal.aborted ||
        !target.isConnected ||
        screen !== target ||
        mode === "current"
      )
        return;
      stage.textContent = "The comparison could not be loaded. ";
      const retry = doc.createElement("button");
      retry.type = "button";
      retry.setAttribute("data-diff-refresh", "");
      retry.textContent = "Try again";
      stage.append(retry);
      if (error instanceof Error) {
        const details = doc.createElement("details");
        const summary = doc.createElement("summary");
        summary.textContent = "Comparison details";
        const description = doc.createElement("p");
        description.textContent = error.message;
        details.append(summary, description);
        stage.append(details);
      }
    } finally {
      if (request === pending) {
        request = undefined;
        stage.removeAttribute("aria-busy");
      }
    }
  };
  doc.addEventListener("click", (event) => {
    const target =
      event.target instanceof win.Element ? event.target : undefined;
    if (!target) return;
    const option = target.closest<HTMLElement>("[data-diff-mode]");
    const refresh = target.closest("[data-diff-refresh]");
    if (option || refresh) {
      const owning = target.closest<HTMLElement>("[data-diff-screen]");
      if (!owning) return;
      if (screen !== owning) {
        reset();
        screen = owning;
      }
      const selected = option?.dataset["diffMode"];
      if (mode === "current" && selected !== "current") loaded = undefined;
      if (
        selected === "current" ||
        selected === "side" ||
        selected === "overlay" ||
        selected === "difference"
      )
        mode = selected;
      if (mode === "current") {
        request?.abort();
        request = undefined;
      }
      if (refresh) loaded = undefined;
      display();
      if (mode !== "current" && (refresh || (!loaded && !request)))
        void load(Boolean(refresh));
      return;
    }
  });
  return {
    reset,
    update: () => {
      if (mode !== "current") {
        loaded = undefined;
        void load(false);
      }
    },
  };
}
