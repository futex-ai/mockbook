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

/** The Changes count in one shell response, absent when no filter row shows. */
export function changedCount(html: string): number | undefined {
  const value = html.match(/class="mbk-nav-filter-count">(\d+)</)?.[1];
  return value === undefined ? undefined : Number(value);
}

/** Wait for a fully published watch action to reach the current catalogue. */
export function waitForUpdate(url: string, previous: number): Promise<string> {
  return waitForPublished(url, previous, () => true, "a watched update");
}

/**
 * Wait for a published watch action whose catalogue settles on `expected`
 * changed screens, or on no Changes row at all when `expected` is undefined.
 *
 * An edit built from several filesystem operations — removing a file before
 * replacing it, creating a directory before the file inside it — publishes one
 * update per event while debouncing is off, so the first published version can
 * carry the state between those operations. Waiting for the expected count lets
 * those intermediate publications pass instead of asserting against one.
 */
export function waitForChangedCount(
  url: string,
  previous: number,
  expected?: number,
): Promise<string> {
  return waitForPublished(
    url,
    previous,
    (html) => changedCount(html) === expected,
    `${expected ?? "no"} changed screens`,
  );
}

/**
 * Poll the watched catalogue until it publishes a newer version that satisfies
 * `settled`, reporting the last state it did publish when the wait runs out.
 */
async function waitForPublished(
  url: string,
  previous: number,
  settled: (html: string) => boolean,
  expectation: string,
): Promise<string> {
  const deadline = performance.now() + 20_000;
  let published: string | undefined;
  while (performance.now() < deadline) {
    try {
      const html = await catalogue(url);
      if (version(html) > previous) {
        published = html;
        if (settled(html)) return html;
      }
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
    `referenced resource edit did not publish ${expectation}; ${
      published === undefined
        ? "no watched update was published"
        : `the last published update had ${changedCount(published) ?? "no"} changed screens`
    }`,
  );
}
