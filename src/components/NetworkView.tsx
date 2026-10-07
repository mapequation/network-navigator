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
import { pathKey } from "../lib/path-key";
import type { LoadedNetwork } from "../lib/types";
import { useStores } from "../stores";
import type { NetworkStore } from "../stores/network-store";
import type { ScaleKind, SettingsStore } from "../stores/settings-store";

const DEFAULT_NODE_FILL = "#4878d0";
// Color by flow: the colour ranges of d3gl's "Flow borders and half-arrows"
// example (website/src/examples/flow-borders/data.ts), low → high, over
// [0, max] of this network's values.
const NODE_FILL_RANGE: [string, string] = ["#EF7518", "#D75908"];
const NODE_BORDER_RANGE: [string, string] = ["#FFAE38", "#f9a327"];
const LINK_RANGE: [string, string] = ["#71B2D7", "#418EC7"];
// Color by module: one neutral ring colour, the module rings' grey.
const NEUTRAL_RING = "rgb(90,100,120)";
// Flow-border ring width (px in screen size mode) at the largest node boundary
// flow; a module's ring extrapolates above it.
const RING_NODE_MAX_WIDTH = 4;
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

/**
 * The layout after new modules or a Nested layout switch, or null for none.
 * The nodes stay where they are unless the kind of layout they have (a nested
 * map of the modules, or not: `have`) is no longer the kind asked for
 * (`want`); then, while the simulation runs, the layout goes on from where the
 * nodes are (d3gl#454, `warm`), streamed from its first frame: nothing
 * restarts from a disc, and nothing is solved out of sight first. (With the
 * simulation off nothing moves the nodes until it's switched back on, which
 * lays the network out anew as set then.)
 *
 * - A nested map of the (new) modules streams from the positions on screen:
 *   the nodes glide into their modules' discs as it forms, and it goes to its
 *   own size, centred where the nodes are. Switched on from a force layout it
 *   shrinks to about a third of the force layout's width, framed as it goes
 *   (fit). A re-clustering (`recluster`) streams the same way but keeps the
 *   camera the user left: a nested map of the old modules has the new one's
 *   size already, so it stays in view.
 * - A force layout streams from the nested map and glides out to the force
 *   model's own scale (about 3× wider) as it converges, framed as it grows.
 * Either way d3gl eases the nodes from where they are toward each frame of
 * the solve as it lands, so the switch glides rather than steps.
 *
 * So with Nested layout off a re-clustering lays nothing out: the new modules
 * regroup the LOD and recolour the nodes where they are. (A states network's
 * re-clustering is a load, see NetworkStore.)
 */
export function relayoutOf(
  want: boolean,
  have: boolean,
  simulation: boolean,
  recluster = false,
): Omit<NetworkLayoutOptions, "backend"> | null {
  if (!simulation || want === have) return null;
  if (!want) return { fit: true, warm: true };
  return recluster
    ? { nested: true, warm: true }
    : { nested: true, warm: true, fit: true };
}
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

export function buildStyle(
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
  // Flow colours need node flow; without it the module colours stand in.
  const flowColors = settings.colorBy === "flow" && !!cur?.graph.nodeFlow;
  const linkDomain: [number, number] = [0, store.maxLinkFlow || 1];
  const flowFill = scaleLinear<string>()
    .domain([0, store.maxFlow || 1])
    .range(NODE_FILL_RANGE)
    .clamp(true);
  const fillOf = (i: number, g: { flow: Float32Array | null }): string =>
    flowColors
      ? flowFill(g.flow?.[i] ?? 0)
      : (colors?.[i] ?? DEFAULT_NODE_FILL);
  const ring = cur?.boundaryFlow;
  const ringDomain: [number, number] = [0, store.maxBoundaryFlow || 1];
  const ringColor = scaleLinear<string>()
    .domain(ringDomain)
    .range(NODE_BORDER_RANGE)
    .clamp(true);
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
    // By module, opacity rises with flow so weak links recede and overlaps
    // read as density (as in d3gl's directed map of modules). By flow, the
    // blues of the flow-borders example, over the same per-link value as the
    // width (the link weight; super-edges their summed weight).
    linkStroke: (settings.linkScale === "root"
      ? scaleSqrt<string>()
      : scaleLinear<string>()
    )
      .domain(linkDomain)
      .range(
        flowColors
          ? LINK_RANGE
          : ["rgba(90,100,120,0.12)", "rgba(60,70,90,0.85)"],
      )
      .clamp(true),
    // Occurrence colours win, per node. Otherwise by flow each glyph takes
    // the flow scale's colour of its own flow: a module's is its members'
    // summed flow (d3gl#446), not a member's colour.
    nodeFill: occurrences.length
      ? (i: number, g: { flow: Float32Array | null }) => {
          for (const f of occurrences) if (f.idSet.has(i)) return f.color;
          return fillOf(i, g);
        }
      : flowColors
        ? { by: "flow", scale: flowFill }
        : colors
          ? (i: number) => colors[i] ?? DEFAULT_NODE_FILL
          : DEFAULT_NODE_FILL,
    // Rings only where an in-app Infomap run gave each node's boundary flow
    // (checked against the modules' enter + exit flow). A module of the
    // hierarchy rings by Infomap's own enter + exit flow for it (d3gl#446):
    // summing its members' rings would count the flow between its own
    // submodules too.
    flowBorder: ring
      ? {
          flow: ring,
          scale: makeScale(settings.nodeScale)
            .domain(ringDomain)
            .range([0, RING_NODE_MAX_WIDTH]),
          // Not clamped: a module's ring extrapolates on the nodes' scale, as
          // its radius does on nodeRadius's, so ring and disc grow together.
          moduleFlow: (path: readonly number[]) => {
            const m = cur?.moduleFlow?.get(pathKey(path));
            return m ? m.enterFlow + m.exitFlow : undefined;
          },
          color: flowColors ? (v: number) => ringColor(v) : NEUTRAL_RING,
        }
      : undefined,
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
    declutterSpacing: settings.declutterSpacing,
    superEdges: settings.superEdges,
    crossLevelEdges: settings.crossLevelEdges,
    crossFade: settings.crossFade,
  };
}

