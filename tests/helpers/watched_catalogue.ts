import assert from "node:assert/strict";

/** Read the current watched shell without starting a comparison build. */
export async function catalogue(url: string): Promise<string> {
  const response = await fetch(url);
  assert.equal(response.status, 200);
  return response.text();
}

/** Extract the server version stamped into one shell response. */
export function version(html: string): number {
  const value = html.match(/data-mokabook-update-version="(\d+)"/)?.[1];
  assert.ok(value);
  return Number(value);
}

interface CatalogueState {
  version: number;
  changes: number | "unavailable";
}

/** Wait for a newer publication and, when specified, the intended Changes state. */
export async function waitForUpdate(
  url: string,
  previous: number,
  expected?: Pick<CatalogueState, "changes">,
): Promise<string> {
  const deadline = performance.now() + 20_000;
  let latest: CatalogueState | undefined;
  while (performance.now() < deadline) {
    try {
      const html = await catalogue(url);
      const count = html.match(/class="mbk-nav-filter-count">(\d+)</)?.[1];
      latest = {
        version: version(html),
        changes: count === undefined ? "unavailable" : Number(count),
      };
      if (
        latest.version > previous &&
        (!expected || latest.changes === expected.changes)
      )
        return html;
    } catch (error) {
      const code = (error as { cause?: NodeJS.ErrnoException }).cause?.code;
      if (
        !code ||
        !["ECONNREFUSED", "ECONNRESET", "UND_ERR_SOCKET"].includes(code)
      )
        throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(
    `referenced resource edit did not publish the expected update after version ${previous}` +
      (expected ? `; expected Changes ${expected.changes}` : "") +
      (latest
        ? `; last version ${latest.version}, Changes ${latest.changes}`
        : "; no catalogue response"),
  );
}
