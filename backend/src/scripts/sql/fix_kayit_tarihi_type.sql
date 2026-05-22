-- Fix kayit_tarihi column type to prevent timezone conversion
-- Change from DATE/TIMESTAMP to VARCHAR to store pure date string

DO $$
BEGIN
  -- First, check if column exists and is not already VARCHAR
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'atolye' 
      AND column_name = 'kayit_tarihi'
      AND data_type != 'character varying'
  ) THEN
    -- Convert existing data to YYYY-MM-DD format
    UPDATE atolye 
    SET kayit_tarihi = kayit_tarihi::date::text 
    WHERE kayit_tarihi IS NOT NULL;
    
    -- Change column type to VARCHAR
    ALTER TABLE atolye 
    ALTER COLUMN kayit_tarihi TYPE VARCHAR(10) 
    USING kayit_tarihi::date::text;
    
    RAISE NOTICE 'kayit_tarihi column converted to VARCHAR(10)';
  ELSE
    RAISE NOTICE 'kayit_tarihi column is already VARCHAR or does not exist';
  END IF;
END $$;
