import pool from './db';

/**
 * Saha kayıtları için performans index'lerini ekler.
 * Yüksek hacimli kayıtlarda pagination + arama (ILIKE/LIKE %x%) + bugün filtresini
 * 10-100x hızlandırır.
 *
 * Idempotent: Her başlangıçta güvenle çalışır (CREATE INDEX IF NOT EXISTS).
 */
export async function addSahaPerformanceIndexes(): Promise<void> {
  try {
    // pg_trgm extension: LIKE '%abc%' arama için GIN trigram index'i gerekir
    try {
      await pool.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    } catch (err: any) {
      // Bazı managed PostgreSQL'lerde extension izni olmayabilir → sorun değil, diğer indexlerle devam
      console.warn('⚠️ pg_trgm extension oluşturulamadı (izin yok olabilir):', err?.message);
    }

    // 1) Saha kullanıcı ana sorgusu: WHERE saha_elemani_id = $1 ORDER BY created_at DESC
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_saha_kayitlari_elemani_created
      ON saha_kayitlari(saha_elemani_id, created_at DESC)
    `);

    // 2) Admin tüm kayıtlar: ORDER BY created_at DESC
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_saha_kayitlari_created_at_desc
      ON saha_kayitlari(created_at DESC)
    `);

    // 3) Trigram GIN index'ler (arama) — extension başarılıysa çalışır
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_saha_kayitlari_isim_trgm
        ON saha_kayitlari USING GIN (LOWER(isim) gin_trgm_ops)
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_saha_kayitlari_soyisim_trgm
        ON saha_kayitlari USING GIN (LOWER(soyisim) gin_trgm_ops)
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_saha_kayitlari_notlar_trgm
        ON saha_kayitlari USING GIN (LOWER(COALESCE(notlar, '')) gin_trgm_ops)
      `);
    } catch (err: any) {
      console.warn('⚠️ Trigram GIN index oluşturulamadı (pg_trgm yok olabilir):', err?.message);
    }

    // 4) Admin username filtresi
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_saha_kayitlari_username
      ON saha_kayitlari(saha_elemani_username)
    `);

    // 5) Planner istatistiklerini güncelle
    try {
      await pool.query(`ANALYZE saha_kayitlari`);
    } catch {
      // analyze başarısız olsa bile kritik değil
    }

    console.log('✅ Saha performans index\'leri hazır');
  } catch (error) {
    console.error('❌ Saha performans index migration hatası:', error);
    // Fırlatma — diğer başlangıç adımları çalışmalı
  }
}

export default addSahaPerformanceIndexes;
