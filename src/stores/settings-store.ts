import { makeAutoObservable } from "mobx";

export type NodeSizeBy = "flow" | "degree";
export type ScaleKind = "linear" | "root";
/** LOD aggregation source: Infomap modules, d3gl's spatial coarsening, or none. */
export type LodMode = "modules" | "spatial" | "off";

/** Every d3gl option exposed in the Settings UI. */
export class SettingsStore {
  nodeSizeBy: NodeSizeBy = "flow";
  nodeScale: ScaleKind = "root";
  linkScale: ScaleKind = "root";
  labelsVisible = true;
  maxLabels = 50;
  simulation = true;
  lodMode: LodMode = "modules";
  expandPx = 48;
  maxAggregateRadius = 26;
  declutter = true;
  superEdges = true;
  crossFade = 0;
  linkStyle: "line" | "half-arrow" = "half-arrow";
  sizeMode: "screen" | "world" = "screen";
  // "auto" (progressive canvas→WebGL) blocks the main thread for ~10s emitting
  // canvas geometry on large graphs (mapequation/d3gl#201) — default to webgl
  // until the auto path scales; auto/canvas/svg stay selectable in Settings.
  backend: "auto" | "webgl" | "canvas" | "svg" = "webgl";
  pickLinks = false;
  stateView: "physical" | "state" | "both" = "physical";

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
