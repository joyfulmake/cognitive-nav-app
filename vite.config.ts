import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'esnext',
  },
  // Prevent Vite from pre-bundling WASM/ONNX packages — they manage their own loading
  optimizeDeps: {
    exclude: ['kokoro-js', '@huggingface/transformers'],
  },
  resolve: {
    alias: {
      // Use the browser WASM build of kokoro-js (not the Node.js build)
      'kokoro-js': new URL('./node_modules/kokoro-js/dist/kokoro.web.js', import.meta.url).pathname,
    },
  },
  server: {
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
})
