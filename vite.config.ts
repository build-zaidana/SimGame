/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Worker MicroPython (ADR 026) memakai top-level await: perlu worker berformat modul ES.
  worker: { format: 'es' },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt': versi baru menunggu persetujuan pemain (tidak reload paksa di tengah shift).
      registerType: 'prompt',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'ShiftIT — Simulasi Kerja IT',
        short_name: 'ShiftIT',
        description: 'Game simulasi kerja analis keamanan (SOC) untuk pelajar Indonesia.',
        lang: 'id',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#161a24',
        theme_color: '#161a24',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        // Shell, font, ikon, dan chunk mode (konten SOC ada di dalamnya) di-precache: bisa main offline.
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,webmanifest,wasm}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    // Satu-satunya chunk besar adalah Phaser (kantor top-down, ADR 024): dimuat lazy, tidak di bundle
    // awal, dan dibatasi .size-limit.json. Batas peringatan dinaikkan agar build tidak berisik.
    chunkSizeWarningLimit: 1500,
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
});
