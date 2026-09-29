import {
  buildGraph,
  buildStateGraph,
  type Network,
  type NetworkGraph,
  type StateNetworkGraph,
} from "@mapequation/d3gl/network";
import { makeAutoObservable, observable } from "mobx";
import { withClustering } from "../lib/apply-ftree";
import { parseNodeNames } from "../lib/node-names";
import { OCCURRENCE_COLORS } from "../lib/occurrence-colors";
import { pathKey } from "../lib/path-key";
import type { InfomapTree, LoadedNetwork } from "../lib/types";

export interface SelectionInfo {
  ids: number[];
  aggregate: boolean;
  name: string;
  path: number[] | null;
  flow: number | null;
  physicalId: number | null;
}

export interface OccurrenceFile {
  /** Stable identity for React keys — files may share a name. */
  id: string;
  name: string;
  /** Size in bytes. */
  size: number;
  /** File text as loaded, so the load dialog can restage it. */
  text: string;
  ids: number[];
  idSet: Set<number>;
  color: string;
  enabled: boolean;
}

/** Common module path shared by a set of leaf paths (excluding the leaf position). */
function commonPathPrefix(paths: ArrayLike<number>[]): number[] {
  const first = paths[0];
  if (!first) return [];
  let len = first.length - 1;
  for (const p of paths) {
    let k = 0;
    const max = Math.min(len, p.length - 1);
    while (k < max && p[k] === first[k]) k++;
    len = k;
    if (!len) break;
  }
  return Array.from({ length: len }, (_, k) => first[k]);
}

/** See {@link NetworkStore.maxLinkFlow}. */
function maxLinkFlowOf(net: LoadedNetwork, maxLeafWeight: number): number {
  let max = maxLeafWeight;
  for (const l of net.moduleLinks ?? []) if (l.flow > max) max = l.flow;
  const modules = net.modules;
  if (!modules) return max;
  // Leaf links summed per ordered pair of distinct top modules (the coarsest super-edges).
  const g = net.graph;
  const pair = new Map<number, number>();
  const tops = 1 + modules.reduce((m, r) => Math.max(m, r.path[0] ?? 0), 0);
  for (let e = 0; e < g.source.length; e++) {
    const a = modules[g.source[e]]?.path[0];
    const b = modules[g.target[e]]?.path[0];
    if (a === undefined || b === undefined || a === b) continue;
    const key = a * tops + b;
    const sum = (pair.get(key) ?? 0) + (g.weight?.[e] ?? 1);
    pair.set(key, sum);
    if (sum > max) max = sum;
  }
  return max;
}

/** Module pathKey → highest-flow leaf, over every module prefix. O(nodes · depth). */
function topLeaves(net: LoadedNetwork): Map<string, number> {
  const out = new Map<string, number>();
  const flow = net.graph.nodeFlow as ArrayLike<number> | undefined;
  if (!net.modules || !flow) return out;
  for (const { id, path } of net.modules) {
    for (let k = 1; k < path.length; k++) {
      const key = pathKey(Array.prototype.slice.call(path, 0, k));
      const best = out.get(key);
      if (best === undefined || flow[id] > flow[best]) out.set(key, id);
    }
  }
  return out;
}

export class NetworkStore {
  current: LoadedNetwork | null = null;
  selection: SelectionInfo | null = null;
  searchHighlight: number[] | null = null;
  occurrenceFiles: OccurrenceFile[] = [];
  breadcrumb: number[] = [];
  maxFlow = 0;
  maxDegree = 0;
  maxWeight = 0;
  /**
   * Largest link flow/weight at any level: leaf links, ftree module links, and
   * top-module pairs aggregated from leaf links — the link-width scale's domain,
   * so module super-edges and leaf links share one scale.
   */
  maxLinkFlow = 0;
  /** Largest node boundary flow (LoadedNetwork.boundaryFlow): the flow-border rings' domain. */
  maxBoundaryFlow = 0;
  /**
   * Bumped on every load (setNetwork): the view takes the network as new data,
   * lays it out from scratch and frames it. A re-clustering of a plain network
   * keeps it — same nodes, same graph buffers — so the view keeps its engine,
   * camera and positions and re-lays the map out from where it is.
   */
  topologyVersion = 0;

