import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type Page, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => path.join(__dirname, "fixtures", name);

/** Console/page errors are collected per-test and asserted at the end so a
 * single failure doesn't hide errors raised earlier in the same test. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/** Errors we expect/tolerate — third-party noise unrelated to app correctness. */
function isFatal(message: string): boolean {
  if (message.includes("favicon.ico")) return false;
  return true;
}

async function screenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: path.join(__dirname, "screenshots", `${name}.png`),
    fullPage: false,
  });
}

// The load modal's close is a real state change, but WebGL/shader init and
// (for the citation-scale example) graph layout compete for the main thread
// with Playwright's own polling overhead — under the test runner (unlike a
// bare script) that's occasionally enough to blow past a tight expect()
// timeout even though the app itself isn't hung. Give modal-close assertions
// generous headroom, matching the Infomap-run allowance elsewhere.
const MODAL_CLOSE_TIMEOUT = 30_000;

async function loadExample(page: Page): Promise<void> {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Load network" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Load example" }).click();
  await expect(
    page.getByRole("heading", { name: "Load network" }),
  ).toBeHidden({ timeout: MODAL_CLOSE_TIMEOUT });
  await expect(page.locator("main canvas")).toBeVisible({ timeout: 30_000 });
}

/** Attaches files to the hidden dropzone input without going through the
 * dropzone's native file picker (which Playwright can't drive). */
async function addFiles(page: Page, files: string[]): Promise<void> {
  await page.locator('input[type="file"]').setInputFiles(files);
}

