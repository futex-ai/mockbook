# Local Component Rendering

Serve enables this private service with the runtime retained by a successful
Build. Static export never supplies a capability, token, or rendering endpoint.
The public authoring API and ordinary renderer remain the integration boundary.

The parent shell sends controlled overrides to
`POST /__mokabook/components/render`. Requests must match the bound loopback
Host, Origin, shell token, current generation, saved variant and view. The body
is strict JSON capped at 64 KiB. Shared schema/codec validation checks every
merged prop, including fields that cannot be edited.

`RenderQueue` admits one active job and eight queued pages, coalesces requests
per mounted page, cancels superseded work, and replaces a worker after failure
or a ten-second timeout. The worker evaluates the retained in-memory consumer
bundle; no independently configured renderer or React graph is loaded. A
renderer cannot occupy the server's HTTP thread or delay its shutdown.

`transient.ts` uses Build's stylesheet selection, renderer, compatibility/link
transformation, ownership, range, prop, manifest and resource checks. Existing
public resources are copied into the edited document's immutable memory bundle.
Generated inline styles remain part of its HTML. No generated file, manifest,
watch event, Review artifact, or export inventory is written by this service.

`RenderStore` bounds bundles to sixteen entries and 32 MiB including usage/props
metadata. Five-minute expiration and eviction return 410 for authenticated old
ids; malformed or foreign ids return 404. Every response is `no-store` and
`nosniff`; documents also carry script-disabled sandbox policy.

Watched Serve transfers the accepted configuration and already validated
manifest over its private parent/child IPC channel before readiness, then
transfers the remaining retained bundle and generated-file set only after the
child has validated the payload and current source inventory, constructed the
catalogue and bound its port. The second response
omits the config, manifest object, and serialized manifest output already
supplied or represented. Attaching the runtime publishes a reserved higher
version so an early shell reloads with controls enabled. A successful build with
an unchanged manifest applies its runtime to the live child before publishing
the reload event. A changed manifest or reconfiguration stages the runtime for
the next child; the old child keeps its matching catalogue and controls until
shutdown. Each spawned child captures both startup IPC responses. Failed
candidates retain the old graph. Recovery receives the accepted rendering graph;
its independent source-inventory validation can still reject broken or stale inputs.

## Development

```sh
npm run build
node --import tsx --test tests/component_render*.test.ts tests/component_controls_watch.test.ts
npx playwright test tests/browser/component_controls_runtime.spec.ts
```

The test suite covers validation, authority, chunked size limits, immutable
resources, queue pressure/coalescing, timeouts, worker recovery, failed watched
builds, generation replacement and unchanged filesystem output. Browser checks
cover local editing, last-valid previews, optional/unset values, negative zero,
presets, variant/context changes, comparisons, expiration and navigation.

See the [controls contract](../../../docs/protocol/mokabook-component-controls.md),
[component authoring guide](../../components/README.md), and
[build architecture](../../../docs/architecture/build-pipeline.md).
