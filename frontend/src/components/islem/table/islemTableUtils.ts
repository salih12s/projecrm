/**
 * IslemTable için saf yardımcı fonksiyonlar.
 *
 * Buradaki hiçbir helper React state'i, prop'u veya context kullanmaz;
 * sadece input → output mapping yapar. Davranış legacy `IslemTable.tsx`
 * içindeki inline versiyonu ile birebir aynıdır.
 */

/**
 * Telefon numarasını "0544 448 88 88" formatına çevirir.
 * Sadece 11 haneli (Türkiye GSM) inputlarda biçim uygulanır;
 * diğer durumlarda input olduğu gibi geri döner.
 */
export const formatPhoneNumber = (phone: string | undefined): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
};
