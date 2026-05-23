/**
 * İşlem (is_durumu) sabitleri.
 * Backend ile aynı string değerleri kullanır.
 */

export type IslemDurum = 'acik' | 'parca_bekliyor' | 'tamamlandi' | 'iptal';

export type IslemChipColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning';

export const ISLEM_DURUM_LABEL: Record<IslemDurum, string> = {
  acik: 'Açık',
  parca_bekliyor: 'Parça Bek.',
  tamamlandi: 'Tamamlandı',
  iptal: 'İptal',
};

export const ISLEM_DURUM_COLOR: Record<IslemDurum, IslemChipColor> = {
  acik: 'warning',
  parca_bekliyor: 'info',
  tamamlandi: 'success',
  iptal: 'error',
};

const DURUM_SET = new Set<string>(Object.keys(ISLEM_DURUM_LABEL));

export const isIslemDurum = (value: string): value is IslemDurum =>
  DURUM_SET.has(value);

export const getIslemDurumLabel = (durum: string): string =>
  isIslemDurum(durum) ? ISLEM_DURUM_LABEL[durum] : durum;

export const getIslemDurumColor = (durum: string): IslemChipColor =>
  isIslemDurum(durum) ? ISLEM_DURUM_COLOR[durum] : 'default';

/** Aktif (açık veya parça bekliyor) işlemler için kısayol */
export const isAktifDurum = (durum: string | undefined | null): boolean =>
  durum === 'acik' || durum === 'parca_bekliyor';
