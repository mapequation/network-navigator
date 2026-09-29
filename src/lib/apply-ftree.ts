import type { ModuleNode } from "@mapequation/d3gl/network";
import { boundaryFlow, moduleFlowOf } from "./boundary-flow";
import type { InfomapTree, InfomapTreeNode, LoadedNetwork } from "./types";

/**
 * Attach an Infomap JSON tree to a raw network, keeping the real edges.
 * No moduleLinks: the raw graph already holds every leaf edge, and d3gl sums
 * moduleLinks on top of the graph's edges, so they would count twice.
 *
 * `flowText` is the same run's flow output (-o flow). With it, a plain
 * network gets each node's boundary flow (its flow-border ring) when that
 * adds up to the tree's module enter/exit flow; see boundaryFlow.
 */
export function withClustering(
  net: LoadedNetwork,
  tree: InfomapTree,
  flowText?: string,
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
  // Each node needs an id of its own: two nodes sharing one would leave one of
  // them unmatched, so name the pair rather than report it as missing below.
  const denseIndex = new Map<number, number>();
  ids.forEach((id, i) => {
    const first = denseIndex.get(id);
    if (first !== undefined) {
      throw new Error(
        `${net.filename}: nodes "${net.names[first]}" and "${net.names[i]}" are two nodes here but one to Infomap (id ${id})`,
      );
    }
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

  // A states network is drawn through d3gl's state views, each of its own
  // node count, so its rings would need a physical and a state variant.
  let ring: Float32Array | undefined;
  if (flowText && !net.isStates) {
    const r = boundaryFlow(tree, flowText, net.graph.nodeCount, (id) =>
      denseIndex.get(id),
    );
    if (r.ok) ring = r.node;
    else console.info(`No flow borders: ${r.reason}`);
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
    boundaryFlow: ring,
    moduleFlow: moduleFlowOf(tree),
  };
}
