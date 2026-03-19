import react from '@vitejs/plugin-react'
import { defineConfig, type PluginOption } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react() as PluginOption[]],
  root: 'src/webview',
  build: {
    outDir: '../../dist/webview',
    emptyOutDir: true,
    target: 'esnext',
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'index.css'
          }

          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
})
