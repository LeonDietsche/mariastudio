import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: '../static',      // ✅ Still works
  base: '/mariastudio/',       // ✅ Correct GitHub Pages base
  build: {
    outDir: '../dist',         // ✅ Clean build folder outside of src
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
