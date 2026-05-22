-- Mevcut bayiler tablosuna yeni kolonlar ekle
-- Mevcut veriler korunur

-- Username kolonu ekle (isim ile aynı değeri ata)
ALTER TABLE bayiler 
ADD COLUMN IF NOT EXISTS username VARCHAR(100);

-- Password kolonu ekle (varsayılan 123456)
ALTER TABLE bayiler 
ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT '123456';

-- Mevcut kayıtlar için username'i isim ile doldur
UPDATE bayiler 
SET username = isim 
WHERE username IS NULL;

-- Username kolonunu UNIQUE yap
ALTER TABLE bayiler 
ADD CONSTRAINT bayiler_username_unique UNIQUE (username);

-- Username kolonunu NOT NULL yap
ALTER TABLE bayiler 
ALTER COLUMN username SET NOT NULL;
