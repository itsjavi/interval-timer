import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  base: '/interval-timer/',
  // build: {
  //   sourcemap: true,
  //   rollupOptions: {
  //     output: {
  //       manualChunks: (moduleId /*, _meta*/) => {
  //         if (moduleId.includes('react')) {
  //           return 'react'
  //         }
  //         if (moduleId.includes('node_modules')) {
  //           return 'vendor'
  //         }
  //         return null
  //       },
  //     },
  //   },
  // },
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