  /** Non-observable: typed-array graphs + engine handle (imperative surface). */
  built: NetworkGraph | null = null;
  builtState: StateNetworkGraph | null = null;
  engine: Network | null = null;
  /** Set by NetworkView; null ids = fit whole network. Placeholder for d3gl fitToNodes (d3gl#197). */
  zoomTo: ((ids: readonly number[] | null) => void) | null = null;

  private moduleLeafCache = new Map<string, readonly number[]>();
  /** Module pathKey → its highest-flow leaf (names unnamed modules, v1-style). */
  private moduleTopLeaf = new Map<string, number>();

  constructor() {
    // `moduleLeafCache` is private; TS's homomorphic AnnotationsMap mapped type drops private
    // members from `keyof this`, so it must be threaded through as an explicit AdditionalKeys
    // type argument rather than inferred from the overrides object literal.
    makeAutoObservable<this, "moduleLeafCache" | "moduleTopLeaf">(
      this,
      {
        // The loaded network is replaced wholesale, never mutated internally —
        // observable.ref avoids deep-proxying its ~10k-element arrays.
        current: observable.ref,
        built: false,
        builtState: false,
        engine: false,
        zoomTo: false,
        moduleLeafCache: false,
        moduleTopLeaf: false,
      },
      // autoBind: actions are handed bare to d3gl event callbacks (e.g. onClick: store.selectFromHit).
      { autoBind: true },
    );
  }

  setNetwork(net: LoadedNetwork): void {
    this.topologyVersion++;
    this.adopt(net, buildGraph(net.graph));
  }

  /** Make `net` (built as `g`) current and reset everything derived from it. */
  private adopt(net: LoadedNetwork, g: NetworkGraph): void {
    this.built = g;
    this.builtState =
      net.stateGraph && net.modules ? buildStateGraph(net.stateGraph) : null;
    this.moduleLeafCache.clear();
    this.current = net;
    this.selection = null;
    this.searchHighlight = null;
    this.occurrenceFiles = [];
    this.breadcrumb = [];
    let maxFlow = 0;
    let maxDegree = 0;
    let maxWeight = 0;
    if (g.flow) for (const f of g.flow) maxFlow = Math.max(maxFlow, f);
    for (const d of g.csr.degree) maxDegree = Math.max(maxDegree, d);
    for (const w of g.weight) maxWeight = Math.max(maxWeight, w);
    this.maxFlow = maxFlow;
    this.maxDegree = maxDegree;
    this.maxWeight = maxWeight;
    this.maxLinkFlow = maxLinkFlowOf(net, maxWeight);
    let maxBoundaryFlow = 0;
    for (const v of net.boundaryFlow ?? [])
      if (v > maxBoundaryFlow) maxBoundaryFlow = v;
    this.maxBoundaryFlow = maxBoundaryFlow;
    this.moduleTopLeaf = topLeaves(net);
  }

  /** A module's display name: curated (example), else its highest-flow node's name. */
  moduleLabel(path: readonly number[]): string {
    const cur = this.current;
    if (!cur) return "";
    const key = pathKey(path);
    const curated = cur.moduleNames?.get(key);
    if (curated) return curated;
    const leaf = this.moduleTopLeaf.get(key);
    return leaf === undefined ? "" : (cur.names[leaf] ?? "");
  }

  /** Unload the network: reset everything derived from it (NetworkView tears the engine down). */
  clear(): void {
    this.current = null;
    this.built = null;
    this.builtState = null;
    this.selection = null;
    this.searchHighlight = null;
    this.occurrenceFiles = [];
    this.breadcrumb = [];
    this.maxFlow = 0;
    this.maxDegree = 0;
    this.maxWeight = 0;
    this.maxLinkFlow = 0;
    this.maxBoundaryFlow = 0;
    this.moduleLeafCache.clear();
    this.moduleTopLeaf = new Map();
  }

  /** Cluster the current network with an in-app Infomap run's tree and flow text. */
  applyClustering(tree: InfomapTree, flowText?: string): void {
    const cur = this.current;
    const built = this.built;
    if (!cur || !built) return;
    // Re-clustering keeps the dense node ids, so metadata-overlap files stay valid.
    const occurrenceFiles = this.occurrenceFiles;
    const net = withClustering(cur, tree, flowText);
    // A partition the network was loaded with no longer produced these modules.
    net.sources = cur.sources.filter((f) => f.kind === "network");
    if (cur.isStates) {
      // A clustered states network is shown as a state network — new data for
      // the engine, so this is a load.
      this.setNetwork(net);
    } else {
      // Same nodes and edges: share every buffer of the built graph (no CSR
      // rebuild), the positions included, and swap in the new flow.
      const flow = net.graph.nodeFlow;
      this.adopt(net, {
        ...built,
        flow: flow ? Float32Array.from(flow) : null,
      });
    }
    this.occurrenceFiles = occurrenceFiles;
  }

