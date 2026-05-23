import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
  },
  build: {
    // Her build'de eski asset'leri temizle (Phase 1 hijyen düzeltmesi).
    // Vite default'u zaten true ama explicit yazıyoruz; dist/ artığı asset birikmesin.
    emptyOutDir: true,
    // .htaccess dosyasını dist'e kopyala
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // Dosya yollarında forward slash kullan
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    }
  },
  publicDir: 'public',
})
