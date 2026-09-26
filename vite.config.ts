import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative asset paths, so the built site works from any folder (GitHub Pages, Netlify, a USB stick).
  base: "./",
  test: {
    include: ["src/**/*.test.ts"],
  },
});
