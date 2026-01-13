import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
export default defineConfig({
  site: "https://yoursite.com",
  adapter: cloudflare(),
  output:"static",
  i18n: {
    defaultLocale: "en",
    locales: ["en", "zh"],
    routing: {
      prefixDefaultLocale: true,
    },
  },
  integrations: [sitemap(), react()],
  vite: {
    plugins: [tailwindcss()],
  },
});