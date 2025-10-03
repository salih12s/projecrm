import pool from './db';
import fs from 'fs';
import path from 'path';

const createAdminTable = async () => {
  try {
    const sqlPath = path.join(__dirname, 'create_admin_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    await pool.query(sql);
    console.log('✓ Admin tablosu ve ek kolonlar oluşturuldu');
    console.log('✓ Varsayılan admin kullanıcısı oluşturuldu (username: admin, password: admin123)');
  } catch (error) {
    console.error('Admin tablo oluşturma hatası:', error);
  } finally {
    await pool.end();
  }
};

createAdminTable();
