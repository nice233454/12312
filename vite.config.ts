import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react', '@xenova/transformers', 'onnxruntime-web'],
  },
  worker: {
    format: 'es',
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          transformers: ['@xenova/transformers'],
        },
      },
    },
  },
});
