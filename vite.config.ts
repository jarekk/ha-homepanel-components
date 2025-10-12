import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/ha-homepanel-components.tsx'),
      name: 'Home Assistant Homepanel Components',
      fileName: 'ha-homepanel-components',
      formats: ['es'] // Single file format
    },
    rollupOptions: {
      // Inline React and ReactDOM instead of treating as external
      output: {
        inlineDynamicImports: true,
      }
    },
    minify: false, // Disable minification for easier debugging,
  }
})
