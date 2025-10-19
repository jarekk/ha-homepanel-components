import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'
import tailwindcss from '@tailwindcss/vite'

// Plugin to copy built file to local overrides directory
function copyToOverrides() {
  return {
    name: 'copy-to-overrides',
    writeBundle() {
      // Get destination directory from environment variable or use default
      const destDirEnv = process.env.DEST_DIR
      if (!destDirEnv) {
        console.log('\x1b[33m[copy]\x1b[0m No DEST_DIR specified, skipping copy')
        return
      }

      const src = resolve(__dirname, 'dist/ha-homepanel-components.js')
      const destDir = resolve(__dirname, destDirEnv)
      const dest = resolve(destDir, 'ha-homepanel-components.js')

      try {
        mkdirSync(destDir, { recursive: true })
        copyFileSync(src, dest)
        console.log(`\x1b[36m[copy]\x1b[0m Copied to ${destDirEnv}`)
      } catch (err) {
        console.error('\x1b[31m[copy]\x1b[0m Failed to copy:', err)
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyToOverrides()],
  server: {
    cors: {
      origin: '*', 
      credentials: true,
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  build: {
    watch: {
      exclude: ['dist/**', 'overrides/**'],
    },
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
