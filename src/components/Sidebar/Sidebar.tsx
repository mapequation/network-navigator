import { observer } from "mobx-react-lite";
import { formatNumber } from "../../lib/network-stats";
import { useStores } from "../../stores";
import { Section } from "./controls";
import { DataPanel } from "./DataPanel";
import { Distributions } from "./Distributions";
import { Export } from "./Export";
import { Header } from "./Header";
import { ModulesPanel } from "./ModulesPanel";
import { Occurrences } from "./Occurrences";
import { Search } from "./Search";
import { SelectedNode } from "./SelectedNode";
import { DisplayPanel, LodPanel, RenderingPanel } from "./SettingsPanel";

export const Sidebar = observer(function Sidebar() {
  const { network: store, ui } = useStores();
  const cur = store.current;
  return (
    <aside className="flex w-84 shrink-0 flex-col overflow-y-auto border-l border-neutral-200 bg-white">
      <Header />
      {/* Load errors otherwise only render inside the (closed) load modal. */}
      {ui.loadError && !ui.loadOpen && (
        <p role="alert" className="mx-4 mb-3 text-xs text-red-600">
          {ui.loadError}
        </p>
      )}
      {cur && (
        <>
          <Section
            title="Data"
            aside={`${formatNumber(cur.stats.nodes)} nodes`}
          >
            <DataPanel />
          </Section>
          <Section
            title="Modules"
            aside={ui.infomapRunning ? "running…" : undefined}
          >
            <ModulesPanel />
          </Section>
          <Section title="Search">
            <Search />
          </Section>
          <Section
            title={store.selection?.aggregate ? "Selected module" : "Selection"}
          >
            <SelectedNode />
            <Distributions />
          </Section>
          <Section title="Occurrences" defaultOpen={false}>
            <Occurrences />
          </Section>
          <Section title="Display">
            <DisplayPanel />
          </Section>
          <Section title="Level of detail">
            <LodPanel />
          </Section>
          <Section title="Rendering">
            <RenderingPanel />
          </Section>
          <Section title="Export">
            <Export />
          </Section>
        </>
      )}
    </aside>
  );
});
