-- Add kayit_tarihi column to atolye table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'atolye' AND column_name = 'kayit_tarihi'
  ) THEN
    ALTER TABLE atolye ADD COLUMN kayit_tarihi DATE;
    RAISE NOTICE 'kayit_tarihi column added to atolye table';
  ELSE
    RAISE NOTICE 'kayit_tarihi column already exists in atolye table';
  END IF;
END $$;
