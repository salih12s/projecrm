import pool from './db';

// Retry mekanizmalı bağlantı
async function connectWithRetry(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      return client;
    } catch (err) {
      console.log(`⏳ Veritabanı bağlantısı bekleniyor... (${i + 1}/${retries})`);
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Veritabanına bağlanılamadı');
}

async function addNoteNoToAtolyeTable() {
  const client = await connectWithRetry();
  try {
    console.log('🔧 Atölye tablosuna note_no kolonu ekleniyor...');
    
    // SQL direkt olarak kod içinde (build sorunu yaşanmaması için)
    const sql = `
      -- Atölye tablosuna note_no kolonu ekle
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'atolye' AND column_name = 'note_no'
        ) THEN
          ALTER TABLE atolye ADD COLUMN note_no VARCHAR(100);
          RAISE NOTICE 'note_no kolonu eklendi';
        ELSE
          RAISE NOTICE 'note_no kolonu zaten mevcut';
        END IF;
      END $$;
    `;
    
    await client.query(sql);
    console.log('✅ note_no kolonu başarıyla eklendi!');
  } catch (error) {
    console.error('❌ Migration hatası:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Sadece doğrudan çalıştırılırsa çalıştır
if (require.main === module) {
  addNoteNoToAtolyeTable()
    .then(() => {
      console.log('✅ Migration tamamlandı!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration başarısız:', error);
      process.exit(1);
    });
}

export default addNoteNoToAtolyeTable;
