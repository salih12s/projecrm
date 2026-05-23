# Phase 13 — Code Quality & Performance Audit

> Branch: `refactor/phase-0-baseline`
> Commit (önerilen): `refactor: improve code quality and performance hotspots safely`

## 1) Modern Yapı Puanı

| Alan                        | Puan  | Notlar                                                                                                                                                  |
| --------------------------- | :---: | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend yapı**           | 7/10  | Feature klasörleri (`components/{islem,atolye,saha,admin,settings,...}`), `services/` domain bazlı, `hooks/`, `context/`, `utils/` ayrı. `constants/` boş (Phase 11-12 README'sinde plan var). Componentler hâlâ büyük: IslemDialog 2349, IslemTable 1730. |
| **Backend yapı**            | 6/10  | `routes/`, `middleware/`, `migrations/`, `types/`, `utils/` ayrı. `service/repository` katmanı yok (henüz erken). `pool.query` ↔ `query()` tutarsızlığı çoğu route'da (plan: `backend-query-standardization-plan.md`). Çok sayıda scaffolding script `src/` kökünde duruyor. |
| **Genel proje organizasyonu** | 7/10 | `docs/refactor/` raporları, `hooks/README.md`, `services/README.md` mevcut; refactor süreci izlenebilir. Test (jest/vitest) henüz yok — modernlik puanını çekiyor. |

## 2) En Şişmiş Frontend Dosyaları (LOC)

| Dosya | Satır | Problem | Modern yaklaşım | Risk | Uygulanabilir mi? |
| --- | ---: | --- | --- | --- | --- |
| `components/islem/IslemDialog.tsx` | 2349 | Çok fazla state (form + duplicate-check + karaliste + auto-fill), 10+ useEffect, inline phone helper, devasa JSX | `useIslemForm` hook + `IslemDuplicateCheck` + `IslemKaralisteCheck` alt componentleri; form alanlarını `IslemFormSection` grup component'lerine bölmek | **Yüksek** | Hayır — spec: "IslemDialog'u komple parçalama". Sadece raporlandı. |
| `components/islem/IslemTable.tsx` | 1730 | 20+ filter alanı, kolon başına tekrarlı `TableCell sx={{ fontSize:'0.65rem', py:0.1, ... }}`, `historyFilters` aynı pattern'i ikinci kez tekrar ediyor, `columnConfigs` 700+ satır | `IslemTableRow`, `IslemTableHeader`, `IslemHistoryDialog` ayrı dosyalar; `tableCellSx` constant'ı; `useColumnFilters` (Phase 12'de hazır) entegrasyonu | **Orta-yüksek** | Hayır — spec: "IslemTable filtre/pagination davranışını değiştirme". Sadece raporlandı. |
| `components/dashboard/Dashboard.tsx` | 1115 | `loadIslemler` 7 path'li tek fonksiyon, 4 farklı `ref` (statusFilter/showToday/showYazdirilmamis/columnFilters), on-hold formları array+activeIndex, hamburger + drawer + tabs + bayi/saha/admin koşulları iç içe | `useIslemListLoader` hook, `useOnHoldForms` hook, `DashboardAppBar` + `DashboardDrawer` sub-componentleri | **Orta** | Bu turda hayır — socket hook (Phase 7-8) zaten çıkarıldı; bir sonraki büyük adım. |
| `components/atolye/AtolyeTakip.tsx` | 1153 (→ ~1080 sonrası) | 5 helper'ın iç içe iki kez tanımlandığı (dead duplicate), local `useDebounce` hook, çok fazla `parseInt(String(...))` boilerplate, mobile + desktop iki ayrı JSX bloku | Bu turda dead-duplicate'ler silindi + `useDebouncedValue` paylaşıldı. Geri kalan iki render path'i (Card vs Table) ileride `AtolyeRecordCard` + `AtolyeRecordRow` ile birleşebilir. | **Düşük** (dead-code) / **Orta** (split) | Düşük riskli kısım **UYGULANDI**. |
| `components/saha/SahaKayitlari.tsx` | 930 | Kendi pagination state'i, filtre state'i, foto önizleme dialog'u, listeleme + export hepsi tek dosya | `usePagination` (Phase 12'de hazır) pilot; foto önizleme ayrı bir component | **Orta** | Bu turda hayır — değiştirilmedi. |
| `components/admin/AdminPanel.tsx` | 776 | Birden fazla CRUD tab tek componentte (markalar/teknisyenler/montajlar/aksesuarlar/ürünler) | Generic `<ReferenceCrudPanel domain="marka" />` ile DRY | **Orta** | Bu turda hayır. |
| `components/settings/Settings.tsx` | 452 | App.tsx hem statik hem `lazy()` ile import ediyor (chunk warning), tek dosyada birkaç tab | Sadece `App.tsx` ya da `Dashboard.tsx` üzerinden import — biri kaldırılmalı | **Düşük** ama davranış kritik | Bu turda hayır (mevcut warning pre-existing). |

## 3) Performans Bulguları (Top 10)

1. **Bundle dev/prod chunk**: `dist/assets/index-*.js` 1,106 kB (gzip 347 kB) — `MusteriGecmisi` (433 kB), `html2canvas` (201 kB), `purify.es` (150 kB), `index.es` (150 kB). `manualChunks` ile MUI/icons ayrı bundle'a çıkarmak büyük kazanç sağlar. **Yapılmadı** (yapılandırma değişikliği, ayrı bir vite tuning phase'i istiyor).
2. **`Settings.tsx` çift import**: `App.tsx`'te static + `Dashboard.tsx`'te `lazy()` → vite warning. Birini kaldırmak chunk split'i düzeltir. **Yapılmadı** (App.tsx davranışını değiştirme riski).
3. **`IslemTable.handleHistoryFilterChange`**: Her tuş darbesinde tüm `customerHistory` üzerinde 14 condition'lı `.filter()` çalışıyor; debounce yok, memo yok. Liste 100+ kayıt olduğunda hissedilir. (Düzeltme: `useDebouncedValue` + `useMemo`.) **Yapılmadı** (IslemTable davranış-koruma kuralı).
4. **`Dashboard.stats` memoization**: `useMemo([serverStats, islemler, isAdmin])` — `islemler` her socket event'inde değişir → 5000+ kayıtta `reduce` her seferinde tetiklenir. Bu liste sadece `isAdmin` ise kullanılır; `useMemo` dep'lerini conditional'a almak güvenli kazanç. **Yapılmadı** (Dashboard davranış-koruma).
5. **`IslemDialog` her phone input render'ında `formatPhoneNumber`** çağrısı (kontrollü input). Şu an pure / cheap, problem değil.
6. **`useReferenceData` cache + IslemDialog 3-noktalı mahalle fetch race** (Phase 9-10 raporundan): hâlâ var, `useMahalleler` hazır ama entegre değil.
7. **`AtolyeTakip` `useDebounce` local kopyası** silindi → bundle'a etki yok ama maintainability + minor tree-shake kazancı (tek hook implementation).
8. **`AtolyeTakip` 5 inner helper duplicate'i** silindi → kod 70 satır azaldı; her render'da fonksiyon redeklarasyonu da kayboldu (mikro CPU kazancı).
9. **Backend `karaliste.ts /check-address`**: `LOWER(mahalle) = LOWER($1)` — `mahalle` kolonunda functional index yoksa seq-scan riski. **Plan dokümanına eklendi**, değiştirilmedi.
10. **Backend `pool.query` retry yokluğu**: 14 route dosyasının 12'si direkt `pool.query`, transient hatalarda retry yok. `backend-query-standardization-plan.md`'de zaten plan var; bu phase'de uygulama yok.

