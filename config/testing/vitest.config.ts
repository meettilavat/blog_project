import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Vitest config entrypoint consumed by the test runner CLI.
const rootDir = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["tests/vitest.setup.ts"]
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, ".")
    }
  }
});
