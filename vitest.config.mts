import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**"],
  },
  resolve: {
    alias: {
      "server-only": path.resolve(import.meta.dirname, "test/stubs/server-only.ts"),
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
});
