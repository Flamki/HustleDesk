import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import sitemap from 'vite-plugin-sitemap';

const SEO_ROUTES = [
  '/',
  '/features',
  '/pricing',
  '/freelancer-crm',
  '/proposal-generator',
  '/time-tracking',
  '/client-portal',
  '/portfolio-builder',
  '/link-in-bio',
];

const APP_AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/auth/callback',
  '/auth/check-email',
  '/unsubscribe',
  '/app/dashboard',
];

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
      plugins: [
        react(),
        sitemap({
          hostname: 'https://getsolodesk.com',
          dynamicRoutes: SEO_ROUTES.filter((route) => route !== '/'),
          generateRobotsTxt: false,
        }),
      ],
      ssgOptions: {
        includedRoutes: () => [...SEO_ROUTES, ...APP_AUTH_ROUTES],
      },
      build: {
        target: 'es2020',
        sourcemap: false,
        cssCodeSplit: true,
        minify: 'esbuild',
        // Asset optimization
        assetsInlineLimit: 4096, // 4kb - inline small assets
        chunkSizeWarningLimit: 1000, // Warn for chunks over 1MB
        // Chunk splitting strategy for better caching (client build only)
        rollupOptions: {
          output: {
            manualChunks(id) {
              // Vendor chunk for large dependencies
              if (id.includes('node_modules/react/') || 
                  id.includes('node_modules/react-dom/') || 
                  id.includes('node_modules/react-router-dom/')) {
                return 'vendor';
              }
              // Supabase client
              if (id.includes('node_modules/@supabase/')) {
                return 'supabase';
              }
              // Icons
              if (id.includes('node_modules/lucide-react/') || 
                  id.includes('node_modules/react-icons/')) {
                return 'icons';
              }
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

