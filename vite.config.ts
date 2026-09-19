import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * `base` doit correspondre au chemin de publication.
 * - dev / hébergement à la racine : "/"
 * - GitHub Pages (project site)   : "/<nom-du-repo>/", injecté par la CI.
 */
const base = process.env['BASE_PATH'] ?? '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        /*
         * Le contenu change à chaque session, les bibliothèques quasiment
         * jamais. Les séparer garde le gros morceau en cache entre deux
         * publications de cartes.
         */
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router'],
          markdown: ['marked', 'dompurify', 'highlight.js'],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
