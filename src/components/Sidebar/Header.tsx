import { Button, Kbd } from "@heroui/react";
import { version as d3glVersion } from "@mapequation/d3gl";
import Infomap from "@mapequation/infomap";
import { observer } from "mobx-react-lite";
import icon from "../../assets/mapequation-icon.svg";
import { useStores } from "../../stores";
import { Cite } from "./Cite";

export const Header = observer(function Header() {
  const { ui } = useStores();
  return (
    <div className="flex flex-col gap-3">
      <a href="https://www.mapequation.org" className="flex items-center gap-3">
        <img src={icon} alt="MapEquation" className="h-10 w-10" />
        <div>
          <h1 className="text-lg font-semibold leading-tight">
            Network Navigator{" "}
            <span className="text-xs font-normal text-neutral-400">
              v{import.meta.env.VITE_APP_VERSION}
            </span>
          </h1>
          <p className="text-xs text-neutral-500">
            Powered by Infomap v{Infomap.__version__} and d3gl v{d3glVersion}
          </p>
        </div>
      </a>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onPress={ui.openLoad}>
          Load <Kbd>L</Kbd>
        </Button>
        <Cite />
        <Button
          size="sm"
          variant="secondary"
          onPress={() => ui.setHelpOpen(true)}
        >
          Help
        </Button>
      </div>
    </div>
  );
});
