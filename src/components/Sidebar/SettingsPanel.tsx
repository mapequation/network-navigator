import {
  Button,
  ListBox,
  NumberField,
  Select,
  Slider,
  Switch,
} from "@heroui/react";
import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import { buildInfomapArgs } from "../../lib/infomap-args";
import { runInfomap } from "../../lib/run-infomap";
import { useStores } from "../../stores";
import type { LodMode } from "../../stores/settings-store";

// `label` is not a native <label> here: several controls (Switch, Select) render their own
// internal <label>/button structure, so wrapping them in a second <label> would nest labels
// (invalid HTML) and confuse their accessible name. Row is a plain layout row; every control
// below carries its own `aria-label` for accessibility instead.
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-neutral-600">{label}</span>
      {children}
    </div>
  );
}

export const SettingsPanel = observer(function SettingsPanel() {
  const { network: store, settings, ui } = useStores();
  const cur = store.current;

  const cluster = async (): Promise<void> => {
    if (!cur?.networkText) return;
    try {
      ui.startInfomap();
      const ftree = await runInfomap({
        network: cur.networkText,
        filename: cur.filename,
        args: buildInfomapArgs({
          directed: cur.directed,
          twoLevel: false,
          noInfomap: false,
        }),
        onProgress: ui.onInfomapProgress,
        onLog: ui.onInfomapLog,
      });
      store.applyClustering(ftree);
    } catch (err) {
      ui.setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      ui.finishInfomap();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {cur?.kind === "raw" && cur.networkText && (
        <Button size="sm" onPress={cluster} isDisabled={ui.infomapRunning}>
          {ui.infomapRunning
            ? `Clustering… ${Math.round(ui.infomapProgress)}%`
            : "Cluster with Infomap"}
        </Button>
      )}
      {/* ui.loadError otherwise only renders inside the (closed) load modal. */}
      {ui.loadError && !ui.loadOpen && (
        <p role="alert" className="text-xs text-red-600">
          {ui.loadError}
        </p>
      )}

      <Row label={`Node size by ${settings.nodeSizeBy}`}>
        <Switch
          aria-label="Node size by"
          isSelected={settings.nodeSizeBy === "flow"}
          onChange={(on) => settings.set("nodeSizeBy", on ? "flow" : "degree")}
        >
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch>
      </Row>
      <Row label={`Node radius scale: ${settings.nodeScale}`}>
        <Switch
          aria-label="Node radius scale"
          isSelected={settings.nodeScale === "root"}
          onChange={(on) => settings.set("nodeScale", on ? "root" : "linear")}
        >
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch>
      </Row>
      <Row label={`Link width scale: ${settings.linkScale}`}>
        <Switch
          aria-label="Link width scale"
          isSelected={settings.linkScale === "root"}
          onChange={(on) => settings.set("linkScale", on ? "root" : "linear")}
        >
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch>
      </Row>
      <Row label="Show labels">
        <Switch
          aria-label="Show labels"
          isSelected={settings.labelsVisible}
          onChange={(on) => settings.set("labelsVisible", on)}
        >
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch>
      </Row>
      <Row label="Max labels">
        <NumberField
          aria-label="Max labels"
          value={settings.maxLabels}
          minValue={0}
          maxValue={500}
          onChange={(v) => settings.set("maxLabels", v)}
          className="w-24"
        >
          <NumberField.Group>
            <NumberField.DecrementButton />
            <NumberField.Input />
            <NumberField.IncrementButton />
          </NumberField.Group>
        </NumberField>
      </Row>
      <Row label="Run simulation">
        <Switch
          aria-label="Run simulation"
          isSelected={settings.simulation}
          onChange={(on) => settings.set("simulation", on)}
        >
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch>
      </Row>

      <p className="mt-2 text-xs font-semibold text-neutral-700">
        Level of detail (d3gl)
      </p>
      <Row label="Aggregate by">
        <Select
          aria-label="LOD mode"
          selectedKey={settings.lodMode}
          onSelectionChange={(k) => settings.set("lodMode", k as LodMode)}
          className="w-32"
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="modules">modules</ListBox.Item>
              <ListBox.Item id="spatial">spatial</ListBox.Item>
              <ListBox.Item id="off">off</ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </Row>
      <Row label={`Expand at ${settings.expandPx}px`}>
        <Slider
          aria-label="Expand threshold"
          isDisabled={settings.lodMode === "off"}
          minValue={16}
          maxValue={200}
          step={4}
          value={settings.expandPx}
          onChange={(v) => settings.set("expandPx", v as number)}
          className="w-32"
        >
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
      </Row>
      <Row label={`Max aggregate radius ${settings.maxAggregateRadius}px`}>
        <Slider
          aria-label="Max aggregate radius"
          isDisabled={settings.lodMode === "off"}
          minValue={8}
          maxValue={64}
          step={2}
          value={settings.maxAggregateRadius}
          onChange={(v) => settings.set("maxAggregateRadius", v as number)}
          className="w-32"
        >
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
      </Row>
      <Row label="Declutter">
        <Switch
          aria-label="Declutter"
          isDisabled={settings.lodMode === "off"}
          isSelected={settings.declutter}
          onChange={(on) => settings.set("declutter", on)}
        >
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch>
      </Row>
      <Row label="Super-edges">
        <Switch
          aria-label="Super-edges"
          isDisabled={settings.lodMode === "off"}
          isSelected={settings.superEdges}
          onChange={(on) => settings.set("superEdges", on)}
        >
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch>
      </Row>
      <Row label={`Cross-fade ${settings.crossFade.toFixed(1)}`}>
        <Slider
          aria-label="Cross-fade"
          isDisabled={settings.lodMode === "off"}
          minValue={0}
          maxValue={1}
          step={0.1}
          value={settings.crossFade}
          onChange={(v) => settings.set("crossFade", v as number)}
          className="w-32"
        >
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
      </Row>

      <p className="mt-2 text-xs font-semibold text-neutral-700">
        Rendering (d3gl)
      </p>
      <Row label="Link style">
        <Select
          aria-label="Link style"
          isDisabled={!cur?.directed}
          selectedKey={settings.linkStyle}
          onSelectionChange={(k) =>
            settings.set("linkStyle", k as "line" | "half-arrow")
          }
          className="w-32"
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="line">line</ListBox.Item>
              <ListBox.Item id="half-arrow">half-arrow</ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </Row>
      <Row label="Size mode">
        <Select
          aria-label="Size mode"
          selectedKey={settings.sizeMode}
          onSelectionChange={(k) =>
            settings.set("sizeMode", k as "screen" | "world")
          }
          className="w-32"
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="screen">screen</ListBox.Item>
              <ListBox.Item id="world">world</ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </Row>
      <Row label="Backend (recreates view)">
        <Select
          aria-label="Backend"
          selectedKey={settings.backend}
          onSelectionChange={(k) =>
            settings.set("backend", k as typeof settings.backend)
          }
          className="w-32"
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="auto">auto</ListBox.Item>
              <ListBox.Item id="webgl">webgl</ListBox.Item>
              <ListBox.Item id="canvas">canvas</ListBox.Item>
              <ListBox.Item id="svg">svg</ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </Row>
      <Row label="Pick links (WebGL)">
        <Switch
          aria-label="Pick links"
          isSelected={settings.pickLinks}
          onChange={(on) => settings.set("pickLinks", on)}
        >
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch>
      </Row>
      {cur?.isStates && cur.modules && (
        <Row label="State view">
          <Select
            aria-label="State view"
            selectedKey={settings.stateView}
            onSelectionChange={(k) =>
              settings.set("stateView", k as typeof settings.stateView)
            }
            className="w-32"
          >
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="physical">physical</ListBox.Item>
                <ListBox.Item id="state">state</ListBox.Item>
                <ListBox.Item id="both">both</ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </Row>
      )}
    </div>
  );
});
