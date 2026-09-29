import { describe, expect, it } from "vitest";
import { computeStats } from "../lib/network-stats";
import type { LoadedNetwork } from "../lib/types";
import { NetworkStore } from "../stores/network-store";
import { SettingsStore } from "../stores/settings-store";
import { buildLod, buildStyle } from "./NetworkView";

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
  const fillOf = (s: ReturnType<typeof buildStyle>, i: number) =>
    typeof s.nodeFill === "function"
      ? s.nodeFill(i, graph as never)
      : s.nodeFill;

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

  it("by flow, shades the fill, the rings and the links like d3gl's flow-borders example", () => {
    const boundaryFlow = new Float32Array([0, 0.1, 0.1, 0.05]);
    const { store, settings } = setup({ ...clustered(), boundaryFlow });
    settings.set("colorBy", "flow");
    const style = buildStyle(store, settings, colors);
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
