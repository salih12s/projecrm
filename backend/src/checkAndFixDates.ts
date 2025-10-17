import pool from './db';

const checkAndFixDates = async (): Promise<void> => {
  try {
    console.log('Mevcut tarih verilerini kontrol ediyorum...\n');
    
    // Get all records with kayit_tarihi
    const result = await pool.query(`
      SELECT id, bayi_adi, kayit_tarihi, created_at
      FROM atolye 
      ORDER BY id DESC
      LIMIT 10
    `);
    
    console.log('Son 10 kayıt:');
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}, Bayi: ${row.bayi_adi}`);
      console.log(`  kayit_tarihi: ${row.kayit_tarihi}`);
      console.log(`  created_at: ${row.created_at}`);
      console.log('');
    });
    
    // Fix any timestamps that are longer than 10 characters
    const updateResult = await pool.query(`
      UPDATE atolye 
      SET kayit_tarihi = substring(kayit_tarihi from 1 for 10)
      WHERE kayit_tarihi IS NOT NULL 
        AND length(kayit_tarihi) > 10
      RETURNING id, kayit_tarihi
    `);
    
    if (updateResult.rowCount && updateResult.rowCount > 0) {
      console.log(`✅ ${updateResult.rowCount} kayıt düzeltildi`);
      console.table(updateResult.rows);
    } else {
      console.log('✅ Tüm tarihler zaten doğru formatta (YYYY-MM-DD)');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
};

checkAndFixDates();
