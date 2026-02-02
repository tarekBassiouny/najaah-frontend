import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup/unit.tsx"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "src/**/__tests__/**/*.{ts,tsx}",
      "tests/**/*.{test,spec}.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      enabled: false,
      reportsDirectory: "./coverage/unit",
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
        statements: 4,
        branches: 35,
        functions: 35,
        lines: 4,
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
