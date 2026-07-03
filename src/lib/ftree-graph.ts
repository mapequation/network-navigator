import { parseTree } from "@mapequation/infomap-parser";
import { normalizeModulePath, parseNodePath, pathKey } from "./path-key";
import type { LoadedNetwork } from "./types";

interface ParsedNode {
  path: number[] | string;
  flow?: number;
  name?: string;
  id: number;
  stateId?: number;
}

/**
 * Leaf edges come from bottom-module *Links rows. A module-level link becomes
 * ONE leaf edge between the highest-flow leaves of its endpoint modules
 * (weight = link flow) so d3gl's LOD derives super-edges with the correct
 * aggregate flow. Upstreaming tracked by mapequation/d3gl#199.
 */
export function ftreeToNetwork(text: string, filename: string): LoadedNetwork {
  const result = parseTree(text, undefined, true, false);
  const nodes = result.nodes as unknown as ParsedNode[];
  if (!nodes.length) throw new Error(`${filename}: no nodes found`);

  const directed = result.directed ?? /^\*Links\s+directed/im.test(text);
  const isStates = nodes[0]?.stateId !== undefined;

  const names: string[] = [];
  const physicalIds: number[] = [];
  const stateIds: number[] = [];
  const nodeFlow = new Float32Array(nodes.length);
  const leafByPath = new Map<string, number>();
  const bestLeaf = new Map<string, number>(); // module pathKey → highest-flow leaf index

  nodes.forEach((node, i) => {
    const path = parseNodePath(node.path);
    names.push(node.name ?? String(node.id));
    physicalIds.push(node.id);
    if (node.stateId !== undefined) stateIds.push(node.stateId);
    nodeFlow[i] = node.flow ?? 0;
    leafByPath.set(pathKey(path), i);
    for (let k = 1; k < path.length; k++) {
      const key = pathKey(path.slice(0, k));
      const best = bestLeaf.get(key);
      if (best === undefined || (nodes[best].flow ?? 0) < (node.flow ?? 0))
        bestLeaf.set(key, i);
    }
  });

  const source: number[] = [];
  const target: number[] = [];
  const weight: number[] = [];
  for (const module of result.modules ?? []) {
    const modPath = normalizeModulePath(module.path);
    const resolve = (child: number): number => {
      const key = pathKey([...modPath, child]);
      const leaf = leafByPath.get(key) ?? bestLeaf.get(key);
      if (leaf === undefined)
        throw new Error(`${filename}: link endpoint ${key} not found`);
      return leaf;
    };
    for (const link of module.links ?? []) {
      source.push(resolve(link.source));
      target.push(resolve(link.target));
      weight.push(link.flow);
    }
  }

  const net: LoadedNetwork = {
    kind: "clustered",
    filename,
    directed,
    isStates,
    graph: {
      nodeCount: nodes.length,
      source,
      target,
      weight,
      nodeFlow,
      directed,
    },
    names,
    physicalIds,
    modules: nodes.map((n, i) => ({ id: i, path: parseNodePath(n.path) })),
    ftree: text,
  };

  if (isStates) {
    net.stateIds = stateIds;
    const physicalIndex = new Map<number, number>();
    for (const id of physicalIds) {
      if (!physicalIndex.has(id)) physicalIndex.set(id, physicalIndex.size);
    }
    net.stateGraph = {
      stateCount: nodes.length,
      stateToPhysical: physicalIds.map((id) => physicalIndex.get(id) ?? 0),
      source,
      target,
      weight,
      nodeFlow,
      directed,
      physicalCount: physicalIndex.size,
    };
  }

  return net;
}
