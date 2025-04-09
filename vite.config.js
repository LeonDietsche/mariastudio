// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: '../static', // This is okay as long as you know it's not in 'src'
  base: '/mariastudio/',  // This is perfect for GitHub Pages under a repo
  build: {
    outDir: 'dist', // Important! This tells Vite to build into src/dist
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});