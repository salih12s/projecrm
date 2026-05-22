-- Admins tablosunu oluştur
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users tablosuna created_at ekle (eğer yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='created_at') THEN
    ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Users tablosuna is_active (aktif/pasif) ekle
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='is_active') THEN
    ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Islemler tablosuna created_by ekle (eğer yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='islemler' AND column_name='created_by') THEN
    ALTER TABLE islemler ADD COLUMN created_by VARCHAR(255);
  END IF;
END $$;

-- Varsayılan admin kullanıcısı ekle (username: admin, password: admin123)
-- Şifre hash'i: $2a$10$Xd2xu5CfBn6f.yDY09KX.u/qC6oVpXuA30HWxPd8psr3C/aT/aOCq
INSERT INTO admins (username, password) 
VALUES ('admin', '$2a$10$Xd2xu5CfBn6f.yDY09KX.u/qC6oVpXuA30HWxPd8psr3C/aT/aOCq')
ON CONFLICT (username) DO NOTHING;
