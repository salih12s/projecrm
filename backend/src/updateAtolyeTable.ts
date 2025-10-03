import pool from './db';
import * as fs from 'fs';
import * as path from 'path';

async function addCreatedByToAtolye() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'add_atolye_created_by.sql'),
      'utf-8'
    );

    await pool.query(sql);
    console.log('✓ Atölye tablosu güncellendi - created_by sütunu eklendi');
    
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

addCreatedByToAtolye();
