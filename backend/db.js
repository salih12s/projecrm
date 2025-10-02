const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test bağlantısı
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Veritabanı bağlantı hatası:', err.stack);
  }
  console.log('PostgreSQL veritabanına başarıyla bağlanıldı');
  release();
});

module.exports = pool;
