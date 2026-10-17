import { describe, expect, it } from "vitest";
import { degreeFlow } from "./degree-flow";

describe("degreeFlow", () => {
  it("is each node's weighted degree over the total, a self-link counted once", () => {
    // 0–1 (2), 1–2 (1), self-link 2–2 (1): degrees 2, 3, 2 of 2·4 − 1 = 7.
    const flow = degreeFlow(3, [0, 1, 2], [1, 2, 2], [2, 1, 1]);
    expect(Array.from(flow)).toEqual(
      [2 / 7, 3 / 7, 2 / 7].map((f) => Math.fround(f)),
    );
  });

  it("counts links as weight 1 without weights, and is zero without links", () => {
    expect(Array.from(degreeFlow(3, [0], [1]))).toEqual([0.5, 0.5, 0]);
    expect(Array.from(degreeFlow(2, [], []))).toEqual([0, 0]);
  });
});
