// vite.config.js
import { defineConfig } from 'vite'

// BUILD_TARGET=subpath  -> base '/mariastudio/'
// anything else (or unset) -> base '/'
const isSubpath = process.env.BUILD_TARGET === 'subpath'

export default defineConfig({
  root: 'src',
  publicDir: '../static',
  base: isSubpath ? '/mariastudio/' : '/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: { host: '0.0.0.0', port: 5173 },
})
