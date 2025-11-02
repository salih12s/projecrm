import pool from './db';
import fs from 'fs';
import path from 'path';

async function addPerformanceIndexes() {
  try {
    console.log('⚡ Performance index\'leri ekleniyor...');
    
    const sql = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_performance_indexes.sql'),
      'utf-8'
    );
    
    await pool.query(sql);
    
    console.log('✅ Performance index\'leri başarıyla eklendi!');
    console.log('   - idx_is_durumu: İş durumu filtresi');
    console.log('   - idx_tarih: Tarih sıralaması');
    console.log('   - idx_teknisyen: Teknisyen bazlı sorgular');
    console.log('   - idx_bayi: Bayi bazlı sorgular');
    console.log('   - idx_cep_tel: Telefon aramaları');
    console.log('   - idx_durum_tarih: Composite index (durum + tarih)');
    console.log('   - idx_ad_soyad: Ad soyad araması');
    console.log('   - idx_yazdirildi: Yazdırılmamış işler');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Index ekleme hatası:', error);
    process.exit(1);
  }
}

addPerformanceIndexes();
