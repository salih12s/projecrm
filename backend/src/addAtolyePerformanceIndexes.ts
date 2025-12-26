import pool from './db';

async function addAtolyePerformanceIndexes() {
  const client = await pool.connect();
  
  try {
    console.log('Adding performance indexes to atolye table...');

    // Index for teslim_durumu (used in filters and status counts)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_atolye_teslim_durumu 
      ON atolye(teslim_durumu);
    `);
    console.log('✓ Index on teslim_durumu created');

    // Index for bayi_adi (used in bayi filtering)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_atolye_bayi_adi 
      ON atolye(bayi_adi);
    `);
    console.log('✓ Index on bayi_adi created');

    // Index for created_at (used in sorting)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_atolye_created_at 
      ON atolye(created_at DESC);
    `);
    console.log('✓ Index on created_at created');

    // Index for kayit_tarihi (used in filtering)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_atolye_kayit_tarihi 
      ON atolye(kayit_tarihi);
    `);
    console.log('✓ Index on kayit_tarihi created');

    // Composite index for common query pattern (bayi + status)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_atolye_bayi_status 
      ON atolye(bayi_adi, teslim_durumu);
    `);
    console.log('✓ Composite index on bayi_adi, teslim_durumu created');

    // Index for id DESC (pagination ordering)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_atolye_id_desc 
      ON atolye(id DESC);
    `);
    console.log('✓ Index on id DESC created');

    console.log('\n✅ All performance indexes added successfully!');
    console.log('Database queries will be significantly faster now.');
    
  } catch (error) {
    console.error('Error adding indexes:', error);
    throw error;
  } finally {
    client.release();
  }
}

addAtolyePerformanceIndexes()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
