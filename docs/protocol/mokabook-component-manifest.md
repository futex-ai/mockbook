# Component Manifest Schema

## Delivery Status

Approved target, not implemented. These are the normative manifest-v4 interfaces
for the [component contract](./mokabook-components.md). `ManifestEntryBase`,
`ManifestScreen`, `ManifestCollection`, `ManifestUseCase`, `ManifestLegacyPage`,
and `Viewport` retain the [v3 contract](./mokabook-package.md) and the named
[registry interfaces](../../src/registry/types.ts).
`ColorScheme` is `"light" | "dark"`. Prop/wire types come from the
[prop schema](./mokabook-component-props.md); `ComponentControl` comes from the
[controls contract](./mokabook-component-controls.md).

## Entries And Variants

```ts
interface ManifestV4 {
  schemaVersion: 4;
  generatedBy: "mokabook";
  entries: readonly ManifestEntryV4[];
  legacyPages: readonly ManifestLegacyPage[];
}

type ManifestEntryV4 =
  ManifestCollection | ManifestUseCase | ManifestScreenV4 | ManifestComponent;

interface ManifestScreenV4 extends ManifestScreen {
  componentViews: readonly ComponentViewRecord[];
}

interface ManifestComponent extends Omit<ManifestEntryBase, "kind"> {
  kind: "component";
  route: string;
  viewports: readonly ["mobile", "desktop"];
  tags?: readonly string[];
  propSchema: ObjectPropSchema;
  slots: readonly string[];
  controls: Readonly<Record<string, ComponentControl>>;
  ownedDependencies: readonly string[];
  variants: readonly ManifestComponentVariant[];
}

interface ManifestComponentVariant {
  id: string;
  title: string;
  description?: string;
  props: ComponentWireProps;
  suppliedSlots: readonly string[];
  fragments: Record<Viewport, string>;
  darkFragments?: Record<Viewport, string>;
  componentViews: readonly ComponentViewRecord[];
}
```

Common entry metadata keeps v3 meaning, including source attribution and
hierarchy-derived `navPath`. Variant props contain only validated data; supplied
slot names reference declared slots and contain no React values. Every component
has at least one variant, with unique kebab-case ids in authored order. The first
is the default; all variants use the component's same effective scheme set.

`componentViews` contains exactly one record for each light and optional dark
fragment, ordered mobile/light, mobile/dark, desktop/light, desktop/dark. It is
required even for a view with no component instances. Missing metadata is never
normalized to an empty record. The root component of its own variant is the
entry owner and is not listed as its own used instance.

## Usage And Rendered Ranges

```ts
type ComponentInputOwner =
  { kind: "entry" } | { kind: "instance"; instanceKey: string };

interface ComponentInstanceRecord {
  key: string;
  id: string;
  componentId: string;
  owner: ComponentInputOwner;
  slotKey?: string;
  order: number;
  props: ComponentWireProps;
  propsKey: string;
}

interface ComponentSlotRecord {
  key: string;
  instanceKey: string;
  name: string;
  owner: ComponentInputOwner;
  sourceSlotKey?: string;
}

type ComponentRangeTarget =
  { kind: "instance"; instanceKey: string } | { kind: "slot"; slotKey: string };

interface ComponentRangeRecord {
  id: string;
  target: ComponentRangeTarget;
  parentId?: string;
}

interface ComponentStyleOwnership {
  startOffset: number;
  endOffset: number;
  componentIds: readonly string[];
}

interface ComponentResourceOwnership {
  path: string;
  componentIds: readonly string[];
}

interface ComponentViewRecord {
  viewport: Viewport;
  colorScheme: ColorScheme;
  instances: readonly ComponentInstanceRecord[];
  slots: readonly ComponentSlotRecord[];
  ranges: readonly ComponentRangeRecord[];
  styles: readonly ComponentStyleOwnership[];
  resources: readonly ComponentResourceOwnership[];
}
```

