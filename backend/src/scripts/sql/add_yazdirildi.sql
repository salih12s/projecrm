-- Migration: islemler tablosuna yazdirildi sütunu ekle
-- Bu sütun, işlemin yazdırılıp yazdırılmadığını tutar (boolean, default false)

DO $$
BEGIN
  -- yaz dirildi sütunu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'islemler' 
      AND column_name = 'yazdirildi'
  ) THEN
    ALTER TABLE islemler ADD COLUMN yazdirildi BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'yazdirildi sütunu islemler tablosuna eklendi';
  ELSE
    RAISE NOTICE 'yazdirildi sütunu zaten mevcut';
  END IF;
END
$$;
