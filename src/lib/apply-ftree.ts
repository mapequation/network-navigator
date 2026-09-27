import type { ModuleNode } from "@mapequation/d3gl/network";
import type { InfomapTree, InfomapTreeNode, LoadedNetwork } from "./types";

/**
 * Attach an Infomap JSON tree to a raw network, keeping the real edges.
 * No moduleLinks: the raw graph already holds every leaf edge, and d3gl sums
 * moduleLinks on top of the graph's edges, so they would count twice.
 */
export function withClustering(
  net: LoadedNetwork,
  tree: InfomapTree,
): LoadedNetwork {
  // Raw states networks are keyed by state id; plain networks by physical id.
  const keyOf = (n: InfomapTreeNode): number =>
    net.isStates ? (n.stateId ?? n.id) : n.id;
  const ids = net.isStates && net.stateIds ? net.stateIds : net.physicalIds;
  if (!ids) {
    throw new Error(
      `${net.filename} has no integer node ids to match Infomap output to`,
    );
  }
  const denseIndex = new Map<number, number>();
  ids.forEach((id, i) => {
    denseIndex.set(id, i);
  });

  const modules: ModuleNode[] = new Array(net.graph.nodeCount);
  const nodeFlow = new Float32Array(net.graph.nodeCount);
  const names = [...net.names];
  let covered = 0;
  for (const n of tree.nodes) {
    const idx = denseIndex.get(keyOf(n));
    // Skip unknown and duplicate keys (first write wins) so `covered`
    // counts distinct filled indices and the guard below stays sound.
    if (idx === undefined || modules[idx] !== undefined) continue;
    modules[idx] = { id: idx, path: n.path };
    nodeFlow[idx] = n.flow ?? 0;
    if (n.name) names[idx] = n.name;
    covered++;
  }
  if (covered < net.graph.nodeCount) {
    throw new Error(
      `Infomap output is missing ${net.graph.nodeCount - covered} of ${net.graph.nodeCount} nodes`,
    );
  }

  return {
    ...net,
    kind: "clustered",
    graph: { ...net.graph, nodeFlow },
    stateGraph: net.stateGraph ? { ...net.stateGraph, nodeFlow } : undefined,
    names,
    modules,
    infomap: {
      codelength: tree.codelength,
      numLevels: tree.numLevels,
      numTopModules: tree.numTopModules,
      relativeCodelengthSavings: tree.relativeCodelengthSavings,
    },
    infomapJson: tree,
  };
}
