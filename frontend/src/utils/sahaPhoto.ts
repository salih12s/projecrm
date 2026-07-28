/**
 * Saha kayıtlarındaki fotoğraf yükünün (foto_data) ortak yardımcıları.
 *
 * DEPOLAMA BİÇİMİ — iki sürüm birden desteklenir:
 *   ESKİ:  ["data:image/jpeg;base64,...", ...]
 *   YENİ:  [{ "name": "IMG_2034.jpg", "data": "data:image/jpeg;base64,..." }, ...]
 *
 * Orijinal dosya adı eskiden hiç saklanmıyordu (yükleme sırasında `file.name`
 * yalnızca hata mesajında kullanılıp atılıyordu). Yeni biçim bunu saklar;
 * eski kayıtlar okunmaya devam eder ve isimsiz döner — o durumda indirme
 * adı kaydın kendi bilgilerinden üretilir.
 */

export interface SahaPhoto {
  /** data: URL (base64) */
  data: string;
  /** Yüklendiği andaki orijinal dosya adı. Eski kayıtlarda yoktur. */
  name?: string;
}

/** foto_data yükünü — hangi sürüm olursa olsun — tek biçime indirger. */
export function parseSahaPhotos(raw: string | null | undefined): SahaPhoto[] {
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Hiç JSON değilse tek bir data URL'dir
    return [{ data: raw }];
  }

  if (!Array.isArray(parsed)) {
    return typeof parsed === 'string' ? [{ data: parsed }] : [{ data: raw }];
  }

  return parsed
    .map((item): SahaPhoto | null => {
      if (typeof item === 'string') return { data: item };
      if (item && typeof item === 'object' && typeof (item as any).data === 'string') {
        const name = (item as any).name;
        return { data: (item as any).data, name: typeof name === 'string' ? name : undefined };
      }
      return null;
    })
    .filter((p): p is SahaPhoto => p !== null);
}

/** Kaydetmek üzere yeni biçimde serileştirir. */
export function serializeSahaPhotos(photos: SahaPhoto[]): string {
  return JSON.stringify(photos.map((p) => ({ name: p.name, data: p.data })));
}

/** Bir data URL'in MIME tipinden dosya uzantısı çıkarır. */
function extensionFromDataUrl(dataUrl: string): string {
  const match = /^data:image\/([a-z0-9.+-]+)/i.exec(dataUrl);
  if (!match) return 'jpg';
  const subtype = match[1].toLowerCase();
  if (subtype === 'jpeg') return 'jpg';
  if (subtype === 'svg+xml') return 'svg';
  return subtype;
}

/** Dosya sisteminde sorun çıkaran karakterleri temizler. */
function sanitizeFileName(value: string): string {
  return value
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 120);
}

/**
 * İndirme için dosya adı üretir.
 *
 * Öncelik sırası:
 *   1. Fotoğrafın saklanan orijinal adı
 *   2. `fallbackBase` (ör. "Ahmet_Yilmaz_2026-07-28")
 *
 * Uzantı her durumda verinin GERÇEK MIME tipinden alınır: yükleme sırasında
 * `compressImage` görüntüyü yeniden kodluyor, dolayısıyla ".png" olarak
 * yüklenen bir dosya diskte JPEG olarak duruyor olabilir.
 */
export function buildPhotoFileName(
  photo: SahaPhoto,
  fallbackBase: string,
  index: number,
  total: number
): string {
  const ext = extensionFromDataUrl(photo.data);

  if (photo.name) {
    const base = sanitizeFileName(photo.name.replace(/\.[^.]+$/, ''));
    if (base) return `${base}.${ext}`;
  }

  const base = sanitizeFileName(fallbackBase) || 'fotograf';
  const suffix = total > 1 ? `_${index + 1}` : '';
  return `${base}${suffix}.${ext}`;
}

/** data: URL'i Blob'a çevirip tarayıcıya indirtir. */
export function downloadPhoto(photo: SahaPhoto, fileName: string): void {
  const commaIndex = photo.data.indexOf(',');
  const header = commaIndex >= 0 ? photo.data.slice(0, commaIndex) : '';
  const payload = commaIndex >= 0 ? photo.data.slice(commaIndex + 1) : photo.data;
  const mime = /^data:([^;,]+)/.exec(header)?.[1] || 'image/jpeg';

  let blob: Blob;
  if (/;base64/i.test(header)) {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    blob = new Blob([bytes], { type: mime });
  } else {
    blob = new Blob([decodeURIComponent(payload)], { type: mime });
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Chrome indirmeyi başlatana kadar URL'in yaşaması gerekiyor.
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
