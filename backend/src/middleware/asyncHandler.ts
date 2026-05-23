import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * `asyncHandler` — async route handler'larını saran küçük yardımcı.
 *
 * Yakalanmayan promise rejection'larını otomatik olarak `next(err)` ile
 * Express error middleware zincirine aktarır; bu sayede her route'a tek
 * tek `try { ... } catch (err) { next(err); }` yazmaktan kurtulur.
 *
 * KULLANIMI (bu phase'de ZORUNLU değil — sadece yardımcı olarak eklendi):
 *
 *   router.get('/foo', asyncHandler(async (req, res) => {
 *     const data = await someAsync();
 *     res.json(data);
 *   }));
 *
 * NOTLAR:
 * - Bu turda hiçbir route bu helper'a taşınmadı. Spec: helper ekle, yayma.
 * - Pilot dosya seçilirse `routes/karaliste.ts` gibi küçük bir dosya
 *   tercih edilmeli, ayrı bir phase'de yapılmalı.
 * - Mevcut route davranışı, status kodları, hata mesajları değişmemeli.
 */
export const asyncHandler =
  <Req extends Request = Request, Res extends Response = Response>(
    handler: (req: Req, res: Res, next: NextFunction) => Promise<unknown> | unknown,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req as Req, res as Res, next)).catch(next);
  };

export default asyncHandler;
