import { query } from '../db';

/**
 * Karaliste tablosunu (varsa atlar) oluşturur.
 * server.ts başlatma adımında withRetry ile çağrılır.
 *
 * Ayrı dosyaya taşınma nedeni: route dosyaları sadece HTTP handler'larını
 * tutmalı; uygulama başlatma sırasında çalışan DDL'ler bootstrap/ altına
 * çekildi (Part 2 / P2.D1).
 */
export async function createKaralisteTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS karaliste (
      id SERIAL PRIMARY KEY,
      ad_soyad VARCHAR(100) NOT NULL,
      cep_tel VARCHAR(20),
      yedek_tel VARCHAR(20),
      mahalle VARCHAR(100),
      cadde VARCHAR(100),
      sokak VARCHAR(100),
      kapi_no VARCHAR(20),
      sebep TEXT,
      created_by VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export default createKaralisteTable;
