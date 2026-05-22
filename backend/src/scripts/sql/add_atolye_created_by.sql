-- Atölye tablosuna created_by sütunu ekleme

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'atolye' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE atolye ADD COLUMN created_by VARCHAR(255);
    RAISE NOTICE 'created_by sütunu atolye tablosuna eklendi';
  ELSE
    RAISE NOTICE 'created_by sütunu zaten mevcut';
  END IF;
END $$;