export const NetworkView = observer(function NetworkView() {
  const { network: store, settings, ui } = useStores();
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
     * After new modules (`recluster`) or a Nested layout switch: goes on with
     * the layout the network should have now, from where it is (see
     * relayoutOf); otherwise the LOD regroups in place.
     */
    const relayout = (recluster = false): void => {
      const nested = settings.nestedLayout && !!hierarchyOf(store.current);
      const next = relayoutOf(
        nested,
        latest.get().nested,
        settings.simulation,
        recluster,
      );
      if (next) layout(next);
      else applyLod(lod.get());
    };

    // A load waits in its dialog until its network is on screen (ui.viewPhase). d3gl reports no load phase
    // or first frame (proposed upstream: d3gl#466), so this watches what it does expose: with LOD on, the engine has a
    // tree to draw (lodSource); with LOD off it draws on data(). Then two more frames: the frame that draws
    // the tree, with the view's one-time builds (link styles and tables), has run by then.
    let readyWatch = 0;
    const watchFirstFrame = (): void => {
      if (ui.viewPhase === null) return;
      const watch = ++readyWatch;
      let after = -1;
      const step = (): void => {
        if (watch !== readyWatch || ui.viewPhase === null) return;
        if (
          after < 0 &&
          (lod.get() === false ||
            net.lodSource !== "none" ||
            latest.get().settled)
        )
          after = 2;
        if (after === 0) {
          ui.viewReady();
          return;
        }
        if (after > 0) after--;
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const show = (): void => {
      const cur = store.current;
      const graph = store.built;
      if (!cur || !graph) {
        ui.viewReady(); // nothing to wait for
        return; // cleared: the view is unmounting
      }
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
      watchFirstFrame();
      if (!reCluster) {
        layoutAnew();
        return;
      }
      // data() has stopped any layout, and a nested map of the old modules
      // is none of the new ones.
      layoutRun++;
      runInAction(() => latest.set({ nested: false, settled: true }));
      relayout(true);
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
      // Nested layout switched: see relayoutOf. A network without a module
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
      // For the e2e tests too: data-nested-map says whether the latest layout,
      // landed, is the nested map of the modules the view asked d3gl for (what
      // the module rings follow). It's the view's record, not d3gl's report:
      // neither the transport nor any d3gl getter tells the kind (d3gl#434).
      reaction(
        () => discs.get(),
        (landed) => {
          host.dataset.nestedMap = String(landed);
        },
        { fireImmediately: true },
      ),
      // For the e2e tests: whether the nodes carry flow-border rings.
      reaction(
        () => !!style.get().flowBorder,
        (on) => {
          host.dataset.flowBorders = String(on);
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
      readyWatch++;
      for (const dispose of disposers) dispose();
      host.removeEventListener("dblclick", onDblClick);
      store.zoomTo = null;
      if (store.engine === net) store.engine = null;
      net.destroy();
    };
  }, [store, settings, ui, backend]);

  return <div ref={hostRef} className="absolute inset-0" />;
});
