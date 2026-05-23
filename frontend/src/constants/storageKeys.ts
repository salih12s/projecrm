/**
 * localStorage anahtarları. String literal'leri yerine bu sabitleri kullanın.
 */
export const STORAGE_KEYS = {
  ISLEM_TABLE_COLUMN_ORDER: 'islemTableColumnOrder',
  ISLEM_TABLE_COLUMN_WIDTHS: 'islemTableColumnWidths',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
