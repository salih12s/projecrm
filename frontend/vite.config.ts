import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    // Dev'de API tabanı `/api` (bkz. services/api.ts fallback'i). Proxy olmadan
    // bu istekler Vite dev sunucusuna gidip SPA fallback'i olarak index.html
    // döndürüyor; axios HTML alınca `response.data.sort` patlıyordu.
    // Proxy ile dev, backend ve frontend'in aynı origin'de olduğu production
    // davranışıyla eşleşir — .env.development'a URL yazmaya gerek kalmaz.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Socket.IO handshake'i de aynı origin üzerinden geçebilsin.
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    // Her build'de eski asset'leri temizle (Phase 1 hijyen düzeltmesi).
    // Vite default'u zaten true ama explicit yazıyoruz; dist/ artığı asset birikmesin.
    emptyOutDir: true,
    // Chunk uyarı eşiği — manualChunks sonrası iç çekirdek hâlâ büyük
    // olabileceği için 600 kB'a çıkarıldı (Part 3 / P3.F1).
    chunkSizeWarningLimit: 600,
    // .htaccess dosyasını dist'e kopyala
    rollupOptions: {
      output: {
        // Part 3 / P3.F1: ağır bağımlılıkları ayrı vendor chunk'larına böl.
        // Amaç: ilk paint sırasında PDF/Excel/DnD gibi nadiren kullanılan
        // kütüphanelerin indirilmemesi → lighter cold start.
        // İçerik tabanlı hash dosya adları sayesinde her bağımsız chunk'ın
        // cache invalidation'ı kendi başına gerçekleşir.
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-dom') || id.includes('react-router') || id.match(/[\\/]react[\\/]/)) {
            return 'vendor-react';
          }
          if (id.includes('@mui') || id.includes('@emotion')) {
            return 'vendor-mui';
          }
          if (id.includes('pdf-lib') || id.includes('jspdf') || id.includes('fontkit')) {
            return 'vendor-pdf';
          }
          if (id.includes('xlsx')) {
            return 'vendor-excel';
          }
          if (id.includes('@hello-pangea/dnd') || id.includes('react-window')) {
            return 'vendor-ui-extras';
          }
          if (id.includes('socket.io-client')) {
            return 'vendor-socket';
          }
          return undefined;
        },
        // Dosya yollarında forward slash kullan
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    }
  },
  publicDir: 'public',
})
