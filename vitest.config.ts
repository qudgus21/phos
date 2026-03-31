import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
  test: {
    environment: "node",
    globals: true,
    setupFiles: [],
    env,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
};
});
