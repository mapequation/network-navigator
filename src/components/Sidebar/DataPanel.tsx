import { Button, Chip } from "@heroui/react";
import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import { formatBytes, formatNumber } from "../../lib/network-stats";
import { useStores } from "../../stores";
import { Stats } from "./controls";

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4M6.5 6.5v4.5M9.5 6.5v4.5" />
    </svg>
  );
}

/** A loaded file: name, then its size, which a trash button replaces on hover/focus. */
function FileRow({
  name,
  size,
  swatch,
  removeLabel,
  isDisabled,
  onRemove,
}: {
  name: string;
  size: number;
  /** Metadata files: their overlay colour. */
  swatch?: string;
  removeLabel: string;
  isDisabled?: boolean;
  onRemove: () => void;
}) {
  return (
    <li className="group/file flex items-baseline gap-2 text-xs">
      {swatch && (
        <span
          className="h-2.5 w-2.5 shrink-0 self-center rounded-sm"
          style={{ background: swatch }}
        />
      )}
      <span
        className="min-w-0 flex-1 truncate font-medium text-neutral-800"
        title={name}
      >
        {name}
      </span>
      {/* Size and trash share one slot: the size hides on hover/focus, the
          button only fades (opacity) so it stays keyboard-focusable. */}
      <span className="relative shrink-0">
        <span className="tabular-nums text-neutral-400 group-focus-within/file:invisible group-hover/file:invisible">
          {formatBytes(size)}
        </span>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label={removeLabel}
          isDisabled={isDisabled}
          onPress={onRemove}
          className="absolute top-1/2 right-0 size-6 -translate-y-1/2 opacity-0 group-focus-within/file:opacity-100 group-hover/file:opacity-100"
        >
          <TrashIcon />
        </Button>
      </span>
    </li>
  );
}

export const DataPanel = observer(function DataPanel() {
  const { network: store, ui } = useStores();
  const cur = store.current;
  if (!cur) return null;

  const clear = (): void => {
    store.clear();
    ui.clearInfomapRun();
    ui.setLoadError(null);
    ui.openLoad();
  };
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
        {/* Any network input clears the whole network; a metadata file goes alone. */}
        {cur.sources.map((f) => (
          <FileRow
            key={`${f.kind}:${f.name}`}
            name={f.name}
            size={f.size}
            removeLabel="Clear network"
            isDisabled={ui.infomapRunning}
            onRemove={clear}
          />
        ))}
        {store.occurrenceFiles.map((f) => (
          <FileRow
            key={f.id}
            name={f.name}
            size={f.size}
            swatch={f.color}
            removeLabel={`Remove ${f.name}`}
            onRemove={() => store.removeOccurrenceFile(f.id)}
          />
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