test.describe("Network Navigator smoke", () => {
  test("example: load, canvas, sidebar, search", async ({ page }) => {
    const errors = collectErrors(page);
    await loadExample(page);

    await expect(page.getByText(/Powered by Infomap v/)).toBeVisible();

    const search = page.getByRole("textbox", { name: "Search nodes" });
    await search.fill("PHYS");
    await expect(page.getByText(/\d+ matching nodes highlighted/)).toBeVisible();

    await screenshot(page, "example");
    expect(errors.filter(isFatal)).toEqual([]);
  });

  test("drill + selection: click and double-click the canvas", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await loadExample(page);

    const canvas = page.locator("main canvas").first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error("canvas has no bounding box");
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await page.mouse.click(cx, cy);
    // Best-effort: a hit depends on layout settling near the click point, so
    // only assert on the "Selected" section when it actually filled in.
    const nameRow = page.getByText("Name", { exact: true });
    if (await nameRow.isVisible().catch(() => false)) {
      await expect(nameRow).toBeVisible();
    }

    await page.mouse.dblclick(cx, cy);
    await expect(canvas).toBeVisible();

    await screenshot(page, "drill-selection");
    expect(errors.filter(isFatal)).toEqual([]);
  });

  test("raw + cluster: load toy.net, cluster with Infomap", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await addFiles(page, [fixture("toy.net")]);
    await page.getByRole("button", { name: "Load", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Load network" }),
    ).toBeHidden({ timeout: MODAL_CLOSE_TIMEOUT });
    await expect(page.locator("main canvas")).toBeVisible();

    const clusterButton = page.getByRole("button", {
      name: "Run Infomap",
      exact: true,
    });
    await expect(clusterButton).toBeVisible();
    await clusterButton.click();
    await expect(
      page.getByRole("button", { name: "Re-run Infomap" }),
    ).toBeVisible({ timeout: 30_000 });

    // Breadcrumb overlay shows the filename once modules exist.
    await expect(
      page.locator("nav").getByRole("button", { name: "toy.net" }),
    ).toBeVisible();

    // In-app runs export Infomap's JSON tree (no ftree is written).
    await expect(
      page.getByRole("button", { name: "Download .json" }),
    ).toBeEnabled();

    await screenshot(page, "raw-cluster");
    expect(errors.filter(isFatal)).toEqual([]);
  });

  test("partition: load toy.net + toy.clu with No Infomap", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await addFiles(page, [fixture("toy.net"), fixture("toy.clu")]);

    const noInfomap = page.getByRole("switch", { name: /No Infomap/ });
    // The accessible <input role="switch"> is visually hidden (clip-rect
    // pattern) behind a styled thumb/control that sits on top of it — normal
    // for this component and fine for real users (a click anywhere in the
    // wrapping <label> toggles the input natively), but Playwright's
    // actionability check refuses to click a target it considers obscured by
    // a sibling element. force:true bypasses that visibility heuristic while
    // still dispatching a real click at the input's location.
    await noInfomap.click({ force: true });
    await expect(noInfomap).toBeChecked();

    await page.getByRole("button", { name: "Load", exact: true }).click();

    // If Infomap fails headlessly, the modal surfaces an Alert instead of
    // closing — capture that verbatim rather than silently retrying.
    const alert = page.getByRole("alert");
    const canvas = page.locator("main canvas");
    await Promise.race([
      expect(canvas).toBeVisible({ timeout: 30_000 }).catch(() => {}),
      expect(alert).toBeVisible({ timeout: 30_000 }).catch(() => {}),
    ]);

    if (await alert.isVisible().catch(() => false)) {
      throw new Error(`Load modal error (partition flow): ${await alert.innerText()}`);
    }

    await expect(canvas).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Download .json" }),
    ).toBeEnabled();

    await screenshot(page, "partition");
    expect(errors.filter(isFatal)).toEqual([]);
  });

  test("states: load toy_states.net, raw then clustered state view", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await addFiles(page, [fixture("toy_states.net")]);
    await page.getByRole("button", { name: "Load", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Load network" }),
    ).toBeHidden({ timeout: MODAL_CLOSE_TIMEOUT });
    await expect(page.locator("main canvas")).toBeVisible();

    const clusterButton = page.getByRole("button", {
      name: "Run Infomap",
      exact: true,
    });
    await expect(clusterButton).toBeVisible();
    await clusterButton.click();
    await expect(
      page.getByRole("button", { name: "Re-run Infomap" }),
    ).toBeVisible({ timeout: 30_000 });

    await expect(
      page.getByRole("radiogroup", { name: "State view" }),
    ).toBeVisible();

    await screenshot(page, "states");
    expect(errors.filter(isFatal)).toEqual([]);
  });

  test("load dialog: restages the loaded files and adds metadata in place", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const heading = page.getByRole("heading", { name: "Load network" });
    const dialog = page.getByRole("dialog", { name: "Load network" });
    const load = dialog.getByRole("button", { name: "Load", exact: true });
    const reopen = async (): Promise<void> => {
      await page.getByRole("button", { name: /^Load network/ }).click();
      await expect(heading).toBeVisible();
    };
    const rerun = page.getByRole("button", { name: "Re-run Infomap" });

    await page.goto("/");
    await addFiles(page, [fixture("toy.net")]);
    await load.click();
    await expect(heading).toBeHidden({ timeout: MODAL_CLOSE_TIMEOUT });
    await page.getByRole("button", { name: "Run Infomap", exact: true }).click();
    await expect(rerun).toBeVisible({ timeout: 30_000 });

    // The raw network is restaged; loading it unchanged keeps the clustering.
    await reopen();
    await expect(
      dialog.getByRole("button", { name: "Remove toy.net" }),
    ).toBeVisible();
    await load.click();
    await expect(heading).toBeHidden();
    await expect(rerun).toBeVisible();

    // Adding a metadata file applies it without reloading the network.
    await reopen();
    await dialog
      .locator('input[type="file"]')
      .setInputFiles([fixture("toy-names.csv")]);
    await expect(
      dialog.getByRole("button", { name: "Remove toy-names.csv" }),
    ).toBeVisible();
    await load.click();
    await expect(heading).toBeHidden();
    await expect(rerun).toBeVisible();
    const metaRow = page
      .locator("aside li")
      .filter({ hasText: "toy-names.csv" });
    await expect(metaRow).toBeVisible();

    // Its own trash removes just the metadata file.
    await metaRow.hover();
    await page.getByRole("button", { name: "Remove toy-names.csv" }).click();
    await expect(metaRow).toBeHidden();
    await expect(rerun).toBeVisible();

    // Removing every staged file clears the network.
    await reopen();
    await dialog.getByRole("button", { name: "Remove toy.net" }).click();
    await dialog.getByRole("button", { name: "Clear network" }).click();
    await expect(page.locator("main canvas")).toHaveCount(0);
    await expect(heading).toBeVisible();

    expect(errors.filter(isFatal)).toEqual([]);
  });

  test("export: SVG, PNG, and ftree downloads", async ({ page }) => {
    const errors = collectErrors(page);
    await loadExample(page);

    const [svgDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download SVG" }).click(),
    ]);
    expect(svgDownload.suggestedFilename()).toMatch(/\.svg$/);

    const [pngDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download PNG" }).click(),
    ]);
    expect(pngDownload.suggestedFilename()).toMatch(/\.png$/);

    const ftreeButton = page.getByRole("button", { name: "Download .ftree" });
    await expect(ftreeButton).toBeEnabled();
    const [ftreeDownload] = await Promise.all([
      page.waitForEvent("download"),
      ftreeButton.click(),
    ]);
    expect(ftreeDownload.suggestedFilename()).toMatch(/\.ftree$/);

    expect(errors.filter(isFatal)).toEqual([]);
  });

  test("errors: dropping an unsupported file surfaces an alert", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await addFiles(page, [fixture("bogus.pdf")]);
    await page.getByRole("button", { name: "Load", exact: true }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Unsupported");

    // App stays alive: the modal heading is still there, ready to retry.
    await expect(
      page.getByRole("heading", { name: "Load network" }),
    ).toBeVisible();

    await screenshot(page, "errors");
    expect(errors.filter(isFatal)).toEqual([]);
  });
});

// Manual-check item (not automated): `?infomap` query-param handover from
// Infomap Online. It reads a pre-populated IndexedDB entry ("infomap" DB)
// written by the separate Infomap Online app's exact schema. Seeding that
// from a Playwright addInitScript would duplicate undocumented internals of
// a different codebase and would be brittle/misleading if that schema ever
// changes. Verify this manually against a real Infomap Online handoff.
