import { ErrorRequestHandler } from 'express';
import logger from '../utils/logger';

/**
 * Global Express error middleware.
 *
 * `asyncHandler` ile sarılmış route'larda fırlatılan/reject olan promise'ler
 * Express tarafından bu middleware'e iletilir. Davranış, mevcut route
 * dosyalarındaki try/catch ile bire bir uyumludur:
 *   - log: `logger.error(...)` (önceki `console.error` proxy'si)
 *   - http: status 500, body `{ message: 'Sunucu hatası' }`
 *
 * `(err as any).status` set edilmişse, o status kullanılır ve hata mesajı
 * (varsa) iletilir — bu sayede ileride asyncHandler + `next(err)` ile
 * domain hataları taşıyabilir, ama mevcut kod buna güvenmez.
 *
 * (Part 2 / P2.D4)
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error('Beklenmeyen hata:', err);
  if (res.headersSent) {
    return;
  }
  const rawStatus = (err as { status?: unknown })?.status;
  const status =
    typeof rawStatus === 'number' && Number.isInteger(rawStatus) && rawStatus >= 400 && rawStatus < 600
      ? rawStatus
      : 500;
  const rawMessage = (err as { message?: unknown })?.message;
  const message =
    status === 500 || typeof rawMessage !== 'string' || !rawMessage
      ? 'Sunucu hatası'
      : rawMessage;
  res.status(status).json({ message });
};

export default errorHandler;
