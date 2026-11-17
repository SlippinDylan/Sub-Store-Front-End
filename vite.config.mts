import vue from "@vitejs/plugin-vue";
import * as path from "path";
import fs from "fs";
import { ConfigEnv, defineConfig, loadEnv } from "vite";
import ui from "@nuxt/ui/vite";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";

const version = JSON.parse(
  fs.readFileSync(path.join(__dirname, "package.json"), "utf-8"),
).version.trim();

const alias: Record<string, string> = {
  "@": path.resolve(__dirname, "src"),
  vue: "vue/dist/vue.esm-bundler.js",
};

const htmlPlugin = () => {
  return {
    name: "html-transform",
    transformIndexHtml(html: string) {
      return html.replace(/__SUB_STORE_FRONT_END_VERSION__/g, version);
    },
  };
};

const viteConfig = defineConfig((mode: ConfigEnv) => {
  const env = loadEnv(mode.mode, process.cwd());

  return {
    plugins: [
      htmlPlugin(),
      vue(),
      ui({
        colorMode: false,
        autoImport: false,
        components: { dirs: [], dts: false },
        icon: {
          clientBundle: {
            scan: true,
            icons: [
              "archive",
              "arrow-left",
              "ban",
              "braces",
              "calendar-days",
              "check",
              "chevron-down",
              "chevron-left",
              "chevron-right",
              "chevron-up",
              "circle-alert",
              "circle-check",
              "circle-help",
              "circle-x",
              "clipboard-paste",
              "clock",
              "cloud",
              "cloud-download",
              "cloud-upload",
              "code",
              "contact",
              "copy",
              "database",
              "download",
              "ellipsis",
              "eraser",
              "external-link",
              "eye",
              "file",
              "file-code",
              "file-input",
              "file-output",
              "folder",
              "gauge",
              "github",
              "grip-vertical",
              "image",
              "info",
              "inbox",
              "key-round",
              "languages",
              "layers",
              "link",
              "list",
              "list-checks",
              "loader-circle",
              "lock-keyhole",
              "maximize",
              "menu",
              "minimize",
              "monitor",
              "network",
              "panel-left-close",
              "panel-left-open",
              "pencil",
              "plus",
              "refresh-cw",
              "redo-2",
              "scan-text",
              "save",
              "scroll-text",
              "search",
              "send",
              "server",
              "settings",
              "share-2",
              "sliders-horizontal",
              "square-pen",
              "text-cursor",
              "timer",
              "toggle-left",
              "toggle-right",
              "trash-2",
              "triangle-alert",
              "type",
              "undo-2",
              "upload",
              "user",
              "waypoints",
              "x",
            ].map((name) => `lucide:${name}`),
          },
        },
      }),
      viteCompression({
        // verbose: true,
        // disable: false,
        threshold: 10240,
        // algorithm: 'gzip',
        // ext: '.gz'
      }),
      VitePWA({
        srcDir: "src",
        outDir: "dist",
        strategies: "generateSW",
        registerType: "prompt",
        // minify: true,
        // includeAssets: ['favicon.svg'],
        manifest: {
          name: "Sub-Store",
          short_name: "Sub-Store",
          description: "A sub-converter running in a Progressive Web App",
          id: "/",
          start_url: "/",
          scope: "/",
          lang: "en",
          display: "standalone",
          icons: [
            {
              src: "144x144.png",
              sizes: "144x144",
              type: "image/png",
            },
            {
              src: "168x168.png",
              sizes: "168x168",
              type: "image/png",
            },
            {
              src: "192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "256x256.png",
              sizes: "256x256",
              type: "image/png",
            },
            {
              src: "512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,json}"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/(^|\/.+)\/(api|download|share)\/.+/],
          runtimeCaching: [
            {
              urlPattern: ({ url, request }) =>
                request.destination === "script" &&
                url.origin === self.location.origin,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "js-cache",
              },
            },
            {
              urlPattern: ({ request }) =>
                request.destination === "style" ||
                request.destination === "image" ||
                request.destination === "font",
              handler: "CacheFirst",
              options: {
                cacheName: "asset-cache",
              },
            },
          ],
        },
        selfDestroying: false,
      }),
    ],
    root: process.cwd(),
    resolve: { alias },
    optimizeDeps: {
      include: ["@codemirror/lang-yaml"],
    },
    base: mode.command === "serve" ? "./" : env.VITE_PUBLIC_PATH,
    hmr: true,
    server: {
      port: Number(env.VITE_PORT),
      open: env.VITE_OPEN === "true",
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      assetsInlineLimit: 2048,
      chunkSizeWarningLimit: 2048,
      target: "es2015",
      minify: "terser",
      rollupOptions: {
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "chunks/[name]-[hash].js",
          assetFileNames: (assetInfo) => {
            const ext = assetInfo.name?.split(".").pop()?.toLowerCase() ?? "";
            if (/^(png|jpe?g|svg|webp|avif|gif|ico)$/.test(ext))
              return "images/[name].[ext]";
            if (/^(woff2?|ttf|eot|otf)$/.test(ext)) return "fonts/[name].[ext]";
            if (ext === "css") return "css/[name].[ext]";
            return "[name].[ext]";
          },
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (
                id.includes("/codemirror/") ||
                id.includes("@codemirror/") ||
                id.includes("@lezer/") ||
                id.includes("@replit/codemirror") ||
                id.includes("js-beautify")
              )
                return "editor";
              if (id.includes("vue-i18n") || id.includes("@intlify/"))
                return "i18n";
              if (
                id.includes("/vue/") ||
                id.includes("/vue-router/") ||
                id.includes("/pinia/") ||
                id.includes("@vue/") ||
                id.includes("@vueuse/")
              )
                return "vue-vendor";
            }
          },
        },
      },
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: (source, filename) =>
            filename.endsWith("/mixins.scss")
              ? source
              : `@use "@/assets/styles/mixins.scss" as *;${source}`,
          silenceDeprecations: ["import", "legacy-js-api"],
        },
      },
    },
    define: {
      __VUE_I18N_FULL_INSTALL__: true,
      __VUE_I18N_LEGACY_API__: false,
      __INTLIFY_PROD_DEVTOOLS__: false,
      "import.meta.env.PACKAGE_VERSION": JSON.stringify(version),
    },
  };
});

export default viteConfig;