## 4) TypeScript Kalite Borçları (Top 10)

1. **`(req as any).user` cast'leri** — 10 yerden 1'i (karaliste.ts) bu turda kaldırıldı. Kalan 9 (`atolye.ts` × 4, `saha.ts` × 5) ileride.
2. **`(req as any).app.get('io')`** — `Application` augmentation gerekli (`express.d.ts`'de plan yorum olarak var).
3. **`islemService.update(islem.id, ... as any)`** — `IslemTable.tsx` handleToggleYazdirildi (L322). `UpdateDto`'ya `yazdirildi?: boolean` eklemek temizler. (Düşük risk, uygulanmadı çünkü `types/index.ts` shape değişikliği başka call-site etkileyebilir.)
4. **`Dashboard.tsx` `onHoldFormData: any[]`** ve `serverStats: any` — uygun interface tanımı yok. Orta risk; mevcut çalışan davranışı kırma riski var.
5. **`AdminPanel.tsx` ve diğer CRUD'larda payload `any`** — service tarafı tipli ama caller `any` ile gönderiyor.
6. **`Atolye.teslim_durumu`** string union (`'beklemede' | 'teslim_edildi' | ...`) tanımlı değil — magic string olarak her yerde geçiyor. `types/atolyeStatus.ts` ile çıkarılabilir.
7. **`is_durumu`** aynı şekilde magic string (`'acik' | 'parca_bekliyor' | 'tamamlandi' | 'iptal'`) — IslemTable filter + Dashboard filter + backend route hepsi raw string.
8. **`role`** string magic — auth.ts L69 `'user'`, L113 `'bayi'`; Dashboard `'admin' | 'user' | 'bayi' | 'saha'`. Type alias yok.
9. **Socket event isimleri** — string literal her iki socket hook'unda. `constants/socketEvents.ts` planı var (boş constants/ README'sinde).
10. **`backend/src/middleware/auth.ts`'de duplicate `declare global` augmentation** — Phase 11'de bilinçli bırakıldı (TS merge eder). Tek bir yerde tutmak `express.d.ts` lehine.

