# Mokabook CI And Npm Release Contract

## Package Metadata

`package.json` describes the published, unscoped public ESM package `mokabook`,
with a release-managed version, MIT licensing, Firna authorship, exact
repository/bugs/homepage metadata for `futex-ai/mokabook`, a Node engine floor,
one `mokabook` bin, explicit exports/types, and a restrictive `files` allowlist.

Read the checkout's version from `package.json`; `.release-please-manifest.json`
tracks release-please's version state, and `package-lock.json` mirrors package
metadata. Release PRs update these together. Neither this document nor consumer
export instructions pin a current version or require another bootstrap publish.

`publishConfig` targets the public npm registry with public access. The package
contains compiled runtime code, declarations, package-owned shell assets,
README, LICENSE, CHANGELOG, and package metadata only. Source fixtures, tests,
plans, protocol docs, caches, review artifacts, and generated demo output are
not published unless a documented runtime requirement proves otherwise.

Runtime dependencies are intentional and minimal. Mokabook does not take a
runtime dependency on `@firna/ui`, Accounting, Juno, Playwright, or a consumer's
component system. Development and browser-test packages remain development
dependencies.
The exporter's Koffi dependency supplies OS-enforced exclusive directory rename;
its optional platform binaries must remain available for export. The native
bridge is lazy and does not load for build/check/serve or help.

## Local Verification

`cargo xtask check` is the complete repository and release gate. It delegates
to deterministic npm scripts and includes:

- formatting and lint checks;
- TypeScript typechecking with no unexplained source exclusions;
- unit and integration tests with a 100% pass rate;
- production build and declaration generation;
- a byte-stable example `check` against committed generated output;
- package-file inspection with `npm pack --dry-run --json`;
- packed-tarball installs in clean ESM, NodeNext, Accounting-shaped, and
  Juno-shaped consumers;
- local-npx and clean-cache npx-style execution from the packed artifact;
- consumer exports from the installed CLI, including custom configs/bases,
  cross-platform renderers, legacy pages, and the compiled static client graph;
- source-tree ESM, declaration, CLI, workspace-resolution, server, Review, and
  watched-runtime regressions;
- Playwright Browse and Review regressions using Chromium, including isolated
  exact-file exports after source removal and the actual Cloudflare runtime; and
- Rust formatting, Clippy, tests, and file-length audits for `xtask`.

Tests that mutate files use isolated temporary directories and clean up child
processes. Package smokes execute the packed artifact, not the source tree or a
workspace symlink. The temporary real-Accounting parity audit is release
evidence rather than a recurring CI dependency on another repository.

## Continuous Integration

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`, with
read-only repository contents permission and concurrency cancellation for
superseded validation. Its two independent verification jobs run the complete
gate on Ubuntu:

- the minimum supported Node 22.14.0 with npm 11.7.0; and
- release Node 24 with npm 11.7.0.

Both install Rust 1.95.0, install Chromium, and run `cargo xtask check`.
Focused macOS and Windows jobs additionally run native export move and
destination-race tests at the minimum Node version. The `Required CI` aggregator
fails unless both complete gates and both platform jobs succeed and is the
branch-rule status to require. CI checks out complete Git history so the preview regression
can resolve `origin/main`, and uses `npm ci` with the committed lockfile. Action
revisions are immutable commit hashes with reviewed version comments; runtime
versions are explicit. Fork pull requests receive no release secrets or write
permissions.

## Preview Deployments

The [consumer static exporter](./mokabook-export.md) provides the shared package
implementation. This section describes the repository's deployment adapter;
consumer `mokabook export` produces files without deploying or publishing npm.

`.github/workflows/preview.yml` deploys a browsable copy of the synthetic basic
consumer to the direct-upload Cloudflare Pages project `mokabook`. A `main`
push updates the production deployment at `https://mokabook.pages.dev`.
Same-repository pull requests, except Release Please pull requests, deploy to a
stable `pr-<number>` branch alias and receive one updated sticky comment with
the deployment result, URL, commit, and workflow run. Fork pull requests never
receive Cloudflare credentials or write-capable execution.

