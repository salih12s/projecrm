import pool from './db';

const createTables = async (): Promise<void> => {
  try {
    // Kullanıcılar tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // İşlemler tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS islemler (
        id SERIAL PRIMARY KEY,
        full_tarih TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        teknisyen_ismi VARCHAR(100),
        yapilan_islem TEXT,
        tutar DECIMAL(10, 2),
        ad_soyad VARCHAR(100) NOT NULL,
        ilce VARCHAR(100) NOT NULL,
        mahalle VARCHAR(100) NOT NULL,
        cadde VARCHAR(100) NOT NULL,
        sokak VARCHAR(100) NOT NULL,
        kapi_no VARCHAR(20) NOT NULL,
        apartman_site VARCHAR(100),
        blok_no VARCHAR(20),
        daire_no VARCHAR(20),
        sabit_tel VARCHAR(20),
        cep_tel VARCHAR(20) NOT NULL,
        urun VARCHAR(100) NOT NULL,
        marka VARCHAR(100) NOT NULL,
        sikayet TEXT NOT NULL,
        is_durumu VARCHAR(20) DEFAULT 'acik',
        created_by VARCHAR(50),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Teknisyenler tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teknisyenler (
        id SERIAL PRIMARY KEY,
        isim VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Markalar tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS markalar (
        id SERIAL PRIMARY KEY,
        isim VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bayiler tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bayiler (
        id SERIAL PRIMARY KEY,
        isim VARCHAR(100) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL DEFAULT '123456',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Atölye takip tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS atolye (
        id SERIAL PRIMARY KEY,
        teslim_durumu VARCHAR(50) DEFAULT 'beklemede',
        bayi_adi VARCHAR(255) NOT NULL,
        musteri_ad_soyad VARCHAR(255) NOT NULL,
        tel_no VARCHAR(20) NOT NULL,
        marka VARCHAR(100) NOT NULL,
        kod VARCHAR(100),
        seri_no VARCHAR(100),
        sikayet TEXT NOT NULL,
        ozel_not TEXT,
        yapilan_islem TEXT,
        ucret DECIMAL(10, 2),
        yapilma_tarihi TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Montaj tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS montajlar (
        id SERIAL PRIMARY KEY,
        isim VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Aksesuarlar tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS aksesuarlar (
        id SERIAL PRIMARY KEY,
        isim VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ürünler tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS urunler (
        id SERIAL PRIMARY KEY,
        isim VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Tablolar başarıyla oluşturuldu');
  } catch (error) {
    console.error('Tablo oluşturma hatası:', error);
  }
};

export default createTables;
