-- İşlemler tablosuna yedek_tel sütunu ekleme

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'islemler' 
    AND column_name = 'yedek_tel'
  ) THEN
    ALTER TABLE islemler ADD COLUMN yedek_tel VARCHAR(20);
    RAISE NOTICE 'yedek_tel sütunu islemler tablosuna eklendi';
  ELSE
    RAISE NOTICE 'yedek_tel sütunu zaten mevcut';
  END IF;
END $$;
