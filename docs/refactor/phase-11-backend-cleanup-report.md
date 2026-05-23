# Phase 11 — Backend Low-Risk Cleanup Report

> Branch: `refactor/phase-0-baseline` · Tek commit'in backend ayağıdır.

## Oluşturulan / Değişen Dosyalar

| Dosya                                              | Durum   | Açıklama                                                                 |
| -------------------------------------------------- | ------- | ------------------------------------------------------------------------ |
| `backend/src/types/express.d.ts`                   | **YENİ** | Merkezi `Express.Request.user?: AuthPayload` augmentation + `req.app.get('io')` için ertelenmiş typing planı (yorum).             |
| `backend/src/types/index.ts`                       | **DEĞİŞTİ** | `AuthPayload` interface'ine optional `role?: string` ve `bayiIsim?: string` alanları eklendi (JWT payload ile uyumlu hale geldi). |
| `backend/src/middleware/asyncHandler.ts`           | **YENİ** | Generic async route wrapper. Hiçbir route henüz buna taşınmadı.          |
| `backend/src/utils/logger.ts`                      | **YENİ** | `logger.info/warn/error/debug`. Tek bir mevcut `console.*` çağrısı taşınmadı.  |
| `docs/refactor/backend-query-standardization-plan.md` | **YENİ** | `pool.query` → `query()` wrapper geçiş planı + route bazlı sayım tablosu. |

## Değişmeyen Davranışlar (verify edildi)

- ✅ Hiçbir API endpoint URL'i, HTTP method'u veya status kodu değişmedi.
- ✅ Hiçbir request/response body alanı eklenmedi/kaldırılmadı.
- ✅ Hiçbir DB sorgu metni veya parametre düzeni değiştirilmedi.
- ✅ Auth/JWT akışı (`routes/auth.ts`, `middleware/auth.ts`) byte-bazlı değişmedi.
- ✅ JWT payload formatı (`{ id, username, role?, bayiIsim? }`) değişmedi; sadece TypeScript tarafında daha doğru typed hale geldi.
- ✅ CORS, Socket.IO event isimleri, PDF/Excel kodu, migration dosyaları, `package.json` script'leri değişmedi.
- ✅ Hiçbir mevcut `console.log/warn/error` çağrısı `logger.*` ile değiştirilmedi.
- ✅ Hiçbir route dosyası `asyncHandler` ile sarılmadı.

## Route Dosyalarına Dokunuldu Mu?

**Hayır.** `backend/src/routes/*.ts` altında tek bir dosya bu phase'de modifiye edilmedi.
Mevcut 10 adet `(req as any)` cast'i (atolye.ts × 4, karaliste.ts × 1, saha.ts × 5) olduğu gibi bırakıldı; type augmentation sayesinde teknik olarak artık gereksizler ama temizlik ayrı bir küçük PR'a bırakıldı.

## Test Sonuçları

- ✅ `cd backend; npx tsc --noEmit` → no output (clean exit).
- ⏭️ Runtime smoke testleri bu phase için gerekli değil (helper-only, side-effect yok).

## Riskli Alanlar / Bilinen Kısıtlar

- `express.d.ts` ile `middleware/auth.ts` içinde aynı `Request.user?` augmentation iki kez declare ediliyor. TypeScript declaration merging sayesinde sorun yok; ileride auth.ts'deki blok silinip merkezileştirilebilir (ayrı PR).
- `req.app.get('io')` tipi hâlâ `any`. Tighten etmek için socket.io `Server` tipini ambient olarak import etmek gerekiyor; yan etkileri olabilir, ertelendi.
- `logger` şu an `console.*`'a delege ediyor; ileride pino/winston entegrasyonu yapılırsa internal yapı değişebilir ama public API (`info/warn/error/debug`) stabil kalmalı.

## Sonraki Backend Adımı (önerilen)

1. `karaliste.ts` pilot: `pool.query` → `query()` migration (plan doc'taki kurallarla).
2. `auth.ts`/`middleware/auth.ts` içindeki `req.user` cast cleanup'ı (type augmentation zaten yeterli).
3. Tek bir route dosyasında `asyncHandler` pilot uygulaması.
