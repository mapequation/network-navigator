import { describe, expect, it } from "vitest";
import { computeStats } from "../lib/network-stats";
import type { LoadedNetwork } from "../lib/types";
import { NetworkStore } from "../stores/network-store";
import { SettingsStore } from "../stores/settings-store";
import { buildLod, buildStyle, relayoutOf } from "./NetworkView";

const clustered = (): LoadedNetwork => ({
  kind: "clustered",
  filename: "toy.ftree",
  sources: [{ name: "toy.ftree", size: 0, text: "", kind: "ftree" }],
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

describe("buildLod module rings", () => {
  const setup = (nestedLayout: boolean) => {
    const store = new NetworkStore();
    store.setNetwork(clustered());
    const settings = new SettingsStore();
    settings.set("nestedLayout", nestedLayout);
    return { store, settings };
  };

  it("rings the modules once a nested map of them has landed, even with Nested layout since switched off", () => {
    const { store, settings } = setup(false);
    expect(buildLod(store, settings, true)).toMatchObject({
      source: "modules",
      moduleBoundary: expect.anything(),
    });
  });

  it("rings nothing over any other layout, even with Nested layout on", () => {
    const { store, settings } = setup(true);
    const lod = buildLod(store, settings, false);
    expect(lod).toMatchObject({ source: "modules" });
    expect(lod).not.toHaveProperty("moduleBoundary");
  });

  it("rings nothing when the LOD doesn't cut the modules", () => {
    const { store, settings } = setup(true);
    settings.set("lodMode", "spatial");
    const lod = buildLod(store, settings, true);
    expect(lod).toMatchObject({ source: "spatial" });
    expect(lod).not.toHaveProperty("moduleBoundary");
  });
});

describe("buildStyle colours and flow borders", () => {
  const setup = (net: LoadedNetwork = clustered()) => {
    const store = new NetworkStore();
    store.setNetwork(net);
    return { store, settings: new SettingsStore() };
  };
  const colors = ["#a00000", "#a00000", "#00a000", "#00a000"];
  const graph = { flow: new Float32Array([0.4, 0.3, 0.2, 0.1]) };
  const fillOf = (s: ReturnType<typeof buildStyle>, i: number) => {
    const fill = s.nodeFill;
    if (typeof fill === "function") return fill(i, graph as never);
    if (typeof fill === "object" && fill.by === "flow")
      return fill.scale(graph.flow[i] ?? 0);
    return fill;
  };

  it("draws no rings without an in-app Infomap run's boundary flow", () => {
    const { store, settings } = setup();
    expect(buildStyle(store, settings, colors).flowBorder).toBeUndefined();
  });

  it("rings every node by its boundary flow, in one neutral colour by module", () => {
    const boundaryFlow = new Float32Array([0, 0.1, 0.1, 0.05]);
    const { store, settings } = setup({ ...clustered(), boundaryFlow });
    const style = buildStyle(store, settings, colors);
    expect(style.flowBorder?.flow).toBe(boundaryFlow);
    expect(typeof style.flowBorder?.color).toBe("string");
    expect(style.flowBorder?.scale(0)).toBe(0);
    expect(style.flowBorder?.scale(0.1)).toBeCloseTo(4);
    expect(fillOf(style, 2)).toBe("#00a000");
  });

  it("rings a module by Infomap's enter + exit flow for it, not its members' sum", () => {
    const boundaryFlow = new Float32Array([0, 0.1, 0.1, 0.05]);
    const moduleFlow = new Map([
      ["1", { enterFlow: 0.05, exitFlow: 0.07 }],
      ["", { enterFlow: 0, exitFlow: 0 }],
    ]);
    const { store, settings } = setup({
      ...clustered(),
      boundaryFlow,
      moduleFlow,
    });
    const ringOf = buildStyle(store, settings, colors).flowBorder?.moduleFlow;
    expect(ringOf?.([1])).toBeCloseTo(0.12);
    expect(ringOf?.([])).toBe(0);
    expect(ringOf?.([9])).toBeUndefined(); // unknown: d3gl sums the members
  });

  it("by flow, shades the fill, the rings and the links like d3gl's flow-borders example", () => {
    const boundaryFlow = new Float32Array([0, 0.1, 0.1, 0.05]);
    const { store, settings } = setup({ ...clustered(), boundaryFlow });
    settings.set("colorBy", "flow");
    const style = buildStyle(store, settings, colors);
    // { by: "flow" }: d3gl fills a module by its members' summed flow too.
    expect(style.nodeFill).toMatchObject({ by: "flow" });
    expect(fillOf(style, 0)).toBe("rgb(215, 89, 8)"); // max flow: #D75908
    expect(fillOf(style, 3)).not.toBe(fillOf(style, 0));
    const ring = style.flowBorder?.color;
    expect(typeof ring === "function" && ring(0.1, 1, graph as never)).toBe(
      "rgb(249, 163, 39)", // max boundary flow: #f9a327
    );
    const link = style.linkStroke;
    expect(typeof link === "function" && link(store.maxLinkFlow)).toBe(
      "rgb(65, 142, 199)", // max link weight: #418EC7
    );
  });

  it("by flow, falls back to the module colours on a network without flow", () => {
    const net = clustered();
    const { store, settings } = setup({
      ...net,
      graph: { ...net.graph, nodeFlow: undefined },
    });
    settings.set("colorBy", "flow");
    expect(fillOf(buildStyle(store, settings, colors), 2)).toBe("#00a000");
  });

  it("keeps metadata occurrence colours over flow colours", () => {
    const { store, settings } = setup();
    settings.set("colorBy", "flow");
    store.addOccurrenceFile({ name: "m.txt", size: 5, text: "gamma" });
    const color = store.occurrenceFiles[0]?.color;
    expect(fillOf(buildStyle(store, settings, colors), 2)).toBe(color);
  });
});

describe("relayoutOf", () => {
  it("lays nothing out while the kind of layout is the one asked for", () => {
    expect(relayoutOf(true, true, true)).toBeNull();
    expect(relayoutOf(false, false, true)).toBeNull();
  });

  it("lays nothing out with the simulation off", () => {
    expect(relayoutOf(true, false, false)).toBeNull();
    expect(relayoutOf(false, true, false)).toBeNull();
  });

  it("goes on from where the nodes are: a nested map, framed as it goes", () => {
    // Streamed from the positions on screen (d3gl#454): warm, no transition
    // (that would solve out of sight first). It goes to its own size, about
    // a third of a force layout's width, and the camera follows it.
    expect(relayoutOf(true, false, true)).toEqual({
      nested: true,
      warm: true,
      fit: true,
    });
  });

  it("a re-clustering streams the new map the same way, but keeps the camera", () => {
    // From a nested map of the old modules the new one has the same size.
    expect(relayoutOf(true, false, true, true)).toEqual({
      nested: true,
      warm: true,
    });
    expect(relayoutOf(false, false, true, true)).toBeNull();
  });

  it("goes on from where the nodes are: the force layout, framed as it grows", () => {
    expect(relayoutOf(false, true, true)).toEqual({ fit: true, warm: true });
  });
});
