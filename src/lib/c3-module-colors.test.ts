import { describe, expect, it } from "vitest";
import { c3ModuleColors } from "./c3-module-colors";

describe("c3ModuleColors", () => {
  const modules = [
    { id: 0, path: [1, 1, 1] },
    { id: 1, path: [1, 1, 2] },
    { id: 2, path: [1, 2, 1] },
    { id: 3, path: [2, 1] },
  ];

  it("gives a node its enclosing module's colour", () => {
    const colors = c3ModuleColors(modules, [0.4, 0.2, 0.3, 0.1]);
    expect(colors).toHaveLength(4);
    for (const c of colors) expect(c).toMatch(/^#[0-9a-f]{6}$/);
    expect(colors[0]).toBe(colors[1]);
    expect(colors[0]).not.toBe(colors[2]);
    expect(colors[2]).not.toBe(colors[3]);
  });

  it("sizes modules by member count without flow", () => {
    const colors = c3ModuleColors(modules, undefined);
    expect(colors[0]).toBe(colors[1]);
    expect(colors[0]).not.toBe(colors[3]);
  });
});
