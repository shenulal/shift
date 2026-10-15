import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath, URL } from 'node:url';

// Modes:
//  - development / production: talks to the API at /api (proxied to :4000 in dev)
//  - hosted: the demo inlined into one HTML file for claude.ai artifact hosting (no print/downloads there)
//  - demo: fully in-browser data (seeded, persisted to localStorage), hash routing, relative base — used for the hosted review build
export default defineConfig(({ mode }) => ({
  base: mode === 'demo' || mode === 'hosted' ? './' : '/',
  plugins: mode === 'hosted' ? [react(), viteSingleFile()] : [react()],
  resolve: {
    alias: {
      '@shift/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: { __DEMO__: JSON.stringify(mode === 'demo' || mode === 'hosted'), __HOSTED__: JSON.stringify(mode === 'hosted') },
  server: { port: 5173, proxy: { '/api': 'http://localhost:4000' } },
  build: { outDir: mode === 'hosted' ? 'dist-hosted' : mode === 'demo' ? 'dist-demo' : 'dist', chunkSizeWarningLimit: 5000 },
}));
