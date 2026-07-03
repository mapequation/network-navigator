import type { ClusterOptions } from "./types";

// The Arguments type lives in @mapequation/infomap; keep the subset we use
// structural so the exact type-export path never bites us. output stays a
// literal type so the whole object is assignable to the library's Arguments.
export interface InfomapArguments {
  output: "ftree"[];
  silent: boolean;
  directed?: boolean;
  twoLevel?: boolean;
  noInfomap?: boolean;
  clusterData?: string;
}

export function buildInfomapArgs(o: ClusterOptions): InfomapArguments {
  const args: InfomapArguments = { output: ["ftree"], silent: true };
  if (o.directed) args.directed = true;
  if (o.twoLevel) args.twoLevel = true;
  if (o.noInfomap) args.noInfomap = true;
  if (o.clusterFilename) args.clusterData = o.clusterFilename;
  return args;
}
