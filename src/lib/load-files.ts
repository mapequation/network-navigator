import {
  detectFormat,
  type ParsedPajek,
  parseEdgeList,
  parsePajek,
} from "@mapequation/d3gl/network";
import { withClustering } from "./apply-ftree";
import { type FileKind, fileKind, isStatesText } from "./file-kinds";
import { ftreeToNetwork } from "./ftree-graph";
import { buildInfomapArgs, infomapArgString } from "./infomap-args";
import { byteLength, computeStats } from "./network-stats";
import { parseStates } from "./parse-states";
import { runInfomap } from "./run-infomap";
import type { ClusterOptions, LoadedNetwork, SourceFile } from "./types";

export interface NamedText {
  name: string;
  text: string;
  /** Byte size when known (File.size); computed from `text` otherwise. */
  size?: number;
  /** Kind as staged (a restaged metadata .txt); from the extension otherwise. */
  kind?: FileKind;
}

const kindOf = (f: NamedText): FileKind => f.kind ?? fileKind(f.name);

/**
 * Parse a raw network file (Pajek, edge list, or *States) into a LoadedNetwork.
 * `directedOverride: true` forces directed links (mirroring Infomap's `-d` flag);
 * undefined defers to the file format (Pajek *Arcs directed, *Edges undirected,
 * states default directed).
 */
export function networkToLoaded(
  text: string,
  filename: string,
  directedOverride?: boolean,
  size = byteLength(text),
): LoadedNetwork {
  const sources: SourceFile[] = [
    { name: filename, size, text, kind: "network" },
  ];
  if (isStatesText(text)) {
    const parsed = parseStates(text, filename, directedOverride ?? true);
    const g = parsed.stateGraph;
    return {
      kind: "raw",
      filename,
      sources,
      stats: computeStats(g.stateCount, g.source, g.target, g.weight, {
        physicalIds: parsed.physicalIds,
      }),
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
  const { parsed, physicalIds } = parseWithIds(text, filename);
  const directed = directedOverride ?? parsed.directed;
  return {
    kind: "raw",
    filename,
    sources,
    stats: computeStats(
      parsed.nodeCount,
      parsed.source,
      parsed.target,
      parsed.weight,
    ),
    directed,
    isStates: false,
    graph: {
      nodeCount: parsed.nodeCount,
      source: parsed.source,
      target: parsed.target,
      weight: parsed.weight,
      directed,
    },
    names: [...parsed.labels],
    physicalIds,
    networkText: text,
  };
}

/**
 * Parse a Pajek file or an edge list together with the node ids Infomap keys
 * its output by. One format decision drives both the parse and the ids:
 * - Pajek: the ids are the vertex numbers (the parser puts vertex v at dense
 *   index v - 1); the vertex labels are names, whatever they look like.
 * - Edge list: there are no names; each node token is the node's id. Infomap
 *   reads only integer ids, so a file with any other token has no ids.
 */
function parseWithIds(
  text: string,
  filename: string,
): { parsed: ParsedPajek; physicalIds?: number[] } {
  if (detectFormat(text, filename) === "pajek") {
    const parsed = parsePajek(text);
    const physicalIds = Array.from(
      { length: parsed.nodeCount },
      (_, i) => i + 1,
    );
    return { parsed, physicalIds };
  }
  const parsed = { ...parseEdgeList(text), directed: false };
  const integerIds = parsed.labels.every((l) => /^\d+$/.test(l));
  return {
    parsed,
    physicalIds: integerIds ? parsed.labels.map(Number) : undefined,
  };
}

export interface LoadCallbacks {
  /** Infomap is about to run (partition loads only), with its command line. */
  onInfomapStart?: (command: string) => void;
  onLog?: (line: string) => void;
}

/**
 * Turn a set of dropped files into a LoadedNetwork:
 * - one .ftree alone → clustered network
 * - one network file alone → raw network
 * - one network + one .tree/.clu → Infomap runs with the partition as cluster
 *   data (full run seeded by it, or flow-only with noInfomap)
 * Metadata files (.csv/.tsv) are skipped: the caller adds them to the store
 * once the network is set.
 */
export async function loadFiles(
  files: NamedText[],
  opts: ClusterOptions,
  cb: LoadCallbacks = {},
): Promise<LoadedNetwork> {
  const unsupported = files.find((f) => kindOf(f) === "unknown");
  if (unsupported)
    throw new Error(`Unsupported file type: ${unsupported.name}`);
  const net = await loadStructure(files, opts, cb);
  net.loadOptions = opts;
  return net;
}

async function loadStructure(
  files: NamedText[],
  opts: ClusterOptions,
  cb: LoadCallbacks,
): Promise<LoadedNetwork> {
  const ftrees = files.filter((f) => kindOf(f) === "ftree");
  const partitions = files.filter((f) => ["tree", "clu"].includes(kindOf(f)));
  const networks = files.filter((f) => kindOf(f) === "network");

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
    return ftreeToNetwork(ftrees[0].text, ftrees[0].name, ftrees[0].size);
  }
  if (!networks.length) {
    throw new Error(
      partitions.length
        ? "A partition file needs its network file"
        : files.some((f) => kindOf(f) === "metadata")
          ? "Metadata files need a network or .ftree file"
          : "No files to load",
    );
  }

  const net = networkToLoaded(
    networks[0].text,
    networks[0].name,
    opts.directed || undefined,
    networks[0].size,
  );
  if (!partitions.length) return net;

  const partition = partitions[0];
  const args = buildInfomapArgs({ ...opts, clusterFilename: partition.name });
  cb.onInfomapStart?.(`infomap ${infomapArgString(args)}`);
  const tree = await runInfomap({
    network: networks[0].text,
    filename: networks[0].name,
    args,
    files: { [partition.name]: partition.text },
    onLog: cb.onLog,
  });
  const clustered = withClustering(net, tree);
  clustered.sources = [
    ...net.sources,
    {
      name: partition.name,
      size: partition.size ?? byteLength(partition.text),
      text: partition.text,
      kind: kindOf(partition),
    },
  ];
  return clustered;
}
