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

## İleride Eklenmesi Planlanan Hook'lar

- **`usePagination`** — `IslemTable`, `SahaKayitlari`, `AtolyeTakip` paylaşılan page/pageSize/total state'i.
- **`useDebouncedValue`** — `IslemFilters` ve `IslemDialog` autocomplete'lerindeki inline debounce.
- **`useIslemForm`** — `IslemDialog` form state + validation + karaliste check logic'i.
- **`useIslemTableState`** — `IslemTable` sort/filter/page/selection state'i.

## Bu turda yapılan (Phase 6)
- `useReferenceData` + `useAtolyeSocket` eklendi.
- `IslemFilters`, `IslemDialog`, `AtolyeTakip` hook'lara taşındı.
- Hiçbir endpoint, payload, event ismi, cache key, TTL veya UI davranışı değişmedi.
