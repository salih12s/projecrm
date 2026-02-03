import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Railway DATABASE_URL veya ayrı ayrı env variables kullan
const isProduction = process.env.NODE_ENV === 'production';

// Pool konfigürasyonu - Railway için optimize edilmiş
const poolConfig: PoolConfig = process.env.DATABASE_URL
  ? {
      // Railway/Production: DATABASE_URL kullan
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      max: 5, // Railway için az bağlantı (proxy limitleri)
      min: 1, // Minimum 1 bağlantı her zaman hazır
      idleTimeoutMillis: 10000, // 10 saniye idle sonra bağlantıyı kapat (Railway proxy timeout'undan önce)
      connectionTimeoutMillis: 30000, // 30 saniye bağlantı timeout
      allowExitOnIdle: false, // Pool idle olsa bile process'i kapatma
      // Keepalive ayarları - bağlantının kopmasını önler
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000, // 10 saniyede bir keepalive gönder
    }
  : {
      // Local development: ayrı env variables
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

const pool = new Pool(poolConfig);

// Bağlantı hatası event handler - pool'u resetleme
pool.on('error', (err) => {
  console.error('⚠️ Veritabanı pool hatası (bağlantı yeniden kurulacak):', err.message);
  // Pool otomatik olarak yeni bağlantı açacak, crash olmayacak
});

// Bağlantı açıldığında log
pool.on('connect', () => {
  console.log('🔗 Yeni veritabanı bağlantısı açıldı');
});

// Bağlantı kapandığında log
pool.on('remove', () => {
  console.log('🔌 Veritabanı bağlantısı kapatıldı');
});

// Retry mekanizmalı bağlantı testi
async function testConnection(retries = 5, delay = 3000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('✅ PostgreSQL veritabanına başarıyla bağlanıldı');
      client.release();
      return;
    } catch (err) {
      console.log(`⏳ Veritabanı bağlantısı deneniyor... (${i + 1}/${retries})`);
      if (i === retries - 1) {
        console.error('❌ Veritabanı bağlantı hatası:', err);
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// İlk bağlantı testini başlat (arka planda)
testConnection().catch(() => {
  console.error('⚠️ Veritabanı bağlantısı kurulamadı, uygulama devam ediyor...');
});

export default pool;
