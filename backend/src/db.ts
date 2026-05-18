import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Railway DATABASE_URL veya ayrı ayrı env variables kullan
const isProduction = process.env.NODE_ENV === 'production';

function numberFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

// Pool konfigürasyonu - Railway için optimize edilmiş
const poolConfig: PoolConfig = process.env.DATABASE_URL
  ? {
      // Railway/Production: DATABASE_URL kullan
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      max: numberFromEnv('DB_POOL_MAX', 10),
      min: 0,
      idleTimeoutMillis: numberFromEnv('DB_IDLE_TIMEOUT_MS', 60000),
      connectionTimeoutMillis: numberFromEnv('DB_CONNECTION_TIMEOUT_MS', 15000),
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
  if (process.env.DEBUG_DB_POOL === 'true') {
    console.log('🔗 Yeni veritabanı bağlantısı açıldı');
  }
});

// Bağlantı kapandığında log
pool.on('remove', () => {
  if (process.env.DEBUG_DB_POOL === 'true') {
    console.log('🔌 Veritabanı bağlantısı kapatıldı');
  }
});

const TRANSIENT_DB_ERROR_CODES = new Set([
  '40001',
  '40P01',
  '53300',
  '53400',
  '57P01',
  '57P02',
  '57P03',
  '08000',
  '08001',
  '08003',
  '08004',
  '08006',
  '08007',
  '08P01',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
]);

function isTransientDbError(error: unknown): boolean {
  const err = error as { code?: string; message?: string };
  const message = (err.message || '').toLowerCase();

  return (
    Boolean(err.code && TRANSIENT_DB_ERROR_CODES.has(err.code)) ||
    message.includes('timeout') ||
    message.includes('connection terminated') ||
    message.includes('terminating connection') ||
    message.includes('server closed the connection') ||
    message.includes('connection reset') ||
    message.includes('remaining connection slots') ||
    message.includes('too many clients')
  );
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[],
  retries = 2
): Promise<QueryResult<T>> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await pool.query<T>(text, params);
    } catch (error) {
      if (!isTransientDbError(error) || attempt === retries) {
        throw error;
      }

      const delay = 300 * (attempt + 1);
      console.warn(`Geçici veritabanı hatası, sorgu tekrar denenecek (${attempt + 1}/${retries})`, {
        delay,
        message: (error as Error).message,
      });
      await wait(delay);
    }
  }

  throw new Error('Veritabanı sorgusu tamamlanamadı');
}

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
