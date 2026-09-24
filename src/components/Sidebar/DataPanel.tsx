import { Chip } from "@heroui/react";
import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import { formatBytes, formatNumber } from "../../lib/network-stats";
import { useStores } from "../../stores";
import { Stats } from "./controls";

export const DataPanel = observer(function DataPanel() {
  const { network: store } = useStores();
  const cur = store.current;
  if (!cur) return null;
  const s = cur.stats;
  const fromFtree = s.moduleLinks !== undefined;

  const rows: [string, ReactNode, string?][] = [];
  rows.push([cur.isStates ? "State nodes" : "Nodes", s.nodes.toLocaleString()]);
  if (s.physicalNodes !== undefined)
    rows.push(["Physical nodes", s.physicalNodes.toLocaleString()]);
  rows.push([
    fromFtree ? "Leaf links" : "Links",
    s.links.toLocaleString(),
    fromFtree ? "Leaf-to-leaf links stored in the ftree" : undefined,
  ]);
  if (fromFtree && s.moduleLinks)
    rows.push([
      "Module links",
      s.moduleLinks.toLocaleString(),
      "Links between modules — aggregates of leaf links the ftree does not list",
    ]);
  rows.push([
    "Degree mean / max",
    `${formatNumber(s.meanDegree)} / ${s.maxDegree.toLocaleString()}`,
  ]);
  rows.push([
    s.weightIsFlow ? "Link flow mean / max" : "Weight mean / max",
    s.weight
      ? `${formatNumber(s.weight.mean)} / ${formatNumber(s.weight.max)}`
      : "unweighted",
  ]);

  return (
    <div className="flex flex-col gap-2.5">
      <ul className="flex flex-col gap-1">
        {cur.files.map((f) => (
          <li key={f.name} className="flex items-baseline gap-2 text-xs">
            <span
              className="min-w-0 flex-1 truncate font-medium text-neutral-800"
              title={f.name}
            >
              {f.name}
            </span>
            <span className="shrink-0 tabular-nums text-neutral-400">
              {formatBytes(f.size)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-1">
        <Chip size="sm" variant="secondary">
          {cur.directed ? "Directed" : "Undirected"}
        </Chip>
        <Chip size="sm" variant="secondary">
          {s.weight ? "Weighted" : "Unweighted"}
        </Chip>
        {cur.isStates && (
          <Chip size="sm" variant="secondary">
            State network
          </Chip>
        )}
      </div>
      <Stats rows={rows} />
      {fromFtree && (
        <p className="text-[11px] leading-snug text-neutral-400">
          An ftree stores leaf links only within bottom modules; degrees count
          those links.
        </p>
      )}
    </div>
  );
});
