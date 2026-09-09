import fs from "node:fs";
import path from "node:path";

import { isInside, isSafeRepositoryPath } from "../config/paths.js";
import { EXPORT_MARKER, parseExportOwnership } from "./ownership.js";
import { exportReservation, TRANSACTION_MARKER } from "./transaction.js";

/** Recognize proven output/reservations, not unrelated similarly named files. */
export function isExportIgnoredPath(
  candidate: string,
  repoRoot: string,
): boolean {
  for (
    let directory = candidate;
    isInside(repoRoot, directory) && directory !== repoRoot;
    directory = path.dirname(directory)
  ) {
    const ownership = readMarker(directory, EXPORT_MARKER);
    if (ownership && parseExportOwnership(ownership)) return true;
    if (validReservation(directory)) return true;
    try {
      if (validReservation(exportReservation(directory))) return true;
    } catch {
      // A disappearing unowned path is not proof of export ownership.
    }
  }
  return false;
}

function validReservation(directory: string): boolean {
  const content = readMarker(directory, TRANSACTION_MARKER);
  if (!content) return false;
  try {
    const value: unknown = JSON.parse(content);
    if (
      !value ||
      typeof value !== "object" ||
      !("schemaVersion" in value) ||
      value.schemaVersion !== 1 ||
      !("output" in value) ||
      typeof value.output !== "string" ||
      !isSafeRepositoryPath(value.output) ||
      value.output.includes("/")
    )
      return false;
    return (
      exportReservation(path.join(path.dirname(directory), value.output)) ===
      directory
    );
  } catch {
    return false;
  }
}

function readMarker(directory: string, marker: string): string | undefined {
  try {
    const candidate = path.join(directory, marker);
    const stat = fs.lstatSync(candidate);
    return stat.isFile() && stat.size <= 8 * 1024 * 1024
      ? fs.readFileSync(candidate, "utf8")
      : undefined;
  } catch {
    return undefined;
  }
}
