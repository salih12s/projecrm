CREATE TABLE IF NOT EXISTS urunler (
  id SERIAL PRIMARY KEY,
  isim VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Örnek veriler
INSERT INTO urunler (isim) VALUES 
  ('Davlumbaz'),
  ('Klima'),
  ('Ocak'),
  ('Fırın')
ON CONFLICT DO NOTHING;
