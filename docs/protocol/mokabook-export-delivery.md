# Static Export Delivery

## Delivery Status

Implemented. This document completes the
[consumer export contract](./mokabook-export.md). It defines portable serving
and browser behavior for the consumer command, with Cloudflare normalization
kept in the repository adapter. Delivery is tracked in the
[consumer static export plan](../../plans/consumer-static-export.md).

## Hosting Contract

Deploy the export directory's contents as the HTTP(S) origin's document root.
The host must serve ordinary files with their correct MIME types, index.html
directory indexes, query-insensitive file lookup, and normal missing-file
responses. It must serve the double-underscore package asset directories.
No SPA fallback, extension-removal rule, redirect interpreter, worker, API,
or server-side rendering is required for catalogue functionality.

The artifact includes a `404.html` catalogue page. Hosts may configure it as
their error document; producing the HTTP 404 status for arbitrary unknown URLs
is host configuration, not something static HTML can guarantee.
The consumer publishes atomically or as an immutable host deployment to avoid
serving a mix of builds. Configure revalidation for shell HTML and mutable
aliases; comparison generation URLs must not be rewritten to another generation.
Serve comparison resources with `X-Content-Type-Options: nosniff` and the existing
no-store policy. Generic deployments document these header requirements;
provider adapters may emit the host's metadata files for them. Correctness must
not depend on a generic static server interpreting `_headers` or `_redirects`.

## Artifact Routes

Paths below are relative to the export directory. URL path segments use the
existing validated route grammar and are encoded once when written into URLs.

| Path                        | Meaning                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------ |
| `index.html`                | Full catalogue home                                                                  |
| `view/<route>`              | Full shell for each current routed entry, legacy page, and removed comparison screen |
| `id/<id>/index.html`        | Static alias showing the same shell as the canonical route                           |
| `static/<public-path>`      | Adapted current fragments and public consumer resources                              |
| `__mokabook/`               | Required shell CSS, fonts, browser modules, and comparison generation                |
| `404.html`                  | Existing catalogue not-found view                                                    |
| `.mokabook-export-artifact` | Public-safe versioned ownership inventory                                            |

Catalogue routes retain their validated `.html` suffixes; additional public
`.htm` documents retain their filenames too. Do not
apply the preview script's Cloudflare-specific extension stripping. Generated
resource references must address actual exported files. Hosts that normalize
HTML URLs remain compatible provided their redirects preserve the query and
resolve to the same page; Cloudflare tests protect this existing deployment.

Collections remain navigation folders, not new routed pages. Include use cases
and configured legacy pages. Empty registries remain invalid under the existing
build contract; exporting one preserves the previous artifact. Missing views
remain explicit in added/removed comparisons; never synthesize content.

Every manifest, generated, copied, and adapter-added path enters a single
collision-checked inventory, including file/directory prefix collisions.
Reject incompatible duplicate routes, aliases, or reserved paths before
installation. Shared byte-identical resources may be deduplicated. Current-id
precedence for renamed/reused ids follows the Changes contract.

Adapter aliases enter the same case-folded path namespace as files, including
the final ownership marker. Each alias is a safe relative, file-like route
whose target is an existing exported file, not another alias. Reject exact
alias/file matches even when their bytes would agree, case-folded matches, and
ancestor/descendant collisions between aliases or between aliases and files,
independent of insertion order. Distinct sibling aliases may share one target.
These checks happen before installation and preserve any previous export on
failure. They also apply to the preview adapter's extensionless HTML aliases;
ordinary consumer exports retain their real `.html` routes.

## Static Navigation

Embed a typed, versioned static-delivery descriptor in shell-owned metadata,
not consumer documents. It supplies the canonical route for the current page,
the id-to-route map, and the generation-specific comparison URL. Validate it
against the catalogue while exporting and at the client boundary. All targets
must stay same-origin under the expected Mokabook prefixes. Consumer markup
cannot supply or override this descriptor; serialize it safely in HTML.
The root `html` element carries `data-mokabook-static=""` and an escaped
`data-mokabook-delivery` JSON attribute with `schemaVersion: 1`, `canonicalPath`,
`idRoutes`, and `comparisonUrl`. Static mode with missing/malformed metadata
fails closed instead of requesting a development endpoint. Generation ids are
64 lowercase hex characters hashing the sorted path/content-hash inventory.

