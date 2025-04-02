// vite.config.js
export default {
  root: 'src/',
  publicDir: '../static',
  base: '/mariastudio/',
  build: {
    outDir: "dist"  // ✅ Fixed missing comma
  },
  server: {
    host: '0.0.0.0',
    port: 5173, // Ensure this port is not blocked by your firewall
  }
};