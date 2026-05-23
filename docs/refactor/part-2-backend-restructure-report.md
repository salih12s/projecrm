# Part 2 — Backend Restructure Raporu

**Branch:** `refactor/phase-0-baseline`
**Tag (öncesi):** `part-1-complete` (`139edd9`)
**Tag (sonrası):** `part-2-complete`

Bu doküman Part 2 kapsamında backend'de yapılan, davranışı korumayı garanti
eden, küçük adımlı (commit-per-substep) refaktör hareketlerini özetler.

---

## 0. Hedef ve sınırlar

- Tüm değişiklikler **davranışı korur** (request/response gövdeleri, status
  kodları, sıralama, init sırası, log içerikleri).
- **Frozen dosyalar** (asla dokunulmaz): `frontend/src/utils/print.ts`,
  `frontend/src/utils/excel.ts`, `frontend/src/components/settings/PrintEditor.tsx`.
- **SQL dosyaları** düzenlenmez (sadece yer değiştirilebilir).
- Her substep ayrı, atomik bir commit'tir → kolay rollback.

---

## 1. C — `pool.query` → `query()` (retry-aware wrapper)

`backend/src/db.ts` zaten Part 1'de eklenen `query<T>(text, params, retries=2)`
fonksiyonunu sunuyor. Bu wrapper, transient PostgreSQL hatalarında
(40001, 40P01, 57P01-03, 53300/400, 08*, ECONNRESET, ETIMEDOUT, EPIPE)
otomatik yeniden dener. Part 2 / C* commit'leri tüm route dosyalarındaki
`pool.query(...)` çağrılarını `query(...)`'a taşıdı.

| Adım | Commit | Dosyalar |
| --- | --- | --- |
| P2.C1 | `f60dd62` | `routes/karaliste.ts` (6 site) |
| P2.C2 | `6faba66` | `routes/{markalar,teknisyenler,montajlar,aksesuarlar,urunler}.ts` |
| P2.C3 | `0b82bc4` | `routes/{bayiler,locations}.ts` |
| P2.C4 | `28c13e0` | `routes/{atolye,saha}.ts` (lokal `query` değişkenleri `sql`'e renamelendi) |
| P2.C5 | `57b270b` | `routes/{admin,auth}.ts` |

**Doğrulama:** `Select-String backend/src/routes/*.ts 'pool\.query'` → **0**.

`pool.query` hâlâ kullanımda olduğu yerler:
- `backend/src/bootstrap/*` — uygulama başlatma DDL'leri (bilinçli; retry
  zaten `withRetry()` ile server.ts içinde yapılıyor).
- `backend/src/scripts/*` — tek-seferlik geliştirici scriptleri.
- `backend/src/db.ts` — wrapper'ın kendisi.

---

## 2. D — Klasör yeniden yapılandırması ve hata mimarisi

### P2.D1 — `backend/src/bootstrap/` (commit `67f552d`)

Uygulama başlatma sırasında çalışan DDL/seed yardımcıları flat `src/`'den
ayrıldı.

Taşınanlar:
- `createTables.ts`
- `initLocations.ts`
- `addNoteNoToAtolyeTable.ts`
- `addSahaPerformanceIndexes.ts`

Yeni dosya:
- `bootstrap/createKaralisteTable.ts` — `routes/karaliste.ts` içindeki aynı
  isimli `export const` buraya alındı. Route dosyaları artık yalnız HTTP
  handler'ları içerir.

`server.ts`'deki 5 import yolu güncellendi. Davranış değişmedi.

### P2.D2 — `backend/src/scripts/` (commit `1c5c5f5`)

`scripts/` ağacı zaten Part 0/1'de oluşturulmuştu (admin/, dev/,
migrations-legacy/, seed/, sql/, README.md). Part 2'de geriye kalan iki
dosya yerine kondu:

- `fetchLocations.ts` → `scripts/dev/fetchLocations.ts`
- `runAtolyeMigration.ts` → `scripts/migrations-legacy/runAtolyeMigration.ts`

`backend/package.json` script yolları güncellendi:
- `postbuild`: `node dist/scripts/dev/fetchLocations.js`
- `fetch-locations`: `ts-node src/scripts/dev/fetchLocations.ts`

