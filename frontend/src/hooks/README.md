# frontend/src/hooks

Bu klasör paylaşılan custom React hook'larını barındırır.

## Mevcut Hook'lar

### `useReferenceData`
Paylaşılan referans listelerini (`teknisyenler` / `markalar` / `montajlar` /
`aksesuarlar` / `urunler` / `ilceler`) tek bir noktadan yükler.

- Endpoint path'leri ilgili `*Service.getAll()` / `locationService.getIlceler()`
  metodları üzerinden değişmeden çalışır.
- `keys` opsiyonu ile sadece istenen referanslar yüklenir (gereksiz endpoint çağrısı yok).
- `enabled` opsiyonu ile koşullu mount desteklenir (admin, dialog open vb).
- `cache` opsiyonu ile legacy `IslemDialog` 5 dakikalık `localStorage` cache'i
  (`islemDialogData` + `islemDialogDataTime`) birebir korunur.
- Snackbar/UI state hook içinde değil — caller'da kalır.

Kullanan componentler:
- `components/islem/IslemFilters.tsx` (admin filtreleri için)
- `components/islem/IslemDialog.tsx` (cache'li tam set için)

### `useAtolyeSocket`
`AtolyeTakip` ekranındaki Socket.IO bağlantısını sarmalar.

- Aynı `SOCKET_URL` mantığı (prod / localhost:5000).
- Aynı `reconnection`, `reconnectionDelay`, `reconnectionAttempts`, `transports` ayarları.
- Aynı event isimleri: `yeni-atolye`, `atolye-guncellendi`, `atolye-silindi`,
  `connect`, `connect_error`.
- Default `onConnect` / `onError` legacy console log/error metinlerini korur.
- `onYeniAtolye` / `onAtolyeGuncellendi` / `onAtolyeSilindi` ile caller state'i sürer.

Kullanan componentler:
- `components/atolye/AtolyeTakip.tsx`

### `useIslemSocket`
`Dashboard` ekranındaki işlem (job) Socket.IO bağlantısını sarmalar.

- Aynı `SOCKET_URL`, `reconnection*`, `transports` ayarları.
- Aynı event isimleri: `yeni-islem`, `islem-guncellendi`, `islem-silindi`,
  `islem-durum-degisti`, `connect`, `connect_error`.
- Default `onConnect` / `onError` legacy Dashboard console wording'ini korur
  (`'Socket.IO bağlantısı kuruldu'` / `'Socket.IO bağlantı hatası:'`).
- Handlers bir ref üzerinden çağrılır → connection lifecycle mount-only,
  caller closure'ları her zaman taze (legacy boş-deps useEffect ile aynı).
- Snackbar / `loadStats` / state mutasyonu caller'da kalır.

Kullanan componentler:
- `components/dashboard/Dashboard.tsx`

### `useDebouncedValue`
Generic `useDebouncedValue<T>(value, delayMs): T`. Klasik `setTimeout` /
`clearTimeout` ile değeri geciktirir. Şu an hiçbir componentte entegre değil
(Phase 7-8: `IslemFilters` zaten `lodash.debounce` kullandığı için çakışma
riski nedeniyle sadece hazırlandı, entegrasyon ertelendi).

### `useMahalleler`
`locationService.getMahalleler(ilceId)` üzerine ince bir sarmalayıcı.

- `{ data, loading, error, refetch }` döner.
- `ilceId` null/undefined ise istek atmaz, `data` boşaltılır.
- `enabled` opsiyonu ile mount koşulu desteklenir.
- Şu an `IslemDialog`'a entegre **edilmedi** — Phase 7-8 kapsamında
  `IslemDialog` "yüksek riskli" olarak işaretli olduğu için hook sadece hazır
  durumda bırakıldı.

## Bu turda yapılan (Phase 6)
- `useReferenceData` + `useAtolyeSocket` eklendi.
- `IslemFilters`, `IslemDialog`, `AtolyeTakip` hook'lara taşındı.
- Hiçbir endpoint, payload, event ismi, cache key, TTL veya UI davranışı değişmedi.

## Bu turda yapılan (Phase 7-8)
- `useDebouncedValue`, `useMahalleler`, `useIslemSocket` eklendi.
- `Dashboard` Socket.IO useEffect tamamen `useIslemSocket`'a taşındı.
- `SnackbarContext` — `showSnackbar` + `handleClose` `useCallback`, value `useMemo` ile
  stabilize edildi (hook deps churn'ünü engellemek için).
- `useDebouncedValue` ve `useMahalleler` integrasyonu bilinçli olarak ertelendi
  (sırasıyla `lodash.debounce` çakışma riski ve `IslemDialog` yüksek-risk skoru).

## Bu turda yapılan (Phase 9-10)
- **`useDebouncedValue` entegrasyonu — yapılmadı.** `IslemFilters` içindeki
  `lodash.debounce` *callback* debouncing yapıyor (`onFilterChange` çağrısı
  300ms gecikmeli), `useDebouncedValue` ise *value* debouncing yapar. İki
  semantik denk değil — `.cancel()` davranışı, cleanup ve `onFilterChange`
  identity değişimine yanıt farklı. Davranış değişme riski olduğu için spec
  gereği sadece raporlandı.
- **`useMahalleler` entegrasyonu — yapılmadı.** `IslemDialog`'da 3 farklı
  call-site var (mount-effect, edit auto-fill `await`'i, duplicate-flow
  `.then`'i). 1 noktayı izole etmek diğer iki manuel fetch ile race condition
  yaratır. Spec'in "risk varsa dokunma" kuralı uygulandı.
- `IslemTable` light split: `DebouncedFilterInput`, `IslemTableLoadingState`,
  `formatPhoneNumber` ayrı dosyalara çıkarıldı. Davranış birebir aynı.

## Bu turda yapılan (Phase 11-12)

- **`usePagination`** eklendi. `{ page, pageSize, total, totalPages, setPage, setPageSize, resetPage }` döner. `setPage` 1'e clamp'lenir; `setPageSize` sayfayı sıfırlamaz (her component'in kendi davranışı korunsun diye). **Hiçbir component'e entegre edilmedi.**
- **`useColumnFilters`** eklendi. `{ filters, setFilter, clearFilter, clearAll, hasActiveFilters, getFilter }` döner; `setFilter(key, '')` key'i map'ten siler. **Hiçbir component'e entegre edilmedi** — `IslemTable` internal `filters` state'i + `Dashboard.columnFiltersRef` debounce koreografisi yüksek risk olarak değerlendirildi.

### `usePagination`
Sayfa & sayfa boyutu state'i için generic yardımcı (server-side ya da
client-side pagination'la uyumlu). Şu an hiçbir componentte entegre değil.

### `useColumnFilters`
Tablo kolonlarına göre `Record<string, string>` filtre state'i. `IslemTable`
çağrı şablonuyla (`onColumnFiltersChange(filters)`) uyumlu API; entegrasyon
ertelendi.

## İleride Eklenmesi Planlanan Hook'lar (güncel sıra)

- **`useIslemTableState`** — `IslemTable` sort/filter/page/selection state'i (`usePagination` + `useColumnFilters`'ın üzerine).
- **`useIslemForm`** — `IslemDialog` form state + validation + karaliste check logic'i (IslemDialog yüksek risk azaldıktan sonra).
- **`useIslemSocket` generic varyant** — Atolye/Dashboard socket hook'larındaki ortak `reconnection*` + `transports` config'ini tek bir base hook'a taşımak.
