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

/** Wait for a fully published watch action to reach the current catalogue. */
export async function waitForUpdate(
  url: string,
  previous: number,
): Promise<string> {
  const deadline = performance.now() + 20_000;
  while (performance.now() < deadline) {
    try {
      const html = await catalogue(url);
      if (version(html) > previous) return html;
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
  throw new Error("referenced resource edit did not publish a watched update");
}
