import {
  buildGraph,
  buildStateGraph,
  type Network,
  type NetworkGraph,
  type StateNetworkGraph,
} from "@mapequation/d3gl/network";
import { makeAutoObservable } from "mobx";
import { withClustering } from "../lib/apply-ftree";
import { OCCURRENCE_COLORS } from "../lib/occurrence-colors";
import { pathKey } from "../lib/path-key";
import type { LoadedNetwork } from "../lib/types";

export interface SelectionInfo {
  ids: number[];
  aggregate: boolean;
  name: string;
  path: number[] | null;
  flow: number | null;
  physicalId: number | null;
}

export interface OccurrenceFile {
  name: string;
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

export class NetworkStore {
  current: LoadedNetwork | null = null;
  selection: SelectionInfo | null = null;
  searchHighlight: number[] | null = null;
  occurrenceFiles: OccurrenceFile[] = [];
  breadcrumb: number[] = [];
  maxFlow = 0;
  maxDegree = 0;
  maxWeight = 0;

  /** Non-observable: typed-array graphs + engine handle (imperative surface). */
  built: NetworkGraph | null = null;
  builtState: StateNetworkGraph | null = null;
  engine: Network | null = null;
  /** Set by NetworkView; null ids = fit whole network. Placeholder for d3gl fitToNodes (d3gl#197). */
  zoomTo: ((ids: readonly number[] | null) => void) | null = null;

  private moduleLeafCache = new Map<string, readonly number[]>();

  constructor() {
    // `moduleLeafCache` is private; TS's homomorphic AnnotationsMap mapped type drops private
    // members from `keyof this`, so it must be threaded through as an explicit AdditionalKeys
    // type argument rather than inferred from the overrides object literal.
    makeAutoObservable<this, "moduleLeafCache">(
      this,
      {
        built: false,
        builtState: false,
        engine: false,
        zoomTo: false,
        moduleLeafCache: false,
      },
      // autoBind: actions are handed bare to d3gl event callbacks (e.g. onClick: store.selectFromHit).
      { autoBind: true },
    );
  }

  setNetwork(net: LoadedNetwork): void {
    this.built = buildGraph(net.graph);
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
    const g = this.built;
    if (g.flow) for (const f of g.flow) maxFlow = Math.max(maxFlow, f);
    for (const d of g.csr.degree) maxDegree = Math.max(maxDegree, d);
    for (const w of g.weight) maxWeight = Math.max(maxWeight, w);
    this.maxFlow = maxFlow;
    this.maxDegree = maxDegree;
    this.maxWeight = maxWeight;
  }

  applyClustering(ftreeText: string): void {
    if (this.current) this.setNetwork(withClustering(this.current, ftreeText));
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
        physicalId: cur.physicalIds[id] ?? null,
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

  moduleName(path: number[] | null, memberIds: number[]): string {
    const cur = this.current;
    if (!cur) return "";
    if (path) {
      const curated = cur.moduleNames?.get(pathKey(path));
      if (curated) return curated;
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

  addOccurrenceFile(name: string, values: string[]): void {
    const cur = this.current;
    if (!cur) return;
    const wanted = new Set(values);
    const ids: number[] = [];
    cur.names.forEach((n, i) => {
      if (wanted.has(n)) ids.push(i);
    });
    this.occurrenceFiles.push({
      name,
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

  removeOccurrenceFile(index: number): void {
    this.occurrenceFiles.splice(index, 1);
  }
}
