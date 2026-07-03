import { makeAutoObservable } from "mobx";

export type NodeSizeBy = "flow" | "degree";
export type ScaleKind = "linear" | "root";

/** Every d3gl option exposed in the Settings UI. */
export class SettingsStore {
  nodeSizeBy: NodeSizeBy = "flow";
  nodeScale: ScaleKind = "root";
  linkScale: ScaleKind = "root";
  labelsVisible = true;
  maxLabels = 50;
  simulation = true;
  lodEnabled = true;
  expandPx = 48;
  maxAggregateRadius = 26;
  declutter = true;
  superEdges = true;
  crossFade = 0;
  linkStyle: "line" | "half-arrow" = "half-arrow";
  sizeMode: "screen" | "world" = "screen";
  backend: "auto" | "webgl" | "canvas" | "svg" = "auto";
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
