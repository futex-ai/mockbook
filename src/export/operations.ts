import fs from "node:fs";

/** Filesystem mutation boundary; recursive removal is only for private stages. */
export interface ExportOperations {
  lstat(candidate: string): Promise<fs.Stats | undefined>;
  rename(from: string, to: string): Promise<void>;
  remove(candidate: string): Promise<void>;
  unlink(candidate: string): Promise<void>;
  rmdir(candidate: string): Promise<void>;
}

/** Native replacement and non-recursive backup cleanup operations. */
export const fileExportOperations: ExportOperations = {
  lstat: async (candidate) => {
    try {
      return await fs.promises.lstat(candidate);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw error;
    }
  },
  rename: (from, to) => fs.promises.rename(from, to),
  remove: (candidate) =>
    fs.promises.rm(candidate, { recursive: true, force: true }),
  unlink: (candidate) => fs.promises.unlink(candidate),
  rmdir: (candidate) => fs.promises.rmdir(candidate),
};
