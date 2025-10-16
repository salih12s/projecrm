import pool from './db';
import * as fs from 'fs';
import * as path from 'path';

async function addYazdirildi() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'add_yazdirildi.sql'), 'utf-8');
    await pool.query(sql);
    console.log('✅ yazdirildi sütunu başarıyla eklendi (veya zaten mevcut)');
    process.exit(0);
  } catch (error) {
    console.error('❌ yazdirildi sütunu eklenirken hata:', error);
    process.exit(1);
  }
}

addYazdirildi();
