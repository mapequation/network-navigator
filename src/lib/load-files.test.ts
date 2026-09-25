import { describe, expect, it, vi } from "vitest";
import { loadFiles, networkToLoaded } from "./load-files";
import { type RunInfomapOptions, runInfomap } from "./run-infomap";
import type { InfomapTree } from "./types";

vi.mock("./run-infomap", () => ({ runInfomap: vi.fn() }));

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

  it("runs Infomap on a network + partition and clusters from its JSON tree", async () => {
    const tree: InfomapTree = {
      version: "v2.14.0",
      args: "",
      startedAt: "",
      completedIn: 0,
      codelength: 1.5,
      numLevels: 2,
      numTopModules: 2,
      relativeCodelengthSavings: 0,
      directed: false,
      flowModel: "undirected",
      higherOrder: false,
      nodes: [
        { path: [1, 1], flow: 0.4, id: 1 },
        { path: [1, 2], flow: 0.3, id: 2 },
        { path: [2, 1], flow: 0.3, id: 3 },
      ],
      modules: [],
    };
    vi.mocked(runInfomap).mockResolvedValueOnce(tree);
    const commands: string[] = [];
    const net = await loadFiles(
      [
        { name: "toy.net", text: PAJEK },
        { name: "p.clu", text: "1 1\n2 1\n3 2\n" },
      ],
      { directed: false, twoLevel: false, noInfomap: true },
      { onInfomapStart: (c) => commands.push(c) },
    );
    const opts = vi.mocked(runInfomap).mock.calls[0][0] as RunInfomapOptions;
    expect(opts.args.output).toEqual(["json"]);
    expect(opts.files).toEqual({ "p.clu": "1 1\n2 1\n3 2\n" });
    expect(commands).toEqual([
      "infomap --cluster-data p.clu --no-infomap --output json",
    ]);
    expect(net.kind).toBe("clustered");
    expect(net.infomap?.codelength).toBe(1.5);
    expect(net.files.map((f) => f.name)).toEqual(["toy.net", "p.clu"]);
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
