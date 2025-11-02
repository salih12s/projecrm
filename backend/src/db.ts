import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// ⚡ CONNECTION POOL OPTIMIZATION
// Pool ile DB bağlantıları yeniden kullanılır, her sorgu yeni bağlantı açmaz
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Performance ayarları
  max: 20, // Maksimum 20 eşzamanlı bağlantı (varsayılan: 10)
  idleTimeoutMillis: 30000, // Boşta kalan bağlantılar 30 saniye sonra kapanır
  connectionTimeoutMillis: 2000, // Bağlantı için maksimum 2 saniye bekle
});

// Test bağlantısı
pool.connect((err, _client, release) => {
  if (err) {
    return console.error('Veritabanı bağlantı hatası:', err.stack);
  }
  console.log('PostgreSQL veritabanına başarıyla bağlanıldı');
  release();
});

export default pool;
