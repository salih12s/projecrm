import { useCallback, useMemo, useState } from 'react';

export interface UsePaginationOptions {
  /** Başlangıç sayfa numarası (1-tabanlı). Default: 1. */
  initialPage?: number;
  /** Sayfa başına kayıt. Default: 50. */
  initialPageSize?: number;
  /** Toplam kayıt sayısı (server-side pagination için). Default: 0. */
  total?: number;
}

export interface UsePaginationResult {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  /** Sayfa numarasını `initialPage`'e geri çeker (filtre değiştiğinde çağrılır). */
  resetPage: () => void;
}

/**
 * `usePagination` — sayfa, sayfa boyutu ve toplam kayıt sayısını yönetir.
 *
 * NOT — Bu turda hiçbir component'e entegre edilmedi. `IslemTable`,
 * `SahaKayitlari`, `AtolyeTakip` mevcut pagination davranışlarıyla aynen
 * çalışmaya devam ediyor. Entegrasyon her component için ayrı bir
 * phase'de yapılacak.
 *
 * Davranış kararları:
 * - `setPage(n)` çağrısı `n < 1` olursa 1'e clamp'lenir.
 * - `setPage(n)` çağrısı toplam sayı bilindiğinde `totalPages`'i aşmayı
 *   engellemez (server-side scenario'larda total henüz dönmemiş olabilir).
 *   Bu davranışı entegre eden component kendi tarafında kararlaştırır.
 * - `setPageSize(s)` sayfayı `initialPage`'e döndürmez; bunu çağıran
 *   bilinçli olarak yapmalı (mevcut component davranışlarının her biri
 *   farklı — örn. bazıları korur, bazıları reset eder).
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationResult {
  const { initialPage = 1, initialPageSize = 50, total = 0 } = options;

  const [page, setPageState] = useState<number>(Math.max(1, initialPage));
  const [pageSize, setPageSizeState] = useState<number>(Math.max(1, initialPageSize));
  const [totalState, setTotalState] = useState<number>(total);

  // total prop dışarıdan değişirse senkron tut.
  if (total !== totalState) {
    // Render esnasında setState — React 18+ otomatik batch'liyor; sadece
    // gerçek değer farkı varsa tetiklenir.
    setTotalState(total);
  }

  const setPage = useCallback((next: number) => {
    setPageState(Math.max(1, Math.floor(next)));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(Math.max(1, Math.floor(size)));
  }, []);

  const resetPage = useCallback(() => {
    setPageState(Math.max(1, initialPage));
  }, [initialPage]);

  const totalPages = useMemo(
    () => (pageSize > 0 ? Math.max(1, Math.ceil(totalState / pageSize)) : 1),
    [pageSize, totalState],
  );

  return {
    page,
    pageSize,
    total: totalState,
    totalPages,
    setPage,
    setPageSize,
    resetPage,
  };
}

export default usePagination;
