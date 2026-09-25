import Infomap from "@mapequation/infomap";
import { type InfomapArguments, infomapArgString } from "./infomap-args";
import type { InfomapTree } from "./types";

export interface RunInfomapOptions {
  network: string;
  filename: string;
  args: InfomapArguments;
  /** Extra command-line flags appended to `args`. */
  flags?: string;
  /** Virtual files (e.g. cluster data) — keys must match args.clusterData. */
  files?: Record<string, string>;
  /** One call per stdout line (no trailing newline; blank lines included). */
  onLog?: (line: string) => void;
}

/** Run Infomap in its web worker; resolve with the JSON tree (states variant preferred). */
export async function runInfomap(
  opts: RunInfomapOptions,
): Promise<InfomapTree> {
  const infomap = new Infomap();
  if (opts.onLog) infomap.on("data", opts.onLog);
  const result = await infomap.runAsync({
    network: opts.network,
    filename: opts.filename,
    args: infomapArgString(opts.args, opts.flags),
    files: opts.files,
  });
  const tree: InfomapTree | undefined = result.json_states ?? result.json;
  if (!tree) throw new Error("Infomap finished without JSON output");
  return tree;
}
