import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "url";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const tsConfigFile =
    mode === "development" ? "tsconfig.dev.json" : "tsconfig.json";

  return {
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      tsconfigPaths({ projects: [tsConfigFile] }),
    ],
    server: {
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8000",
        },
        "/filepond": {
          target: "http://127.0.0.1:8000",
        },
        "/storage": {
          target: "http://127.0.0.1:8000",
        },
      },
    },
  };
});
