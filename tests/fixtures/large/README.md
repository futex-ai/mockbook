# Large Mokabook Consumer

A deterministic, synthetic workload for finding catalogue-size bottlenecks.
It uses the real build, watched server, component usage collector, Firna controls,
React Native Web styling and Git Changes path. Nothing is added to the basic
example's generated files or shipped as product data.

```bash
npm run dev:large -- --debug-timings
npm run benchmark:large
npm run benchmark:large -- --areas 2 --screens 10 --rows 6
npm run fixture:large -- --areas 1 --screens 4 --rows 3
```

Each command creates a fresh `.context/mokabook-large-*` directory, builds its
output and commits a `main` baseline **inside that isolated fixture**, not in the
Mokabook repository. Setup includes a full initial build; startup measurements
begin with the subsequent Serve process. `fixture:large` stops after setup and
prints a reusable config path. `dev:large` keeps serving until Ctrl-C.
`benchmark:large` enables timings, requests the home, screen, component, document
and image routes, waits for Changes publication, prints JSON measurements, then
closes the server. Failures exit non-zero. Generated directories remain for
inspection and can be removed when no fixture server is using them.

Defaults are 30 areas, 40 screens per area, and 12 records per screen. Each area
adds two registered components with three saved variants, a page and one flow
per ten screens. The default therefore has 1,410 routed entries and 5,550
documents plus the manifest. Collections are additional non-routed entries.
Each screen and component variant renders in mobile/desktop and light/dark.
Flows reuse the canonical screens rather than adding documents. Shared panels
contain nested actions and caller-owned slots; screens also invoke repeated
actions. Local CSS imports and SVG resources exercise resource validation and
watch discovery. Templates use the basic example's theme tokens.

`--areas`, `--screens` and `--rows` take positive integers; screens must be at
least two per area. To reproduce a source edit, change an entry module in the
printed directory, or its shared `entries/screens.tsx`, then observe rebuild
and Changes timings. To compare repeated startups, reuse the printed config
path instead of generating a new baseline every time.

This is representative structure and volume, not Accounting's private data or
an exact prediction of its timing. OS, hardware, cache state, markup complexity
and instance counts matter. Benchmark while other heavy checks are idle. There
are no fixed timing thresholds in CI. Small fixtures exercise the same generator
in `tests/large_fixture.test.ts`; CLI timing tests cover stdout/byte stability,
child propagation and watched rebuilds.

## Current scale limit

The benchmark checks startup and HTTP delivery, not every browser interaction.
Full-default browser smoke checks have verified both viewports and themes,
document navigation, and Changes delivery. Editing the Action component's label
at that size currently reaches the existing ten-second render-worker deadline
and returns HTTP 422; the saved preview remains available. Treat this as a
separate live-rendering bottleneck to investigate, not a successful Props-edit
benchmark. Smaller catalogues exercise successful edits in the browser suite.

Key files: `generate.ts` produces consumer sources; `area.tsx`, `components.tsx`
and `screens.tsx` define the catalogue; `renderer.tsx` collects native styles;
`scripts/large/cli.mjs` owns baseline setup and benchmark lifecycle. The
[diagnostic contract](../../../docs/protocol/mokabook-timings.md) describes timing
records, inclusive durations and process boundaries.
