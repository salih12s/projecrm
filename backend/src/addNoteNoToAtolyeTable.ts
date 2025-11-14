import pool from './db';
import fs from 'fs';
import path from 'path';

async function addNoteNoToAtolyeTable() {
  const client = await pool.connect();
  try {
    console.log('🔧 Atölye tablosuna note_no kolonu ekleniyor...');
    
    const sql = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_note_no_to_atolye.sql'),
      'utf-8'
    );
    
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