`npm run preview:build` first rebuilds Mokabook and its committed basic
consumer. The repository-only preview adapter calls the shared exporter, which
directly renders the home, not-found, current catalogue routes, and removed-screen
routes through the existing shell. It copies the shell stylesheet, browser and
shared navigation modules, fonts, id redirects, and every validated public
consumer asset into `.context/mokabook-preview`. HTML copies pass through the
same manifest/header-aware logical-link adapter as served Browse; unowned
reserved metadata is removed and invalid trusted output fails the build.
Preview shell links use Cloudflare
Pages' canonical extensionless HTML routes, and static shell HTML omits the
watched server's live-update entrypoint. The parent client validates one optional
`fragment` query and applies its encoded hash to every applicable current and
light/dark frame source, with first-step-only use-case scope. The builder
computes route changes from the
branch point shared with `origin/main`, and both deployment jobs fetch complete
Git history so that common ancestor can be resolved and the static Browse shell
always includes the All/Changes filter, including a zero count. Every structured
screen includes Current / Side by side / Overlay / Difference in the actual
shell. Publishing prepares the real comparison through the same Git engine as
development, then exports its JSON, isolated snapshots, and their resources
under one immutable generation path. Static shell metadata addresses that
generation directly, and the stable comparison redirect remains available.
Visitors fetch and render comparisons only after selecting a diff;
refresh reloads the currently published result. Missing baselines and invalid
comparison output fail the build instead of publishing unusable controls.
The [Changes contract](./mokabook-changes.md) owns the shared interaction and
snapshot rules. Artifact
replacement uses the shared exclusive reservation, ownership inventory, and
rollback transaction. Only this adapter can migrate a valid legacy
`.mokabook-preview-artifact` directory; consumer export cannot claim it.

Closing a same-repository pull request marks its sticky comment inactive and
attempts to delete all Cloudflare deployments carrying that PR branch alias.
Cleanup failures retain the deployment and report why rather than hiding the
failure. Superseded runs for the same main ref or pull request are cancelled.
All workflow actions use immutable commit hashes, Wrangler is lockfile-pinned,
and its vulnerable transitive `sharp` release is overridden with the fixed
release targeted by that override. Re-run the dependency audit for current
advisories; an earlier override is not evidence that the whole tree is audit-clean.

## Release Management

Conventional Commits feed release-please's Node release strategy through
`release-please-config.json` and `.release-please-manifest.json`. A push to
`main` creates or updates a release PR; an ordinary push with no release does
not publish. The release PR owns `CHANGELOG.md`, `package.json`,
`package-lock.json`, and the release-please manifest. A maintainer reviews and
merges it after required checks pass to create the immutable
`vX.Y.Z` tag and GitHub release.

The release workflow then:

1. Selects only the release-please tag, or an explicitly supplied manual tag.
2. Checks out that tag with history on a GitHub-hosted runner.
3. Installs Node 24, npm 11.7.0, Rust 1.95.0, and Chromium without a package
   cache.
4. Verifies the local and remote tag identify `HEAD`, the tree is clean, and
   the tag exactly matches the package version.
5. Runs `npm ci` and the complete `cargo xtask check` gate.
6. Creates one exact tarball, validates its allowlist and license closure, and
   records its integrity, shasum, file inventory, and size report.
7. Queries npm. A recognized missing-version response (`E404` or `ETARGET`)
   permits a publish; any other lookup failure stops the workflow. An existing
   version must byte-for-byte match the checked report and commit or the
   workflow fails.
8. Uploads the exact checked artifact, then publishes that same path publicly
   with npm trusted publishing when it is not already present.
9. Downloads the registry artifact and rechecks integrity, shasum, file
   inventory, version, optional `gitHead`, the `latest` dist-tag, and npm
   signatures/provenance. Because npm metadata and tarball endpoints may become
   consistent at different times, recognized missing-version or stale dist-tag
   responses retry the complete check with bounded backoff; content,
   provenance, and unexpected transport failures remain fail-closed.

Publishing occurs in the same workflow invocation that creates the GitHub
release. A manual `publish_ref` dispatch may retry an existing `vX.Y.Z` tag and
runs the identical verification path. Concurrency never cancels an in-progress
publish.

The publish job alone receives `id-token: write`, plus read-only contents, and
runs in the protected GitHub environment named `npm`. Release-please receives
only contents, pull-request, and issue write permissions. Prefer a
repository-owned fine-grained token or GitHub App credential in the
`RELEASE_PLEASE_TOKEN` secret so release PR events trigger normal checks. The
workflow falls back to `GITHUB_TOKEN`; GitHub suppresses most follow-on workflow
events created with that token, so maintainers must verify the release PR's
required checks when using the fallback.

