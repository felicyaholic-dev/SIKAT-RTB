import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**"],
    // bcryptjs (pure JS, no native bindings) at cost factor 12 can take
    // well over the 5s default under CPU contention (several tests hash
    // and compare multiple passwords) — bump it so that shows up as a
    // real failure, not a flaky one.
    testTimeout: 20000,
  },
  resolve: {
    alias: {
      "server-only": path.resolve(import.meta.dirname, "test/stubs/server-only.ts"),
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
});
