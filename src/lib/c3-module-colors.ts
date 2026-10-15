import { type HierarchyOptions, hierarchy } from "@mapequation/c3";
import type { ModuleNode } from "@mapequation/d3gl/network";
import { pathKey } from "./path-key";

/**
 * Per-node colours (indexed by node `id`) from c3's `hierarchy()`: each node
 * takes the colour of its enclosing module (`path` minus the final rank), as
 * d3gl's moduleColors does. A module's size is its members' summed node flow,
 * or its member count when the network has no flow.
 */
export function c3ModuleColors(
  modules: ArrayLike<ModuleNode>,
  nodeFlow: ArrayLike<number> | undefined,
  options: HierarchyOptions = {},
): string[] {
  const sizes = new Map<string, { path: number[]; flow: number }>();
  for (let r = 0; r < modules.length; r++) {
    const node = modules[r];
    if (!node) continue;
    const path = Array.from(node.path);
    const w = nodeFlow ? (nodeFlow[node.id] ?? 0) : 1;
    for (let k = 1; k < path.length; k++) {
      const key = pathKey(path.slice(0, k));
      const m = sizes.get(key);
      if (m) m.flow += w;
      else sizes.set(key, { path: path.slice(0, k), flow: w });
    }
  }
  const colorOf = hierarchy([...sizes.values()], options);
  const out = new Array<string>(modules.length);
  for (let r = 0; r < modules.length; r++) {
    const node = modules[r];
    if (!node) continue;
    const color = colorOf(Array.from(node.path).slice(0, -1));
    if (color) out[node.id] = color;
  }
  return out;
}
