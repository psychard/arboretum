import { defineConfig } from 'vite';

// The site is served from the root of arboretum.psychard.com, so the default
// base ('/') is right. public/ (icons, manifest, fonts) is copied as is.
export default defineConfig({
  build: {
    target: 'es2020',
    // The game chunk is mostly three.js r128 (about 600 kB minified), the same
    // weight the vendored copy was; there is nothing to split off yet.
    chunkSizeWarningLimit: 800,
  },
  server: { port: 5173 },
});
