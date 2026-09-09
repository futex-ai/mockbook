import fs from "node:fs";
import path from "node:path";

import { projectRealPath } from "../config/paths.js";
import { assertExportActive, exportError } from "./error.js";
import {
  assertExportOwnership,
  type LegacyExportOwnership,
} from "./ownership.js";
import { prepareReservation, reservationPath } from "./reservation.js";

/** Marker proving ownership of an active export reservation. */
export const TRANSACTION_MARKER = ".mokabook-export-transaction";

/** Injectable replacement/cleanup boundary for transaction failure tests. */
export interface ExportOperations {
  rename(from: string, to: string): Promise<void>;
  remove(candidate: string): Promise<void>;
}

/** Real filesystem replacement operations. */
export const fileExportOperations: ExportOperations = {
  rename: (from, to) => fs.promises.rename(from, to),
  remove: (candidate) =>
    fs.promises.rm(candidate, { recursive: true, force: true }),
};

/** Deterministic reservation shared by aliases of the same output. */
export function exportReservation(output: string): string {
  return reservationPath(output);
}

/** One owned stage and rollback directory protected by an exclusive writer. */
export class ExportTransaction {
  readonly stage: string;
  readonly backup: string;
  readonly reservationRoot: string;
  private installed = false;

  private constructor(
    readonly output: string,
    readonly reservation: string,
    private readonly operations: ExportOperations,
    private readonly legacy: LegacyExportOwnership | undefined,
  ) {
    this.stage = path.join(reservation, "stage");
    this.backup = path.join(reservation, "backup");
    this.reservationRoot = path.dirname(path.dirname(reservation));
  }

  /** Reserve output without stealing an abandoned or active reservation. */
  static async open(
    output: string,
    legacy?: LegacyExportOwnership,
    operations = fileExportOperations,
  ): Promise<ExportTransaction> {
    await assertExportOwnership(output, legacy);
    const real = projectRealPath(output);
    await prepareReservation(real);
    const reservation = exportReservation(real);
    try {
      await fs.promises.mkdir(reservation);
    } catch (error) {
      throw exportError(
        `Export reservation unavailable: ${reservation}. Check for an active export before explicitly recovering an abandoned reservation.`,
        error,
      );
    }
    const transaction = new ExportTransaction(
      real,
      reservation,
      operations,
      legacy,
    );
    try {
      await fs.promises.writeFile(
        path.join(reservation, TRANSACTION_MARKER),
        JSON.stringify({ schemaVersion: 2, output: path.basename(real) }),
      );
      await fs.promises.mkdir(transaction.stage);
      return transaction;
    } catch (error) {
      await transaction.close();
      throw error;
    }
  }

  /** Replace validated owned output and restore its previous bytes on failure. */
  async install(signal?: AbortSignal): Promise<void> {
    await assertExportOwnership(this.output, this.legacy);
    assertExportActive(signal);
    const existed = fs.existsSync(this.output);
    if (existed) await this.operations.rename(this.output, this.backup);
    try {
      assertExportActive(signal);
      await this.operations.rename(this.stage, this.output);
    } catch (error) {
      if (existed) {
        try {
          await this.operations.rename(this.backup, this.output);
        } catch (rollback) {
          throw exportError(
            `Export rollback failed; recover the previous site from ${this.backup}.`,
            new AggregateError([error, rollback]),
          );
        }
      }
      throw exportError(
        "Could not install export; the previous output was restored.",
        error,
      );
    }
    this.installed = true;
    if (existed) {
      try {
        await this.operations.remove(this.backup);
      } catch (error) {
        throw exportError(
          `Export installed, but backup cleanup failed at ${this.backup}.`,
          error,
        );
      }
    }
  }

  /** Remove only this operation's temporary files, retaining a recovery backup. */
  async close(): Promise<void> {
    if (fs.existsSync(this.backup))
      throw exportError(
        `${this.installed ? "Export installed, but recovery files" : "Export recovery files"} retained at ${this.reservation}; the backup was not deleted.`,
      );
    try {
      await this.operations.remove(this.reservation);
    } catch (error) {
      throw exportError(
        `Export cleanup failed; owned temporary files remain at ${this.reservation}.`,
        error,
      );
    }
  }
}
