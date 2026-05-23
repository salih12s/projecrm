/**
 * Ortak formatlama yardımcıları.
 *
 * Bu modül, frontend boyunca tekrarlayan `formatPhoneNumber` kopyalarını
 * tek bir noktada toplar. Davranış, mevcut tüketicilerle birebir uyumludur:
 *   - 11 haneli (Türkiye GSM) sayılar `0XXX XXX XX XX` formatında döner.
 *   - Diğer durumlarda input olduğu gibi geri verilir.
 *   - Boş/`null`/`undefined` için isteğe bağlı `fallback` döner (varsayılan: `''`).
 *
 * Frozen dosyalar (`utils/print.ts`, `utils/excel.ts`, `PrintEditor.tsx`)
 * bu helper'ı kullanmaz — kendi lokal kopyaları kasıtlı olarak korunur.
 *
 * (Part 3 / P3.G2)
 */

export function formatPhone(
  phone: string | null | undefined,
  fallback: string = '',
): string {
  if (!phone) return fallback;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
}
