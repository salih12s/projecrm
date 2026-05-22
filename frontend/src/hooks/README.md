# frontend/src/hooks

Bu klasör, ileride ortak custom React hook'ları için ayrıldı. **Şu an boş.**

## İleride taşınması/eklenmesi planlanan hook'lar

- **`useSocket`** — Şu an `Dashboard.tsx` ve `AtolyeTakip.tsx` içinde **kopyalanmış** Socket.IO bağlantı + listener mantığı var. İkisini tek bir `useSocket(events, deps)` hook'una konsolide edilecek. Hardcoded `SOCKET_URL` 2 yerde duplike → tek noktaya alınacak.
- **`usePagination`** — `IslemTable.tsx`, `SahaKayitlari.tsx`, `AtolyeTakip.tsx` her biri kendi sayfalama state'ini tutuyor. Standart hale getirilecek (page, pageSize, total, setters).
- **`useDebouncedValue`** — `IslemFilters.tsx` ve `IslemDialog.tsx` autocomplete'lerinde debounce inline yazılmış (`setTimeout` + `clearTimeout`). 300ms standart debounce hook'u eklenecek.
- **`useIslemForm`** — `IslemDialog.tsx` (2403 satır) içindeki form state + validation + karaliste check logic'i ayrı hook'a alınacak. Bkz. [frontend-component-split-plan.md](../../../docs/refactor/frontend-component-split-plan.md).
- **`useIslemTableState`** — `IslemTable.tsx` (1789 satır) içindeki sort/filter/page/selection state'i ayrı hook'a alınacak.

## Bu turda
Hiçbir hook çıkarılmadı. Sadece klasör + bu README oluşturuldu.
