import pool from '../../db';

async function createSahaTables() {
  try {
    console.log('Saha tabloları oluşturuluyor...');

    // Saha Elemanları Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saha_elemanlari (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        ad_soyad VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ saha_elemanlari tablosu oluşturuldu');

    // Saha Kayıtları Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saha_kayitlari (
        id SERIAL PRIMARY KEY,
        saha_elemani_id INTEGER REFERENCES saha_elemanlari(id) ON DELETE CASCADE,
        saha_elemani_username VARCHAR(100) NOT NULL,
        isim VARCHAR(255) NOT NULL,
        soyisim VARCHAR(255) NOT NULL,
        foto_url TEXT,
        foto_data TEXT,
        notlar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ saha_kayitlari tablosu oluşturuldu');

    // Index'ler
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_saha_kayitlari_saha_elemani_id ON saha_kayitlari(saha_elemani_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_saha_kayitlari_created_at ON saha_kayitlari(created_at)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_saha_kayitlari_isim ON saha_kayitlari(isim)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_saha_kayitlari_soyisim ON saha_kayitlari(soyisim)
    `);
    console.log('✅ Index\'ler oluşturuldu');

    console.log('✅ Tüm saha tabloları başarıyla oluşturuldu!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Saha tabloları oluşturulurken hata:', error);
    process.exit(1);
  }
}

createSahaTables();
