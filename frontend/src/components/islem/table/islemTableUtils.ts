/**
 * IslemTable için saf yardımcı fonksiyonlar.
 *
 * Buradaki hiçbir helper React state'i, prop'u veya context kullanmaz;
 * sadece input → output mapping yapar. Davranış legacy `IslemTable.tsx`
 * içindeki inline versiyonu ile birebir aynıdır.
 *
 * (Part 3 / P3.G2): `formatPhoneNumber` artık `utils/format.ts`'ye taşındı,
 * burada yalnız geriye dönük uyumluluk için re-export ediliyor.
 */

export { formatPhone as formatPhoneNumber } from '../../../utils/format';

/**
 * Türkçe-doğru küçük harfe çevirme — `toLocaleLowerCase('tr-TR')` ile aynı
 * sonucu üretir ama ~5 kat hızlıdır.
 *
 * `toLocaleLowerCase` her çağrıda ICU'ya iner; 11.000 kayıt × 20 alanlık arama
 * indeksinde bu tek başına ~550 ms tutuyordu. Türkçe'nin locale'e özgü tek
 * farkı I/İ çiftidir; onu önden değiştirip standart `toLowerCase()` kullanmak
 * aynı çıktıyı ~110 ms'de veriyor.
 */
export function normalizeTr(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
}

