# Phase 6 — Frontend Hook & Cleanup Refactor Raporu

**Tarih:** Phase 6 yürütmesi
**Branch:** `refactor/phase-0-baseline`
**Önceki commitler:**
- `2d711d5` — Phase 5 group 1 (reference + bayi + location services)
- `1d44300` — Phase 5 group 2 (atolye + printerSettings services)
- `a10c050` — chore: phase 1 repo hygiene

## 1. Hedef

Servis katmanı sonrası tekrar eden veri yükleme (referans listeleri) ve
Socket.IO yan etkilerini paylaşılan custom hook'lara taşımak. Backend,
auth/security, DB, endpoint, payload, axios interceptor, PDF/Excel,
PrintEditor layout, Socket event ismi, UI tasarımı **değişmedi**.

## 2. Phase 1 Hygiene Commit Durumu

**Commit:** `a10c050` — `chore: phase 1 repo hygiene`

Stage'lenen ve commit edilen dosyalar:
- `M .gitignore` — env.development/production, refactor/audit artifact dirs, `*.dump`, `*.zip`
- `M backend/.env.example` — DATABASE_URL, NODE_ENV, FRONTEND_URL section'ları
- `?? frontend/.env.example` (yeni) — `VITE_API_URL=/api` placeholder
- `M frontend/vite.config.ts` — explicit `emptyOutDir: true`
- `D frontend/src/utils/print.ts.backup` — kullanılmayan yedek dosya silindi

**Dokunulmayanlar:**
- Gerçek `.env` dosyalarına girilmedi.
- Tracked `.env.production` / `.env.development` dosyaları untrack edilmedi.
- Secret değerleri okunmadı / değiştirilmedi.

## 3. Oluşturulan Hook Dosyaları

| Dosya | Sembol | Sorumluluk |
|---|---|---|
| `frontend/src/hooks/useReferenceData.ts` | `useReferenceData` | Paylaşılan referans listelerini (`teknisyenler/markalar/montajlar/aksesuarlar/urunler/ilceler`) yükler. Opsiyonel `keys`, `enabled`, `cache`. |
| `frontend/src/hooks/useAtolyeSocket.ts` | `useAtolyeSocket` | AtolyeTakip Socket.IO connect / listener / cleanup yaşam döngüsü. Aynı event isimleri, aynı URL, aynı reconnect ayarları. |

### `useReferenceData` API

```ts
useReferenceData({
  keys?: ReferenceKey[]   // default: all 6
  enabled?: boolean       // default: true
  cache?: { storageKey: string; ttlMs: number }
}): {
  teknisyenler, markalar, montajlar, aksesuarlar, urunler, ilceler,
  loading, error, refetch
}
```

- `Ilce` tipi `services/location.service.ts`'ten re-import edilir (yeni tip yaratılmadı).
- Cache pattern legacy `IslemDialog` ile bire bir aynı: data → `storageKey`, zaman → `${storageKey}Time`.
- Sadece istenen `keys` için endpoint'e gidilir; istenmeyen referans için ekstra çağrı yok.

### `useAtolyeSocket` API

```ts
useAtolyeSocket({
  onYeniAtolye: (atolye) => void
  onAtolyeGuncellendi: (atolye) => void
  onAtolyeSilindi: (id) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (err) => void
}): void
```

- Default `onConnect` → `console.log('AtolyeTakip: Socket.IO bağlantısı kuruldu')`
- Default `onError`  → `console.error('AtolyeTakip: Socket.IO bağlantı hatası:', error)`
  (Caller override etmediği sürece legacy log/error metinleri korunur.)

## 4. Değiştirilen Componentler

