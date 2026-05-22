-- İlçeler tablosu
CREATE TABLE IF NOT EXISTS ilceler (
  id SERIAL PRIMARY KEY,
  ilce_id INTEGER UNIQUE NOT NULL,
  isim VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mahalleler tablosu
CREATE TABLE IF NOT EXISTS mahalleler (
  id SERIAL PRIMARY KEY,
  mahalle_id INTEGER UNIQUE NOT NULL,
  ilce_id INTEGER NOT NULL,
  isim VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ilce_id) REFERENCES ilceler(ilce_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mahalleler_ilce_id ON mahalleler(ilce_id);
