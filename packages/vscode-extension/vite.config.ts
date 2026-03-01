import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react()],
  root: 'src/webview',
  build: {
    outDir: '../../dist/webview',
    emptyOutDir: true,
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
