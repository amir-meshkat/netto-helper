import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative asset paths, so the built site works from any folder (GitHub Pages, Netlify, a USB stick).
  base: "./",
  appType: "mpa",
  build: {
    rolldownOptions: {
      // One HTML file per tool page.
      input: {
        main: "index.html",
        household: "household/index.html",
        sideIncome: "side-income/index.html",
      },
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
