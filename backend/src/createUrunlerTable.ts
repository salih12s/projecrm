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

    // Örnek veriler ekle
    const checkResult = await pool.query('SELECT COUNT(*) FROM urunler');
    const count = parseInt(checkResult.rows[0].count);
    
    if (count === 0) {
      await pool.query(`
        INSERT INTO urunler (isim) VALUES 
          ('Davlumbaz'),
          ('Klima'),
          ('Ocak'),
          ('Fırın'),
          ('Bulaşık Makinesi'),
          ('Çamaşır Makinesi'),
          ('Kurutma Makinesi')
      `);
      console.log('✅ Örnek ürünler eklendi');
    } else {
      console.log(`ℹ️  Veritabanında zaten ${count} ürün var`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

createUrunlerTable();
