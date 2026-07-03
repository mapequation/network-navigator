import { describe, expect, it } from "vitest";
import { buildInfomapArgs } from "./infomap-args";

describe("buildInfomapArgs", () => {
  it("always requests ftree output, silently", () => {
    expect(
      buildInfomapArgs({ directed: false, twoLevel: false, noInfomap: false }),
    ).toEqual({
      output: ["ftree"],
      silent: true,
    });
  });

  it("maps the options", () => {
    expect(
      buildInfomapArgs({
        directed: true,
        twoLevel: true,
        noInfomap: true,
        clusterFilename: "p.clu",
      }),
    ).toEqual({
      output: ["ftree"],
      silent: true,
      directed: true,
      twoLevel: true,
      noInfomap: true,
      clusterData: "p.clu",
    });
  });
});
