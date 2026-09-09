import path from "node:path";

import { loadConfig } from "../../dist/config/load.js";
import { buildPreview } from "./catalogue.mjs";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const configPath = path.join(
  repositoryRoot,
  "examples/basic/mokabook.config.ts",
);
const output = outputArgument(process.argv.slice(2));
const config = await loadConfig(repositoryRoot, configPath);

await buildPreview(config, output);
process.stdout.write(`Built Mokabook preview at ${output}.\n`);

function outputArgument(arguments_) {
  if (arguments_.length === 0)
    return path.join(repositoryRoot, ".context/mokabook-preview");
  if (arguments_.length === 2 && arguments_[0] === "--out")
    return path.resolve(repositoryRoot, arguments_[1]);
  throw new Error("usage: node scripts/preview/build.mjs [--out <path>]");
}
