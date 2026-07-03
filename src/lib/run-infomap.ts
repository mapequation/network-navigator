import Infomap from "@mapequation/infomap";
import type { InfomapArguments } from "./infomap-args";

export interface RunInfomapOptions {
  network: string;
  filename: string;
  args: InfomapArguments;
  /** Virtual files (e.g. cluster data) — keys must match args.clusterData. */
  files?: Record<string, string>;
  onProgress?: (percent: number) => void;
  onLog?: (line: string) => void;
}

/** Run Infomap in its web worker; resolve with the ftree text (states variant preferred). */
export async function runInfomap(opts: RunInfomapOptions): Promise<string> {
  const infomap = new Infomap();
  if (opts.onProgress) infomap.on("progress", opts.onProgress);
  if (opts.onLog) infomap.on("data", opts.onLog);
  const result = await infomap.runAsync({
    network: opts.network,
    filename: opts.filename,
    args: opts.args,
    files: opts.files,
  });
  const ftree = result.ftree_states ?? result.ftree;
  if (!ftree) throw new Error("Infomap finished without ftree output");
  return ftree;
}
