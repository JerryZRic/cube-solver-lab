import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  optimizeDeps: { include: ['cubejs'] },
  build: { commonjsOptions: { include: [/node_modules/, /vendor\/cubejs/] } },
});
