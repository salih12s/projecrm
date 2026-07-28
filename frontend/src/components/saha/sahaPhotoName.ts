import { SahaKayit } from '../../types';

/**
 * Orijinal dosya adı olmayan (yeni biçim öncesi yüklenmiş) fotoğraflar için
 * indirme adı tabanı üretir: "Ahmet_Yilmaz_2026-07-28".
 *
 * Yeni yüklenen fotoğraflar kendi dosya adlarıyla indiği için bu yalnızca
 * geriye dönük bir yedektir.
 */
export function buildKayitFallbackName(kayit?: SahaKayit | null): string {
  if (!kayit) return 'fotograf';

  const adSoyad = [kayit.isim, kayit.soyisim].filter(Boolean).join('_');
  const tarih = kayit.created_at ? String(kayit.created_at).slice(0, 10) : '';

  return [adSoyad, tarih].filter(Boolean).join('_') || 'fotograf';
}
