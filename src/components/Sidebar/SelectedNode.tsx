import { observer } from "mobx-react-lite";
import { Fragment } from "react";
import { useStores } from "../../stores";

export const SelectedNode = observer(function SelectedNode() {
  const { network: store } = useStores();
  const sel = store.selection;
  if (!sel)
    return (
      <p className="text-xs text-neutral-400">
        Click a node or module in the network
      </p>
    );

  const rows: [string, string][] = [["Name", sel.name]];
  if (sel.aggregate) rows.push(["Nodes", sel.ids.length.toLocaleString()]);
  if (sel.path) rows.push(["Module", sel.path.join(":") || "root"]);
  if (sel.flow !== null) rows.push(["Flow", sel.flow.toExponential(2)]);
  if (sel.physicalId !== null) rows.push(["Node id", String(sel.physicalId)]);

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
      {rows.map(([label, value]) => (
        <Fragment key={label}>
          <dt className="text-neutral-500">{label}</dt>
          <dd className="truncate" title={value}>
            {value}
          </dd>
        </Fragment>
      ))}
    </dl>
  );
});
