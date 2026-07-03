import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import { useStores } from "../../stores";
// Uncomment as Tasks 18–19 land:
import { Distributions } from "./Distributions";
import { Header } from "./Header";
// import { Occurrences } from "./Occurrences";
import { Search } from "./Search";
import { SelectedNode } from "./SelectedNode";
// import { SettingsPanel } from "./SettingsPanel";
// import { Export } from "./Export";

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 border-t border-neutral-100 pt-3">
      <h4 className="text-sm font-semibold text-neutral-700">{title}</h4>
      {children}
    </section>
  );
}

export const Sidebar = observer(function Sidebar() {
  const { network: store } = useStores();
  return (
    <aside className="flex w-80 shrink-0 flex-col gap-3 overflow-y-auto border-l border-neutral-200 bg-white p-4">
      <Header />
      {store.current && (
        <>
          <Section title="Search">
            <Search />
          </Section>
          <Section
            title={
              store.selection?.aggregate ? "Selected module" : "Selected node"
            }
          >
            <SelectedNode />
            <Distributions />
          </Section>
          {/* <Section title="Occurrences"><Occurrences /></Section> */}
          {/* <Section title="Settings"><SettingsPanel /></Section> */}
          {/* <Section title="Export"><Export /></Section> */}
        </>
      )}
    </aside>
  );
});