All references in one view are local to that document except component ids,
which reference registered entries. `id` is the local `mokabookInstance` value
or its component-id default. Instance and slot keys are lowercase 64-hex SHA-256
digests of UTF-8 JSON preimages, without a trailing newline. For an instance,
the preimage is the array
`["mokabook-instance-v1", owner.kind, owner.kind === "instance" ? owner.instanceKey : null, slotKey ?? null, id]`.
For a slot it is `["mokabook-slot-v1", instanceKey, name]`, using its receiving
instance and declared slot name. Serialize those arrays with `JSON.stringify`.
An entry owner means the containing screen or component variant. Parent/slot
references are their fixed-size digests, never recursively embedded JSON keys.
Readers recompute keys from the record fields and reject mismatches or conflicting
duplicate keys. Neither key is a filesystem path, selector, catalogue id, or
route segment. This bounds key length independently of nesting depth.

`owner` identifies the caller whose inputs are compared. `slotKey`, when present,
identifies the original slot scope in which the instance was supplied. The slot
owner equals that instance's input owner. A forwarded slot names its prior
record in `sourceSlotKey` and preserves the original owner; following this chain
must terminate. Its contents retain the original slot scope. Owner, slot-source,
and range-parent graphs must be acyclic, with no missing references.

Instances sort by key; `order` separately records the zero-based encounter order
within each `(owner, slotKey)` scope and must be contiguous and unique. Keys and
local ids within a scope are unique. Multiple placements of the same captured
slot may yield several ranges for one logical instance; they must agree on its
props and owner. Conflicting duplicate invocations fail. Slot records sort by
key and exist for supplied slots even when the adapter never renders them.

Ranges record physical placement independently of input ownership. They sort
in DOM start-marker order and have ids `r-0`, `r-1`, and so on. Each has exactly
one matched boundary pair; `parentId` identifies its nearest enclosing registered
range, including slots. Multi-root/text output occupies one enclosing range.
An invoked null component has an empty range with no visible bounds. Unrendered
slots have no range; repeated placements have different range ids.

Range ids, physical parentage, style offsets, and repeated placement counts are
inspection coordinates, not direct input identity. A component implementation
moving or duplicating an unchanged slot must not itself mark the caller changed.
Comparison projects each original slot's material once under its input owner,
then applies the [attribution rules](./mokabook-component-changes.md). Caller
changes to logical instance ids/order/props still remain material.

## Styles, Validation, And Serialization

Style offsets are nonnegative safe integers delimiting a nonempty half-open
UTF-16 range in the final generated HTML, within a parsed style element's text.
The builder rebases renderer offsets through its own transformations and
validates ownership after compatibility output; it never trusts stale offsets.
Ranges must not overlap and sort by start offset. Resource paths are exact
mockups-root-relative public files and sort lexically, with one record per path.
Owner lists are nonempty, sorted, duplicate-free component ids that actually
render in the view, including its component root when applicable. Ownership is
an explicit renderer/author assertion, not CSS-selector inference.

Use one schema implementation for Build output, Browse, historical manifest
parsing, and publishing. Reject unknown fields in new v4 structures, incorrect
types, invalid keys/ids/hashes, inconsistent props/schema, duplicate records,
unsafe paths, and broken cross-references. Preserve current validation of the
inherited v3 entry forms. The hash must match decoded/validated props.

Ids, routes, dependency roots, source paths, collection/use-case relationships,
tags, resource confinement, and global output collisions retain existing rules.
Variant fragment paths must exactly match the component route and suffix rule
in the authoring contract, including every optional dark path. `ownedDependencies`
is a subset of `dependencies`; validate and retain direct-screen overlap evidence.

Entries sort by route (empty for collections), then id; lexical ordering in v4
uses UTF-16 code units rather than a locale-sensitive collator. Variants,
collection children, use-case steps, and tags retain authored order. Legacy pages sort by route.
Dependency arrays sort uniquely, as do owned paths, supplied slots, and the
declared `slots` list. JSON object keys in new structures sort lexically;
arrays follow their stated order. Omit absent optional fields; emit required
empty arrays/objects. Serialize with two-space indentation and a final LF.

Emit v4 only when components are registered; otherwise retain existing v3 bytes.
Read v3 unchanged and v2 only through its current explicit compatibility path.
Do not invent v4 usage for historical v3 entries. Reject unknown versions.
Implement shared positive/negative contract fixtures, schema round trips,
deterministic-output checks, and ownership/path regressions in Milestone 2.
