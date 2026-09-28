import {
  type ModuleNode,
  moduleColors,
  type NetworkLayoutOptions,
  type NetworkLODOptions,
  type NetworkStyle,
  network,
} from "@mapequation/d3gl/network";
import { scaleLinear, scaleSqrt } from "d3-scale";
import { computed, observable, reaction, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import { fitTransform } from "../lib/fit-transform";
import type { LoadedNetwork } from "../lib/types";
import { useStores } from "../stores";
import type { NetworkStore } from "../stores/network-store";
import type { ScaleKind, SettingsStore } from "../stores/settings-store";

const DEFAULT_NODE_FILL = "#4878d0";
const HALF_ARROW_BEND = 0.15; // d3gl#299: half-arrow bend is a chord fraction too
const LINE_BEND = 0.15;
// Every layout runs on the layout backend chosen in Settings when it starts
// (d3gl's "auto", "gpu" or "worker"; "auto" by default, d3gl#375). A switch
// leaves a running layout on its backend and applies from the next layout.
// A load lays the network out from scratch, simulation or not: it has no
// positions yet. With a module hierarchy (given to data(), whatever the LOD
// mode) and Nested layout on in Settings (the default), that's the nested map
// of modules (d3gl#324): each module's children inside it, by their own links
// only. Otherwise it's the force layout. fit keeps the camera framed while it
// streams.
const LAYOUT = { fit: true } as const;
// A re-clustering or a Nested layout switch keeps the nodes where they are
// unless the kind of layout they have (a nested map of the modules, or not)
// is no longer the kind asked for; then, while the simulation runs, the
// network is laid out again. (With it off nothing moves the nodes until it's
// switched back on, which lays the network out anew as set then.) A nested
// map is laid out from the current positions (d3gl#328) and eased in, so the
// camera stays. A force layout is laid out as a load does, framed: d3gl has
// no warm start for it. So with Nested layout off a re-clustering lays
// nothing out: the new modules regroup the LOD and recolour the nodes where
// they are. (A states network's re-clustering is a load, see NetworkStore.)
const RELAYOUT = { nested: { warm: true }, transition: 600 } as const;
// Rings around the modules the LOD cut has opened (d3gl#329): thin and low
// contrast, context rather than content. They are the discs of a nested map
// of the modules; without one d3gl rings each module's centroid + extent,
// which over other (e.g. force) positions is a tangle of huge rings. So they
// follow the positions, not the setting: drawn once a nested map of the
// modules the engine holds has landed, whatever Nested layout is set to now.
const MODULE_BOUNDARY = { width: 1, color: "rgb(90,100,120)", opacity: 0.35 };
const ZOOM_EXTENT: [number, number] = [0.002, 200];

const makeScale = (kind: ScaleKind) =>
  kind === "root" ? scaleSqrt() : scaleLinear();

function buildStyle(
  store: NetworkStore,
  settings: SettingsStore,
  colors: string[] | null,
): NetworkStyle {
  const cur = store.current;
  const occurrences = store.occurrenceFiles.filter((f) => f.enabled);
  const byFlow = settings.nodeSizeBy === "flow" && !!cur?.graph.nodeFlow;
  // half-arrow only makes sense with direction; undirected graphs render lines.
  const linkStyle = cur?.directed ? settings.linkStyle : "line";
  const halfArrow = linkStyle === "half-arrow";
  return {
    directed: cur?.directed,
    sizeMode: settings.sizeMode,
    linkStyle,
    // Half-arrow bend is an absolute world offset; line bend a chord fraction.
    linkBend: settings.bendFor(halfArrow)
      ? halfArrow
        ? HALF_ARROW_BEND
        : LINE_BEND
      : 0,
    nodeBorder: { width: 1, color: "#ffffff" },
    nodeRadius: {
      by: byFlow ? "flow" : "degree",
      scale: makeScale(settings.nodeScale)
        .domain([0, (byFlow ? store.maxFlow : store.maxDegree) || 1])
        .range([2, 14]),
    },
    linkWidth: {
      by: "weight",
      scale: makeScale(settings.linkScale)
        .domain([0, store.maxLinkFlow || 1])
        .range([0.4, 4])
        .clamp(true),
    },
    // Opacity rises with flow so weak links recede and overlaps read as
    // density (as in d3gl's directed map of modules).
    linkStroke: (settings.linkScale === "root"
      ? scaleSqrt<string>()
      : scaleLinear<string>()
    )
      .domain([0, store.maxLinkFlow || 1])
      .range(["rgba(90,100,120,0.12)", "rgba(60,70,90,0.85)"])
      .clamp(true),
    nodeFill:
      occurrences.length || colors
        ? (i: number) => {
            for (const f of occurrences) if (f.idSet.has(i)) return f.color;
            return colors?.[i] ?? DEFAULT_NODE_FILL;
          }
        : DEFAULT_NODE_FILL,
  };
}

/**
 * The module hierarchy the engine holds as data (d3gl#326), or undefined.
 * `modules` is dense-indexed by node id in `cur.graph` (buildGraph's space).
 * A *States network's records are state-indexed, but the engine renders its
 * physical graph — so it keeps stateNetwork()'s own module handling instead.
 */
function hierarchyOf(cur: LoadedNetwork | null) {
  return cur?.modules && !cur.isStates
    ? { modules: cur.modules, moduleLinks: cur.moduleLinks }
    : undefined;
}

/**
 * The LOD options. `discs`: the positions are a nested map of the modules the
 * engine holds, landed, whose discs the module rings outline.
 */
export function buildLod(
  store: NetworkStore,
  settings: SettingsStore,
  discs: boolean,
): NetworkLODOptions | false {
  if (settings.lodMode === "off") return false;
  const cur = store.current;
  // "modules" cuts the hierarchy the engine holds (see hierarchyOf); without
  // one it falls back to "spatial", which groups nodes by where the layout
  // put them (a quadtree, d3gl#343), so an aggregate is a compact region.
  const cutsModules = settings.lodMode === "modules" && !!hierarchyOf(cur);
  return {
    source: cutsModules ? "modules" : "spatial",
    ...(cutsModules && discs ? { moduleBoundary: MODULE_BOUNDARY } : {}),
    ...(settings.expandPx !== null ? { expandPx: settings.expandPx } : {}),
    maxAggregateRadius: settings.maxAggregateRadius,
    declutter: settings.declutter,
    superEdges: settings.superEdges,
    crossLevelEdges: settings.crossLevelEdges,
    crossFade: settings.crossFade,
  };
}

export const NetworkView = observer(function NetworkView() {
  const { network: store, settings } = useStores();
  const hostRef = useRef<HTMLDivElement>(null);
  const backend = settings.backend;

  // One engine per host + backend. A load hands it new data; a re-clustering
  // keeps its camera and positions (see NetworkStore.topologyVersion).
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const net = network(host, { backend });
    store.engine = net;

    let colorsFor: ArrayLike<ModuleNode> | undefined;
    let colors: string[] | null = null;
    const colorsOf = (cur: LoadedNetwork | null): string[] | null => {
      if (cur?.modules !== colorsFor) {
        colorsFor = cur?.modules;
        colors = colorsFor ? moduleColors(colorsFor) : null;
      }
      return colors;
    };

    net.enableZoom(ZOOM_EXTENT);
    net.interactive({
      selectable: { multi: true },
      draggable: true,
      hover: { others: { opacity: 0.5 } },
      selection: { others: { opacity: 0.3 } },
    });

    net.on("click", (hit) => {
      runInAction(() => {
        if (hit?.layer !== "nodes") {
          store.clearSelection();
          return;
        }
        const aggregate =
          (hit.datum as { aggregate?: boolean }).aggregate === true;
        const members = hit.members ? hit.members().map(Number) : null;
        store.selectFromHit(Number(hit.id), aggregate, members);
      });
    });

    const activePositions = (): Float32Array | null => {
      const cur = store.current;
      if (cur?.isStates && store.builtState && cur.modules) {
        return settings.stateView === "physical"
          ? store.builtState.physical.positions
          : store.builtState.state.positions;
      }
      return store.built?.positions ?? null;
    };

    store.zoomTo = (ids) => {
      const positions = activePositions();
      if (!positions) return;
      const t = fitTransform(
        positions,
        ids,
        host.clientWidth,
        host.clientHeight,
      );
      if (!t) return;
      net.setTransform(t);
      // enableZoom seeds d3-zoom's internal transform only at call time, so a
      // programmatic setTransform leaves it stale and the next wheel gesture
      // snaps back to the old view (mapequation/d3gl#202). Re-calling
      // enableZoom re-seeds it from the engine's current transform.
      net.enableZoom(ZOOM_EXTENT);
    };

    const onDblClick = (ev: MouseEvent) => {
      const rect = host.getBoundingClientRect();
      const hit = net.pick(ev.clientX - rect.left, ev.clientY - rect.top);
      if (hit?.members) store.zoomTo?.(hit.members().map(Number));
    };
    host.addEventListener("dblclick", onDblClick);

    // Style and LOD are computed once per change and shared by the reaction
    // that keeps them live and by `show`, so a network swap applies each once.
    const style = computed(() =>
      buildStyle(store, settings, colorsOf(store.current)),
    );
    // The latest layout: whether it's a nested map of the modules the engine
    // holds, and whether it has landed (converged, or been stopped).
    const latest = observable.box(
      { nested: false, settled: false },
      { deep: false },
    );
    const discs = computed(() => latest.get().nested && latest.get().settled);
    const lod = computed(() => buildLod(store, settings, discs.get()));
    let appliedStyle: NetworkStyle | null = null;
    let appliedLod: NetworkLODOptions | false | null = null;
    const applyStyle = (s: NetworkStyle): void => {
      if (s === appliedStyle) return;
      appliedStyle = s;
      net.style(s);
    };
    const applyLod = (l: NetworkLODOptions | false): void => {
      if (l === appliedLod) return;
      appliedLod = l;
      net.lod(l);
    };

    // The network the engine holds, and the topology it was loaded with. The
    // reactions below track store state that a network swap also changes, and
    // mobx may run them before `show` within the same action: until the
    // engine holds the current network they leave it alone (show applies it).
    let shown: LoadedNetwork | null = null;
    let shownTopology = -1;
    const holdsCurrent = () => shown !== null && shown === store.current;

    let layoutRun = 0; // a layout's landing counts only while it's the latest
    const layout = (opts: Omit<NetworkLayoutOptions, "backend">): void => {
      const run = ++layoutRun;
      // d3gl lays out a nested map only of a hierarchy it holds as data.
      const nested = !!opts.nested && !!hierarchyOf(store.current);
      runInAction(() => latest.set({ nested, settled: false }));
      applyLod(lod.get());
      net.layout({ ...opts, backend: settings.layoutBackend });
      void net.whenSettled().then(() => {
        if (run === layoutRun)
          runInAction(() => latest.set({ nested, settled: true }));
      });
    };
    /** A layout from scratch, framed: a load's or a restarted simulation's. */
    const layoutAnew = (): void =>
      layout({ ...LAYOUT, nested: settings.nestedLayout });
    /**
     * After new modules or a Nested layout switch: lays the network out again
     * if the kind of layout it has isn't the kind asked for and the
     * simulation runs (see RELAYOUT); otherwise the LOD regroups in place.
     */
    const relayout = (): void => {
      const nested = settings.nestedLayout && !!hierarchyOf(store.current);
      if (!settings.simulation || nested === latest.get().nested) {
        applyLod(lod.get());
      } else if (nested) layout(RELAYOUT);
      else layoutAnew();
    };

    const show = (): void => {
      const cur = store.current;
      const graph = store.built;
      if (!cur || !graph) return; // cleared: the view is unmounting
      const reCluster =
        shown !== null && shownTopology === store.topologyVersion;
      shown = cur;
      shownTopology = store.topologyVersion;
      const s = style.get();
      // data()/stateNetwork() re-resolve the engine's current style against
      // the new graph, and style() resolves against the old one. Sizing by
      // flow throws on a graph without flow, so apply the new style after the
      // swap when the new graph has flow and before it otherwise.
      const flowFirst = !!cur.graph.nodeFlow;
      if (!flowFirst) applyStyle(s);
      if (cur.isStates && store.builtState && cur.modules) {
        net.stateNetwork(store.builtState, {
          modules: cur.modules,
          view: settings.stateView,
        });
      } else {
        net.data(graph, hierarchyOf(cur));
      }
      if (flowFirst) applyStyle(s);
      net.select("nodes", store.searchHighlight);
      if (!reCluster) {
        layoutAnew();
        return;
      }
      // data() has stopped any layout, and a nested map of the old modules
      // is none of the new ones.
      layoutRun++;
      runInAction(() => latest.set({ nested: false, settled: true }));
      relayout();
    };

    const disposers = [
      reaction(
        () => style.get(),
        (s) => {
          if (holdsCurrent()) applyStyle(s);
        },
      ),
      reaction(
        () => lod.get(),
        (l) => {
          if (holdsCurrent()) applyLod(l);
        },
      ),
      // Loads and re-clusterings. After the two above, so that when the store
      // swaps the network those usually run first and skip.
      reaction(() => [store.current, store.topologyVersion], show, {
        fireImmediately: true,
      }),
      reaction(
        () => ({ on: settings.labelsVisible, max: settings.maxLabels }),
        ({ on, max }) =>
          net.labels(
            on
              ? {
                  max,
                  // Modules are named like v1: curated name, else their
                  // highest-flow node. info.path is the module's Infomap path.
                  labelOf: (id, info) =>
                    info.aggregate
                      ? info.path
                        ? store.moduleLabel(info.path)
                        : `${info.count.toLocaleString()} node${info.count === 1 ? "" : "s"}`
                      : (store.current?.names[Number(id)] ?? ""),
                  importanceOf: (id, info) =>
                    info.aggregate
                      ? info.count
                      : (store.built?.flow?.[Number(id)] ?? 0),
                }
              : false,
          ),
        { fireImmediately: true },
      ),
      reaction(
        () => settings.simulation,
        (on) => {
          if (!holdsCurrent()) return;
          if (on) layoutAnew();
          else net.stopLayout();
        },
      ),
      // Nested layout switched: see RELAYOUT. A network without a module
      // hierarchy has the force layout either way.
      reaction(
        () => settings.nestedLayout,
        () => {
          if (holdsCurrent()) relayout();
        },
      ),
      // Busy while a layout runs, for assistive tech (and the e2e tests). Once
      // it lands, data-layout-transport names where d3gl ran it: "gpu", or the
      // worker's "shared" / "copy" ("none" if it was stopped first).
      reaction(
        () => latest.get().settled,
        (done) => {
          host.setAttribute("aria-busy", String(!done));
          if (done) host.dataset.layoutTransport = net.layoutTransport;
          else delete host.dataset.layoutTransport;
        },
        { fireImmediately: true },
      ),
      // For the e2e tests too: data-nested-map says whether the positions are
      // a nested map of the modules the engine holds, landed (as the module
      // rings follow). The transport alone doesn't tell the kind of layout.
      reaction(
        () => discs.get(),
        (landed) => {
          host.dataset.nestedMap = String(landed);
        },
        { fireImmediately: true },
      ),
      reaction(
        () => store.searchHighlight,
        (ids) => {
          if (holdsCurrent()) net.select("nodes", ids);
        },
      ),
      reaction(
        () => settings.pickLinks,
        (p) => net.pickLinks(p),
        { fireImmediately: true },
      ),
      reaction(
        () => settings.stateView,
        (view) => {
          const cur = store.current;
          if (holdsCurrent() && cur?.isStates && cur.modules) net.view(view);
        },
      ),
    ];

    return () => {
      for (const dispose of disposers) dispose();
      host.removeEventListener("dblclick", onDblClick);
      store.zoomTo = null;
      if (store.engine === net) store.engine = null;
      net.destroy();
    };
  }, [store, settings, backend]);

  return <div ref={hostRef} className="absolute inset-0" />;
});
