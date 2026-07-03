import {
  moduleColors,
  type NetworkLODOptions,
  type NetworkStyle,
  network,
} from "@mapequation/d3gl/network";
import { scaleLinear, scaleSqrt } from "d3-scale";
import { reaction, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import { fitTransform } from "../lib/fit-transform";
import { useStores } from "../stores";
import type { NetworkStore } from "../stores/network-store";
import type { ScaleKind, SettingsStore } from "../stores/settings-store";

const DEFAULT_NODE_FILL = "#4878d0";

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
  return {
    directed: cur?.directed,
    sizeMode: settings.sizeMode,
    linkStyle: settings.linkStyle,
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
        .domain([0, store.maxWeight || 1])
        .range([0.4, 4])
        .clamp(true),
    },
    linkStroke: "rgba(90,100,120,0.55)",
    nodeFill:
      occurrences.length || colors
        ? (i: number) => {
            for (const f of occurrences) if (f.idSet.has(i)) return f.color;
            return colors?.[i] ?? DEFAULT_NODE_FILL;
          }
        : DEFAULT_NODE_FILL,
  };
}

function buildLod(
  store: NetworkStore,
  settings: SettingsStore,
): NetworkLODOptions | false {
  if (!settings.lodEnabled) return false;
  const modules = store.current?.modules;
  return {
    ...(modules ? { modules } : {}),
    expandPx: settings.expandPx,
    maxAggregateRadius: settings.maxAggregateRadius,
    declutter: settings.declutter,
    superEdges: settings.superEdges,
    crossFade: settings.crossFade,
  };
}

export const NetworkView = observer(function NetworkView() {
  const { network: store, settings } = useStores();
  const hostRef = useRef<HTMLDivElement>(null);
  const current = store.current; // observed: effect re-runs when a new network loads
  const backend = settings.backend;

  useEffect(() => {
    const host = hostRef.current;
    const graph = store.built;
    if (!host || !current || !graph) return;

    const net = network(host, { backend });
    store.engine = net;
    const colors = current.modules ? moduleColors(current.modules) : null;

    net.enableZoom([0.002, 200]);
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

    const activePositions = (): Float32Array => {
      if (current.isStates && store.builtState && current.modules) {
        return settings.stateView === "physical"
          ? store.builtState.physical.positions
          : store.builtState.state.positions;
      }
      return graph.positions;
    };

    store.zoomTo = (ids) => {
      const t = fitTransform(
        activePositions(),
        ids,
        host.clientWidth,
        host.clientHeight,
      );
      if (t) net.setTransform(t);
    };

    const onDblClick = (ev: MouseEvent) => {
      const rect = host.getBoundingClientRect();
      const hit = net.pick(ev.clientX - rect.left, ev.clientY - rect.top);
      if (hit?.members) store.zoomTo?.(hit.members().map(Number));
    };
    host.addEventListener("dblclick", onDblClick);

    if (current.isStates && store.builtState && current.modules) {
      net.stateNetwork(store.builtState, {
        modules: current.modules,
        view: settings.stateView,
      });
    } else {
      net.data(graph);
    }

    const disposers = [
      reaction(
        () => buildStyle(store, settings, colors),
        (s) => net.style(s),
        { fireImmediately: true },
      ),
      reaction(
        () => buildLod(store, settings),
        (lod) => net.lod(lod),
        { fireImmediately: true },
      ),
      reaction(
        () => ({ on: settings.labelsVisible, max: settings.maxLabels }),
        ({ on, max }) =>
          net.labels(
            on
              ? {
                  max,
                  // Aggregate glyphs are labeled by size only: labelOf(id, info) exposes no
                  // module identity for aggregates yet — raised on mapequation/d3gl#197.
                  labelOf: (id, info) =>
                    info.aggregate
                      ? `${info.count.toLocaleString()} nodes`
                      : current.names[Number(id)],
                  importanceOf: (id, info) =>
                    info.aggregate
                      ? info.count
                      : (graph.flow?.[Number(id)] ?? 0),
                }
              : false,
          ),
        { fireImmediately: true },
      ),
      reaction(
        () => settings.simulation,
        (on) => (on ? net.layout({ backend: "worker" }) : net.stopLayout()),
      ),
      reaction(
        () => store.searchHighlight,
        (ids) => net.select("nodes", ids),
        { fireImmediately: true },
      ),
      reaction(
        () => settings.pickLinks,
        (p) => net.pickLinks(p),
        { fireImmediately: true },
      ),
      reaction(
        () => settings.stateView,
        (view) => {
          if (current.isStates && current.modules) net.view(view);
        },
      ),
    ];

    net.layout({ backend: "worker" });
    void net.whenSettled().then(() => store.zoomTo?.(null));

    return () => {
      for (const dispose of disposers) dispose();
      host.removeEventListener("dblclick", onDblClick);
      store.zoomTo = null;
      if (store.engine === net) store.engine = null;
      net.destroy();
    };
  }, [store, settings, current, backend]);

  return <div ref={hostRef} className="absolute inset-0" />;
});
