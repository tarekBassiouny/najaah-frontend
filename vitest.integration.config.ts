import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup/unit.tsx", "./tests/setup/integration.ts"],
    include: ["tests/integration/**/*.{test,spec}.{ts,tsx}"],
    env: {
      BACKEND_API_URL: "http://xyz-lms.test",
    },
    testTimeout: 10000,
    coverage: {
      reporter: ["text", "lcov"],
      enabled: false,
    },
  },
  esbuild: {
    loader: "tsx",
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      tests: path.resolve(__dirname, "tests"),
    },
  },
});
