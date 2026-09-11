# On-demand Serve

## Startup and completeness

Serve loads one consumer graph and validates its catalogue metadata, routes,
hierarchy, schemas, source inventory and output confinement before listening.
It does not render every document, write output, classify Git changes or transfer
generated HTML as a prerequisite for Browse. This applies with and without watch.

The live catalogue index is a distinct internal format, not a schema-v5 manifest.
It describes available views, not completed rendering or usage evidence. A v5
manifest still requires every view's validated records. Build, Check and Export
remain exhaustive and produce the same portable, committed artifacts.

The scale target is command start to searchable navigation and a real selected
preview visible in under five seconds, cold and warm on the default large fixture.
A listening socket or empty shell does not satisfy that target. Fixture creation,
package compilation and Git-baseline preparation are explicit setup operations,
reported separately and never repeated during ordinary large-fixture startup.

## Foreground documents

Generated `/static/` routes render the requested page or screen/component variant,
viewport and scheme through the retained consumer graph. Rendering runs outside
the HTTP event loop in a bounded, terminable worker. Concurrent requests for the
same view share work. Only validated results enter the generation-local bounded
cache. A renderer failure cannot make unrelated routes or shutdown unavailable.

The foreground service admits one active document and 32 queued distinct routes,
with a ten-second deadline, a 256 MiB worker heap limit and a 64 MiB result cache.
Its worker has a separate 32 MiB prepared-document cache. Failed workers terminate
before replacements start. Exhaustive background work uses one worker with a
1 GiB heap limit and yields between documents and major validation phases.

The single-document compiler reuses exhaustive Build's validation primitives: rendering,
stylesheet selection, compatibility, logical links, ownership, component ranges,
props, style/resource metadata, ignore markers, output confinement, and resource
validation. Navigation without anchors needs the destination's registered route,
not its rendered HTML. Anchors require the actual destination document; logical
anchors require every applicable destination view. Embedded local resources and
CSS imports are validated transitively. Protected sources and manifests remain
private even through aliases. No validation is skipped to meet the time target.

Route indexes and parsed resource metadata are reused within the generation.
The inspector loads usage for displayed views on demand. Uncomputed catalogue-wide
usage is explicitly unavailable, never displayed as zero consumers. Changes stays
unavailable until a complete validated calculation has been adopted.
The existing mobile/desktop Inspection unavailable designs also cover this usage
state: “Usage is unavailable until the catalogue has been checked.” It does not
add an environment label or replace a real zero-consumer result.

Props requests validate and capture only the edited view and its resource closure.
They never clone a full rendered manifest or validate unrelated documents. Existing
origin/token checks, cancellation, last-valid previews and memory/time limits apply.

## Background work and replacement

Both Serve modes complete the generated tree and Changes in background work.
Background work is bounded, gives foreground rendering priority and cannot publish
after its source generation is superseded. Source/config replacement accepts a new
validated index and rendering graph together; failed candidates retain the previous
working generation. Replacements invalidate cached documents, usage and comparisons.
Resource edits invalidate cached resource evidence. Shutdown cancels outstanding work.

Background generation uses the ordinary exhaustive Build pipeline and render order,
with checkpoints between documents and major validation phases. Forward-anchor
validation cannot render a destination ahead of that order. Stateful style registries
can include different unused CSS in on-demand previews; the committed background
artifacts retain Build's bytes and do not create artificial Changes.

Full generated output is committed only through the existing transactional output
store. It never substitutes for demand rendering of the current generation.
Git-only baseline changes are observed off the HTTP request path. Ref observation
must support worktrees and packed refs. Publication and offline consumers accept
only exhaustive, validated artifacts, never the live index.

## Verification

Regression tests cover cold start with an unrelated failing renderer, identical
exhaustive/demand output, cache coalescing, worker failure/timeout, source and resource
confinement, anchor checks, partial evidence, Props isolation, source replacement,
stale background results and shutdown. The full-sized browser benchmark checks real
frame content, search, themes/viewports and a successful Props edit, cold and warm.
