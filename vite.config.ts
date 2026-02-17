import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const devPort = Number(env.VITE_PORT || 5173);
    return {
      server: {
        port: Number.isFinite(devPort) ? devPort : 5173,
        host: '0.0.0.0',
        // Local dev: proxy /api/* to our lightweight API runner so serverless routes work on Vite.
        proxy: {
          '/api': {
            target: 'http://localhost:8787',
            changeOrigin: true,
          },
        },
      },
      plugins: [react()],
      build: {
        target: 'es2020',
        sourcemap: false,
        cssCodeSplit: true,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (!id.includes('node_modules')) return;
              if (id.includes('react-router')) return 'vendor-router';
              if (id.includes('react-dom') || id.includes('react')) return 'vendor-react';
              if (id.includes('@supabase/')) return 'vendor-supabase';
              if (id.includes('lucide-react') || id.includes('react-icons')) return 'vendor-icons';
              if (id.includes('stripe')) return 'vendor-stripe';
              return 'vendor';
            },
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
