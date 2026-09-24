import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { searchForWorkspaceRoot } from "vite";
import { defineConfig } from "vitest/config";
import pkg from "./package.json";

export default defineConfig({
  base: "/navigator2/",
  plugins: [react(), tailwindcss()],
  // Spike: @mapequation/d3gl is linked from a local d3gl worktree outside
  // this project, so the dev server must be allowed to serve it.
  server: {
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        "/Users/daniel/dev/projects/icelab/code/web/d3gl/.claude/worktrees/navigator",
      ],
    },
  },
  optimizeDeps: { exclude: ["@mapequation/d3gl"] },
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(pkg.version),
  },
  test: {
    // Playwright specs live under e2e/**/*.spec.ts; vitest's default include
    // pattern also matches *.spec.ts, so exclude the whole directory to keep
    // the two runners from colliding.
    exclude: ["**/node_modules/**", "**/.git/**", "e2e/**"],
  },
});
