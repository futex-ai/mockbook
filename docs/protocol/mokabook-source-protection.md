# Catalogue Source Protection

## Delivery Status

Implemented for schema-v4 [pages](./mokabook-pages.md), screens, and flows.
The same resolved inventory protects build, runtime, comparisons, and both
publication options. Verification is tracked in
[Unified Catalogue Pages](../../plans/unified-catalogue-pages.md).

## Protected Inputs

Use one source-classification policy for current HTTP assets, generated-resource
validation, Review resource reads, and static publication. A file is protected
if it is beneath `entriesDir`, appears in the validated `sourceFiles` inventory,
or has a reserved source basename. Apply each rule to both its requested path
and its resolved repository-relative target. A public-looking symlink cannot
make a protected target public. Existing regular-file and root-confinement
checks remain mandatory.

Reserve basenames ending in `.source.html`, `.source.htm`, `.source.ts`,
`.source.tsx`, `.source.js`, `.source.jsx`, `.source.mts`, `.source.cts`,
`.source.mjs`, or `.source.cjs`, matched case-insensitively. Their protection is
independent of imports, manifest membership, and whether a page still uses them.
This is a file-access rule, not a source-discovery or navigation mechanism.
It applies to abandoned files under the former legacy directory as well.

For example, removing the final import of `old-page.source.tsx` must leave the
file inaccessible through `/static` and absent from both publication options.
Deleting source files is not a condition of migration. Arbitrarily named helpers
are covered by the inventory while imported; helpers retained without imports
must live under `entriesDir` or use a reserved basename. Ordinary public browser
scripts are not made private merely because they end in `.js`.

Reject generated output routes that use a reserved source basename or overlap
any protected input, including through a symlink. A generated ownership header,
logical link, or asset reference cannot override source protection. A request
for a protected file has the existing not-found behavior; a generated document
that needs it as a public resource fails validation with its referring route.

## Complete Source Inventory

Manifest v4 `sourceFiles` is a sorted, unique array of repository-relative POSIX
paths. Derive it from the union of file inputs resolved by both the config
bundle and the consumer bundle, including inputs eliminated by tree shaking:

- The config entry module and every repository-owned authoring import it loads.
- All discovered entry modules and their transitive authoring imports.
- The configured renderer, compatibility transformer, and their transitive
  authoring imports, including render helpers outside `entriesDir`.
- Repository-owned workspace package modules resolved through aliases or package
  imports; a bare package specifier alone does not imply an external dependency.

Collect real file inputs from the bundler/resolver, including original paths
behind attribution plugins; virtual wrapper IDs are not file paths. Exclude
Mokabook's package runtime and installed external dependencies. Include every
entry's `sourcePath` and configured consumer module path. Preserve both the
logical path and an in-repository realpath alias when they differ.

Classify imports by their resolved loader and role. Executable modules and
JSON/text/raw-template data consumed during authoring are source inputs. Public
CSS, fonts, images, and other copied resource assets remain public unless another
protection rule applies. If a file serves both roles, source protection wins;
consumers must emit a separate public artifact instead of exposing the input.
Runtime file reads that the bundler cannot enumerate must use protected source
locations or reserved names; a dependency string alone is not a public-asset
permission or a substitute for complete static import discovery.

Reject absolute, escaping, malformed, duplicate, or unsorted inventory paths,
unresolvable source aliases, source/output overlap, and missing entry/configured
module paths. Source targets must remain regular files inside `repoRoot`.
Reject a config or consumer graph containing an outside authoring input; never
silently omit it from the inventory. Apply this after excluding runtime,
installed-dependency, and public-asset inputs, so a consumer's transitive
renderer, transformer, page, and template imports use the same boundary.
The error names the offending input. Consumers must move their authoring code
inside `repoRoot` or explicitly configure a common root containing it.

## Freshness And Lifecycle

Build/check derive the inventory from the same resolved graphs used for that
compilation. Before serving or publishing a current v4 catalogue, independently
resolve the config and consumer input graphs and require the persisted inventory
to match. This scan may bundle modules but must not run page render callbacks,
rewrite generated output, or read Git history. A missing, malformed, or stale
inventory rejects the candidate and directs the author to rebuild.

Watch consumes the same discovered input set. Config-graph changes use the
existing transactional config reload; consumer-module changes rebuild. Recompute
and validate the inventory before replacing the current catalogue and notifying
the browser. A failed candidate keeps the last-good generation. Asset checks
continue resolving the requested realpath at read time so changed symlinks
cannot bypass the generation's protected paths.

For historical v4 Review resources, use that baseline's structurally validated
inventory, entry source paths, and reserved-name rules. Never execute historical
config or rebuild a Git baseline to refresh its inventory. Historical v2/v3
readers retain their version-specific source/root safeguards and also deny
reserved source basenames; they are the only readers allowed to lack v4's
inventory. Current-side resource reads always use the current validated policy.

## Acceptance

Add tests before implementation for abandoned reserved files, removing their
last import, config/renderer/transformer/helper imports outside `entriesDir`,
tree-shaken inputs, local workspace packages, and arbitrary helper filenames.
Test missing/stale inventories, logical and realpath aliases, symlink escapes,
mixed source/asset roles, reserved output routes, and rejected protected links.
Cover outside config, entry, renderer, transformer, page-helper, and raw-template
imports, while proving installed dependencies outside the root still load.

Exercise the same fixtures through GET/HEAD `/static`, resource validation,
current and historical Review reads, and both publication options. Verify that
CSS, fonts, images, and public scripts still work. Test watcher reclassification
after dependency changes and prove default publication validation uses no Git.
