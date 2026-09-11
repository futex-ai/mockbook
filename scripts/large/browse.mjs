import { setTimeout } from "node:timers/promises";

/** Classification publication precedes asynchronous IPC delivery and child adoption. */
export async function waitForBrowseChanges(url, timeoutMs = 300000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(
        Math.min(60000, Math.max(1, deadline - Date.now())),
      ),
    });
    if (!response.ok)
      throw new Error(`Browse returned HTTP ${response.status}`);
    if ((await response.text()).includes("data-mokabook-filter")) return;
    await setTimeout(100);
  }
  throw new Error("Changes was not delivered to Browse before the deadline");
}
