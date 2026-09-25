import { describe, expect, it } from "vitest";
import { computeStats } from "../lib/network-stats";
import type { LoadedNetwork } from "../lib/types";
import { NetworkStore } from "./network-store";

const toy = (): LoadedNetwork => ({
  kind: "clustered",
  filename: "toy.ftree",
  files: [{ name: "toy.ftree", size: 0 }],
  stats: computeStats(4, [0, 1, 2], [1, 2, 3], [1, 2, 0.5]),
  directed: false,
  isStates: false,
  graph: {
    nodeCount: 4,
    source: [0, 1, 2],
    target: [1, 2, 3],
    weight: [1, 2, 0.5],
    nodeFlow: new Float32Array([0.4, 0.3, 0.2, 0.1]),
    directed: false,
  },
  names: ["alpha", "beta", "gamma", "delta"],
  physicalIds: [1, 2, 3, 4],
  modules: [
    { id: 0, path: [1, 1] },
    { id: 1, path: [1, 2] },
    { id: 2, path: [2, 1] },
    { id: 3, path: [2, 2] },
  ],
});

describe("NetworkStore", () => {
  it("builds the graph and computes stats on setNetwork", () => {
    const store = new NetworkStore();
    store.setNetwork(toy());
    expect(store.built?.nodeCount).toBe(4);
    expect(store.maxWeight).toBe(2);
    expect(store.maxFlow).toBeCloseTo(0.4);
    expect(store.maxDegree).toBeGreaterThan(0);
  });

  it("resolves module leaves with memoization", () => {
    const store = new NetworkStore();
    store.setNetwork(toy());
    expect(store.leavesOfModule([1])).toEqual([0, 1]);
    expect(store.leavesOfModule([2])).toEqual([2, 3]);
    expect(store.leavesOfModule([1])).toBe(store.leavesOfModule([1])); // cached
  });

  it("selects leaves and aggregates with a breadcrumb path", () => {
    const store = new NetworkStore();
    store.setNetwork(toy());
    store.selectFromHit(0, false, null);
    expect(store.selection).toMatchObject({
      ids: [0],
      aggregate: false,
      name: "alpha",
      physicalId: 1,
    });
    expect(store.breadcrumb).toEqual([1]);

    store.selectFromHit(99, true, [2, 3]);
    expect(store.selection?.ids).toEqual([2, 3]);
    expect(store.selection?.path).toEqual([2]);
    expect(store.selection?.flow).toBeCloseTo(0.3, 5);
    expect(store.selection?.name).toBe("gamma"); // highest-flow member fallback
    expect(store.breadcrumb).toEqual([2]);
  });

  it("keeps actions bound when passed as bare callbacks", () => {
    const store = new NetworkStore();
    store.setNetwork(toy());
    store.selectFromHit(0, false, null);
    const clear = store.clearSelection;
    clear();
    expect(store.selection).toBeNull();
  });

  it("tolerates a leaf hit without a module record", () => {
    const store = new NetworkStore();
    store.setNetwork(toy());
    store.selectFromHit(99, false, null);
    expect(store.selection).toMatchObject({ ids: [99], path: null });
  });

  it("returns an empty module name for empty members", () => {
    const store = new NetworkStore();
    store.setNetwork(toy());
    expect(store.moduleName(null, [])).toBe("");
  });

  it("matches search queries case-insensitively", () => {
    const store = new NetworkStore();
    store.setNetwork(toy());
    store.setSearch("AL");
    expect(store.searchHighlight).toEqual([0]);
    store.setSearch("");
    expect(store.searchHighlight).toBeNull();
  });

  it("matches occurrence values against names", () => {
    const store = new NetworkStore();
    store.setNetwork(toy());
    store.addOccurrenceFile("occ.csv", ["beta", "delta", "nope"]);
    expect(store.occurrenceFiles[0].ids).toEqual([1, 3]);
    expect(store.occurrenceFiles[0].enabled).toBe(true);
  });

  it("keeps occurrence files across a re-clustering", () => {
    const store = new NetworkStore();
    store.setNetwork(toy());
    store.addOccurrenceFile("occ.csv", ["beta"]);
    store.applyClustering({
      version: "v2.14.0",
      args: "",
      startedAt: "",
      completedIn: 0,
      codelength: 1,
      numLevels: 2,
      numTopModules: 2,
      relativeCodelengthSavings: 0,
      directed: false,
      flowModel: "undirected",
      higherOrder: false,
      nodes: [
        { path: [1, 1], flow: 0.4, name: "alpha", id: 1 },
        { path: [1, 2], flow: 0.3, name: "beta", id: 2 },
        { path: [1, 3], flow: 0.2, name: "gamma", id: 3 },
        { path: [2, 1], flow: 0.1, name: "delta", id: 4 },
      ],
      modules: [],
    });
    expect(store.current?.modules?.[3]?.path).toEqual([2, 1]);
    expect(store.occurrenceFiles.map((f) => f.ids)).toEqual([[1]]);
  });

  it("resets all network-derived state on clear", () => {
    const store = new NetworkStore();
    store.setNetwork(toy());
    store.selectFromHit(0, false, null);
    store.setSearch("a");
    store.addOccurrenceFile("occ.csv", ["beta"]);
    expect(store.leavesOfModule([1])).toEqual([0, 1]);
    store.clear();
    expect(store.current).toBeNull();
    expect(store.built).toBeNull();
    expect(store.builtState).toBeNull();
    expect(store.selection).toBeNull();
    expect(store.searchHighlight).toBeNull();
    expect(store.occurrenceFiles).toEqual([]);
    expect(store.breadcrumb).toEqual([]);
    expect([store.maxFlow, store.maxDegree, store.maxWeight]).toEqual([
      0, 0, 0,
    ]);
    expect(store.maxLinkFlow).toBe(0);
    expect(store.leavesOfModule([1])).toEqual([]);
    expect(store.moduleLabel([1])).toBe("");
  });
});
