# Static catalogue export

This internal package module builds complete consumer sites for ordinary static
hosting. Consumers use `mokabook export --out <path>`, not a JavaScript deep import.
Deployment and hosting credentials remain outside Mokabook.

`run.ts` pins one Git baseline, runs the normal build, captures public inputs,
compares them through the existing review engine, and verifies inputs again
before installation. `site.ts` uses the existing shell and Browse adapter to
assemble exact pages, real id aliases, package assets, and immutable comparisons.

`paths.ts`, `ownership.ts`, and `transaction.ts` constrain replacement to a
validated, exclusively reserved output. `inventory.ts` and `references.ts`
check path collisions and local resource closure. `ignored.ts` keeps owned
outputs and transactions out of broad Watch rules. The repository-only preview
adapter supplies validated host aliases and legacy ownership explicitly.

Focused verification:

```bash
npm run build
node --import tsx --test tests/export*.test.ts tests/static_delivery.test.ts
npx playwright test tests/browser/static_export.spec.ts tests/browser/static_comparisons.spec.ts
npm run package:smoke
```

See the [export contract](../../docs/protocol/mokabook-export.md),
[static delivery contract](../../docs/protocol/mokabook-export-delivery.md), and
[plan index](../../plans/README.md).
