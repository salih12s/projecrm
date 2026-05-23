import { useCallback, useMemo, useState } from 'react';

export type ColumnFilters = Record<string, string>;

export interface UseColumnFiltersOptions {
  /** Başlangıç filtre değerleri. */
  initial?: ColumnFilters;
}

export interface UseColumnFiltersResult {
  filters: ColumnFilters;
  setFilter: (key: string, value: string) => void;
  clearFilter: (key: string) => void;
  clearAll: () => void;
  /** Herhangi bir filtre değeri boş-olmayan string mi? */
  hasActiveFilters: boolean;
  getFilter: (key: string) => string;
}

/**
 * `useColumnFilters` — tablo kolonlarına göre `Record<string, string>`
 * şeklinde filtre state'i yöneten küçük yardımcı.
 *
 * NOT — Bu turda hiçbir component'e entegre edilmedi. `IslemTable` kendi
 * `filters` state'ini ve `Dashboard`'ın `columnFiltersRef`'i ile olan
 * debounce/ref koreografisini bozmamak için yalnız altyapı olarak
 * hazırlandı (Phase 9-10'da da bu component'in davranışı bilinçli olarak
 * korunmuştu). Entegrasyon ayrı bir phase'de planlanmalı.
 *
 * Davranış kararları:
 * - `setFilter(key, '')` çağrısı key'i map'ten siler (boş string = filtre yok).
 *   Böylece `hasActiveFilters` doğru hesaplanır ve gereksiz query param'lar
 *   üretilmez.
 * - `getFilter` her zaman string döner (`undefined` döndürmez); MUI
 *   `TextField value` prop'u kontrollü kalsın diye.
 */
export function useColumnFilters(options: UseColumnFiltersOptions = {}): UseColumnFiltersResult {
  const { initial = {} } = options;

  const [filters, setFilters] = useState<ColumnFilters>(() => ({ ...initial }));

  const setFilter = useCallback((key: string, value: string) => {
    setFilters(prev => {
      if (!value) {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
  }, []);

  const clearFilter = useCallback((key: string) => {
    setFilters(prev => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setFilters(prev => (Object.keys(prev).length === 0 ? prev : {}));
  }, []);

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some(v => v !== ''),
    [filters],
  );

  const getFilter = useCallback((key: string) => filters[key] ?? '', [filters]);

  return {
    filters,
    setFilter,
    clearFilter,
    clearAll,
    hasActiveFilters,
    getFilter,
  };
}

export default useColumnFilters;
