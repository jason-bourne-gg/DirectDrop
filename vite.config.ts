import { defineConfig } from "vite";

// Static single-page app — nothing to configure beyond a modern build target.
// Vercel serves the emitted dist/ as-is (build `npm run build`, output `dist`).
export default defineConfig({
  build: { target: "es2020" },
});
