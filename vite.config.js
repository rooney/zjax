// vite.config.js
import { defineConfig } from "vite";

const isTesting = process.env.VITE_COVERAGE

export default defineConfig({
  build: {
    lib: {
      entry: "src/main.js", // Your main library entry file
      name: "zjax", // The global variable name (e.g., window.zjax)
      fileName: () => isTesting ? 'zjax.debug.js' : 'zjax.min.js', // Output file name
      formats: ["iife"], // Output format: IIFE
    },
    rollupOptions: {
      output: {
        // Remove the "name" property if you don't need a global variable
        // globals: { // If you have external dependencies, define their global names
        //   'some-external-library': 'SomeExternalLibrary'
        // },
      },
    },
    minify: !isTesting,
    sourcemap: isTesting && 'inline',
    emptyOutDir: !isTesting,
  },
  plugins: [
    {
      name: "test-404",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Check if the current path should be a 404
          if (req.url === "/test-404") {
            res.statusCode = 404;
            res.end("Not Found");
            return;
          }
          next();
        });
      },
    },
    {
      name: "test-401",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Check if the current path should be a 404
          if (req.url === "/test-401") {
            res.statusCode = 401;
            res.end("Unauthorized");
            return;
          }
          next();
        });
      },
    },
    {
      name: "test-500",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Check if the current path should be a 404
          if (req.url === "/test-500") {
            res.statusCode = 500;
            res.end("Internal Server Error");
            return;
          }
          next();
        });
      },
    },
  ],
});
