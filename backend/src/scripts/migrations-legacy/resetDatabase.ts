import pool from '../../db';

async function resetDatabase() {
  try {
    console.log('🔄 Database sıfırlanıyor (admin kullanıcısı hariç)...');

    // 1. İşlemler tablosunu temizle
    await pool.query('DELETE FROM islemler');
    console.log('✓ İşlemler tablosu temizlendi');

    // 2. Atölye tablosunu temizle
    await pool.query('DELETE FROM atolye');
    console.log('✓ Atölye tablosu temizlendi');

    // 3. Bayiler tablosunu temizle
    await pool.query('DELETE FROM bayiler');
    console.log('✓ Bayiler tablosu temizlendi');

    // 4. Markalar tablosunu temizle
    await pool.query('DELETE FROM markalar');
    console.log('✓ Markalar tablosu temizlendi');

    // 5. Teknisyenler tablosunu temizle
    await pool.query('DELETE FROM teknisyenler');
    console.log('✓ Teknisyenler tablosu temizlendi');

    // 6. Admin hariç tüm kullanıcıları sil
    await pool.query('DELETE FROM users');
    console.log('✓ Kullanıcılar tablosu temizlendi');

    // 7. Sequence'leri sıfırla
    await pool.query('ALTER SEQUENCE islemler_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE atolye_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE bayiler_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE markalar_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE teknisyenler_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    console.log('✓ ID sequence\'leri sıfırlandı');

    console.log('\n✅ Database başarıyla sıfırlandı!');
    console.log('📌 Admin kullanıcısı korundu: admin / admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

resetDatabase();
