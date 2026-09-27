import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { searchForWorkspaceRoot } from "vite";
import { defineConfig } from "vitest/config";
import pkg from "./package.json";

export default defineConfig({
  base: "/navigator2/",
  plugins: [react(), tailwindcss()],
  // @mapequation/d3gl is linked from a local d3gl worktree outside this
  // project, so the dev server must be allowed to serve it, and it must not be
  // pre-bundled (its dist is rebuilt while the dev server runs).
  server: {
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        "/Users/daniel/dev/projects/icelab/code/web/d3gl/.claude/worktrees/large-force",
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
