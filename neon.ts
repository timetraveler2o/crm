import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  auth: true,
  buckets: {
    assets: { access: "public_read" },
    uploads: { access: "private" },
  },
  preview: {
    buckets: {
      assets: { access: "public_read" },
      uploads: { access: "private" },
    },
    functions: {
      api: { name: "api", source: "./hello.ts" },
    },
  },
});