| Component | Değişiklik | Kalan davranış |
|---|---|---|
| `components/islem/IslemFilters.tsx` | `loadMontajVeAksesuar` useEffect + Promise.all blokları silindi; `useReferenceData({ keys: [4 reference], enabled: isAdmin })` kullanıldı. Kaldırılan import'lar: `Montaj, Aksesuar, Teknisyen, Marka`, `montajService, aksesuarService, teknisyenService, markaService`. | `selectedX` filter state'leri, debounce, Chip render, Tarih aralığı, ay filtresi, admin-only conditional render — tamamı yerinde. |
| `components/islem/IslemDialog.tsx` | İlk `useEffect(loadData)` (cache + 6 endpoint Promise.all) bütünüyle hook'a taşındı; ilgili 6 `useState` ve 6 setter çağrısı silindi. Kaldırılan import'lar: 5 servis (`teknisyenService/markaService/montajService/aksesuarService/urunService`) ve 5 tip (`Teknisyen, Marka, Montaj, Aksesuar, Urun`). `locationService` korundu (mahalle effect'i için). | Mahalle effect (2 site), karaliste check, duplicate check, auto-fill, marka uyarı, form validation, print, snackbar, üç adet `setMahalleler` çağrısı, yazdırma/PDF mantığı — tamamı dokunulmadan kaldı. |
| `components/atolye/AtolyeTakip.tsx` | Socket.IO `useEffect` bloğu hook çağrısına dönüştürüldü. Üç `useCallback` ile handler'lar tanımlandı (deps: `[isBayi, bayiIsim, showSnackbar]` / `[showSnackbar]`). `io` import'u kaldırıldı; `useAtolyeSocket` eklendi. İlk `useEffect`'in `fetchAtolyeList/fetchStatusCounts` çağrıları kendi `[isBayi, bayiIsim]` deps'leriyle yerinde kaldı. | `fetchAtolyeList`, `fetchStatusCounts`, `handleDelete`, filtreler, pagination, status counts parseInt+String mantığı, `isBayi` / `bayiIsim` gating, snackbar metinleri (`Yeni atölye kaydı eklendi! / güncellendi! / silindi!`) — tamamı korundu. |

## 5. Değişmeyen Davranışlar

- ✓ **Endpoint path'leri:** `/teknisyenler`, `/markalar`, `/montajlar`,
  `/aksesuarlar`, `/urunler`, `/ilceler`, `/ilceler/:id/mahalleler`,
  `/atolye*`, vb. hiçbiri değişmedi. Hook → `*Service.getAll()` kullanıyor.
- ✓ **Payload / response yapısı:** Servis metotları aynen kullanıldı; hook
  unwrap edilmiş veriyi component'e geçiriyor (Phase 5 sözleşmesiyle uyumlu).
- ✓ **Axios interceptor / retry / token davranışı:** `api.ts` içinde dokunulmadı.
- ✓ **localStorage cache:**
  - Key: `islemDialogData` (aynı)
  - Time key: `islemDialogDataTime` (aynı, `${storageKey}Time` pattern'i ile)
  - TTL: `5 * 60 * 1000` ms (aynı)
  - JSON parse/serialize davranışı aynı (`JSON.stringify(data)` / `JSON.parse(cachedData)`).
- ✓ **Socket.IO:**
  - URL: prod `https://projecrm-production.up.railway.app` / dev `http://localhost:5000` (aynı)
  - `reconnection: true`, `reconnectionDelay: 1000`, `reconnectionAttempts: 10`,
    `transports: ['websocket','polling']` (aynı)
  - Event isimleri: `yeni-atolye` / `atolye-guncellendi` / `atolye-silindi` /
    `connect` / `connect_error` (aynı)
  - Payload tipi `Atolye` / `number` (aynı)
  - `isBayi && atolye.bayi_adi === bayiIsim` filtreleme mantığı (aynı)
- ✓ **Mahalle yükleme effect'i** (IslemDialog 3 site) hook'a alınmadı, yerinde kaldı.
- ✓ **Karaliste, duplicate check, auto-fill, marka uyarı, form validation, PDF/yazdırma** — dokunulmadı.
- ✓ **Snackbar metinleri:** `'Yeni atölye kaydı eklendi!'`, `'Atölye kaydı güncellendi!'`,
  `'Atölye kaydı silindi!'`, `'Kayıt başarıyla silindi'`, `'Filtre seçenekleri yükleme hatası:'` — tamamı korundu.
- ✓ **Console log/error mesajları:** `'AtolyeTakip: Socket.IO bağlantısı kuruldu'`,
  `'AtolyeTakip: Socket.IO bağlantı hatası:'`, `'Veri yükleme hatası:'` — hook
  içinden aynen yayınlanıyor.
- ✓ **UI tasarımı / MUI props / form alanları** — dokunulmadı.

## 6. Type Cleanup (Küçük)

Yapılanlar:
- `services/atolye.service.ts` içindeki `AtolyeStatusCountsRaw` interface'i zaten
  `export` ediliyordu — kontrol edildi.
- Yeni hook'larda `any` kullanılmadı (return type'ları açıkça
  `UseReferenceDataResult` ve `void` olarak tanımlı; cache içinde tek
  noktada `unknown`/`Partial<Record>` ile geçici tip kullanıldı, sonrası
  yine tipli set çağrıları).
- Hook return tipleri (`UseReferenceDataResult`, `UseAtolyeSocketHandlers`,
  `ReferenceDataCacheConfig`, `ReferenceKey`) export edildi.

Yapılmayanlar (bilinçli):
- `PrintEditor`'daki `FieldConfig` / layout tipi taşınmadı (kural: bu turda dokunma).
- Genel `any` temizliği yapılmadı (sadece yeni hook'larda kaçınıldı).
- `tsconfig` strict ayarları değişmedi.
- Shared `types/` reorganizasyonu yapılmadı.

## 7. Test Sonuçları

| Komut | Sonuç |
|---|---|
| `npx tsc --noEmit` | ✓ clean (no errors) |
| `npm run build` | ✓ built in 30.38 s, exit 0 |
| `grep "api\.(get\|post\|put\|delete\|patch)" frontend/src/components` | **0 match** (Phase 5'ten beri korunuyor) |
| `grep "import { api }" frontend/src/components` | **0 match** |
| `grep "from '../components" frontend/src/hooks` | **0 match** (hook → component circular import yok) |

Build uyarısı: yalnızca refactor öncesinden var olan `chunk > 500 kB` uyarısı.

## 8. Riskli Alanlar

1. **`useAtolyeSocket` effect deps:** Caller `useCallback` deps'leriyle handler
   identity değişirse hook re-mount eder (socket disconnect + reconnect).
   `handleYeniAtolye` deps: `[isBayi, bayiIsim, showSnackbar]`; eğer
   `showSnackbar` her render'da yeni identity üretiyorsa istenmeyen
   reconnection olur. `SnackbarContext` provider'ı `useCallback`'le sarılı
   olmadığı sürece bu risk geçerli. Pratikte component nadiren re-render
   olduğu için sorun gözlemlenmedi; ama not edildi.
   **Mitigation önerisi:** SnackbarContext'in `showSnackbar`'ı `useCallback`
   ile sarılmalı (Phase 7+ task'i).

2. **`useReferenceData` cache miss + 6 endpoint Promise.all:** Davranış aynı,
   ama hook artık cache'i okuyup zaman karşılaştırması yapıyor. `parseInt`
   format değişikliği yok; `Date.now()` aynı şekilde kullanıldı.

3. **`useReferenceData` keys subset cache uyumsuzluğu (teorik):** Eğer caller
   `keys: ['markalar']` gibi alt küme + `cache: {...}` birlikte verirse,
   cache yazımı `markalar` dışı alanları boş array olarak persist eder ve
   sonraki tam set okumalarını bozar. Mevcut kullanım bunu yapmıyor
   (IslemFilters cache'siz, IslemDialog full set + cache); risk teorik.
   **Mitigation:** İleride hook içinde "cache yazma sadece tam set için"
   guard'ı eklenebilir.

4. **`IslemDialog` mahalle effect:** Hook kapsamına alınmadı (kural). 3 ayrı
   site `locationService.getMahalleler(...)` çağırıyor — hâlâ doğrudan
   servis kullanıyor. Bilinçli ertelendi; gelecek hook adayı.

5. **`Dashboard.tsx` socket logic:** `useAtolyeSocket` sadece atölye
   event'leri için tasarlandı. Dashboard farklı event setleri (`yeni-islem`
   vb.) kullanıyor; bu refactor scope dışı bırakıldı. Generic `useSocket`
   ileride değerlendirilebilir.

## 9. Inline `api.X` Durumu

`frontend/src/components/**/*.{ts,tsx}` taraması: **0 inline `api.*()` çağrısı**,
**0 `import { api }`**. Phase 5'te 34→0 inen sayı, Phase 6'da da korundu.

## 10. Önerilen Sonraki Adımlar

A. **Phase 7 — Backend Security Bootstrap** (öncelik): JWT secret rotation,
   `.env` validation (zod), Helmet, rate-limit, CORS sıkılaştırma.
B. **`useDebouncedValue` + `usePagination`** — düşük risk, tekrarı yüksek.
C. **`SnackbarContext.showSnackbar`'ı `useCallback` ile sarmak** — bir-iki
   satırlık değişiklik; `useAtolyeSocket` reconnect riskini sıfırlar.
D. **Mahalle fetch hook'u** (`useMahalleler(ilceId)`) — IslemDialog'daki 3 site'i tek noktaya alır.
E. **Component split planı** (IslemDialog 2400+ satır, IslemTable 1700+ satır) —
   en sona; yüksek risk, yüksek getiri.

**Önerim:** Sırayla C (5 dk), B'nin küçük parçası `useDebouncedValue` (1 saat),
sonra Phase 7 (A — backend security).

## 11. Önerilen Commit Mesajları

**Bu commit (Phase 6):**
```
refactor(frontend): extract shared reference and atolye socket hooks

Add useReferenceData hook (teknisyenler/markalar/montajlar/aksesuarlar/urunler/
ilceler) with optional keys/enabled/cache options. Cache key 'islemDialogData'
+ TTL 5 min preserved bit-for-bit from legacy IslemDialog.

Add useAtolyeSocket hook owning the AtolyeTakip Socket.IO lifecycle. Event
names (yeni-atolye / atolye-guncellendi / atolye-silindi), SOCKET_URL, and
reconnection options unchanged.

Refactor IslemFilters, IslemDialog, AtolyeTakip to use the new hooks. Mahalle
fetch (3 sites in IslemDialog), karaliste check, duplicate check, auto-fill,
form validation, PDF/print logic, snackbar text, console log/error wording,
filter UI, pagination, isBayi gating — all preserved.

tsc --noEmit clean; vite build OK. Zero inline api.* calls remain in
frontend/src/components.
```

**Hygiene commit (önceden):** `a10c050` `chore: phase 1 repo hygiene`
