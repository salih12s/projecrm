# 📘 Refactor Playbook — ProjeCRM'de Uyguladığımız Yöntemler

> Bu dosya, bir sonraki projende **aynı yöntemleri uygulayabilmen için** bu projede yaptığımız refactor işlerinin damıtılmış reçetesidir. Sadece "ne yapıldı" değil, "neden ve nasıl" da var.

**Kapsam:** `checkpoint/pre-deep-refactor` → `8ee3b1e` arası **47 commit**, 4 ana faz (`part-1` → `part-4`).

---

## 0. Genel Prensipler (Her Refactor Adımında Uygulanacak Altın Kurallar)

| # | Kural | Neden |
|---|---|---|
| 1 | **Tek mantıksal değişiklik = tek commit** | Sorun çıkarsa tek commit revert edilir |
| 2 | **Önce checkpoint tag'i at** (`git tag checkpoint/pre-deep-refactor`) | Felaket kurtarma çıpası |
| 3 | **Her adımdan sonra**: `tsc --noEmit` + `npm run build` + `git commit` | Yeşil baseline'dan sapmama garantisi |
| 4 | **UI/UX'e dokunma** — sadece dosya bölme | Refactor ≠ feature; davranış değişmez |
| 5 | **"Dondurulmuş dosya" listesi tut** | Yüksek riskli/karmaşık dosyalar (örn. `print.ts`, `excel.ts`, `PrintEditor.tsx`) zero-diff kalır |
| 6 | **Faz sonunda etiket at** (`part-1-complete`, `part-2-complete`, ...) | Geri dönmesi kolay büyük güvenli noktalar |
| 7 | **Commit mesajı formatı:** `refactor(scope): kısa eylem 1935 -> 1187` | Git log direkt rapor olur |
| 8 | **Tahmin yok, ölç** | Satır sayıları + bundle boyutu + tsc süresi raporla |
| 9 | **Üretimde olan dosyalar için pilot** | Bir modülde dene, çalışırsa diğerlerine yay |
| 10 | **Otomatik araçlara güvenme** | Codemod yerine küçük PowerShell/sed splice + el ile doğrulama |

---

## 1. Faz Yapısı (Önerilen Sıra)

Bu projede şu sıra ile gittik — sıralama önemli, sondan başlayan refactor genelde başarısız olur:

### **Part 1 — Temeller (Tooling + Tipler + Servis Sınırları)**
> Önce ev temizliği; sonra mobilya taşıma.

