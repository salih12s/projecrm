import pool from './db';
import * as fs from 'fs';
import * as path from 'path';

async function addYedekTel() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'add_yedek_tel.sql'),
      'utf-8'
    );

    await pool.query(sql);
    console.log('✓ İşlemler tablosu güncellendi - yedek_tel sütunu eklendi');
    
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

addYedekTel();
