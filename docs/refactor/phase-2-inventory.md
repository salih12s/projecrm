# Phase 2 — Envanter Raporu

**Tarih:** 22 Mayıs 2026
**Branch:** `refactor/phase-0-baseline`
**Mod:** Sadece envanter. **Hiçbir kaynak kodu değiştirilmedi.** Hiçbir env içeriği okunmadı.
**Üretilen kalıcı raporlar:**
- `docs/refactor/phase-2-inventory.md` (bu dosya)
- `docs/refactor/api-contract.md`
- `docs/refactor/env-security-audit.md`

**Üretilen ham çıktılar (gitignore'da, kalıcı değil):**
- `reports/backend-unused.txt` (0 hata)
- `reports/frontend-unused.txt` (0 hata)
- `reports/backend-console.txt` (85 hit)
- `reports/frontend-console.txt` (71 hit)
- `reports/db-usage.csv` (10 pattern x N dosya)

---

## 1. Env Güvenlik Envanteri Özeti

Detay: [env-security-audit.md](./env-security-audit.md)

| Dosya | Tracked | Risk |
|---|---|---|
| `backend/.env.production` | ✅ | 🔴 **Kritik** (Railway secret'lar) |
| `backend/.env.development` | ✅ | 🟡 Orta |
| `frontend/.env.production` | ✅ | 🟡 Orta |
| `frontend/.env.development` | ✅ | 🟡 Orta |
| `backend/.env.example` | ✅ | 🟢 Placeholder |
| `frontend/.env.example` | yeni (untracked) | 🟢 Placeholder |

- **Acil aksiyon?** Evet (rotation + untrack), ama **Phase 2'yi engellemiyor**.
- Aksiyon sırası: (1) Secret rotation → (2) `git rm --cached` → (3) ileride history rewrite (kullanıcı kararı).

---

## 2. Unused Import / Değişken Özeti

Komut: `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` her iki tarafta.

| Taraf | Hata sayısı | Sonuç |
|---|---|---|
| Backend | **0** | ✅ |
| Frontend | **0** | ✅ |

**Sebep:** Her iki `tsconfig.json`'da `"noUnusedLocals": true, "noUnusedParameters": true` zaten aktif → her build bunu zorunlu kılıyor.

- Hemen silinmesi güvenli olan: **Yok** (compiler zaten engelliyor).
- Yan etki için tutulan riskli import: **Yok** (compiler izin vermez).
- **Aksiyon:** Hiç. (Phase 3'te `"noUncheckedIndexedAccess"` ve `"exactOptionalPropertyTypes"` flag'leri değerlendirilebilir.)

---

## 3. Console Log Özeti

| Taraf | Toplam | `.error` | `.log` | `.warn/.info/.debug` |
|---|---|---|---|---|
| Backend | 85 | 75 | 10 | 0 |
| Frontend | 71 | 40 | 31 | 0 |

### En yoğun dosyalar

**Backend:**
| Dosya | Adet | Kategori |
|---|---|---|
| `routes/saha.ts` | 14 | Çoğu `console.error(err)` — Error log |
| `routes/atolye.ts` | 12 | Karışık (error + debug log) |
| `routes/islemler.ts` | 8 | Error log |
| `routes/printerSettings.ts` | 8 | Error log |
| `routes/admin.ts` | 8 | Error log |
| Diğer routes | 35 | Mostly error log |

**Frontend:**
| Dosya | Adet | Kategori |
|---|---|---|
| `components/AtolyeDialog.tsx` | 19 | **Debug log şüpheli** (en yoğun) |
| `components/IslemDialog.tsx` | 12 | Debug + error |
| `components/PrintEditor.tsx` | 12 | Debug (PDF preview state) |
| `components/Dashboard.tsx` | 8 | Socket connect + error |
| `components/AtolyeTakip.tsx` | 4 | Socket |

### Kategorize tablo

| Kategori | Tahmini sayı | Aksiyon |
|---|---|---|
| Operasyonel log (server start, db connect) | ~3 (backend server.ts) | Kalabilir, Phase 3'te `logger.info` |
| Error log (`catch` içinde) | ~115 (75 BE + 40 FE) | Phase 3 logger/Sentry hedefi |
| Debug log (geçici dev) | ~40 (öncelikle AtolyeDialog, IslemDialog, PrintEditor) | Phase 3 öncelikli temizlik |
| Hassas veri riski (telefon/adres/request body bas) | Doğrulanmalı — özellikle IslemDialog ve AtolyeDialog'daki log'ların payload içeriği KVKK açısından risk | **Phase 3 ÖNCELİKLİ inceleme** |

> Müşteri telefonu, adresi, isim verisi log'a düşüyor olabilir. Ham çıktı: `reports/frontend-console.txt`.

---

## 4. DB Query Özeti

Detay: `reports/db-usage.csv`

| Pattern | Toplam | Risk |
|---|---|---|
| `pool.query` (retry **YOK**) | 74 | 🟡 Tutarsızlık |
| `query()` (retry **VAR**, db.ts) | 14 | ✅ Doğru kullanım |
| `SELECT *` | 28 | 🔴 Sızıntı potansiyeli |
| `ILIKE` | 18 (tümü `islemler.ts`) | 🟡 Performans |
| `INSERT` | 14 | — |
| `DELETE` | 13 | — |
| `UPDATE` | 10 | — |
| `EXTRACT(` | 2 (`islemler.ts`) | 🟡 Index bypass |
| `::text` cast | 1 (`islemler.ts`) | 🟡 |
| `COALESCE(MAX(id)+1` | 1 (`atolye.ts`) | 🔴 Race condition |

### Önemli bulgular

#### 4.1 `pool.query` vs `query()` tutarsızlığı (74 vs 14)
- `db.ts` içindeki `query()` wrapper **transient hata retry** (ECONNRESET, ETIMEDOUT, 40001, 08xxx) yapar.
- `pool.query` direkt kullanımı bu retry'dan **mahrum kalır** → Railway PostgreSQL bağlantı koparsa istek 500 atar.
- En çok `pool.query` kullanan: `saha.ts` (19), `admin.ts` (10), `atolye.ts` (9).
- Sadece `islemler.ts` (11) ve `printerSettings.ts` (3) `query()` kullanıyor.
- **Phase 3 hedefi:** Yavaş yavaş tüm `pool.query` → `query()` migration (route bazlı, davranış değişmez).

#### 4.2 `SELECT *` (28 yer)
- `bayiler.ts` **3 yerde** `SELECT *` → `password` plaintext API'ye gidiyor 🔴
- `auth.ts` (3) → login sırasında `SELECT *` (password kolonu seçiliyor; iç kullanım, dışarı sızmıyor olmalı — doğrulanmalı).
- `islemler.ts` (5), `admin.ts` (3), `atolye.ts` (3), `saha.ts` (3), `karaliste.ts` (3) → Hangi tabloda hassas kolon var doğrulanmalı.
- **Phase 3 hedefi:** Explicit kolon listesi (özellikle bayiler).

#### 4.3 ILIKE `%...%` (18 yer, hepsi `islemler.ts`)
- Tüm filtreler full-text search yapıyor → tablo büyüdükçe (>50k satır) yavaşlar.
- **Phase 4 hedefi:** Postgres trigram index (`pg_trgm` + GIN) — ama davranış değişmez.

#### 4.4 `COALESCE(MAX(id),0)+1` (atolye.ts)
- `/next-id` endpoint'i race condition'a açık.
- **Phase 3/4 hedefi:** PostgreSQL sequence (`SERIAL` zaten varsa kullanmak, yoksa eklemek).

#### 4.5 `EXTRACT(...)` (2 yer, islemler.ts)
- Muhtemelen `EXTRACT(YEAR FROM kayit_tarihi)` gibi → index'i bypass eder.
- **Phase 4:** Functional index veya range filter.

---

## 5. Auth/JWT Güvenlik Özeti

### 5.1 JWT_SECRET fallback'leri (5 yer)
| Dosya | Fallback değeri | Risk |
|---|---|---|
| `middleware/auth.ts:22` | `''` | 🔴 Boş secret = imza yok |
| `routes/admin.ts:36` | `''` | 🔴 |
| `routes/auth.ts:70` | `''` | 🔴 |
| `routes/auth.ts:114` | `''` | 🔴 |
| `routes/saha.ts:44` | `'secret'` | 🔴 **Farklı** — token mismatch riski |

> Production'da `JWT_SECRET` env mutlaka set olduğu için bu fallback'ler **runtime'da tetiklenmiyor** olmalı; ama defansif kod açısından `throw` yapmak doğru olur (Phase 3).

### 5.2 `jwt.sign` (4 yer)
| Dosya | Endpoint | Payload tahmini |
|---|---|---|
| `routes/auth.ts:68` | `/login` | `{ id, username, role:'user' }` |
| `routes/auth.ts:112` | `/bayi-login` | `{ id, username, role:'bayi', bayiIsim }` |
| `routes/admin.ts:34` | `/login` | `{ id, username, role:'admin' }` |
| `routes/saha.ts:42` | `/login` | `{ id, username, role:'saha' }` |

### 5.3 `jwt.verify` (1 yer — middleware/auth.ts:22)
Tek merkezi nokta — iyi. Ama:
- Sadece imza doğrular, **rol kontrolü yapmaz**.
- `AuthPayload` type'ı `{ id, username }` olarak tanımlı; `role` ve `bayiIsim` payload'a giriyor ama type'tan eksik → `(req as any).user.role` cast'i gerekiyor.

### 5.4 `(req as any)` cast'leri (10 yer)
- `atolye.ts` 4 yer (3'ü `app.get('io')`, 1'i `user.username`)
- `saha.ts` 5 yer (hepsi `user`)
- `karaliste.ts` 1 yer (`user?.username`)
- **Phase 3:** `Express.Request` interface augmentation (sıfır davranış değişikliği, sadece tip).

### 5.5 `authenticateToken` middleware kullanımı
- Import yeri: `admin.ts`, `saha.ts`, `urunler.ts` (3 route dosyası).
- Toplam koruma: 27 satır (admin 7 + saha 14 + urunler 4 + 3 import).
- **`router.use(authenticateToken)` file-level kullanımı: 0 (doğrulandı — grep)**
- Sonuç: 75 endpoint'in **48'i token gerektirmez** (login'ler hariç ~44 endpoint public).

### 5.6 Plaintext password karşılaştırma
- `routes/auth.ts:106` → `if (password !== bayi.rows[0].password)` 🔴
- **Phase 3 hedefi:** Bayi tablosunda mevcut plaintext şifreler bcrypt'e migrate edilmeli (script + bir-defalık migration).

### 5.7 `/register` endpoint korumasız
- `auth.ts:9` → kim isterse `POST /api/auth/register` ile kullanıcı yaratabilir.
- **Phase 3 hedefi:** `authenticateToken` + admin rol guard veya tamamen kaldırma (admin paneli zaten `/create-user`'a sahip).

### 5.8 Admin endpoint'lerinde rol guard eksikliği
- `admin.ts`'in tüm korumalı endpoint'lerinde `authenticateToken` var ama `req.user.role === 'admin'` kontrolü **yok**.
- Geçerli bir bayi/saha/user token'ıyla admin endpoint'leri kullanılabilir → **yetki yükseltme açığı**.
- **Phase 3 hedefi:** `requireRole('admin')` middleware ekle (davranış: 403 dön).

### 5.9 Auth özet tablo

| Dosya | Bulgular | Risk | Phase önerisi |
|---|---|---|---|
| `middleware/auth.ts` | JWT_SECRET '' fallback, role yok, AuthPayload eksik | 🔴 | Phase 3 |
| `routes/auth.ts` | bayi plaintext compare, /register açık, 2 JWT_SECRET '' | 🔴 | Phase 3 |
| `routes/admin.ts` | rol guard yok, JWT_SECRET '' | 🔴 | Phase 3 |
| `routes/saha.ts` | JWT_SECRET 'secret', rol guard yok, all-kayitlar herkese açık | 🔴 | Phase 3 |
| Diğer route'ları | auth middleware yok | 🟡 | Phase 3 (file-level auth uygulanacak) |
| `routes/urunler.ts` | ✅ tüm endpoint'lerde auth var | 🟢 | Örnek pattern |

---

## 6. Socket.IO Özeti

Detay: [api-contract.md § Socket.IO](./api-contract.md#socketio-event-sözleşmesi-refactorda-değişmeyecek)

| Event | Backend | Frontend | Risk |
|---|---|---|---|
| `yeni-islem` | islemler.ts:316 | Dashboard.tsx:132 | Payload müşteri verisi içerir |
| `islem-guncellendi` | islemler.ts:394 | Dashboard.tsx:140 | Müşteri verisi |
| `islem-silindi` | islemler.ts:421 | Dashboard.tsx:150 | Düşük |
| `islem-durum-degisti` | islemler.ts:453 | Dashboard.tsx:158 | Düşük |
| `yeni-atolye` | atolye.ts:174 | AtolyeTakip.tsx:230 | Müşteri verisi |
| `atolye-guncellendi` | atolye.ts:283 | AtolyeTakip.tsx:246 | Müşteri verisi |
| `atolye-silindi` | atolye.ts:313 | AtolyeTakip.tsx:257 | Düşük |

### Bulgular
- **Socket.IO handshake'inde auth yok** → public broadcast'i herkes dinleyebilir → KVKK riski yüksek.
- `app.get('io')` 7 yerde `(req as any)` cast'iyle erişiliyor.
- Hardcoded SOCKET_URL 2 yerde (`Dashboard.tsx:113`, `AtolyeTakip.tsx:210`).
- **Phase 3/4 hedefi:** Socket auth middleware (`io.use((socket, next) => verifyToken(...))`) — **event isimleri değişmez**.

---

## 7. API Contract Özeti

Detay: [api-contract.md](./api-contract.md)

- 75 endpoint, 14 route dosyası, `/api` prefix
- Auth açıkça uygulanmış: 27 endpoint (admin 7, saha 14, urunler 4 + 3 import)
- Public: ~44 endpoint (login'ler hariç)
- Error format tutarsız: `{ error }` vs `{ message }`
- 2 mount aynı router için: `/api/ilceler` + `/api/locations/ilceler` (duplicate)

---

## 8. Frontend Component Şişkinlik Özeti

| Dosya | Satır | KB | Sorumluluklar (tahmin) | Refactor önerisi | Risk |
|---|---|---|---|---|---|
| `IslemDialog.tsx` | **2403** | 103 | Form, validation, alt-dialog'lar (marka/teknisyen/aksesuar ekle), karaliste check, autocomplete, print preview entry | Form'u `useIslemForm` hook'una; alt-dialog'ları ayrı component'lere; field-bazlı sections (`MüşteriSection`, `UrunSection`, `IslemDetaySection`) | 🔴 Yüksek (en büyük dosya) |
| `IslemTable.tsx` | **1789** | 75.6 | Sütun filtreleri, sayfalama, sıralama, virtualization, satır seçimi, durum dropdown, action menu | `useIslemTableState`, sütun filtreleri ayrı component (`ColumnFilters`), TableRow ayrı | 🔴 Yüksek |
| `AtolyeTakip.tsx` | 1173 | 57 | Tab paneli, socket bağlantısı, durum kolonu, atölye CRUD, kanban-benzeri görünüm | Socket logic'i hook'a (`useAtolyeSocket`), kolon render'ı `AtolyeColumn` | 🟡 Orta |
| `Dashboard.tsx` | 1134 | 44.4 | Socket bağlantısı, tab state, lazy load orchestration, header, refresh logic | Socket'i hook'a (`useIslemSocket`), tab logic'i ayrı, lazy import'ları zaten var | 🟡 Orta |
| `SahaKayitlari.tsx` | 930 | 37.5 | Liste, filtre, pagination, thumbnail grid, foto detay dialog | Foto dialog'u ayrı component, thumbnail row ayrı | 🟡 Orta |
| `AdminPanel.tsx` | 776 | 37.7 | User CRUD, kayıt listele, tab'lar | Tab başına ayrı component (`UsersTab`, `RecordsTab`) | 🟡 Orta |
| `SahaPanel.tsx` | 734 | 29.3 | Saha kullanıcısının kendi kayıt akışı | (Saha) form + liste ayrı | 🟡 Orta |
| `PrintEditor.tsx` | 700 | 25.8 | Yazıcı ayarları + PDF önizleme + .ttf font yükleme | 🚫 **PDF'e dokunma** — sadece UI bölümü ayrılabilir | 🔴 PDF |
| `MusteriGecmisi.tsx` | 648 | 27.8 | Liste + jspdf-autotable PDF export (433 KB bundle!) | jspdf import'u dynamic import'a alınabilir (bundle küçülür) | 🟡 |
| `AtolyeDialog.tsx` | 604 | 22.9 | Form + alt-dialog'lar; 19 console log | Form hook, alt-dialog ayrı | 🟡 |
| `Settings.tsx` | 439 | 16.8 | Profil + sistem ayarları | Düşük öncelik | 🟢 |
| `IslemFilters.tsx` | 430 | 16.3 | ~15 filtre alanı | Filter group component'lere | 🟢 |
| Diğer (271 ↓) | — | — | Görece sağlıklı | — | 🟢 |

**Toplam frontend:** 13.873 satır → ilk **4 dosya 6.499 satır** (%47).

---

## 9. services/api.ts Özeti

Toplam: 275 satır, tek dosya.

| Servis | Endpoint sayısı (tahmin) | Kullanıldığı componentler | Ayrılma önerisi | Risk |
|---|---|---|---|---|
| `authService` | 5+ (login, bayi-login, register, verify-system-password, logout helper) | `Login.tsx`, `AuthContext.tsx`, `Dashboard.tsx` | `services/auth.api.ts` | 🟢 |
| `islemService` | 8 | `Dashboard.tsx`, `IslemTable.tsx`, `IslemDialog.tsx`, `MusteriGecmisi.tsx` | `services/islem.api.ts` | 🟢 |
| `adminService` | 7-8 | `AdminPanel.tsx` | `services/admin.api.ts` | 🟢 |
| `sahaService` | 13+ | `SahaPanel.tsx`, `SahaKayitlari.tsx`, `AdminPanel.tsx` | `services/saha.api.ts` | 🟢 |
| `atolyeService` | 7 | `AtolyeTakip.tsx`, `AtolyeDialog.tsx` | `services/atolye.api.ts` | 🟢 |
| Diğer (markalar, teknisyenler, urunler, aksesuarlar, montajlar, bayiler, locations, karaliste, printerSettings) | ~30 | Settings, IslemDialog, AtolyeDialog | `services/reference.api.ts` veya ayrı | 🟢 |

### Davranış (doğrulanmalı, kod okundu)
- **Axios interceptor:** GET istekleri için 500/502/503/504/ECONNABORTED → 2 retry, 500ms backoff.
- **401 handling:** Tüm 401 yanıtlarında `window.location.href = '/login'` (hard reload, state kaybı).
- **localStorage token:** `localStorage.getItem('token')` ile Authorization header'a ekleniyor.
- **VITE_API_URL:** `import.meta.env.VITE_API_URL || '/api'` (api.ts:8).
- **Error parsing:** Tutarsız (`error.response?.data?.message || error.response?.data?.error || error.message`).

### Phase 3 önerisi
- 9 servisi `services/api/` klasörüne ayır.
- **Davranış aynı kalır** — sadece import path'leri değişir.
- 275 satır → 9 dosya x ~30 satır.

---

## 10. PDF/Excel Risk Özeti

| Alan | Dosya | Risk | Dokunma seviyesi |
|---|---|---|---|
| pdf-lib + fontkit | `utils/print.ts` (557 satır) | 🔴 Yüksek — Türkçe karakter font fix burada | 🚫 Phase 2/3'te dokunulmaz |
| jspdf + jspdf-autotable | `utils/print.ts`, `components/MusteriGecmisi.tsx` | 🔴 Yüksek — autotable kolonları, kırılgan | 🚫 Phase 2/3'te dokunulmaz |
| xlsx | `utils/excel.ts` (146 satır) | 🟡 Orta — kolon sırası kullanıcıya teslim | 🟡 Sadece type ekleme, içerik aynı |
| html2canvas | (transitive, jspdf bağımlısı) | 🟡 200 KB bundle ağırlığı | Lazy import (Phase 4) |
| PrintEditor.tsx | `components/PrintEditor.tsx` (700 satır) | 🔴 Yazıcı kalibrasyonu | 🚫 Phase 2/3'te dokunulmaz |

> **Kural (kullanıcı isteği):** PDF çıktısı görsel hizalama açısından çok hassas. Türkçe karakterler, kâğıt boyutu, font yüklemesi, yazıcı kalibrasyonu gibi her detay deneme-yanılma ile çözülmüş olabilir. **Phase 4'e kadar PDF/Excel pipeline'ına dokunulmayacak.** Sadece import yolu düzenlemesi (dynamic import) bundle optimizasyonu için Phase 4'te yapılabilir.

---

## 11. İlk Uygulanacak Güvenli Refactor Adayları (Phase 3'ün açılış adımları)

Sıralanış: en düşük risk → orta risk. Her adım **davranış değiştirmez**, geri alınabilir.

1. **🟢 `Express.Request` type augmentation** — `(req as any).user` cast'lerini kaldır (10 yer). Yalnızca tip değişikliği, runtime aynı.
2. **🟢 JWT_SECRET fallback'lerinin merkezîleştirilmesi** — Tek bir `config/env.ts` ya da Zod schema; uygulama başlangıcında missing ise `throw`. Production'da zaten set olduğu için kullanıcı görmeden geçer.
3. **🟢 Bayi password bcrypt migration** — Sadece yeni bayiler için bcrypt; mevcutlar için lazy upgrade (login'de plaintext eşleşirse bcrypt'e dönüştür). Davranış: kullanıcı için aynı.
4. **🟢 `bayiler.ts` SELECT *'tan kolon listesine geçiş** — `password` kolonu artık API yanıtında yok. Sadece frontend bayiler ekranını kontrol etmek lazım.
5. **🟢 `(req as any).app.get('io')` → `req.app.get('io')` (type augmentation sayesinde)** — sıfır davranış.
6. **🟢 `pool.query` → `query()` migration (route bazlı, dosya dosya)** — Önce `karaliste.ts` (en küçük), sonra büyükler. Davranış: aynı + retry kazancı.
7. **🟡 Logger soyutlaması (console.* → logger)** — Phase 1'de eklenmedi. Kabuk: `backend/src/utils/logger.ts` ve `frontend/src/utils/logger.ts`. Default behavior `console.error`/`console.log`'a delegate, prod'da no-op. Davranışta görünür fark yok.
8. **🟡 `requireRole('admin')` middleware** — Mevcut JWT'de `role` zaten var; sadece guard ekleniyor. **Geri alınabilir** (route bazlı ekle/kaldır).
9. **🟡 Public route'lara `router.use(authenticateToken)` eklenmesi** — Bu **davranış değişikliği** olur (anonim çağrılar 401 alır). Frontend tarafında auth zaten token gönderiyor; ama varsa anonim Postman test'leri etkilenir. **Kullanıcı onayı** gerekir.

---

## 12. Ertelenmesi Gereken Riskli İşler

| İş | Neden ertelendi | Hangi Phase |
|---|---|---|
| PDF font/layout/print.ts | Görsel hizalama kırılgan | Phase 4+ (belki hiç) |
| Excel kolon sırası | Kullanıcı alışkanlığı | Phase 4+ |
| Socket.IO event isimleri | Frontend dinleyici bağımlılığı | Hiç değişmez |
| `frontend/dist` deploy yapısı | Hostinger'a manuel zip | Phase 5+ |
| Root `npm run build` script (npm ci) | Hostinger build flow | Phase 5+ |
| DB schema migration (column rename/drop) | Production veri | Phase 5+ |
| ILIKE → trigram + GIN index | Lokal test gerek | Phase 4 |
| `EXTRACT(...)` functional index | Lokal test gerek | Phase 4 |
| `COALESCE(MAX(id)+1)` → SERIAL | DB schema değişikliği | Phase 4 |
| Git history rewrite (env değerleri) | Tehlikeli | Phase 6 (opsiyonel) |
| Component'leri parçalamak (IslemDialog, IslemTable) | Test gerekir | Phase 5 |

---

## ÇIKTI ÖZETİ (kullanıcı sorularına cevap)

### 1. Hangi komutlar çalıştırıldı?
- `git ls-files | Select-String '\.env'` (env audit)
- `cd backend && npx tsc --noEmit --noUnusedLocals --noUnusedParameters`
- `cd frontend && npx tsc --noEmit --noUnusedLocals --noUnusedParameters`
- 9 ayrı PowerShell taraması: console, db patterns (10 regex), auth patterns (10 regex), socket emit/on, hardcoded SOCKET_URL, router definitions, component satır sayımı, PDF/Excel import'ları, file-level `router.use(authenticate)` kontrolü.

### 2. Hangi dosyalar üretildi?
**Kalıcı (commit'lenecek):**
- `docs/refactor/phase-2-inventory.md` (bu dosya)
- `docs/refactor/api-contract.md`
- `docs/refactor/env-security-audit.md`

**Ham (gitignore'da):**
- `reports/backend-unused.txt`
- `reports/frontend-unused.txt`
- `reports/backend-console.txt`
- `reports/frontend-console.txt`
- `reports/db-usage.csv`

### 3. Hangi dosyalar değişti?
**Hiçbir kaynak kodu değişmedi.** Sadece yukarıdaki yeni doküman dosyaları eklendi.

### 4. Kod değişikliği yaptın mı?
**Hayır.**

### 5. Env açısından acil risk var mı?
**Evet, ama Phase 2'yi engellemiyor.**
- `backend/.env.production` tracked → Railway secret'lar (JWT_SECRET, DATABASE_URL, SYSTEM_PASSWORD_HASH muhtemelen) repo'da görünür.
- Repo public ise rotation bugün yapılmalı. Private ise bu hafta yeterli.
- Bu adımda **hiçbir aksiyon alınmadı** (kullanıcı isteği gereği).

### 6. Phase 3'e geçmeden önce ne yapmalıyız?
1. **Karar:** Repo public/private statüsü?
2. **Karar:** Env secret'lar rotate edilecek mi, ne zaman?
3. **Karar:** Phase 2 raporları commit'lenecek mi (`docs/refactor/*.md`)?
4. **Doğrulama:** `backend/.env.production` gerçekten Railway DATABASE_URL/JWT_SECRET içeriyor mu? (Sadece kullanıcı bakar — agent okumadı.)
5. **Onay:** Phase 3 ilk 6 adım (low-risk) onayı.

### 7. Phase 2'deki en kritik 10 bulgu

1. 🔴 **`backend/.env.production` tracked** — production secret'lar repo'da
2. 🔴 **`bayiler.ts` GET /** SELECT * ile plaintext password döndürüyor — **public endpoint**
3. 🔴 **Bayi login plaintext compare** (`auth.ts:106`)
4. 🔴 **`/register` endpoint korumasız** — kim isterse user yaratabilir
5. 🔴 **Admin endpoint'lerinde rol guard yok** — geçerli herhangi token (bayi/saha/user) admin'e erişebilir
6. 🔴 **JWT_SECRET fallback inconsistency** — 4 yer `''`, 1 yer `'secret'` (saha.ts)
7. 🔴 **75 endpoint'in 44'ü auth gerektirmiyor** — `router.use(authenticate)` hiçbir route'ta yok
8. 🔴 **Socket.IO handshake'inde auth yok** — herkes müşteri verisi broadcast'ini dinleyebilir
9. 🟡 **`pool.query` (74) vs `query()` (14) tutarsızlığı** — retry kullanılmıyor, transient hatalar 500'e dönüyor
10. 🟡 **`COALESCE(MAX(id),0)+1` race condition** (atolye.ts) ve `ILIKE '%...%'` x 18 (islemler.ts) performans riski