- **P1.A1** — ESLint flat config + Prettier + EditorConfig kurulumu
- **P1.A2** — Frontend için `constants/` modülleri (magic string'leri tek yere topla)
- **P1.A3** — Backend socket event constants (event isimlerini sabitle)
- **P1.A4** — Frontend'de `as any` cast'lerini sök, tipler sıkı
- **P1.A5** — Backend `Application.get('io')` tipli wrapper + `(req as any)` cast'leri kaldır
- **P1.B1** — Tek `api.ts` god-service'ini per-modul service'lere böl (9 component reroute)
- **P1.B2** — Geride kalan `api.ts`'yi sadece geçiş katmanı olarak küçült
- **Etiket:** `part-1-complete`

### **Part 2 — Backend Yeniden Yapılandırma**
> Backend'i 1:1 davranış koruyarak modüler hale getir.

- **P2.C1-C5** — Tüm route'ları (`karaliste`, `bayiler`, `locations`, `atolye`, `saha`, `admin`, `auth`, referans tablolar) tek bir `query()` wrapper'ına geçir → SQL injection güvenliği + tek noktadan log
- **P2.D1** — `server.ts` bootstrap'ini `backend/src/bootstrap/` altına taşı
- **P2.D2** — Ad-hoc script'leri (`addYedekTel.ts`, `createTestUser.ts` vb.) `backend/scripts/` altına topla
- **P2.D3** — `console.error` → merkezi `logger.error` migrate
- **P2.D4** — `errorHandler` middleware + `karaliste` pilot `asyncHandler` ile try/catch'siz yazım
- **Etiket:** `part-2-complete`

### **Part 3 — Frontend Performans + Büyük Bileşen Bölme**
> Bundle küçült, lazy load, sonra dev bileşenleri parçala.

- **P3.F1** — Vite `manualChunks` ile vendor split (mui / pdf / excel / react ayrı chunk)
- **P3.F2** — Route'larda `React.lazy` + `Suspense` + `ErrorBoundary`
- **P3.G2** — Tekrarlayan `formatPhone` mantığını `utils/format.ts`'te birleştir
- **P3.G3** — Debug `console.log` temizliği
- **P3.E1** — `AtolyeTakip.tsx` 1045 → 356 satır
- **P3.E2** — `Dashboard.tsx` 1115 → 586 satır
- **P3.E3** — `IslemTable` içinden `CustomerHistoryDialog` + `KaralisteConfirmDialog` ayrımı
- **P3.E4 step 1** — `IslemDialog`: `DuplicateRecordDialog`, `KaralisteWarningDialog`, `IslemHistoryViewDialog` ayrımı (2339 → 2083)
- **P3.E4 step 2** — `IslemDialog`: `TamamlaConfirmDialog` ayrımı (2083 → 1935)
- **Etiket:** `part-3-complete`

### **Part 4 — Derin Bileşen Bölme (Bu Tur)**
> Her ekran için `dialog/` ve `table/` alt-klasörlerine modüler dağıt.

- **AdminPanel** 777 → 283 (8 ayrı modül)
- **IslemDialog** 1935 → 1187 (10 ayrı modül — Autocomplete'ler, Alert'ler, form field grupları)
- **IslemTable** 1273 → 831 (`createIslemColumnConfigs` factory + mobile card)
- **AtolyeDialog** 558 → 433
- **Saha kayıtları** ImagePreview / ImageGallery / PhotoLoadingOverlay ayrımı
- **Repo hijyeni:** secret'ları ve zip'leri untrack, README + LICENSE + CI workflow

---

## 2. Reçeteler (Adım-Adım Uygulanabilir)

### 🔧 Reçete A — "Tanrı Bileşeni" (1000+ satır) Bölme

**Belirti:** Tek dosyada 5+ dialog, 10+ state, 20+ fonksiyon var. Scroll'da kayboluyor, merge conflict mıknatısı.

**Adımlar:**

1. **Pasif okuma turu (10 dk)** — Dosyayı baştan sona oku, mantıksal blokları sayfaya not et:
   ```
   L1-50    imports
   L51-200  state + effects
   L201-450 inline DuplicateDialog
   L451-700 inline TamamlaConfirmDialog
   L701-1100 form fields
   L1101-1900 return JSX
   ```

2. **Bağımlılık haritası çıkar** — Her blokun:
   - Aldığı prop'lar / state'ler
   - Çağırdığı handler'lar
   - Açtığı state setter'ları
   - Render ettiği MUI/icon import'ları

3. **En izole bloktan başla** — Genelde **alt dialog'lar** en kolay; props 3-5 tane, kapalı sistem.

4. **Yeni dosya:** `parent/dialog/AltDialog.tsx` veya `parent/table/Alt.tsx`
   - `interface Props` ile başla
   - Bloku **birebir** kopyala (boşluk, yorum dahil)
   - Eksik import'ları üst dosyadan al

5. **Üst dosyada:**
   - Inline blok yerine `<AltDialog ...prop'lar />` koy
   - **Kullanılmayan import'ları kaldır** (`tsc --noEmit` sayesinde TS6133 listesi anında çıkar)
   - Yerel `interface`/`type` artık alt dosyada ise sil

6. **Doğrula:**
   ```powershell
   cd frontend
   npx tsc --noEmit          # 0 hata olmalı
   npm run build              # ✓ built in XXs
   ```

7. **Commit:**
   ```
   git add -A
   git commit -m "refactor(scope): extract AltDialog from Parent 1935 -> 1187"
   ```

8. **Bir sonraki blokta tekrar.**

> **Asla** 2 mantıksal değişikliği aynı commit'e koyma. Hata çıkarsa hangisi sebep belirsiz olur.

---

### 🔧 Reçete B — Büyük `useMemo` / `useCallback` Config Bloklarının Factory'ye Taşınması

**Belirti:** `useMemo(() => ({ ... 400 satır ... }), [deps])` — render fonksiyonları + props mantığı iç içe.

**Çözüm:** Pure factory'ye taşı.

```ts
// table/islemColumnConfigs.tsx
export interface ColumnConfig { id: string; label: string; render: (i: Islem) => React.ReactNode; }
interface Deps { onEdit, onClone?, onDelete?, ... }

export function createIslemColumnConfigs(deps: Deps): Record<string, ColumnConfig> {
  const { onEdit, onClone, onDelete, ... } = deps;
  return { /* 17 kolon */ };
}
```

```tsx
// IslemTable.tsx
const columnConfigs = useMemo(
  () => createIslemColumnConfigs({ onEdit, onClone, onDelete, ... }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [onEdit, onClone, onDelete]
);
```

**Faydaları:**
- 432 satır ana dosyadan çıkar
- Factory unit-test edilebilir hale gelir (props ver, dönen obje'yi assert et)
- React-hook deps listesi otomatik küçülür

---

### 🔧 Reçete C — Backend Route'da `(req, res) => { try { ... await db.query(...) ... } catch (e) { ... } }`'tan Kurtulma

**Önce:**
```ts
router.get('/x', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM x');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal' });
  }
});
```

**Sonra (3 adımda):**

```ts
// 1) wrapper'lar (bir kez)
// db.ts
export const query = <T = any>(sql: string, params?: any[]) =>
  pool.query<T>(sql, params).then(r => r.rows);

// middleware/errorHandler.ts
export const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error(err);
  res.status(err.status ?? 500).json({ error: err.message ?? 'Internal' });
};

// 2) route
router.get('/x', asyncHandler(async (_req, res) => {
  const rows = await query('SELECT * FROM x');
  res.json(rows);
}));

// 3) server.ts en son
app.use(errorHandler);
```

→ Her route'tan 4-6 satır eksilir, log tek yerden çıkar, hatalar standartlaşır.

---

### 🔧 Reçete D — God-Service'i (`api.ts`) Modüler Service'lere Bölme

**Önce:** `services/api.ts` 800 satır, 9 farklı domain'in axios çağrılarını barındırıyor.

**Sonra:**
```
services/
  islem.service.ts
  atolye.service.ts
  karaliste.service.ts
  location.service.ts
  ...
  api.ts   # sadece axios instance + interceptor
```

**Geçiş yöntemi (kırmadan):**

1. Önce `api.ts`'i `re-export shim` haline getir:
   ```ts
   export * from './islem.service';
   export * from './atolye.service';
   // ...
   ```
2. Component'leri tek tek `from './services/api'` → `from './services/islem.service'` taşı.
3. Tüm component'ler taşındıktan sonra `api.ts`'ten re-export'ları sil, sadece axios instance kalsın.

> Bu yöntem 9 component'i **9 ayrı commit**'te taşımanı sağlar — sorun olursa hangisi tek başına anlaşılır.

---

### 🔧 Reçete E — Bundle Boyutu Düşürme (Vite manualChunks)

```ts
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mui':   ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'vendor-pdf':   ['pdf-lib', '@pdf-lib/fontkit', 'jspdf', 'jspdf-autotable'],
          'vendor-excel': ['xlsx'],
        },
      },
    },
  },
});
```

**+ route-level lazy load:**
```tsx
const Dashboard = lazy(() => import('./components/Dashboard'));
const Settings  = lazy(() => import('./components/settings/Settings'));

<Suspense fallback={<Loading />}>
  <ErrorBoundary>
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  </ErrorBoundary>
</Suspense>
```

Sonuç: ilk yükleme bundle'ı ~%40 küçülür, vendor chunk'lar cache'lenir.

---

### 🔧 Reçete F — Repo Hijyeni (Mülakata Hazır Hale)

```bash
# 1. Secret'ları untrack (disk'te kalır)
git rm --cached backend/.env.development backend/.env.production frontend/.env.*
echo ".env.*" >> .gitignore

# 2. Build artifact'lerini untrack
git rm --cached *.zip frontend/*.zip
echo "*.zip" >> .gitignore

# 3. History rewrite (eski commit'lerden de sil)
pip install git-filter-repo
git filter-repo --path backend/.env.production --invert-paths --force
git push origin --force --all

# 4. Secret rotation (HEMEN — repo public ise zaten sızmış)
# - Railway/AWS panelinden DB şifresi
# - JWT_SECRET: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**README + LICENSE + CI workflow** ekle (bu repoda örnekleri var, kopyalanabilir).

---

## 3. Ölçülen Sonuçlar (Bu Projede)

| Metrik | Önce | Sonra | Δ |
|---|---:|---:|---:|
| `IslemDialog.tsx` | 2339 satır | 1187 | **−49.3 %** |
| `IslemTable.tsx`  | 1732 | 831  | **−52.0 %** |
| `AtolyeTakip.tsx` | 1045 | 356  | **−65.9 %** |
| `Dashboard.tsx`   | 1115 | 586  | **−47.4 %** |
| `AdminPanel.tsx`  | 777  | 283  | **−63.6 %** |
| `AtolyeDialog.tsx`| 558  | 433  | **−22.4 %** |
| **Toplam (6 ana dosya)** | **7566** | **3676** | **−51.4 %** |
| TS strict mode | kısmen | tam | ✅ |
| Vendor bundle | tek dosya ~1.4MB | 4 chunk (cache'li) | ✅ |
| Backend try/catch | her route | merkezi error handler | ✅ |
| Repo'da secret | 4 dosya | 0 | ✅ |
| CI pipeline | yok | GitHub Actions | ✅ |
| Test commit sayısı | 0 baseline | **47 atomik** | ✅ |

---

## 4. Karşılaştığım Tuzaklar (Yine Yaşamamak İçin)

| Tuzak | Çözüm |
|---|---|
| PowerShell here-string'de `#` satırın geri kalanını yutuyor | Inline yorum yerine `<# ... #>` blok yorum |
| UTF-8 BOM'suz `.ps1` dosyası Türkçe karakterleri bozuyor (`ü` → `Ã¼`) | `New-Object System.Text.UTF8Encoding $true` ile BOM'lu yaz |
| `multi_replace_string_in_file` kısmi başarı verince hangi op fail oldu belirsiz | Tek tek `replace_string_in_file` ile devam, her birinin sonucunu doğrula |
| MUI `TextField onChange` `HTMLInputElement \| HTMLTextAreaElement` union döndürür | Alt component'in prop tipini `(value: string) => void` yap, `e.target.value`'yi içeride çıkar |
| Extract sonrası `Typography`, `Box` vb. unused → TS6133 patlar | `tsc --noEmit` hatalarını liste olarak alıp tek tek temizle |
| Aynı `interface ColumnConfig` hem üstte hem altta → "Import conflicts with local" | Yerel tanımı sil, sadece factory'den export et |
| `useMemo` deps listesi `useCallback` referansları stabil olmadığında shake olur | Setter referansları stabil → `// eslint-disable-next-line react-hooks/exhaustive-deps` |
| Refactor commit'inde davranış da değişti → revert imkansızlaşır | Davranışı **asla aynı commit'te** değiştirme; ayrı `fix(...)` commit'i aç |
| Büyük splice'larda yanlış satır aralığı dosyayı bozar | Önce `git stash`, sonra splice, sonra `git diff` ile doğrula, sonra `git stash drop` |

---

## 5. Bir Sonraki Projeye Uyarlama Şablonu

```bash
# 0. Güvenli başlangıç
git checkout -b refactor/phase-0-baseline
git tag checkpoint/pre-deep-refactor

# Phase 1 — Tooling
# - ESLint flat config + Prettier + EditorConfig
# - constants/ modülü (magic string'leri topla)
# - tipleri sıkılaştır (as any sök)
# - god-service'i böl
git tag part-1-complete

# Phase 2 — Backend
# - db wrapper
# - asyncHandler + errorHandler
# - route'ları wrapper'a geçir
# - logger merkezileşir
# - script'leri scripts/ altına
git tag part-2-complete

# Phase 3 — Frontend perf
# - vite manualChunks
# - route lazy
# - utils consolidation
# - 1000+ satır bileşenlerin ilk seviyesini böl
git tag part-3-complete

# Phase 4 — Derin bölme
# - dialog/ ve table/ alt-klasörleri
# - factory'ler
# - mobile/desktop ayrımı
git tag part-4-complete

# Phase 5 — Repo hijyeni + README + CI + LICENSE
```

Her phase sonunda:
```powershell
cd frontend; npx tsc --noEmit; npm run build
cd ../backend; npx tsc --noEmit
git log --oneline part-X-complete..HEAD | Measure-Object -Line
```

---

## 6. Mülakatta Anlatım İpuçları

- **"Davranışı değiştirmeden 51% satır azaltıldı"** — somut sayı en güçlü argüman
- **"47 atomik commit, her biri revert-edilebilir"** — disiplin sinyali
- **"3 dosyayı `dondurulmuş` ilan ettim, çünkü PDF üretimi karmaşıktı; zero-diff doğruladım"** — risk yönetimi sinyali
- **"`tsc --noEmit` + `vite build` her commit'te yeşil"** — quality gate sinyali
- **"Tag'li rollback noktaları var: `checkpoint/pre-deep-refactor`, `part-1-complete`, ..."** — operasyonel olgunluk sinyali
- **"`api.ts` god-service'ini 9 component'i 9 ayrı commit'te taşıyarak böldüm"** — kademeli göç deneyimi sinyali
- **"Backend'de wrapper + asyncHandler pattern'ı ile route'lardan try/catch'i kaldırdım"** — pattern bilgisi sinyali

---

## 7. Bu Repoda Örnek Dosyalar

Bir sonraki projede kopyala-yapıştır:

- **CI:** `.github/workflows/ci.yml`
- **README şablonu:** `README.md` (badge + mimari diyagram + tech stack tablosu)
- **LICENSE:** `LICENSE` (MIT)
- **gitignore:** `.gitignore` (env + zip + dist)
- **ESLint config:** `eslint.config.mjs`
- **Prettier:** `.prettierrc.json`
- **Editor:** `.editorconfig`
- **Detaylı rapor formatı:** `REFACTOR_RAPORU.md`

— Son —