Both renderer and parent navigation use a shared delivery-aware route resolver.
Development retains its `/id/<id>` HTTP redirect behavior. Static frame-link
enhancement resolves a validated logical id directly to its exported canonical
`/view/<route>` URL before fetching or opening a browsing context. This applies
to primary/keyboard clicks, modifier clicks, middle-clicks, and named targets.
Do not follow a JS redirect document inside a fetch and mistake it for a page.

Static id aliases contain the real canonical page, not an empty redirect screen.
`/id/<id>/index.html` therefore works without host redirect support. Directory
indexes also support `/id/<id>/`; hosts with normal directory redirects accept
`/id/<id>`. Parent enhancement normalizes an alias history entry to the canonical
route without an extra fetch, retaining the single validated `fragment` query.
Without JavaScript the same screen remains visible at the alias URL.

Every alias and canonical page embeds consistent shell metadata. Progressive
navigation, reload, Back/Forward, new tabs, and browser-normalized response URLs
retain the same route identity and existing scroll/disclosure behavior. Unknown
ids are unavailable; there is no synthetic catch-all client router.

Preserve the existing [navigation contract](./mokabook-navigation.md): trusted
ownership-checked link markers only, immediate-frame parent enhancement,
portable fallback hrefs, sandbox restrictions, latest-wins cancellation, focus,
announcements, active-tree visibility, search/filter state, and fragment grammar.
The static fragment handler applies a single validated `fragment` query to all
current light/dark sources; a use case applies it only to its first step.
Invalid/duplicate fragment values are not injected, and a direct URL with a
syntactically valid missing anchor retains the current static fallback.

## Static Comparisons

Each export packages one complete comparison at
`__mokabook/diffs/__generations/<generation>/review.json` with all referenced
before/after documents and transitive resources under the same generation root.
Retain the engine's JSON and document bytes and relative snapshot paths.
Do not change the review schema or rebase only some of its resource references.

The static descriptor points directly to this immutable JSON URL. `diffs.ts`
uses it only when a diff is selected and resolves snapshot paths relative to
the actual response URL, as today. The generic export does not require a
redirect from `/__mokabook/diffs/review.json`. Development keeps its existing
stable endpoint; the repository's Cloudflare adapter keeps its existing stable
redirect for compatibility.

Current remains the default after navigation/reload. Browsing, Changes filtering,
and scheme/viewport switches do not request comparison JSON or snapshot files.
Side by side, Overlay, and Difference retain the existing UI and missing-side
states. Refresh/retry reload the same exported generation; only another export
and deployment produces new comparison content. An open tab retains its loaded
deployment's descriptor; reload the page to adopt a newer deployment. Progressive
navigation encountering a different generation performs a full page load rather
than mixing its new route with the old catalogue navigation. Hosts may
retain prior generations for old tabs; if they remove them, the existing
comparison failure state applies until page reload. Cancellation and failure
keep the catalogue usable and cannot replace a different screen.

Exclude the watcher entrypoint, event stream connections, and all Node/server
modules. The browser graph must be complete without unused server dependencies.
All product data, counts, and comparison results come from the real captured
catalogue and Git inputs. No publishing, sandbox, or environment labels are added
to product screens. The existing light/dark, mobile/desktop shell design applies.

## Browser Acceptance

Use a basic HTTP fixture that serves exact files and directory indexes, handles
GET/HEAD with proper MIME types, and supplies no Mokabook or provider rewrites.
Copy only the export to a separate directory before serving; its requests must
not reach the consumer project, `.git`, Node modules, or a live Mokabook process.

Verify direct and reloaded nested pages, aliases with/without enhancement,
collection navigation, search/tags/Changes, details, both viewports and schemes,
use cases, ordinary fallback links, all logical-link activation modes, fragments,
Back/Forward, and removed/renamed screens. Assert that every local request
resolves and that Current makes no comparison or event-stream requests.

Exercise all three diff modes, explicit missing sides, ignored/shared impacts,
refresh, errors, interrupted navigation, and resource isolation after the source
tree changes or disappears. Retain browser coverage under the actual Cloudflare
Pages local runtime for normalized URLs, stable redirects, headers, and the
repository preview's existing public URLs. New delivery plumbing does not add
or redesign a screen; visual smoke tests reuse the owning mobile/desktop mocks.