  clearSelection(): void {
    this.selection = null;
  }

  resetView(): void {
    this.breadcrumb = [];
  }

  selectFromHit(
    id: number,
    aggregate: boolean,
    members: number[] | null,
  ): void {
    const cur = this.current;
    if (!cur) return;
    const nodeFlow = cur.graph.nodeFlow as Float32Array | undefined;
    if (!aggregate) {
      const record = cur.modules?.[id];
      const path = record ? Array.from(record.path) : null;
      this.selection = {
        ids: [id],
        aggregate: false,
        name: cur.names[id] ?? String(id),
        path,
        flow: nodeFlow ? nodeFlow[id] : null,
        physicalId: cur.physicalIds?.[id] ?? null,
      };
      if (path) this.breadcrumb = path.slice(0, -1);
      return;
    }
    const ids = members ?? [];
    const path = cur.modules
      ? commonPathPrefix(ids.map((i) => cur.modules?.[i]?.path ?? []))
      : null;
    const flow = nodeFlow ? ids.reduce((sum, i) => sum + nodeFlow[i], 0) : null;
    this.selection = {
      ids,
      aggregate: true,
      name: this.moduleName(path, ids),
      path,
      flow,
      physicalId: null,
    };
    if (path) this.breadcrumb = path;
  }

  moduleName(path: number[] | null, memberIds: readonly number[]): string {
    const cur = this.current;
    if (!cur) return "";
    if (path) {
      const label = this.moduleLabel(path);
      if (label) return label;
    }
    if (memberIds.length === 0) return "";
    const nodeFlow = cur.graph.nodeFlow as Float32Array | undefined;
    let best = memberIds[0] ?? 0;
    if (nodeFlow)
      for (const i of memberIds) if (nodeFlow[i] > nodeFlow[best]) best = i;
    return cur.names[best] ?? "";
  }

  leavesOfModule(path: number[]): readonly number[] {
    const cur = this.current;
    if (!cur?.modules) return [];
    const key = pathKey(path);
    const cached = this.moduleLeafCache.get(key);
    if (cached) return cached;
    const ids: number[] = [];
    for (const m of cur.modules) {
      const p = m.path;
      if (p.length > path.length && path.every((v, k) => p[k] === v))
        ids.push(m.id);
    }
    this.moduleLeafCache.set(key, ids);
    return ids;
  }

  setSearch(query: string): void {
    const cur = this.current;
    const q = query.trim().toLowerCase();
    if (!cur || !q) {
      this.searchHighlight = null;
      return;
    }
    const ids: number[] = [];
    for (let i = 0; i < cur.names.length && ids.length < 5000; i++) {
      if (cur.names[i].toLowerCase().includes(q)) ids.push(i);
    }
    this.searchHighlight = ids;
  }

  /** Add a metadata file: its node names (see parseNodeNames) matched against the network's. */
  addOccurrenceFile(file: { name: string; size: number; text: string }): void {
    const cur = this.current;
    if (!cur) return;
    const wanted = new Set(parseNodeNames(file.text, file.name));
    const ids: number[] = [];
    cur.names.forEach((n, i) => {
      if (wanted.has(n)) ids.push(i);
    });
    this.occurrenceFiles.push({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      text: file.text,
      ids,
      idSet: new Set(ids),
      color:
        OCCURRENCE_COLORS[
          this.occurrenceFiles.length % OCCURRENCE_COLORS.length
        ],
      enabled: true,
    });
  }

  toggleOccurrenceFile(index: number): void {
    const f = this.occurrenceFiles[index];
    if (f) f.enabled = !f.enabled;
  }

  removeOccurrenceFile(id: string): void {
    const index = this.occurrenceFiles.findIndex((f) => f.id === id);
    if (index >= 0) this.occurrenceFiles.splice(index, 1);
  }
}
