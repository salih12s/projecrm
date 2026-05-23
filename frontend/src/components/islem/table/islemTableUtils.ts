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

