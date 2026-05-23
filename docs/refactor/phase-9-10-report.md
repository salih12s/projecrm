# Phase 9-10 Report — Hook Integration + IslemTable Light Split

> Branch: `refactor/phase-0-baseline`
> Scope: Sadece frontend. Backend / auth / DB / migration / API path / payload /
> Axios interceptor / PDF / Excel / PrintEditor / Socket.IO event isimleri /
> Socket.IO URL/reconnect/transports / UI tasarımı / `IslemDialog` form yapısı /
> `IslemTable` davranışı / sayfalama / filtreleme / sıralama / status update /
> row action / `package.json` — **dokunulmadı**.

---

## Phase 9 — Hook entegrasyon sonucu

### `useDebouncedValue` — IslemFilters'a entegre **edilmedi**

**İnceleme:** [IslemFilters.tsx#L170-L186](frontend/src/components/islem/IslemFilters.tsx#L170-L186) içindeki kullanım:

```ts
const debouncedFilterChange = useMemo(
  () => debounce((filteredList: Islem[]) => {
    onFilterChange(filteredList);
  }, 300),
  [onFilterChange]
);

useEffect(() => {
  setFilteredCount(filtered.length);
  setFilteredTutar(calculatedTutar);
  debouncedFilterChange(filtered);
  return () => { debouncedFilterChange.cancel(); };
}, [filtered, calculatedTutar, debouncedFilterChange]);
```

**Neden taşınmadı:**

| Boyut | `lodash.debounce` (legacy) | `useDebouncedValue` (hook) |
|---|---|---|
| Tür | Callback debouncing (function call) | Value debouncing |
| Cleanup | `.cancel()` ile pending call iptal | Sadece `clearTimeout` (effect cleanup) |
| `onFilterChange` identity değişimi | Yeni instance, eski cancel | Direkt `useEffect` tetikler → gecikme bypass olur |
| `filteredCount` / `filteredTutar` lokal set | `debouncedFilterChange(filtered)` ile aynı tick'te anlık | Refactor sırasında ayrı effect'e bölmek gerek |
| Delay | 300ms (aynı) | 300ms (aynı tutulabilir) |

İki semantik denk değil. Spec'in **"Davranış değişme riski varsa değiştirme, sadece raporla"** kuralı uygulandı. Hook ileride yeni alanlarda (örn. `useColumnFilters` value debounce) kullanılabilir.

### `useMahalleler` — IslemDialog'a entegre **edilmedi**

**İnceleme — `locationService.getMahalleler` 3 call-site'da kullanılıyor:**

| # | Satır | Bağlam | Davranış |
|---|---|---|---|
| 1 | [IslemDialog.tsx#L142](frontend/src/components/islem/IslemDialog.tsx#L142) | `useEffect([selectedIlceId])` — mount/değişim fetch | `setMahalleler(data)` veya `[]` |
| 2 | [IslemDialog.tsx#L548](frontend/src/components/islem/IslemDialog.tsx#L548) | Edit/auto-fill flow — **`await` zorunlu** | `setSelectedIlceId(...)` sonra mahalleler bitsin diye await, sonra `setFormData({ mahalle: ... })` |
| 3 | [IslemDialog.tsx#L947](frontend/src/components/islem/IslemDialog.tsx#L947) | Duplicate-record kabul flow | `setSelectedIlceId` + `.then(setMahalleler)` |

**Etkilenen state'ler:** `selectedIlceId`, `mahalleler`, `formData.mahalle`.

**Neden taşınmadı:** Sadece (1) noktasını `useMahalleler` ile değiştirirsem (2) ve (3) `setSelectedIlceId` çağırdığında hem manuel fetch hem de hook'un `useEffect`'i tetiklenir → **race condition**. Hook çağrısı async resolution sırasını koruyamaz; (2)'deki edit auto-fill için `await ... setFormData` sırası kritik. Üç call-site'ı **birlikte** taşımak gerekir, bu da `IslemDialog`'da formData/edit/duplicate akışlarını dokunma anlamına gelir → spec'in "IslemDialog yüksek riskli, dokunma" kuralı ile çelişir.

**Plan:** `useMahalleler` `IslemDialog` refactor phase'ine (ileride, ayrı bir tur) bırakıldı. Mevcut hook hazır; sadece 3 call-site tek seferde geçirilmeli.

### Sonuç (Phase 9)

- `useDebouncedValue` — entegre **edilmedi** (semantic mismatch).
- `useMahalleler` — entegre **edilmedi** (multi-callsite race).
- `IslemDialog` ve `IslemFilters` — **hiç değişmedi**.

---

## Phase 10 — IslemTable Light Split

### Analiz: IslemTable.tsx sorumlulukları (1789 satır)

| Sorumluluk | Yaklaşık konum | Risk | Karar |
|---|---|---|---|
| `DebouncedFilterInput` (memo, 120ms timer) | satır 33-65 | Düşük (saf component) | ✅ Çıkarıldı |
| `formatPhoneNumber` util | satır 83-91 | Yok (saf fn) | ✅ Çıkarıldı |
| Skeleton loader (`if (loading)` bloğu) | satır 989-1019 | Düşük (sadece `columnOrder`/`columnConfigs` props) | ✅ Çıkarıldı |
| Mobil kart status chip | satır 1040-1052 | Orta (3 case, no `iptal`, no `sx`) | ⏸ Çıkarılmadı |
| Customer history mobile chip | satır 1277-1291 | Orta (4 case, `iptal` var, no `info`) | ⏸ Çıkarılmadı |
| Customer history desktop chip | satır 1786-1801 | Orta (4 case, `iptal` + `info` var, `sx={fontSize, height}`) | ⏸ Çıkarılmadı |
| Row actions (Edit/Print/History/Delete buttons) | desktop tablo inline | Yüksek (isAdminMode, isBayi, onClone, dnd handle) | ⏸ Çıkarılmadı |
| Empty state mesajı ("Bu müşteri için kayıt bulunamadı.") | 2 yerde inline `<Typography>` | Düşük ama küçük | ⏸ Çıkarılmadı (overkill) |
| Sütun filtreleri (kolon bazlı `Record<string,string>`) | state + handler | Orta-Yüksek | ⏸ `useColumnFilters` adayı |
| Pagination | state + UI | Orta | ⏸ `usePagination` adayı |
| Sıralama/filtreleme/server query | büyük blok | Yüksek | ⏸ Phase 11+ |

### Hangi alt componentler çıkarıldı?

Yeni klasör: `frontend/src/components/islem/table/`

1. **`islemTableUtils.ts`** — `formatPhoneNumber` saf fonksiyonu. Davranış: 11 haneli temizlenmiş input → `0XXX XXX XX XX` format; diğer durumlarda input olduğu gibi geri döner. Legacy ile bit-for-bit aynı.

2. **`DebouncedFilterInput.tsx`** — Kendi state'ini yöneten 120ms gecikmeli `<TextField>`. `onChangeRef` pattern + `useEffect` cleanup. Default `sx` legacy ile aynı. `React.memo` korundu.

3. **`IslemTableLoadingState.tsx`** — Skeleton loader. Props: `columnOrder: string[]`, `columnConfigs: Record<string, { label: string } | undefined>`, opsiyonel `rowCount?: number = 8`. Header bgcolor, color, py, Skeleton width değerleri legacy ile aynı.

### Çıkarılmayan parçalar ve neden

- **`IslemStatusChip`** — 3 farklı kullanım yeri farklı case set ve farklı `sx` kullanıyor. Tek bir component ile birleştirmek davranış değiştirir. Spec **"UI/MUI prop değerleri değişmeyecek"** koruyor.
- **`IslemRowActions`** — Çok sayıda prop bağımlılığı (`isAdminMode`, `isBayi`, `onClone`, `onDelete`, drag handle), inline ternary'ler ve tooltip wording. Yüksek risk → bu turda yapılmadı.
- **`IslemTableEmptyState`** — Sadece 1 satır Typography, 2 yerde tekrar. Spec **"Gereksiz aşırı parçalama yapma"** maddesi gereği bırakıldı.

### Korunan davranışlar

- Sütun filtreleri, sıralama, sayfalama, server query — değişmedi.
- Drag-and-drop sütun sırası — değişmedi.
- Skeleton row sayısı (8), header background (`primary.main`), `py: 1` — birebir aynı.
- `DebouncedFilterInput` 120ms timer ve default `sx` — birebir aynı.
- `formatPhoneNumber` regex ve length check — birebir aynı.
- Mobil/desktop view switching, status chip render, row actions — **dokunulmadı**.
- PrintEditor entegrasyonu, customer history dialog — **dokunulmadı**.

### `Skeleton` import temizliği

`IslemTable.tsx` artık `Skeleton` MUI bileşenini kullanmadığından import listesinden çıkarıldı. `useRef` da kullanılmıyordu (sadece eski inline `DebouncedFilterInput`'ta kullanılıyordu) → çıkarıldı. `tsconfig` strict `noUnusedLocals` gereği bu temizlik zorunluydu, davranış etkisi yok.

---

## Test sonuçları

| Test | Sonuç |
|---|---|
| `npx tsc --noEmit` | ✅ 0 hata |
| `npm run build` | ✅ Başarılı (32.6s, 1 known chunk-size warning) |
| Componentlerde inline `api.{get,post,put,delete,patch}(` | ✅ 0 |
| Componentlerde `import { api }` | ✅ 0 |
| Backend dosyaları (`backend/**`) | ✅ Değişmedi |
| `PrintEditor` / `print.ts` / `printService` | ✅ Değişmedi |
| Auth / interceptor / localStorage token | ✅ Değişmedi |

---

## Riskli alanlar

1. **`IslemFilters` debounce semantic farkı:** İleride `useDebouncedValue`'yu bu callsite'a taşırken bir test plan'ı gerekir (lokal `filteredCount`/`filteredTutar` setState'leri ile debounced parent call'un sırası).
2. **`IslemDialog` mahalle race condition:** 3 callsite tek seferde taşınmalı. Plan: ayrı bir phase, `IslemDialog` light split ile birlikte.
3. **`IslemTable` status chip varyasyonları:** Tek tip chip'e indirgemek ayrı bir karar; muhtemelen yeni bir `is_durumu` enum union ve color/label map gerektirir.

---

## Sonraki önerilen phase

**Phase 11 — `useColumnFilters` + `usePagination`:**
- `IslemTable` içinde tüm kolon filtre state'i (`Record<string,string>`) + `onColumnFiltersChange` callback tek bir hook'a alınır.
- Pagination state (page/pageSize/total) ortak hook ile `IslemTable`, `SahaKayitlari`, `AtolyeTakip` arasında paylaşılır.
- Davranış değişmeyecek; sadece state yönetimi taşınacak.

**Alternatif Phase 11B — Backend Security Bootstrap:**
- helmet, rate-limit, CORS allowlist, JWT secret hardening.
- Frontend tarafına dokunmadan paralel olarak başlanabilir.

---

## Final report (spec'teki 9 soru)

1. **Hangi dosyalar değişti?**
   - `frontend/src/components/islem/IslemTable.tsx` (M)
   - `frontend/src/hooks/README.md` (M)
   - `frontend/src/components/islem/table/islemTableUtils.ts` (yeni)
   - `frontend/src/components/islem/table/DebouncedFilterInput.tsx` (yeni)
   - `frontend/src/components/islem/table/IslemTableLoadingState.tsx` (yeni)
   - `docs/refactor/phase-9-10-report.md` (yeni)

2. **`useDebouncedValue` entegre edildi mi?** Hayır — semantic mismatch (callback vs value debouncing).

3. **`useMahalleler` entegre edildi mi?** Hayır — 3 callsite race condition, IslemDialog yüksek risk.

4. **`IslemDialog`'a dokunuldu mu?** Hayır.

5. **`IslemTable`'dan hangi componentler çıkarıldı?**
   - `DebouncedFilterInput`
   - `IslemTableLoadingState` (skeleton)
   - `formatPhoneNumber` util

6. **Korunan davranışlar:** Sütun filtreleri, sıralama, sayfalama, server query, drag-drop, mobile/desktop switch, status chip render, row actions, customer history, PrintEditor, MUI prop değerleri — hepsi birebir aynı.

7. **Test sonuçları:** `tsc --noEmit` clean; `npm run build` OK; inline `api.*` componentlerde = 0; backend/print/auth dosyaları unchanged.

8. **Riskli alanlar:** §"Riskli alanlar" — IslemFilters debounce migration, IslemDialog mahalle race, IslemTable status chip varyasyonları.

9. **Sonraki phase önerisi:** Phase 11 — `useColumnFilters` + `usePagination` (frontend). Alternatif: Backend Security Bootstrap.

**Önerilen commit mesajı:**
`refactor(frontend): integrate hooks and split islem table light components`
