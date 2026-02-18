import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],

  // ============================================
  // PATH ALIASES
  // ============================================
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // ============================================
  // VITEST CONFIGURATION
  // ============================================
  test: {
    globals: true,
    environment: 'jsdom',
    deps: {
      inline: ['pinia'],
    },
    exclude: ['node_modules', 'dist', '.git', '.cache', 'src/e2e/**'],
  },

  // ============================================
  // DEV SERVER CONFIGURATION
  // ============================================
  server: {
    port: 5173,
    strictPort: true, // Fail if port is already in use
    open: true, // Auto-open browser

    // ✅ Security headers for development
    headers: {
      // Prevent clickjacking (backup since frame-ancestors doesn't work in meta tags)
      'X-Frame-Options': 'DENY',

      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',

      // Enable XSS filter for older browsers
      'X-XSS-Protection': '1; mode=block',
    },

    // CORS configuration (if you need to call APIs from different origins in dev)
    // cors: true,
  },

  // ============================================
  // PREVIEW SERVER (for testing production builds locally)
  // ============================================
  preview: {
    port: 4173,
    strictPort: true,
    open: true,

    // Same security headers for preview
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },

  // ============================================
  // ESBUILD CONFIGURATION (for minification)
  // ============================================
  esbuild: {
    drop: ['console', 'debugger'], // Remove console.* and debugger in production
  },

  // ============================================
  // BUILD CONFIGURATION (Production)
  // ============================================
  build: {
    target: 'esnext', // Modern browsers only
    outDir: 'dist', // Output directory
    assetsDir: 'assets', // Assets subdirectory
    minify: 'esbuild', // Use esbuild (faster than terser, default in Vite)

    // Generate source maps in development mode only
    sourcemap: false,

    // ============================================
    // CODE SPLITTING & TREE SHAKING
    // ============================================
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // Core Vue dependencies
          'vendor-vue': ['vue', 'vue-router', 'pinia'],

          // Charts library (heavy dependency)
          'vendor-charts': ['echarts'],

          // Add more chunks as your app grows
          // 'vendor-utils': ['lodash', 'date-fns'],
        },

        // Naming pattern for chunks (includes hash for cache busting)
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },

    // Warn if chunk exceeds 500kb (default is 500kb)
    chunkSizeWarningLimit: 500,

    // ============================================
    // OPTIMIZATION
    // ============================================
    // Enable CSS code splitting
    cssCodeSplit: true,

    // Report compressed size (disable for faster builds)
    reportCompressedSize: true,

    // Inline assets smaller than 4kb as base64
    assetsInlineLimit: 4096,
  },

  // ============================================
  // ENVIRONMENT VARIABLES
  // ============================================
  // Prefix for exposed env variables (default is VITE_)
  envPrefix: 'VITE_',

  // ============================================
  // DEFINE GLOBAL CONSTANTS
  // ============================================
  define: {
    // Make app version available globally
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),

    // Build timestamp
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