## 5) Uygulanan Refactorlar (bu turda)

### Frontend

**`components/atolye/AtolyeTakip.tsx`** (−75 satır net):

- **Dead duplicate helper kaldırıldı** — `getStatusColor`, `getStatusLabel`, `getRowBackgroundColor`, `formatDate`, `formatPhoneNumber` fonksiyonları hem module-scope (L47-L100) hem de component body içinde (L459-L540) birebir tanımlıydı. Inner kopyalar outer'ları gölgeliyordu; davranış aynı, ama her render'da redeklarasyon → silindi. Module-scope versiyonları korundu.
- **Local `useDebounce` hook silindi** — `frontend/src/hooks/useDebouncedValue.ts` ile birebir aynı imza (`(value: T, delay: number) => T`). `useDebounce(filters, 700)` → `useDebouncedValue(filters, 700)`. Davranış aynı.

### Backend

**`routes/karaliste.ts`**:

- `(req as any).user?.username` → `req.user?.username` (1 satır). Type augmentation `express.d.ts` + `middleware/auth.ts` sayesinde tip-safe; runtime davranış aynı.

## 6) Uygulanmayan Riskli Refactorlar (gerekçeli erteleme)

| Refactor                                                       | Sebep                                                                                                                |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `IslemDialog` parçalama (form section / duplicate / karaliste) | Spec açık yasak: "IslemDialog'u komple parçalama". 2349 satır.                                                       |
| `IslemTable` row/header split, history dialog ayrımı           | Spec açık yasak: "IslemTable filtre/pagination davranışını değiştirme". Ayrıca Dashboard.columnFiltersRef ile sıkı bağ. |
| `Dashboard` `loadIslemler` parçalama, `useIslemListLoader` hook | 4 ref + 3 path + silent flag kombinasyonu çok dallı; isolated test/snapshot olmadan davranış-koruma garanti edilemez. |
| `formatPhoneNumber` tek paylaşılan utility (utils/format.ts)   | 5 farklı dosyada 2 farklı empty-input davranışı (`''` vs `'-'`). Tek utility'ye taşımak en az 1 call-site'ı kırardı. Print/Excel zaten dokunma yasağı altında. |
| `karaliste.ts` `console.error` → `logger.error`                | Phase 11 prensibiyle tutarlı: "mevcut console'lara dokunma". Helper kullanım pilot'u ayrı planlı bir turda yapılmalı. |
| `karaliste.ts` `asyncHandler` ile sarma                        | Global error middleware yok — wrap edersem `{ message: 'Sunucu hatası' }` response formatı default Express handler'a değişirdi. Response formatı değişme yasağı. |
| `pool.query` → `query()` wrapper migration                     | Phase 11 plan dokümanına göre ayrı bir pilot turunda; bu turda DB sorgu değişikliği yasak.                            |
| `Atolye.teslim_durumu` string union tipi                       | `types/index.ts` shape değişikliği frontend + backend çok call-site etkiler; isolated regression test gerekli.       |
| `Settings.tsx` çift import düzeltmesi                          | `App.tsx`'in static import'unu kaldırmak route lazy davranışını değiştirir; UI tasarım/akış riski.                   |

