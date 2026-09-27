import { describe, expect, it } from "vitest";
import { computeStats } from "../lib/network-stats";
import type { LoadedNetwork } from "../lib/types";
import { NetworkStore } from "../stores/network-store";
import { SettingsStore } from "../stores/settings-store";
import { buildLod } from "./NetworkView";

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