## First Publication — Completed History

Package bootstrap is complete. This section preserves the original one-time
sequence for historical context, not instructions for the next release. Current
releases and failed-publication retries follow **Release Management** above.

1. The reviewed bootstrap started from the renamed `futex-ai/mokabook`
   repository's clean `main` at `0.0.0`, with `Required CI` passing and the
   first release PR still unmerged.
2. The first public publish required checking availability of the unscoped name
   and explicit maintainer approval because npm publication is irreversible.
3. The checked commit's exact packed tarball was the bootstrap artifact, after
   `cargo xtask check` and report inspection. The procedure used an approved
   maintainer's interactive npm authentication and the non-consumer `bootstrap`
   dist-tag, not a GitHub npm write token.
4. Package creation enabled trusted-publisher configuration for organization
   `futex-ai`, repository `mokabook`, workflow `release.yml`, environment `npm`,
   and the workflow's `npm publish` action. Verification, token-publishing
   restrictions, and obsolete-token removal were part of maintainer setup.
5. A one-time `release-as: 0.1.0` override selected the first supported consumer
   release instead of release-please's unreleased-manifest default. That
   override was removed after publication; do not restore it for normal releases.
   Bare `vX.Y.Z` tags (`include-component-in-tag: false`) remain the contract.
6. Bootstrap verification covered visibility, metadata, README, license, owners,
   provenance/signatures, dist tags, `npx mokabook --version`, and a minimal
   build/serve fixture from a clean directory.

The historical `0.0.0` bootstrap is not a supported consumer version. Do not
repeat name reservation, reset package/manifest versions, or manually publish
bootstrap artifacts when preparing a new release.

## Maintainer Setup

Before enabling publish, maintainers must configure and verify:

- repository Actions may create pull requests, and the default workflow token
  has only the permissions declared in each workflow;
- the branch rule requires the exact `Required CI` status;
- the direct-upload Cloudflare Pages project `mokabook` exists with production
  branch `main`, repository variable `CLOUDFLARE_ACCOUNT_ID` is set, and
  repository secret `CLOUDFLARE_PAGES_API_TOKEN` or `CLOUDFLARE_API_TOKEN`
  holds a least-privilege token with Pages write access;
- the protected `npm` environment has the approved deployment branches/tags and
  reviewers, without storing an npm token;
- the `RELEASE_PLEASE_TOKEN` credential owner, least-privilege repository
  access, expiry/rotation, and fallback behavior;
- approved Firna npm maintainer accounts, enforced 2FA, public unscoped-package
  access, and the intended initial owner list;
- the trusted-publisher repository, workflow filename, environment, and publish
  action exactly match the values above; and
- immutable tag/GitHub release protection and who may invoke the manual retry.

No long-lived npm write token is stored in GitHub Actions.

## Release Evidence

Each release records the checked commit, package version, uploaded tarball and
pack report, verification result, GitHub release, npm URL, provenance/signature
result, and smoke-test result. A failed publish never changes the tag or
rebuilds from a branch; the manual retry accepts only the existing immutable
`vX.Y.Z` tag and repeats the identical path.

## Current External Requirements

Implementation must re-check these primary references because release tooling
changes over time:

- [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/)
- [npm unscoped public packages](https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages/)
- [npm package executables](https://docs.npmjs.com/cli/npm-exec/)
- [npm package metadata](https://docs.npmjs.com/files/package.json/)
- [release-please action](https://github.com/googleapis/release-please-action)

As rechecked on 20 July 2026, npm trusted publishing requires Node 22.14 or
newer and npm 11.5.1 or newer; the `npm trust` management command requires npm
11.15 or newer.
The package must already exist before a trust relationship can be configured.
The workflow's npm 11.7.0 satisfies publishing; use npm 11.15 or newer only for
the separate interactive trust-management command. Trusted publishing creates
provenance automatically on supported GitHub-hosted runners.

## Related Docs

- [Package and authoring contract](./mokabook-package.md)
- [Build, Browse, and Review runtime](./mokabook-runtime.md)
