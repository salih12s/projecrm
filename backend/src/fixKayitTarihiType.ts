import pool from './db';

const fixKayitTarihiType = async (): Promise<void> => {
  try {
    console.log('kayit_tarihi kolonu tipi düzeltiliyor...');
    
    // Check current column type
    const checkResult = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'atolye' 
        AND column_name = 'kayit_tarihi'
    `);
    
    console.log('Mevcut tip:', checkResult.rows[0]?.data_type);
    
    if (checkResult.rows[0]?.data_type !== 'character varying') {
      // Convert column to VARCHAR
      await pool.query(`
        ALTER TABLE atolye 
        ALTER COLUMN kayit_tarihi TYPE VARCHAR(10) 
        USING CASE 
          WHEN kayit_tarihi IS NOT NULL THEN kayit_tarihi::date::text 
          ELSE NULL 
        END
      `);
      
      console.log('✅ kayit_tarihi kolonu VARCHAR(10) tipine çevrildi');
      
      // Show sample data
      const sampleData = await pool.query(`
        SELECT id, kayit_tarihi 
        FROM atolye 
        WHERE kayit_tarihi IS NOT NULL 
        LIMIT 5
      `);
      
      console.log('Örnek veriler:');
      console.table(sampleData.rows);
    } else {
      console.log('✅ kayit_tarihi kolonu zaten VARCHAR tipinde');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Migration hatası:', error);
    process.exit(1);
  }
};

fixKayitTarihiType();
