/** Preserve the repository's existing immutable-generation alias and policy. */
export function comparisonMetadata(comparisonUrl) {
  if (
    !/^\/__mokabook\/diffs\/__generations\/[a-f0-9]{64}\/review\.json$/.test(
      comparisonUrl,
    )
  )
    throw new Error(
      "preview comparison did not resolve an immutable generation",
    );
  return {
    redirect: `/__mokabook/diffs/review.json ${comparisonUrl} 302`,
    headers:
      "/__mokabook/diffs/*\n  Cache-Control: no-store\n  X-Content-Type-Options: nosniff\n",
  };
}
