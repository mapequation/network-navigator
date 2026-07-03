import type {
  BuildGraphInput,
  BuildStateGraphInput,
  ModuleNode,
} from "@mapequation/d3gl/network";

/** Everything the app knows about the currently loaded network. */
export interface LoadedNetwork {
  kind: "raw" | "clustered";
  filename: string;
  directed: boolean;
  isStates: boolean;
  /** Leaf graph (state-node graph when isStates). Rendered via buildGraph(). */
  graph: BuildGraphInput;
  /** Present when isStates — enables stateNetwork()/view() once clustered. */
  stateGraph?: BuildStateGraphInput;
  /** Display name per dense node index (state names when isStates). */
  names: string[];
  /** Original node id per dense index (for states: the state's physical id). */
  physicalIds: number[];
  /** Original state id per dense index (states only). */
  stateIds?: number[];
  /** Per-node Infomap paths, dense-index keyed (kind === "clustered"). */
  modules?: ModuleNode[];
  /** Curated module names: pathKey ("1:2") → name. Only the example ships these. */
  moduleNames?: Map<string, string>;
  /** ftree text (loaded or Infomap-generated) — export source. */
  ftree?: string;
  /** Raw network file text — enables (re-)clustering with Infomap. */
  networkText?: string;
}

export interface ClusterOptions {
  directed: boolean;
  twoLevel: boolean;
  noInfomap: boolean;
  clusterFilename?: string;
}
