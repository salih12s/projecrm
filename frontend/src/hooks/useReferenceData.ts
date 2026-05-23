import { useCallback, useEffect, useState } from 'react';
import {
  teknisyenService,
  markaService,
  montajService,
  aksesuarService,
  urunService,
  locationService,
} from '../services/api';
import type { Teknisyen, Marka, Montaj, Aksesuar, Urun } from '../types';
import type { Ilce } from '../services/location.service';

export type ReferenceKey =
  | 'teknisyenler'
  | 'markalar'
  | 'montajlar'
  | 'aksesuarlar'
  | 'urunler'
  | 'ilceler';

export interface ReferenceDataCacheConfig {
  /** localStorage key for the JSON payload */
  storageKey: string;
  /** TTL in milliseconds */
  ttlMs: number;
}

export interface UseReferenceDataOptions {
  /** Which reference lists to load. Default: all six. */
  keys?: ReferenceKey[];
  /** Disable auto-load (e.g. dialog closed, non-admin). Default: true. */
  enabled?: boolean;
  /**
   * Optional localStorage cache. Time stamp is stored at `${storageKey}Time`.
   * Matches the legacy IslemDialog pattern exactly.
   */
  cache?: ReferenceDataCacheConfig;
}

export interface UseReferenceDataResult {
  teknisyenler: Teknisyen[];
  markalar: Marka[];
  montajlar: Montaj[];
  aksesuarlar: Aksesuar[];
  urunler: Urun[];
  ilceler: Ilce[];
  loading: boolean;
  error: unknown;
  refetch: () => Promise<void>;
}

const ALL_KEYS: ReferenceKey[] = [
  'teknisyenler',
  'markalar',
  'montajlar',
  'aksesuarlar',
  'urunler',
  'ilceler',
];

/**
 * Loads the shared reference lists (teknisyen / marka / montaj / aksesuar /
 * urun / ilce) used by IslemDialog and IslemFilters.
 *
 * - Endpoint paths and payload shapes are unchanged (delegates to existing
 *   *Service.getAll() / locationService.getIlceler()).
 * - Only the keys passed in `options.keys` are fetched; defaults to all six.
 * - Optional localStorage cache preserves the legacy 5-min TTL pattern from
 *   IslemDialog (`islemDialogData` + `islemDialogDataTime`).
 * - Does NOT own snackbar, validation, or UI state — caller keeps those.
 */
export function useReferenceData(
  options: UseReferenceDataOptions = {}
): UseReferenceDataResult {
  const { keys = ALL_KEYS, enabled = true, cache } = options;

  const [teknisyenler, setTeknisyenler] = useState<Teknisyen[]>([]);
  const [markalar, setMarkalar] = useState<Marka[]>([]);
  const [montajlar, setMontajlar] = useState<Montaj[]>([]);
  const [aksesuarlar, setAksesuarlar] = useState<Aksesuar[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [ilceler, setIlceler] = useState<Ilce[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);

  const keysCsv = keys.join(',');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeKeys = keysCsv.split(',').filter(Boolean) as ReferenceKey[];

      // Cache hit path (only when caller opts in)
      if (cache) {
        const cachedData = localStorage.getItem(cache.storageKey);
        const cacheTime = localStorage.getItem(`${cache.storageKey}Time`);
        const now = Date.now();
        if (
          cachedData &&
          cacheTime &&
          now - parseInt(cacheTime) < cache.ttlMs
        ) {
          const parsed = JSON.parse(cachedData);
          if (activeKeys.includes('teknisyenler')) setTeknisyenler(parsed.teknisyenler ?? []);
          if (activeKeys.includes('markalar')) setMarkalar(parsed.markalar ?? []);
          if (activeKeys.includes('montajlar')) setMontajlar(parsed.montajlar ?? []);
          if (activeKeys.includes('aksesuarlar')) setAksesuarlar(parsed.aksesuarlar ?? []);
          if (activeKeys.includes('urunler')) setUrunler(parsed.urunler ?? []);
          if (activeKeys.includes('ilceler')) setIlceler(parsed.ilceler ?? []);
          return;
        }
      }

      // Network path — only requested keys are fetched.
      const fetchers: Array<Promise<unknown>> = [];
      const order: ReferenceKey[] = [];
      const pushFetch = (k: ReferenceKey, p: Promise<unknown>) => {
        order.push(k);
        fetchers.push(p);
      };
      if (activeKeys.includes('teknisyenler')) pushFetch('teknisyenler', teknisyenService.getAll());
      if (activeKeys.includes('markalar')) pushFetch('markalar', markaService.getAll());
      if (activeKeys.includes('montajlar')) pushFetch('montajlar', montajService.getAll());
      if (activeKeys.includes('aksesuarlar')) pushFetch('aksesuarlar', aksesuarService.getAll());
      if (activeKeys.includes('urunler')) pushFetch('urunler', urunService.getAll());
      if (activeKeys.includes('ilceler')) pushFetch('ilceler', locationService.getIlceler());

      const results = await Promise.all(fetchers);

      const next: Partial<Record<ReferenceKey, unknown>> = {};
      order.forEach((k, i) => {
        next[k] = results[i];
      });
      if (activeKeys.includes('teknisyenler')) setTeknisyenler((next.teknisyenler as Teknisyen[]) ?? []);
      if (activeKeys.includes('markalar')) setMarkalar((next.markalar as Marka[]) ?? []);
      if (activeKeys.includes('montajlar')) setMontajlar((next.montajlar as Montaj[]) ?? []);
      if (activeKeys.includes('aksesuarlar')) setAksesuarlar((next.aksesuarlar as Aksesuar[]) ?? []);
      if (activeKeys.includes('urunler')) setUrunler((next.urunler as Urun[]) ?? []);
      if (activeKeys.includes('ilceler')) setIlceler((next.ilceler as Ilce[]) ?? []);

      // Persist cache (only when caller opts in)
      if (cache) {
        const payload = {
          teknisyenler: (next.teknisyenler as Teknisyen[]) ?? [],
          markalar: (next.markalar as Marka[]) ?? [],
          montajlar: (next.montajlar as Montaj[]) ?? [],
          aksesuarlar: (next.aksesuarlar as Aksesuar[]) ?? [],
          urunler: (next.urunler as Urun[]) ?? [],
          ilceler: (next.ilceler as Ilce[]) ?? [],
        };
        localStorage.setItem(cache.storageKey, JSON.stringify(payload));
        localStorage.setItem(`${cache.storageKey}Time`, Date.now().toString());
      }
    } catch (err) {
      setError(err);
      // Caller is responsible for surfacing (snackbar/log). Preserve legacy behavior.
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  }, [keysCsv, cache?.storageKey, cache?.ttlMs]);

  useEffect(() => {
    if (!enabled) return;
    load();
  }, [enabled, load]);

  return {
    teknisyenler,
    markalar,
    montajlar,
    aksesuarlar,
    urunler,
    ilceler,
    loading,
    error,
    refetch: load,
  };
}
