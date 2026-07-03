import { describe, expect, it } from "vitest";
import { withClustering } from "./apply-ftree";
import type { LoadedNetwork } from "./types";

const raw: LoadedNetwork = {
  kind: "raw",
  filename: "toy.net",
  directed: false,
  isStates: false,
  graph: {
    nodeCount: 3,
    source: [0, 1],
    target: [1, 2],
    weight: [1, 1],
    directed: false,
  },
  names: ["n1", "n2", "n3"],
  physicalIds: [1, 2, 3],
  networkText: "*Vertices 3\n...",
};

const FTREE = `# path flow name node_id
1:1 0.5 "n1" 1
1:2 0.3 "n2" 2
2:1 0.2 "n3" 3
*Links directed
*Links root 0 0 1 2
1 2 0.1
`;

describe("withClustering", () => {
  const clustered = withClustering(raw, FTREE);

  it("keeps the original edges and adds modules + flow by matching ids", () => {
    expect(clustered.kind).toBe("clustered");
    expect(Array.from(clustered.graph.source as number[])).toEqual([0, 1]);
    expect(clustered.modules).toEqual([
      { id: 0, path: [1, 1] },
      { id: 1, path: [1, 2] },
      { id: 2, path: [2, 1] },
    ]);
    expect(Array.from(clustered.graph.nodeFlow as Float32Array)).toEqual(
      [0.5, 0.3, 0.2].map((v) => Math.fround(v)),
    );
    expect(clustered.ftree).toBe(FTREE);
    expect(clustered.networkText).toBe(raw.networkText);
  });

  it("throws when the ftree does not cover all nodes", () => {
    expect(() =>
      withClustering(raw, '# path flow name node_id\n1:1 1.0 "n1" 1\n'),
    ).toThrow(/missing/i);
  });

  it("does not mutate the input", () => {
    expect(raw.kind).toBe("raw");
    expect(raw.modules).toBeUndefined();
  });
});
