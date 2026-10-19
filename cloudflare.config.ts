import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "grove",
    compatibilityDate: "2026-10-01",
    // LAB-DOMAIN: domains: ["grove.<lab domain>"] once it's picked
    workersDev: false,
    previewUrls: false,
    observability: { enabled: true, issues: { enabled: true } },
  },
});
