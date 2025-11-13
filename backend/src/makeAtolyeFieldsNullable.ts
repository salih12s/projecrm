import pool from './db';

async function makeAtolyeFieldsNullable() {
  try {
    console.log('Atolye tablosu alanları nullable yapılıyor...');
    
    await pool.query(`
      ALTER TABLE atolye ALTER COLUMN tel_no DROP NOT NULL;
      ALTER TABLE atolye ALTER COLUMN bayi_adi DROP NOT NULL;
      ALTER TABLE atolye ALTER COLUMN musteri_ad_soyad DROP NOT NULL;
    `);
    
    console.log('✓ Alanlar başarıyla nullable yapıldı');
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

makeAtolyeFieldsNullable();
