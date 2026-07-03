import { parseNetwork } from "@mapequation/d3gl/network";
import { withClustering } from "./apply-ftree";
import { fileKind, isStatesText } from "./file-kinds";
import { ftreeToNetwork } from "./ftree-graph";
import { buildInfomapArgs } from "./infomap-args";
import { parseStates } from "./parse-states";
import { runInfomap } from "./run-infomap";
import type { ClusterOptions, LoadedNetwork } from "./types";

export interface NamedText {
  name: string;
  text: string;
}

/** Parse a raw network file (Pajek, edge list, or *States) into a LoadedNetwork. */
export function networkToLoaded(
  text: string,
  filename: string,
  directedOverride?: boolean,
): LoadedNetwork {
  if (isStatesText(text)) {
    const parsed = parseStates(text, filename, directedOverride ?? true);
    return {
      kind: "raw",
      filename,
      directed: parsed.stateGraph.directed ?? true,
      isStates: true,
      graph: parsed.graph,
      stateGraph: parsed.stateGraph,
      names: parsed.names,
      physicalIds: parsed.physicalIds,
      stateIds: parsed.stateIds,
      networkText: text,
    };
  }
  const parsed = parseNetwork(text, filename);
  const directed = directedOverride ?? parsed.directed;
  // Infomap keys its output by the file's node ids. Pajek ids are 1..N; edge
  // lists may use arbitrary numeric ids preserved in labels — recover them so
  // withClustering can match.
  const numericLabels =
    parsed.labels.length === parsed.nodeCount &&
    parsed.labels.every((l) => /^\d+$/.test(l));
  const physicalIds = numericLabels
    ? parsed.labels.map(Number)
    : Array.from({ length: parsed.nodeCount }, (_, i) => i + 1);
  return {
    kind: "raw",
    filename,
    directed,
    isStates: false,
    graph: {
      nodeCount: parsed.nodeCount,
      source: parsed.source,
      target: parsed.target,
      weight: parsed.weight,
      directed,
    },
    names: parsed.labels.length ? [...parsed.labels] : physicalIds.map(String),
    physicalIds,
    networkText: text,
  };
}

export interface LoadCallbacks {
  onProgress?: (percent: number) => void;
  onLog?: (line: string) => void;
}

/**
 * Turn a set of dropped files into a LoadedNetwork:
 * - one .ftree alone → clustered network
 * - one network file alone → raw network
 * - one network + one .tree/.clu → Infomap runs with the partition as cluster
 *   data (full run seeded by it, or flow-only with noInfomap)
 */
export async function loadFiles(
  files: NamedText[],
  opts: ClusterOptions,
  cb: LoadCallbacks = {},
): Promise<LoadedNetwork> {
  const unsupported = files.find((f) => fileKind(f.name) === "unknown");
  if (unsupported)
    throw new Error(`Unsupported file type: ${unsupported.name}`);

  const ftrees = files.filter((f) => fileKind(f.name) === "ftree");
  const partitions = files.filter((f) =>
    ["tree", "clu"].includes(fileKind(f.name)),
  );
  const networks = files.filter((f) => fileKind(f.name) === "network");

  if (ftrees.length > 1 || networks.length > 1 || partitions.length > 1) {
    throw new Error(
      "Load at most one network, one ftree, and one partition file",
    );
  }
  if (ftrees.length) {
    if (networks.length || partitions.length) {
      throw new Error(
        "Load an .ftree alone, or a network file with an optional partition",
      );
    }
    return ftreeToNetwork(ftrees[0].text, ftrees[0].name);
  }
  if (!networks.length) {
    throw new Error(
      partitions.length
        ? "A partition file needs its network file"
        : "No files to load",
    );
  }

  const net = networkToLoaded(
    networks[0].text,
    networks[0].name,
    opts.directed || undefined,
  );
  if (!partitions.length) return net;

  const partition = partitions[0];
  const ftree = await runInfomap({
    network: networks[0].text,
    filename: networks[0].name,
    args: buildInfomapArgs({ ...opts, clusterFilename: partition.name }),
    files: { [partition.name]: partition.text },
    onProgress: cb.onProgress,
    onLog: cb.onLog,
  });
  return withClustering(net, ftree);
}
