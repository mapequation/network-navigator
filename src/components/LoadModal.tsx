import { Alert, Button, Chip, Modal, Switch } from "@heroui/react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { fileKind } from "../lib/file-kinds";
import { ftreeToNetwork } from "../lib/ftree-graph";
import { loadInfomapOnline } from "../lib/infomap-online";
import { loadFiles, type NamedText } from "../lib/load-files";
import type { LoadedNetwork } from "../lib/types";
import { useStores } from "../stores";
import { ConsoleButton, InfomapProgressBar } from "./InfomapConsole";

interface StagedFile extends NamedText {
  id: string;
}

export const LoadModal = observer(function LoadModal() {
  const { network: store, ui } = useStores();
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [directed, setDirected] = useState(false);
  const [twoLevel, setTwoLevel] = useState(false);
  const [noInfomap, setNoInfomap] = useState(false);
  const [onlineAvailable, setOnlineAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  /** The last Load ran Infomap (network + partition); keeps its output visible after a failure. */
  const [ranInfomap, setRanInfomap] = useState(false);

  useEffect(() => {
    if (ui.loadOpen)
      void loadInfomapOnline()
        .then((item) => setOnlineAvailable(item !== null))
        .catch(() => setOnlineAvailable(false));
  }, [ui.loadOpen]);

  const onDrop = useCallback(async (accepted: File[]) => {
    const named = await Promise.all(
      accepted.map(async (f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        text: await f.text(),
      })),
    );
    setFiles((prev) => [...prev, ...named]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

  const finish = (net: LoadedNetwork): void => {
    store.setNetwork(net);
    ui.setLoadOpen(false);
    ui.setLoadError(null);
    setFiles([]);
    setRanInfomap(false);
    setDirected(false);
    setTwoLevel(false);
    setNoInfomap(false);
  };
  const fail = (err: unknown): void =>
    ui.setLoadError(err instanceof Error ? err.message : String(err));

  const fetchOk = async (url: string): Promise<Response> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    return res;
  };

  const loadExample = async (): Promise<void> => {
    setBusy(true);
    try {
      const base = import.meta.env.BASE_URL;
      const [ftree, names] = await Promise.all([
        fetchOk(`${base}citation_data.ftree`).then((r) => r.text()),
        fetchOk(`${base}citation_module_names.json`).then(
          (r) => r.json() as Promise<Record<string, string>>,
        ),
      ]);
      const net = ftreeToNetwork(ftree, "citation_data.ftree");
      net.moduleNames = new Map(Object.entries(names));
      finish(net);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const loadOnline = async (): Promise<void> => {
    setBusy(true);
    try {
      const item = await loadInfomapOnline();
      if (!item) throw new Error("No network stored by Infomap Online");
      finish(ftreeToNetwork(item.text, item.filename));
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const loadDropped = async (): Promise<void> => {
    setBusy(true);
    setRanInfomap(false);
    let error: string | null = null;
    try {
      const net = await loadFiles(
        files,
        { directed, twoLevel, noInfomap },
        {
          onInfomapStart: (command) => {
            setRanInfomap(true);
            ui.startInfomap(command);
          },
          onLog: ui.onInfomapLog,
        },
      );
      finish(net);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      fail(err);
    } finally {
      ui.finishInfomap(error);
      setBusy(false);
    }
  };

  const hasPartition = files.some((f) =>
    ["tree", "clu"].includes(fileKind(f.name)),
  );
  const hasNetwork = Boolean(store.current);
  const canDismiss = hasNetwork && !ui.infomapRunning && !busy;

  return (
    <Modal.Backdrop
      isOpen={ui.loadOpen}
      isDismissable={canDismiss}
      isKeyboardDismissDisabled={!canDismiss}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !canDismiss) return; // nothing loaded yet or run in flight — modal stays
        ui.setLoadOpen(nextOpen);
      }}
    >
      <Modal.Container size="lg">
        <Modal.Dialog>
          {canDismiss && <Modal.CloseTrigger />}
          <Modal.Header>
            <Modal.Heading>Load network</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-4">
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center text-sm transition-colors ${
                isDragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
              }`}
            >
              <input {...getInputProps()} />
              {files.length === 0 ? (
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-neutral-700">
                    Click or drop files here
                  </p>
                  <p className="text-xs text-neutral-500">
                    An .ftree, or a network (.net, edge list, states) with an
                    optional .tree/.clu partition
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-1 text-left">
                  {files.map((f) => (
                    <li key={f.id} className="flex items-center gap-2">
                      <Chip size="sm">{fileKind(f.name)}</Chip>
                      <span className="min-w-0 flex-1 truncate">{f.name}</span>
                      {/* Keep the remove click from reaching the dropzone (which opens the picker). */}
                      {/* biome-ignore lint/a11y/noStaticElementInteractions: only stops propagation */}
                      {/* biome-ignore lint/a11y/useKeyWithClickEvents: the Button handles keys */}
                      <span onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Remove ${f.name}`}
                          onPress={() =>
                            setFiles((prev) =>
                              prev.filter((p) => p.id !== f.id),
                            )
                          }
                        >
                          ✕
                        </Button>
                      </span>
                    </li>
                  ))}
                  <li className="pt-1 text-center text-xs text-neutral-400">
                    Click or drop to add more
                  </li>
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <Switch isSelected={directed} onChange={setDirected}>
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  Force directed links
                </Switch.Content>
              </Switch>
              {hasPartition && (
                <>
                  <p className="text-neutral-500 text-xs">
                    With a partition file, Infomap runs to compute flow and the
                    module hierarchy from it.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Switch isSelected={noInfomap} onChange={setNoInfomap}>
                      <Switch.Content>
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        No Infomap (keep partition as is)
                      </Switch.Content>
                    </Switch>
                    <Switch
                      isSelected={twoLevel}
                      onChange={setTwoLevel}
                      isDisabled={noInfomap}
                    >
                      <Switch.Content>
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        Two-level
                      </Switch.Content>
                    </Switch>
                  </div>
                </>
              )}
            </div>

            {(ui.infomapRunning || ranInfomap) && (
              <div className="flex flex-col gap-1">
                {ui.infomapRunning && <InfomapProgressBar />}
                <div className="flex items-end gap-2">
                  <pre className="max-h-24 min-w-0 flex-1 overflow-y-auto text-xs text-neutral-500">
                    {ui.infomapOutput.slice(-8).join("\n")}
                  </pre>
                  <ConsoleButton />
                </div>
              </div>
            )}
            {ui.loadError && (
              // HeroUI's Alert doesn't set an ARIA role itself (verified against
              // its source: AlertRoot spreads `rest` onto a plain div with no
              // default role) — without this, assistive tech gets no
              // notification when a load error appears.
              <Alert status="danger" role="alert">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{ui.loadError}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              isPending={busy}
              isDisabled={ui.infomapRunning}
              onPress={loadExample}
            >
              Load example
            </Button>
            <Button
              variant="secondary"
              isPending={busy}
              isDisabled={!onlineAvailable || ui.infomapRunning}
              onPress={loadOnline}
            >
              Open from Infomap Online
            </Button>
            <Button
              isDisabled={files.length === 0 || busy || ui.infomapRunning}
              onPress={loadDropped}
            >
              Load
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
});
