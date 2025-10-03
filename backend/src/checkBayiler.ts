import pool from './db';

const checkBayiler = async () => {
  try {
    const result = await pool.query('SELECT id, isim, username, password FROM bayiler ORDER BY id');
    
    console.log('\n=== MEVCUT BAYİLER ===\n');
    result.rows.forEach(bayi => {
      console.log(`✓ ${bayi.isim}`);
      console.log(`  Username: ${bayi.username}`);
      console.log(`  Password: ${bayi.password}`);
      console.log('');
    });
    console.log(`Toplam: ${result.rows.length} bayi\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
};

checkBayiler();
