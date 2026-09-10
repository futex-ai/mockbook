import { createHash } from "node:crypto";

import type { ComponentInputOwner } from "./manifest_types.js";

export const isComponentKey = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);

export function instanceKey(
  owner: ComponentInputOwner,
  slot: string | undefined,
  id: string,
): string {
  return digest([
    "mokabook-instance-v1",
    owner.kind,
    owner.kind === "instance" ? owner.instanceKey : null,
    slot ?? null,
    id,
  ]);
}
export function slotKey(instance: string, name: string): string {
  return digest(["mokabook-slot-v1", instance, name]);
}
function digest(value: readonly unknown[]): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
