import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// .env.production dosyasını yükle
const envPath = path.join(__dirname, '..', '.env.production');
console.log('📁 .env.production yolu:', envPath);
dotenv.config({ path: envPath });

console.log('🔧 Veritabanı bilgileri:');
console.log('   Host:', process.env.DB_HOST);
console.log('   Port:', process.env.DB_PORT);
console.log('   Database:', process.env.DB_NAME);
console.log('   User:', process.env.DB_USER);
console.log('   Password:', process.env.DB_PASSWORD ? '***' : 'YOK!');
console.log('');

// Canlı veritabanı bağlantı bilgileri
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false // Railway için gerekli
  }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('✅ Canlı veritabanına bağlanıldı!');
    
    // Migration dosyasını oku
    const migrationPath = path.join(__dirname, 'migrations', 'alter_atolye_nullable.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Migration uygulanıyor...\n');
    console.log(migrationSQL);
    console.log('\n');
    
    // Migration'ı çalıştır
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Migration başarıyla uygulandı!');
    console.log('✅ musteri_ad_soyad ve bayi_adi kolonları artık nullable');
    console.log('✅ En az birinin dolu olması zorunluluğu eklendi (CHECK constraint)');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration hatası:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Migration'ı çalıştır
runMigration()
  .then(() => {
    console.log('\n✨ İşlem tamamlandı!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ İşlem başarısız!', error);
    process.exit(1);
  });
