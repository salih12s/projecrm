import pool from './db';

async function addNoteNoColumn() {
  try {
    console.log('note_no sütunu ekleniyor...');
    
    await pool.query(`
      ALTER TABLE atolye ADD COLUMN IF NOT EXISTS note_no VARCHAR(100);
    `);
    
    console.log('✓ note_no sütunu başarıyla eklendi');
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

addNoteNoColumn();
