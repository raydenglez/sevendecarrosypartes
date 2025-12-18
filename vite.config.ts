import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "CarNexo",
        short_name: "CarNexo",
        description: "Vehicle marketplace",
        theme_color: "#FF6A00",
        background_color: "#0A0A0B",
        display: "standalone",
        icons: [
          {
            src: "/icon-1024x1024.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-1024x1024.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icon-1024x1024.png",
            sizes: "1024x1024",
            type: "image/png",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MB
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "unsplash-images",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
