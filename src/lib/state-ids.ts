import type { ModuleNode, PhysicalToState } from "@mapequation/d3gl/network";

/** The views of a state network (d3gl's `view()`). */
export type StateView = "physical" | "state" | "both";

/**
 * The ids the engine draws a set of state nodes by in `view`: the state ids
 * themselves in the state and both views (both draws the state nodes, inside
 * their physical containers), their distinct physical nodes in the physical
 * view. The store keeps a state network's ids as state ids.
 */
export function viewIds(
  stateIds: readonly number[],
  view: StateView,
  stateToPhysical: ArrayLike<number>,
): readonly number[] {
  if (view !== "physical") return stateIds;
  const physical = new Set<number>();
  for (const s of stateIds) {
    const p = stateToPhysical[s];
    if (p !== undefined) physical.add(p);
  }
  return [...physical];
}

/** Physical node `p`'s state nodes. */
export function statesOf(
  physicalToState: PhysicalToState,
  p: number,
): number[] {
  const { offsets, states } = physicalToState;
  return Array.from(states.subarray(offsets[p], offsets[p + 1]));
}

/**
 * The module d3gl colours physical node `p` by with `{ by: "module" }`: the
 * first top module its state nodes are in, as its pie's first wedge (pie
 * level 1, wedges in module order). [] for none. `modules` is indexed by
 * state id.
 */
export function physicalModule(
  physicalToState: PhysicalToState,
  p: number,
  modules: ArrayLike<ModuleNode>,
): number[] {
  const { offsets, states } = physicalToState;
  let top = Number.POSITIVE_INFINITY;
  for (let k = offsets[p] ?? 0; k < (offsets[p + 1] ?? 0); k++) {
    const m = modules[states[k] ?? -1]?.path[0];
    if (m !== undefined && m < top) top = m;
  }
  return Number.isFinite(top) ? [top] : [];
}
