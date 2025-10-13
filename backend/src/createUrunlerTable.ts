import pool from './db';

async function createUrunlerTable() {
  try {
    // Urunler tablosunu oluştur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS urunler (
        id SERIAL PRIMARY KEY,
        isim VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Urunler tablosu başarıyla oluşturuldu');

    // Örnek verileri ekleme (kaldırıldı - kullanıcı istedi)
    console.log('ℹ️  Tablo oluşturuldu, örnek veri eklenmedi');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

createUrunlerTable();
