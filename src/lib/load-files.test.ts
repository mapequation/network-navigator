import { describe, expect, it } from "vitest";
import { loadFiles, networkToLoaded } from "./load-files";

const PAJEK = `*Vertices 3
1 "n1"
2 "n2"
3 "n3"
*Edges
1 2 1
2 3 2
`;

const FTREE = `# path flow name node_id
1:1 0.6 "n1" 1
1:2 0.4 "n2" 2
*Links undirected
*Links 1 0 0 1 2
1 2 1.0
`;

describe("networkToLoaded", () => {
  it("parses Pajek into a raw LoadedNetwork", () => {
    const net = networkToLoaded(PAJEK, "toy.net");
    expect(net.kind).toBe("raw");
    expect(net.isStates).toBe(false);
    expect(net.graph.nodeCount).toBe(3);
    expect(net.names).toEqual(["n1", "n2", "n3"]);
    expect(net.physicalIds).toEqual([1, 2, 3]);
    expect(net.networkText).toBe(PAJEK);
  });

  it("detects state networks", () => {
    const states = '*Vertices 1\n1 "a"\n*States\n1 1\n2 1\n*Links\n1 2 1\n';
    const net = networkToLoaded(states, "toy_states.net");
    expect(net.isStates).toBe(true);
    expect(net.stateGraph?.stateCount).toBe(2);
    expect(net.stateIds).toEqual([1, 2]);
  });
});

describe("loadFiles", () => {
  it("loads a single ftree", async () => {
    const net = await loadFiles([{ name: "a.ftree", text: FTREE }], {
      directed: false,
      twoLevel: false,
      noInfomap: false,
    });
    expect(net.kind).toBe("clustered");
    expect(net.graph.nodeCount).toBe(2);
  });

  it("loads a single network file raw", async () => {
    const net = await loadFiles([{ name: "toy.net", text: PAJEK }], {
      directed: false,
      twoLevel: false,
      noInfomap: false,
    });
    expect(net.kind).toBe("raw");
  });

  it("rejects a partition without a network", async () => {
    await expect(
      loadFiles([{ name: "p.clu", text: "1 1\n" }], {
        directed: false,
        twoLevel: false,
        noInfomap: false,
      }),
    ).rejects.toThrow(/network/i);
  });

  it("rejects unsupported extensions", async () => {
    await expect(
      loadFiles([{ name: "a.pdf", text: "" }], {
        directed: false,
        twoLevel: false,
        noInfomap: false,
      }),
    ).rejects.toThrow(/unsupported/i);
  });
});
