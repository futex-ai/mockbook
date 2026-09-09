# Component Controls

## Delivery Status

Approved target, not implemented. The [component explorer plan](../../plans/component-explorer.md)
delivers these controls after saved component pages and inspection. Components
continue to use the [registered authoring boundary](./mokabook-components.md)
and [explorer shell](./mokabook-component-explorer.md).

## Scope And User Behavior

Saved variants work locally and in published static catalogues. Local Serve
additionally supports temporary editing of declared component props through a
server render. Arbitrary interactive controls in published catalogues would
require a browser renderer or hosted rendering service and are outside this
change. No consumer JavaScript runtime is added to static preview frames.

A Controls panel on the component page lists only explicitly declared editable
props. Data props without controls remain visible in Details and still
participate in change detection. A control starts from the selected saved
variant's actual value, updates the preview after validation, and has a label
derived from declared metadata or the prop name. No invented sample values
replace missing values; optional fields expose their unset state.

Support text, boolean, finite number, and select controls. Text may declare a
maximum length; numbers may declare minimum, maximum, and positive step; selects
declare a nonempty list of unique named primitive values. Declarations include
optional label/description fields, must identify an existing data prop, and must
match its type and every saved variant value. React slots and arbitrary JSON
editors are not live controls. Complex consumer values use declared preset keys
resolved by the render adapter.

A control declares `optional: true` to permit an unset value; otherwise every
saved variant must supply its value. The default is false. This explicit runtime
declaration is required because TypeScript optionality is erased. Unsetting an
optional input removes the prop before rendering; empty text remains a string.

Reset restores the selected saved variant's complete props. Changing the saved
variant discards temporary edits. Viewport/theme changes preserve validated edits
and render them in the new context. Route navigation or reload discards edits.
Temporary state is neither written to source/generated files nor encoded as
arbitrary prop data in URLs, local storage, comparisons, or Changes counts.

Temporary edits operate in Current. Selecting a comparison restores the saved
variant and compares its committed baseline/current output; controls become
unavailable while comparing. The product explains that the comparison shows
the saved variant. Controls render responses cannot overwrite a comparison,
another variant, a new viewport/theme, or a different route.

Published pages show the same saved variants and props with controls read-only
and a secondary message, "Choose a saved variant to explore this component."
Capability comes from delivery configuration rather than an environment badge.
Users can browse, inspect, and compare the saved variants normally.

## Rendering Boundary

Serve exposes a private POST endpoint at `/__mokabook/components/render`.
The request carries a component id, variant id, viewport, color scheme,
catalogue generation, and a data object containing only declared control
overrides. It does not accept a module path, source code, arbitrary component
name, callback, resource path, or renderer selection.

Request keys are `componentId`, `variantId`, `viewport`, `colorScheme`,
`generation`, and `overrides`. Each overrides value is either
`{ kind: "set", value: <declared primitive> }` or `{ kind: "unset" }`.
The server compares the opaque generation string with its active catalogue;
the request token is sent in the `X-Mokabook-Render-Token` header.

The server resolves the request against the current validated registry,
merges overrides into that variant's props, validates types/constraints, then
calls the same consumer render adapter, theme, stylesheet selection, marker,
link, resource, and ownership validation as Build. Server-supplied context and
uneditable props cannot be overridden. Optional values use an explicit unset
operation; JSON null remains an actual value, not an unset sentinel.

A successful response returns a typed result with an opaque render id, the
matching catalogue generation, a sandboxed preview URL, and validated usage
records. Preview URLs are confined beneath
`/__mokabook/components/renders/<render-id>/`; render resources retain valid
public relative resolution through the same adapter as normal Browse. Reject
malformed or expired ids. This response never updates the committed manifest or
publishes watched changes.

Preview documents stay script-disabled. The parent shell swaps only the matching
preview frame and uses its returned usage records for Details/highlighting.
No client-side prop interpolation or arbitrary HTML execution substitutes for
the consumer renderer. Failed validation/rendering preserves the last valid
preview, shows an actionable error, and offers retry/reset.

## Request And Lifecycle Rules

The endpoint is available only in local Serve, with no published route or
background requests in static catalogues. Accept JSON POST only, cap request
bodies at 64 KiB, reject unknown fields and invalid component/variant/view
combinations, and validate unset operations against optional controlled props.
Use structured error codes for invalid input, unknown entry, stale generation,
render failure, and temporary capacity limits. Map them to 400, 404, 409, 422,
and 429 respectively; oversized bodies return 413 and unsupported methods 405.

Require the served origin, validated Host, and a shell-issued unpredictable
request token, with no permissive CORS. The token is scoped to the server
instance and unavailable to consumer frames. Missing or invalid authorization
returns 403. Loading a foreign web page must not cause consumer render code to
execute through this endpoint.

Text/number edits are debounced by 150 ms; boolean/select edits submit
immediately. Each page has one active request and at most one latest queued
replacement. Sequence/generation checks discard stale responses. Cancel
obsolete requests on navigation, reset, variant/context change, or disconnect;
cancellation must not leave an unresolved UI loading state.

Run bounded rendering outside the main HTTP event loop using the same compiled
consumer graph in a supervised worker. Allow one active job and at most eight
queued jobs server-wide; superseded jobs from the same page are coalesced.
Terminate a job after ten seconds and return render failure, replacing the
worker before accepting more work. This makes synchronous consumer render
failures unable to hang Browse or shutdown. No second independently configured
renderer or React resolution graph is permitted.

Keep transient render artifacts outside committed output, with at most sixteen
render documents and 32 MiB total retained bytes. A result exceeding that budget
fails explicitly. Expire artifacts after five minutes and return 410 for expired
URLs. Eviction never overwrites an existing render id; an expired visible frame
can be regenerated from its current validated controls state. Retained documents
and any generated style artifacts share one eviction lifetime.

Watched registry/config replacement invalidates the old generation, stops or
discards its queued work, and only swaps to a fully validated replacement graph.
Failed candidate builds retain the last-good registry/renderer and its controls.
Server shutdown stops admission, rejects queued work, terminates the worker,
and cleans transient artifacts. Controls cannot delay ordinary catalogue
watch/reload or comparison generation indefinitely.

## Verification

Add contract tests for every control type, optional/unset values, unknown props,
type/constraint errors, preset resolution, malformed bodies, request size,
origin/Host/token validation, old generations, worker failure/timeout, and queue
bounds. Prove repeat renders use the same consumer providers and React runtime
resolution as saved variants and never mutate generated output.

Browser tests cover actual prop changes, reset, variant switching, viewport/theme
retention, rapid edits, stale responses, navigation, comparison selection,
render errors, retry, worker replacement, and shutdown. Published smoke tests
prove saved variants remain usable and issue no local-render requests.
Update mobile and desktop controls mockups before implementing these controls.
