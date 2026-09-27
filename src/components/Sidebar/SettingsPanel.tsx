import { ListBox, NumberField, Select, Slider } from "@heroui/react";
import { observer } from "mobx-react-lite";
import { useStores } from "../../stores";
import type { LayoutBackend, LodMode } from "../../stores/settings-store";
import { Group, Row, Segmented, Toggle } from "./controls";

function SliderRow({
  label,
  value,
  format = String,
  min,
  max,
  step,
  onChange,
  isDisabled,
}: {
  label: string;
  value: number;
  format?: (v: number) => string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  isDisabled?: boolean;
}) {
  return (
    <Slider
      aria-label={label}
      isDisabled={isDisabled}
      minValue={min}
      maxValue={max}
      step={step}
      value={value}
      onChange={(v) => onChange(v as number)}
      className="flex flex-col gap-1"
    >
      <div className="flex justify-between text-xs">
        <span className="text-neutral-700">{label}</span>
        <span className="tabular-nums text-neutral-400">{format(value)}</span>
      </div>
      <Slider.Track>
        <Slider.Fill />
        <Slider.Thumb />
      </Slider.Track>
    </Slider>
  );
}

/** Node, link, label and layout appearance. */
export const DisplayPanel = observer(function DisplayPanel() {
  const { network: store, settings } = useStores();
  const cur = store.current;
  const hasFlow = !!cur?.graph.nodeFlow;
  const halfArrow = !!cur?.directed && settings.linkStyle === "half-arrow";

  return (
    <>
      {cur?.isStates && cur.modules && (
        <Row label="State view">
          <Segmented
            label="State view"
            value={settings.stateView}
            options={["physical", "state", "both"] as const}
            onChange={(v) => settings.set("stateView", v)}
          />
        </Row>
      )}
      <Group title="Nodes">
        <Row label="Size by">
          <Segmented
            label="Node size by"
            value={hasFlow ? settings.nodeSizeBy : "degree"}
            options={["flow", "degree"] as const}
            isDisabled={!hasFlow}
            onChange={(v) => settings.set("nodeSizeBy", v)}
          />
        </Row>
        <Row label="Radius scale">
          <Segmented
            label="Node radius scale"
            value={settings.nodeScale}
            options={
              [
                ["root", "√ root"],
                ["linear", "linear"],
              ] as const
            }
            onChange={(v) => settings.set("nodeScale", v)}
          />
        </Row>
      </Group>

      <Group title="Links">
        <Row label="Style">
          <Segmented
            label="Link style"
            value={cur?.directed ? settings.linkStyle : "line"}
            options={
              [
                ["half-arrow", "half-arrow"],
                ["line", "line"],
              ] as const
            }
            isDisabled={!cur?.directed}
            onChange={(v) => settings.set("linkStyle", v)}
          />
        </Row>
        <Row
          label="Bend links"
          hint={
            halfArrow
              ? "Free for half-arrows"
              : "Bent lines draw ~12× more vertices than straight ones"
          }
        >
          <Toggle
            label="Bend links"
            isSelected={settings.bendFor(halfArrow)}
            onChange={(on) => settings.set("bendLinks", on)}
          />
        </Row>
        <Row label="Width scale">
          <Segmented
            label="Link width scale"
            value={settings.linkScale}
            options={
              [
                ["root", "√ root"],
                ["linear", "linear"],
              ] as const
            }
            onChange={(v) => settings.set("linkScale", v)}
          />
        </Row>
      </Group>

      <Group title="Labels & layout">
        <Row label="Labels">
          <div className="flex items-center gap-2">
            <NumberField
              aria-label="Max labels"
              value={settings.maxLabels}
              minValue={0}
              maxValue={500}
              step={10}
              isDisabled={!settings.labelsVisible}
              onChange={(v) => settings.set("maxLabels", v)}
              className="w-28"
            >
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input className="min-w-0 flex-1 px-0 text-center text-xs tabular-nums" />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>
            <Toggle
              label="Show labels"
              isSelected={settings.labelsVisible}
              onChange={(on) => settings.set("labelsVisible", on)}
            />
          </div>
        </Row>
        <Row label="Force simulation">
          <Toggle
            label="Run simulation"
            isSelected={settings.simulation}
            onChange={(on) => settings.set("simulation", on)}
          />
        </Row>
      </Group>
    </>
  );
});

