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
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      enabled: false,
      reportsDirectory: "./coverage/integration",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/__tests__/**",
        "src/**/tests/**",
        "src/**/types/**",
        "src/**/app/**/layout.tsx",
        "src/**/app/**/loading.tsx",
        "src/**/app/**/error.tsx",
        "src/**/app/**/not-found.tsx",
      ],
      thresholds: {
        statements: 5,
        branches: 35,
        functions: 35,
        lines: 5,
      },
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
