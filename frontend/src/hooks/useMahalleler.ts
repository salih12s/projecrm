import { useCallback, useEffect, useState } from 'react';
import { locationService } from '../services/location.service';
import type { Mahalle } from '../services/location.service';

export interface UseMahallelerOptions {
  /** Disable auto-fetch (e.g. dialog closed). Default: true. */
  enabled?: boolean;
}

export interface UseMahallelerResult {
  data: Mahalle[];
  loading: boolean;
  error: unknown;
  refetch: () => Promise<void>;
}

/**
 * Loads mahalleler for a given ilceId via `locationService.getMahalleler`.
 *
 * - Endpoint path unchanged.
 * - When `ilceId` is null/undefined or `enabled` is false, no request is sent
 *   and `data` is reset to []. Matches the legacy IslemDialog behavior.
 * - Console error wording preserved on failure.
 */
export function useMahalleler(
  ilceId: number | null | undefined,
  options: UseMahallelerOptions = {}
): UseMahallelerResult {
  const { enabled = true } = options;
  const [data, setData] = useState<Mahalle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    if (!enabled || !ilceId) {
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await locationService.getMahalleler(ilceId);
      setData(result);
    } catch (err) {
      setError(err);
      console.error('Mahalleler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  }, [ilceId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
