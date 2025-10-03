import pool from './db';

const migrateBayilerTable = async (): Promise<void> => {
  try {
    console.log('Bayiler tablosu migration başlıyor...');

    // Username kolonu ekle
    await pool.query(`
      ALTER TABLE bayiler 
      ADD COLUMN IF NOT EXISTS username VARCHAR(100)
    `);
    console.log('✓ Username kolonu eklendi');

    // Password kolonu ekle
    await pool.query(`
      ALTER TABLE bayiler 
      ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT '123456'
    `);
    console.log('✓ Password kolonu eklendi');

    // Mevcut kayıtlar için username'i isim ile doldur
    await pool.query(`
      UPDATE bayiler 
      SET username = isim 
      WHERE username IS NULL
    `);
    console.log('✓ Mevcut kayıtların username değerleri güncellendi');

    // Username UNIQUE constraint ekle (önce var mı kontrol et)
    try {
      await pool.query(`
        ALTER TABLE bayiler 
        ADD CONSTRAINT bayiler_username_unique UNIQUE (username)
      `);
      console.log('✓ Username UNIQUE constraint eklendi');
    } catch (error: any) {
      if (error.code === '42P07') {
        console.log('✓ Username UNIQUE constraint zaten mevcut');
      } else {
        throw error;
      }
    }

    // Username NOT NULL yap
    await pool.query(`
      ALTER TABLE bayiler 
      ALTER COLUMN username SET NOT NULL
    `);
    console.log('✓ Username NOT NULL yapıldı');

    console.log('✅ Bayiler tablosu migration tamamlandı!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration hatası:', error);
    process.exit(1);
  }
};

migrateBayilerTable();
