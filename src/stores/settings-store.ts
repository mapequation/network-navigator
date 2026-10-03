import { makeAutoObservable } from "mobx";

export type NodeSizeBy = "flow" | "degree";
export type ScaleKind = "linear" | "root";
/**
 * Node and link colours: a categorical colour per module, or shades of flow
 * (node flow for the fill, the flow-border value for the rings, the link
 * weight for the links), as in d3gl's flow-borders example.
 */
export type ColorBy = "module" | "flow";
/**
 * LOD aggregation source: the Infomap module tree (spatial for a network
 * without one), d3gl's spatial quadtree (nearby nodes), or none.
 */
export type LodMode = "modules" | "spatial" | "off";
/**
 * Where d3gl runs a layout, chosen when the layout starts. "auto" lets d3gl
 * choose for each layout and device, silently (d3gl#375; its rules are
 * d3gl's, documented on NetworkLayoutOptions.backend, and net.layoutTransport
 * reports what it chose). "gpu" asks for the GPU (the nested map's too,
 * d3gl#355) and warns when it falls back to the worker; "worker" always runs
 * off-thread on the CPU.
 */
export type LayoutBackend = "auto" | "gpu" | "worker";

/** Every d3gl option exposed in the Settings UI. */
export class SettingsStore {
  nodeSizeBy: NodeSizeBy = "flow";
  nodeScale: ScaleKind = "root";
  colorBy: ColorBy = "module";
  linkScale: ScaleKind = "root";
  labelsVisible = true;
  maxLabels = 50;
  simulation = true;
  lodMode: LodMode = "modules";
  /** null = d3gl's tree-adaptive default (opens a module tree as a map of modules). */
  expandPx: number | null = null;
  maxAggregateRadius = 26;
  /**
   * d3gl's `lod({ overlapSpacing })` (d3gl#449, temporary, to pick its default): members count as
   * overlapping until they are this many times their radii apart, so an aggregate opens later.
   */
  overlapSpacing = 1;
  declutter = true;
  superEdges = true;
  /** Keep super-edges between an expanded module and still-collapsed ones (d3gl crossLevelEdges). */
  crossLevelEdges = true;
  crossFade = 0;
  linkStyle: "line" | "half-arrow" = "half-arrow";
  sizeMode: "screen" | "world" = "screen";
  /**
   * null = auto: bend half-arrow links only. Half-arrows are always drawn as
   * 24-sample strips, so bending them is free on WebGL; plain lines go from 2
   * to 24 samples per link when bent (~12× the vertices).
   */
  bendLinks: boolean | null = null;
  // "auto" (progressive canvas→WebGL) blocks the main thread for ~10s emitting
  // canvas geometry on large graphs (mapequation/d3gl#201) — default to webgl
  // until the auto path scales; auto/canvas/svg stay selectable in Settings.
  backend: "auto" | "webgl" | "canvas" | "svg" = "webgl";
  layoutBackend: LayoutBackend = "auto";
  /**
   * Lay a network with a module hierarchy out as a nested map of modules
   * (d3gl#324), each module inside its parent's disc; false gives it the
   * force layout of a network without one. The modules still drive the LOD
   * and the colours either way.
   */
  nestedLayout = true;
  pickLinks = false;
  stateView: "physical" | "state" | "both" = "physical";

  /** Whether links are bent for the given link style, resolving auto. */
  bendFor(halfArrow: boolean): boolean {
    return this.bendLinks ?? halfArrow;
  }

  constructor() {
    makeAutoObservable(this);
  }

  set = <K extends keyof SettingsStore>(
    key: K,
    value: SettingsStore[K],
  ): void => {
    Object.assign(this, { [key]: value });
  };
}
