import { Alert, Button, Chip, Modal, ProgressBar, Switch } from "@heroui/react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { fileKind } from "../lib/file-kinds";
import { ftreeToNetwork } from "../lib/ftree-graph";
import { loadInfomapOnline } from "../lib/infomap-online";
import { loadFiles, type NamedText } from "../lib/load-files";
import type { LoadedNetwork } from "../lib/types";
import { useStores } from "../stores";

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
        text: await f.text(),
      })),
    );
    setFiles((prev) => [...prev, ...named]);
  }, []);
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
  });

  const finish = (net: LoadedNetwork): void => {
    store.setNetwork(net);
    ui.setLoadOpen(false);
    ui.setLoadError(null);
    setFiles([]);
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
    try {
      ui.startInfomap();
      const net = await loadFiles(
        files,
        { directed, twoLevel, noInfomap },
        { onProgress: ui.onInfomapProgress, onLog: ui.onInfomapLog },
      );
      finish(net);
    } catch (err) {
      fail(err);
    } finally {
      ui.finishInfomap();
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
              className={`rounded-lg border-2 border-dashed p-6 text-center text-sm ${
                isDragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-neutral-300"
              }`}
            >
              <input {...getInputProps()} />
              {files.length === 0 ? (
                <p className="text-neutral-500">
                  Drop files here — .ftree, or a network (.net, edge list,
                  states) optionally with a .tree/.clu partition
                </p>
              ) : (
                <ul className="flex flex-col gap-1 text-left">
                  {files.map((f) => (
                    <li key={f.id} className="flex items-center gap-2">
                      <Chip size="sm">{fileKind(f.name)}</Chip>
                      <span className="min-w-0 flex-1 truncate">{f.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onPress={() =>
                          setFiles((prev) => prev.filter((p) => p.id !== f.id))
                        }
                      >
                        ✕
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <Switch isSelected={directed} onChange={setDirected}>
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  Directed
                </Switch.Content>
              </Switch>
              <Switch isSelected={twoLevel} onChange={setTwoLevel}>
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  Two-level
                </Switch.Content>
              </Switch>
              <Switch
                isSelected={noInfomap}
                onChange={setNoInfomap}
                isDisabled={!hasPartition}
              >
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  No Infomap (flow from partition only)
                </Switch.Content>
              </Switch>
            </div>
            <p className="text-neutral-500 text-xs">
              Directed forces link direction; off lets the file format decide.
            </p>

            {ui.infomapRunning && (
              <div className="flex flex-col gap-1">
                <ProgressBar
                  value={ui.infomapProgress}
                  aria-label="Infomap progress"
                >
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
                <pre className="max-h-24 overflow-y-auto text-xs text-neutral-500">
                  {ui.infomapLog.slice(-8).join("\n")}
                </pre>
              </div>
            )}
            {ui.loadError && (
              <Alert status="danger">
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
            <Button variant="secondary" onPress={open}>
              Add files…
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
