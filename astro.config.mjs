import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
export default defineConfig({
  site: "https://unitconver.com",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    imageService: 'compile'
  }),
  output: "server",
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
    resolve: {
      alias: import.meta.env.PROD && {
        'react-dom/server': 'react-dom/server.edge'
      }
    },
    server: {
      watch: {
        ignored: ['**/.wrangler/**']
      }
    }
  },
});