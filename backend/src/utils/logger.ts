/**
 * Minimal logger wrapper — ileride `console.*` çağrılarını merkezi hale
 * getirmek için. Bu turda hiçbir mevcut `console.log/error` çağrısı bu
 * helper'a taşınmadı (spec: helper ekle, mevcut console'lara dokunma).
 *
 * Davranış:
 *   - `info`, `warn`, `error` her zaman ilgili `console` metoduna delege eder.
 *   - `debug` sadece `NODE_ENV !== 'production'` ise yazar; production'da no-op.
 *   - Mesaj/format/arg sırası değiştirilmez; mevcut `console.log` çağrılarına
 *     birebir denk olacak şekilde rest-parameter forwarding kullanılır.
 *
 * Migration planı (bu turda yapılmadı):
 *   1. Yeni eklenen kod yazılırken doğrudan `logger.X` kullan.
 *   2. Tek bir route dosyasında (örn. karaliste) `console.error` → `logger.error`
 *      pilot taşıma yapılır ve log formatı production'da doğrulanır.
 *   3. Daha sonra route dosyaları sırayla taşınır. Format zorunlu olarak aynı kalır.
 */

const isProduction = (): boolean => process.env.NODE_ENV === 'production';

export const logger = {
  info: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    console.log(...args);
  },
  warn: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    console.error(...args);
  },
  debug: (...args: unknown[]): void => {
    if (isProduction()) return;
    // eslint-disable-next-line no-console
    console.debug(...args);
  },
};

export default logger;