## 7) Build Sonuçları

| Adım                          | Sonuç                       |
| ----------------------------- | --------------------------- |
| `backend; npx tsc --noEmit`   | ✅ Temiz                    |
| `frontend; npx tsc --noEmit`  | ✅ Temiz                    |
| `frontend; npm run build`     | ✅ `built in 10.66s`        |
| `components/**` inline `api.*`| ✅ 0                        |
| `components/**` `import { api }` | ✅ 0                     |
| `PrintEditor.tsx` / `utils/print.ts` | ✅ Değişmedi          |
| `routes/**` endpoint string'leri | ✅ Değişmedi             |
| Socket.IO event isimleri      | ✅ Değişmedi                |

## 8) Manuel Test Checklist

- [ ] `AtolyeTakip` listeleme + filtre yazma (700ms debounce) — tablo + kart görünümü ikisi de.
- [ ] `AtolyeTakip` status filter chip'leri (`beklemede` / `teslim_edildi` / `siparis_verildi` / `yapildi` / `fabrika_gitti` / `odeme_bekliyor`) — kart arka plan renkleri ve chip renkleri/etiketleri eskisiyle aynı.
- [ ] `AtolyeTakip` mobile responsive — yine `Card` render path'i tetikleniyor.
- [ ] `Karaliste`'ye admin/user kullanıcısıyla kayıt ekle — `created_by` username doğru yazılıyor; bayi/saha token'ı kullanıldığında da username veya `'system'` fallback'i çalışıyor.
- [ ] `Karaliste` DELETE / `check-phone` / `check-address` endpoint'leri etkilenmemeli (sadece POST handler'a dokunuldu).

## 9) Sonraki Önerilen Büyük Adım

**Phase 14 önerisi — backend pilot migration:**

1. `karaliste.ts` `pool.query` → `query()` wrapper migration (5 çağrı). `(req as any).user` cast cleanup'ı bu phase'de zaten yapıldı; backend pilot artık tek dosyaya odaklanabilir.
2. Global error middleware tanımı (response format'ı `{ message: 'Sunucu hatası' }` ile birebir) → ardından `asyncHandler` pilot ile karaliste route'ları sarılabilir.

**Phase 14 önerisi — frontend orta risk:**

1. `usePagination` pilot — `SahaKayitlari` (en izole tüketici).
2. `Atolye.teslim_durumu` string union tipi + `frontend/src/constants/atolyeStatus.ts` (color/label/bg map'leri tek noktada).
3. Vite `manualChunks` config'i → `MusteriGecmisi` (433 kB) + MUI ayrı chunk; bundle size'ın gözle görülür azalması.

**Phase 15+ (büyük):**

- `Dashboard` split (`DashboardAppBar`, `DashboardDrawer`, `useIslemListLoader`, `useOnHoldForms`).
- `IslemTable` split (row + header + history dialog) — önce snapshot/regression testleri.
- `IslemDialog` split (form section + duplicate-check + karaliste-check + auto-fill).
