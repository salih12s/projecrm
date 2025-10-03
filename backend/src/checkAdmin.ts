import pool from './db';

const checkAdmin = async () => {
  try {
    // Admin kullanıcısını kontrol et
    const result = await pool.query('SELECT id, username FROM admins');
    console.log('Admin kullanıcıları:', result.rows);
    
    // Users tablosunu kontrol et
    const users = await pool.query('SELECT id, username, created_at, is_active FROM users LIMIT 5');
    console.log('\nNormal kullanıcılar:', users.rows);
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await pool.end();
  }
};

checkAdmin();
