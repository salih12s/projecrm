# Phase 12 — Frontend Filter/Pagination Hook Preparation Report

> Branch: `refactor/phase-0-baseline` · Tek commit'in frontend ayağıdır.

## IslemTable Kolon Filtre Analizi (entegrasyon kararı için)

`IslemTable` içinde kolon filtre state'i şu şekilde:

- `IslemTable.tsx` kendi içinde `filters` (`Record<string, string>`) state'ini tutuyor.
- `useEffect([filters, onColumnFiltersChange])` ile her değişimde
  `onColumnFiltersChange?.(filters)` çağrılıyor.
- Tüketici `Dashboard.tsx`, `useRef<Record<string, string>>({})` tutan
  `columnFiltersRef`'i `handleColumnFiltersChange` içinde manuel olarak
  güncelliyor + "hadAnyFilter" karşılaştırmasıyla ek state mutasyonları
  yapıyor (line 232-237).

Bu çift yönlü (state → callback → ref + ek state) akış, `useColumnFilters`
hook'unu IslemTable'a entegre ettiğimizde:

1. `Dashboard.columnFiltersRef` ile sync'in nasıl bozulacağını,
2. `hadAnyFilter` flip karşılaştırmasının ne zaman tetikleneceğini,
3. `IslemTable`'ın `filters` prop'unu controlled mu uncontrolled mu yapacağımızı

değiştirir. Hepsi davranış değişikliği riski içerir.

**Sonuç:** Spec'in "riskliyse sadece hazırla, entegre etme" maddesi
uygulandı. `useColumnFilters` **create-only** olarak eklendi.

## Oluşturulan / Değişen Dosyalar

| Dosya                                                | Durum   | Açıklama                                                          |
| ---------------------------------------------------- | ------- | ----------------------------------------------------------------- |
| `frontend/src/hooks/usePagination.ts`                | **YENİ** | `{ page, pageSize, total, totalPages, setPage, setPageSize, resetPage }`. |
| `frontend/src/hooks/useColumnFilters.ts`             | **YENİ** | `{ filters, setFilter, clearFilter, clearAll, hasActiveFilters, getFilter }`. |
| `frontend/src/hooks/README.md`                       | **DEĞİŞTİ** | Phase 11-12 girdileri + güncel "ileride planlanan" sırası.        |

## Korunan Davranışlar

- ✅ `IslemTable.tsx` byte-bazlı değişmedi.
- ✅ `Dashboard.tsx` byte-bazlı değişmedi (özellikle `columnFiltersRef`,
  `handleColumnFiltersChange`, `loadIslemler` ilişkisi korundu).
- ✅ `SahaKayitlari.tsx` ve `AtolyeTakip.tsx` pagination kodu olduğu gibi.
- ✅ `IslemDialog.tsx` form yapısı değişmedi.
- ✅ `IslemFilters.tsx` lodash.debounce kullanımı değişmedi.
- ✅ `PrintEditor.tsx` ve `utils/print.ts` değişmedi.
- ✅ Hiçbir endpoint, payload, status code veya request param'ı değişmedi.

## Test Sonuçları

- ✅ `cd frontend; npx tsc --noEmit` → no output (clean exit).
- ✅ `cd frontend; npm run build` → `built in 29.86s`. Hata yok.
  - Pre-existing warning'ler aynen sürüyor: `Settings.tsx` dynamic/static
    karışık import + chunk size > 500 kB. Bu phase tarafından üretilmedi.

## Riskli Alanlar

- `useColumnFilters` entegrasyonu: IslemTable + Dashboard.columnFiltersRef
  üçgeni. Phase 9-10 raporunda da işaret edildiği gibi `IslemTable`
  davranış-koruma kuralı bu phase'de de uygulandı.
- `usePagination` entegrasyonu: `IslemTable`, `SahaKayitlari`,
  `AtolyeTakip` her birinin kendi `setPageSize` reset davranışı farklı —
  hook'un `setPageSize`'ı sayfayı sıfırlamıyor; entegrasyonda her component
  kendi reset kararını korumalı.

## Sonraki Frontend Adımı (önerilen)

1. **Pilot:** `SahaKayitlari` (en izole pagination) `usePagination`'a taşınır.
2. `useIslemTableState` design'ı — `usePagination` + `useColumnFilters` + sort
   üzerine kompoze edilir, sonra `IslemTable`'a entegre edilir.
3. `useIslemForm` (IslemDialog refactor'u olduğunda).
