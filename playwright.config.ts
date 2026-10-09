import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:4173/network-navigator/",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "pnpm build && pnpm preview --port 4173",
    url: "http://localhost:4173/network-navigator/",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
