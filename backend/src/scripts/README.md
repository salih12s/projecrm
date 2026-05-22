# Backend scripts

Bu klasörde **tek seferlik bakım**, **migration legacy**, **seed** ve **admin yardımcı** scriptleri bulunur.

## Klasör yapısı
- `admin/` — admin kullanıcı yönetimi yardımcıları (hash üretme, şifre güncelleme, admin tablosu yaratma)
- `seed/` — test verisi üreten scriptler (createTestUser vb.)
- `dev/` — geliştirme sırasında kullanılan teşhis scriptleri (checkBayiler, checkAndFixDates)
- `migrations-legacy/` — eski tek seferlik şema değişikliği scriptleri (idempotent, çoğu zaten production'da çalıştırılmış)
- `sql/` — eski ham `.sql` dosyaları (referans amaçlı; runner yok)

## Önemli kurallar
- **Runtime server kodu** `routes/`, `middleware/`, `db.ts`, `server.ts` altında kalır. Bu klasör runtime'a karışmaz.
- **Startup sırasında** `server.ts` tarafından import edilen dosyalar **bu turda taşınmadı**:
  - `createTables.ts`
  - `initLocations.ts`
  - `addNoteNoToAtolyeTable.ts`
  - `addSahaPerformanceIndexes.ts`
  - Bu dosyalar `backend/src/` kökünde kaldı; ileride bir `bootstrap/` klasörüne taşınabilir (Phase 4+).
- **`fetchLocations.ts`** `backend/package.json` içinde `postbuild` ve `fetch-locations` script'i ile referans aldığı için **kökte kaldı**.
- **`runAtolyeMigration.ts`** `__dirname` ile `migrations/` SQL dosyasını okuyor; taşınması path bozar → **bu turda ertelendi**, kökte kaldı.
- **Migration runner yoktur**; `migrations-legacy/` klasörü yalnızca mevcut teknik borcu düzenlemek içindir. Yeni migration ihtiyacı için ileride `node-pg-migrate` veya benzeri bir runner değerlendirilebilir (Phase 4+).

## Bir script nasıl çalıştırılır?
Önce `cd backend`, sonra:

```powershell
# TS olarak doğrudan
npx ts-node src/scripts/admin/generateAdminHash.ts

# Veya build sonrası
npm run build
node dist/scripts/admin/generateAdminHash.js
```

Bu scriptler `DATABASE_URL` env'i set olduğunda DB'ye bağlanır. Üretim DB'sine bağlanmadan önce `.env.development`'ın yüklü olduğundan emin ol.