Artık `backend/src/` kökü yalnızca `db.ts`, `server.ts` ve alt klasörleri
içerir.

### P2.D3 — `logger` migrasyonu (commit `af38008`)

`backend/src/routes/**/*.ts` içindeki tüm `console.error(...)` çağrıları
`logger.error(...)` ile değiştirildi. Her route dosyasına son import
satırından sonra `import logger from '../utils/logger';` eklendi.

`utils/logger.ts` halen `console.*`'a ince bir proxy; runtime davranış
birebir aynı, fakat artık merkezi tek bir noktadan değiştirilebilir.

**Doğrulama:** `Select-String backend/src/routes/*.ts 'console\.error'` → **0**.

### P2.D4 — `errorHandler` + `asyncHandler` (karaliste pilot, commit `80b7809`)

Yeni dosya: `backend/src/middleware/errorHandler.ts`. Global Express error
middleware:
- log: `logger.error('Beklenmeyen hata:', err)`
- response: status 500, body `{ message: 'Sunucu hatası' }` (önceki
  per-route try/catch davranışıyla bire bir).
- `(err as any).status` set edilmişse 4xx için o status ve gerçek
  `err.message` kullanılır (geleceğe yönelik domain-error desteği).

`server.ts`: tüm route mount'larından sonra `app.use('/api', errorHandler)`.

Pilot: `routes/karaliste.ts` handler'ları `asyncHandler` ile sarıldı,
try/catch blokları kaldırıldı. Tek tipli hata akışı artık merkezi.
Response gövdeleri ve status kodları değişmedi.

`asyncHandler` zaten Part 1'de eklenmiş ve kullanılmaya hazır beklemekteydi
(`middleware/asyncHandler.ts`).

---

## 3. Doğrulama (Part 2 sonu kapı)

| Kriter | Sonuç |
| --- | --- |
| `backend npx tsc --noEmit` | ✅ exit 0 |
| `backend npm run build` | ✅ |
| `frontend npx tsc --noEmit` | ✅ exit 0 |
| `backend eslint` | 0 error / 27 warn (Part 1 sonu: 0/?) |
| `frontend eslint` | 0 error / 192 warn |
| `pool.query` in `routes/**` | 0 |
| `console.error` in `routes/**` | 0 |
| Davranış değişikliği | yok (route gövdeleri ve status kodları aynı) |
| `frontend/src/utils/{print,excel}.ts`, `PrintEditor.tsx` diff | ✅ dokunulmadı |
| SQL dosya içerikleri | ✅ dokunulmadı (sadece taşındı) |

---

## 4. Commit özeti

```
80b7809 refactor(backend): add errorHandler middleware + karaliste asyncHandler pilot (Part 2 / P2.D4)
af38008 refactor(backend): migrate routes to logger.error (Part 2 / P2.D3)
1c5c5f5 refactor(backend): finalize scripts/ layout (Part 2 / P2.D2)
67f552d refactor(backend): relocate bootstrap initializers to backend/src/bootstrap/ (Part 2 / P2.D1)
57b270b refactor(backend): migrate admin and auth routes to query() (Part 2 / P2.C5)
28c13e0 refactor(backend): migrate atolye and saha routes to query() (Part 2 / P2.C4)
0b82bc4 refactor(backend): migrate bayiler and locations routes to query() (Part 2 / P2.C3)
6faba66 refactor(backend): migrate reference routes to query() wrapper (Part 2 / P2.C2)
f60dd62 refactor(backend): migrate karaliste route to query() wrapper (Part 2 / P2.C1)
```

---

## 5. Rollback opsiyonları

- **Yalnız Part 2 geri al:** `git reset --hard part-1-complete`
- **Tam baseline'a dön:** `git reset --hard checkpoint/pre-deep-refactor`

---

## 6. Sonraki adım

Part 3 — Frontend mega bileşen ayrımları (`IslemTable`, `IslemDialog`,
`AtolyeTakip`, `Dashboard`) + bundle iyileştirmesi.
Frozen dosyalar yine dokunulmayacak. Kullanıcı onayı ("Part 3'e geç")
beklenecek.
