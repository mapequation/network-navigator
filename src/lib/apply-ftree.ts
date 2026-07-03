import type { ModuleNode } from "@mapequation/d3gl/network";
import { parseTree } from "@mapequation/infomap-parser";
import { parseNodePath } from "./path-key";
import type { LoadedNetwork } from "./types";

interface ParsedNode {
  path: number[] | string;
  flow?: number;
  name?: string;
  id: number;
  stateId?: number;
}

/** Attach an Infomap ftree result to a raw network, keeping the real edges. */
export function withClustering(
  net: LoadedNetwork,
  ftreeText: string,
): LoadedNetwork {
  const result = parseTree(ftreeText, undefined, true, false);
  const nodes = result.nodes as unknown as ParsedNode[];

  // Raw states networks are keyed by state id; plain networks by physical id.
  const keyOf = (n: ParsedNode): number =>
    net.isStates ? (n.stateId ?? n.id) : n.id;
  const denseIndex = new Map<number, number>();
  (net.isStates && net.stateIds ? net.stateIds : net.physicalIds).forEach(
    (id, i) => {
      denseIndex.set(id, i);
    },
  );

  const modules: ModuleNode[] = new Array(net.graph.nodeCount);
  const nodeFlow = new Float32Array(net.graph.nodeCount);
  const names = [...net.names];
  let covered = 0;
  for (const n of nodes) {
    const idx = denseIndex.get(keyOf(n));
    // Skip unknown and duplicate keys (first write wins) so `covered`
    // counts distinct filled indices and the guard below stays sound.
    if (idx === undefined || modules[idx] !== undefined) continue;
    modules[idx] = { id: idx, path: parseNodePath(n.path) };
    nodeFlow[idx] = n.flow ?? 0;
    if (n.name) names[idx] = n.name;
    covered++;
  }
  if (covered < net.graph.nodeCount) {
    throw new Error(
      `ftree is missing ${net.graph.nodeCount - covered} of ${net.graph.nodeCount} nodes`,
    );
  }

  return {
    ...net,
    kind: "clustered",
    graph: { ...net.graph, nodeFlow },
    stateGraph: net.stateGraph ? { ...net.stateGraph, nodeFlow } : undefined,
    names,
    modules,
    ftree: ftreeText,
  };
}