/** d3gl level-of-detail aggregation. */
export const LodPanel = observer(function LodPanel() {
  const { settings } = useStores();
  const off = settings.lodMode === "off";
  return (
    <>
      <Row
        label="Aggregate by"
        hint="modules: the Infomap module tree (spatial without one) · spatial: nearby nodes"
      >
        <Segmented
          label="LOD mode"
          value={settings.lodMode}
          options={["modules", "spatial", "off"] as const satisfies LodMode[]}
          onChange={(v) => settings.set("lodMode", v)}
        />
      </Row>
      <SliderRow
        label="Expand at"
        value={settings.expandPx ?? 48}
        format={(v) => (settings.expandPx === null ? "auto" : `${v} px`)}
        min={16}
        max={200}
        step={4}
        isDisabled={off}
        onChange={(v) => settings.set("expandPx", v)}
      />
      <SliderRow
        label="Max aggregate radius"
        value={settings.maxAggregateRadius}
        format={(v) => `${v} px`}
        min={8}
        max={64}
        step={2}
        isDisabled={off}
        onChange={(v) => settings.set("maxAggregateRadius", v)}
      />
      <SliderRow
        label="Cross-fade"
        value={settings.crossFade}
        format={(v) => v.toFixed(1)}
        min={0}
        max={1}
        step={0.1}
        isDisabled={off}
        onChange={(v) => settings.set("crossFade", v)}
      />
      <Row label="Declutter">
        <Toggle
          label="Declutter"
          isDisabled={off}
          isSelected={settings.declutter}
          onChange={(on) => settings.set("declutter", on)}
        />
      </Row>
      <Row label="Super-edges">
        <Toggle
          label="Super-edges"
          isDisabled={off}
          isSelected={settings.superEdges}
          onChange={(on) => settings.set("superEdges", on)}
        />
      </Row>
      <Row
        label="Cross-level links"
        hint="Keep links between an expanded module and collapsed ones"
      >
        <Toggle
          label="Cross-level links"
          // Kept or dropped by the super-edge pass, which Super-edges turns off.
          isDisabled={off || !settings.superEdges}
          isSelected={settings.crossLevelEdges}
          onChange={(on) => settings.set("crossLevelEdges", on)}
        />
      </Row>
    </>
  );
});

/** Engine-level rendering options. */
export const RenderingPanel = observer(function RenderingPanel() {
  const { settings } = useStores();
  return (
    <>
      <Row
        label="Glyph size"
        hint="screen: constant pixels at any zoom · world: scales with zoom"
      >
        <Segmented
          label="Size mode"
          value={settings.sizeMode}
          options={["screen", "world"] as const}
          onChange={(v) => settings.set("sizeMode", v)}
        />
      </Row>
      <Row
        label="Render backend"
        hint="Changing the backend recreates the view"
      >
        <Select
          aria-label="Render backend"
          selectedKey={settings.backend}
          onSelectionChange={(k) =>
            settings.set("backend", k as typeof settings.backend)
          }
          className="w-28"
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="webgl">webgl</ListBox.Item>
              <ListBox.Item id="auto">auto</ListBox.Item>
              <ListBox.Item id="canvas">canvas</ListBox.Item>
              <ListBox.Item id="svg">svg</ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </Row>
      <Row
        label="Layout backend"
        hint="auto: the GPU where supported, else a worker · switching restarts a running layout"
      >
        <Segmented
          label="Layout backend"
          value={settings.layoutBackend}
          options={["auto", "gpu", "worker"] as const satisfies LayoutBackend[]}
          onChange={(v) => settings.set("layoutBackend", v)}
        />
      </Row>
      <Row label="Pick links" hint="Hover and click links (WebGL)">
        <Toggle
          label="Pick links"
          isSelected={settings.pickLinks}
          onChange={(on) => settings.set("pickLinks", on)}
        />
      </Row>
    </>
  );
});
