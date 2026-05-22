# API Contract (Phase 2 envanteri)

**Tarih:** 22 Mayıs 2026
**Kaynak:** Kod analizi (router tanımları, middleware kullanımı, SQL pattern'leri).
**Önemli:** Bu doküman **mevcut davranışı** belgeliyor — refactor sırasında değişmeyecek sözleşme listesidir. Emin olunmayan satırlar `(doğrulanmalı)` ile işaretlendi.

## Genel notlar

- Tüm route'lar `/api` prefix'i altında mount edilir (`server.ts:90-104`).
- "Auth?" sütunu **sadece JWT token doğrulaması** olup olmadığını gösterir; **rol kontrolü hiçbir route'ta yapılmaz** (`authMiddleware` sadece token verify eder).
- Error response formatı **tutarsız**: bazı endpoint'ler `{ error: "..." }`, bazıları `{ message: "..." }` döner. (Phase 3 hedefi.)
- Tüm socket emit'ler **global broadcast** (room/namespace yok).
- "Auth?" = `authenticateToken` middleware'i route'a doğrudan veya `router.use` ile uygulanmış mı? Kaynak: `grep authenticateToken`.

---

## /api/auth — `routes/auth.ts`

| Method | Endpoint | Auth? | Rol kontrolü | Request | Response (özet) | Socket |
|---|---|---|---|---|---|---|
| POST | `/register` | ❌ **KORUMASIZ** | Yok | body: `{ username, password }` | 200: `{ token, user }` (doğrulanmalı) | — |
| POST | `/login` | ❌ (public, login) | Yok | body: `{ username, password }` | 200: `{ token, user{role:'user'} }` / 401 `{ error }` | — |
| POST | `/bayi-login` | ❌ | Yok | body: `{ bayiKodu, password }` | 200: `{ token, user{role:'bayi', bayiIsim} }` / 401 (doğrulanmalı) — **plaintext password karşılaştırma (auth.ts:106)** | — |
| POST | `/verify-system-password` | ❌ | Yok | body: `{ password }` | 200: `{ valid: bool }` (bcrypt) | — |

🔴 **Risk:** `/register` korumasız → kayıt sınırı yok, brute-force kullanıcı yaratma mümkün.
🔴 **Risk:** `/bayi-login` plaintext şifre karşılaştırması (auth.ts:106).

---

## /api/admin — `routes/admin.ts`

| Method | Endpoint | Auth? | Rol kontrolü | Request | Response | Socket |
|---|---|---|---|---|---|---|
| POST | `/login` | ❌ | Yok | body: `{ username, password }` | 200: `{ token, user{role:'admin'} }` / 401 | — |
| POST | `/create-user` | ✅ token | ❌ **Yok** — her token çalışır | body: `{ username, password, role? }` | 201 / 400 (doğrulanmalı) | — |
| GET | `/users` | ✅ | ❌ | — | `User[]` (doğrulanmalı: password gizli mi?) | — |
| PATCH | `/users/:id/toggle` | ✅ | ❌ | params: id | `User` veya `{ success }` (doğrulanmalı) | — |
| DELETE | `/users/:id` | ✅ | ❌ | params: id | `{ message }` (doğrulanmalı) | — |
| GET | `/user-records/:username` | ✅ | ❌ | params: username | `Islem[]` | — |
| GET | `/user-atolye-records/:username` | ✅ | ❌ | params: username | `Atolye[]` | — |
| GET | `/all-records` | ✅ | ❌ | — | `{ islemler, atolye }` veya benzeri (doğrulanmalı) | — |

🔴 **Risk:** Admin tüm endpoint'leri sadece token istiyor; rol guard yok → herhangi geçerli token (bayi/user/saha) admin paneline yazabilir.

---

## /api/islemler — `routes/islemler.ts`

| Method | Endpoint | Auth? | Rol kontrolü | Request | Response | Socket |
|---|---|---|---|---|---|---|
| GET | `/stats` | ❌ | — | query: opsiyonel filtreler (doğrulanmalı) | `{ counts, sums }` | — |
| GET | `/` | ❌ | — | query: ~15 ILIKE filtre + page/limit (opsiyonel) | `Islem[]` veya `{ rows, total }` (sayfalı/sayfasız iki mod) | — |
| GET | `/search-by-phone` | ❌ | — | query: `phone` | `Islem[]` | — |
| GET | `/search-by-name` | ❌ | — | query: `name` | `Islem[]` | — |
| POST | `/` | ❌ | — | body: tam islem nesnesi | 201 `Islem` (created_by = `req.user?.username`) | `yeni-islem` (line 316) |
| PUT | `/:id` | ❌ | — | body: tam veya kısmi | 200 `Islem` | `islem-guncellendi` (line 394) |
| DELETE | `/:id` | ❌ | — | params: id | `{ message }` veya 204 | `islem-silindi` (line 421) |
| PATCH | `/:id/durum` | ❌ | — | params: id, body: `{ durum, ... }` | 200 `Islem` | `islem-durum-degisti` (line 453) |

🟡 **Risk:** Tüm CRUD endpoint'leri **authenticateToken YOK** → public erişim. (Doğrulanmalı: `router.use` ile global mi uygulanmış? Aşağıdaki "Genel kontrol notu" başlığına bakın.)
🟡 18 ILIKE `%...%` (full-text search; index kullanmıyor, büyük tabloda yavaşlar).
🟡 2 EXTRACT( kullanımı (tarih-bazlı index'i bypass eder).

---

## /api/atolye — `routes/atolye.ts`

| Method | Endpoint | Auth? | Rol kontrolü | Request | Response | Socket |
|---|---|---|---|---|---|---|
| GET | `/` | ❌ | — | query: page/limit (opsiyonel) | `Atolye[]` veya sayfalı | — |
| GET | `/next-id` | ❌ | — | — | `{ nextId }` — **COALESCE(MAX(id),0)+1 (race condition)** | — |
| GET | `/status-counts` | ❌ | — | — | `{ counts }` — 10sn in-memory cache | — |
| GET | `/:id` | ❌ | — | params: id | `Atolye` veya 404 | — |
| POST | `/` | ❌ | — | body: tam | 201 `Atolye` (created_by = `(req as any).user?.username`) | `yeni-atolye` (line 174) |
| PUT | `/:id` | ❌ | — | body: dynamic UPDATE | 200 `Atolye` | `atolye-guncellendi` (line 283) |
| DELETE | `/:id` | ❌ | — | params: id | `{ message }` | `atolye-silindi` (line 313) |

🟡 `next-id` race condition: aynı anda 2 POST = aynı id (sequence/serial kullanılmıyor).
🟡 10sn cache tek-instance varsayar — Railway scale-out olursa tutarsızlık.

---

## /api/bayiler — `routes/bayiler.ts`

| Method | Endpoint | Auth? | Rol kontrolü | Request | Response | Socket |
|---|---|---|---|---|---|---|
| GET | `/` | ❌ | — | — | `Bayi[]` (**SELECT *** → `password` plaintext döner) | — |
| POST | `/` | ❌ | — | body: bayi info | 201 — **default password `'123456'` plaintext insert** | — |
| PUT | `/:id` | ❌ | — | body | 200 | — |
| DELETE | `/:id` | ❌ | — | params | `{ message }` | — |

🔴 **Kritik:** `GET /` `SELECT *` → tüm bayi şifreleri plaintext API yanıtında.
🔴 **Kritik:** POST default password `'123456'` ve plaintext saklama.

---

## /api/saha — `routes/saha.ts`

| Method | Endpoint | Auth? | Rol kontrolü | Request | Response | Socket |
|---|---|---|---|---|---|---|
| POST | `/login` | ❌ | — | body: `{ username, password }` | 200: `{ token, user{role:'saha'} }` / 401 | — |
| POST | `/create` | ✅ | ❌ | body: yeni saha user | 201 (doğrulanmalı) | — |
| GET | `/users` | ✅ | ❌ | — | `SahaUser[]` | — |
| PATCH | `/users/:id/toggle` | ✅ | ❌ | params | 200 | — |
| DELETE | `/users/:id` | ✅ | ❌ | params | `{ message }` | — |
| POST | `/kayit` | ✅ | ❌ | body: `{ ..., foto_data (base64) }` | 201 `SahaKayit` | — |
| GET | `/kayitlar` | ✅ | ❌ | query: filter+page | `SahaKayit[]` (kendi kayıtları) (doğrulanmalı) | — |
| GET | `/kayit/:id` | ✅ | ❌ | params | `SahaKayit` | — |
| PUT | `/kayit/:id` | ✅ | ❌ | body | 200 | — |
| DELETE | `/kayit/:id` | ✅ | ❌ | params | `{ message }` | — |
| GET | `/kayit-thumbnail/:id` | ✅ | ❌ | params | image bytes (thumbnail) | — |
| GET | `/kayit-photos/:id` | ✅ | ❌ | params | base64 photos array | — |
| GET | `/all-kayitlar` | ✅ | ❌ | query | tüm saha kayıtları (admin amaçlı, rol kontrol YOK) | — |
| GET | `/user-kayitlar/:username` | ✅ | ❌ | params | belirli user kayıtları | — |

🔴 **Risk:** `JWT_SECRET || 'secret'` fallback (saha.ts:44) — diğer route'lardan farklı.
🟡 Foto base64 TEXT olarak DB'de — Postgres TOAST/iyileştirme gerekebilir.
🟡 `all-kayitlar` "admin için" ama herhangi saha kullanıcısı da erişebilir.

---

## /api/karaliste — `routes/karaliste.ts`

| Method | Endpoint | Auth? | Rol kontrolü | Request | Response | Socket |
|---|---|---|---|---|---|---|
| POST | `/` | ❌ | — | body: telefon/adres bilgileri | 201 (created_by: `(req as any).user?.username || 'system'`) | — |
| DELETE | `/:id` | ❌ | — | params | `{ message }` | — |
| GET | `/check-phone` | ❌ | — | query: phone | `{ inBlacklist: bool }` | — |
| GET | `/check-address` | ❌ | — | query | `{ inBlacklist: bool }` | — |
| GET | `/` | ❌ | — | — | `Karaliste[]` | — |

---

## /api/urunler — `routes/urunler.ts`

| Method | Endpoint | Auth? | Rol kontrolü | Request | Response | Socket |
|---|---|---|---|---|---|---|
| GET | `/` | ✅ | ❌ | — | `Urun[]` | — |
| POST | `/` | ✅ | ❌ | body | 201 | — |
| PUT | `/:id` | ✅ | ❌ | body | 200 | — |
| DELETE | `/:id` | ✅ | ❌ | params | `{ message }` | — |

✅ **Tek route ailesi** tüm endpoint'leri auth ile koruyor (urunler).

---

## /api/markalar, /api/aksesuarlar, /api/montajlar, /api/teknisyenler

Hepsi aynı CRUD şablonu, **hiçbiri auth gerektirmez**:

| Method | Endpoint | Auth? | Request | Response |
|---|---|---|---|---|
| GET | `/` | ❌ | — | `T[]` |
| POST | `/` | ❌ | body | 201 |
| PUT | `/:id` | ❌ | body | 200 |
| DELETE | `/:id` | ❌ | params | `{ message }` |

🟡 **Risk:** Public CRUD → herhangi biri marka/teknisyen/aksesuar tablosunu doldurabilir.

---

## /api/ilceler ve /api/locations/ilceler — `routes/locations.ts`

İki farklı mount path'i aynı router'a (`server.ts:100-101`) — duplicate mount.

| Method | Endpoint | Auth? | Request | Response |
|---|---|---|---|---|
| GET | `/` | ❌ | — | `Ilce[]` |
| GET | `/:ilceId/mahalleler` | ❌ | params | `Mahalle[]` |

🟡 Bilgi: `app.use('/api/ilceler', locationsRoutes)` ve `app.use('/api/locations/ilceler', locationsRoutes)` aynı handler'a iki ayrı public yol. Frontend hangisini kullanıyor? → doğrulanmalı.

---

## /api/printer-settings — `routes/printerSettings.ts`

| Method | Endpoint | Auth? | Request | Response |
|---|---|---|---|---|
| GET | `/:marka` | ❌ | params: marka | `PrinterSettings` veya null |
| POST | `/:marka` | ❌ | params + body | `PrinterSettings` (upsert?) |
| DELETE | `/:marka` | ❌ | params | `{ message }` |

---

## Socket.IO event sözleşmesi (refactor'da DEĞİŞMEYECEK)

| Event | Emit yeri (backend) | Listener yeri (frontend) | Tetiklendiği akış | Payload tipi tahmini |
|---|---|---|---|---|
| `yeni-islem` | `routes/islemler.ts:316` (POST /) | `Dashboard.tsx:132` | Yeni işlem yaratıldıktan sonra | `Islem` (yeni kayıt) |
| `islem-guncellendi` | `routes/islemler.ts:394` (PUT /:id) | `Dashboard.tsx:140` | İşlem güncelleme | `Islem` |
| `islem-silindi` | `routes/islemler.ts:421` (DELETE /:id) | `Dashboard.tsx:150` | İşlem silme | `{ id }` veya `number` |
| `islem-durum-degisti` | `routes/islemler.ts:453` (PATCH /:id/durum) | `Dashboard.tsx:158` | Durum güncelleme | `Islem` veya `{ id, durum }` |
| `yeni-atolye` | `routes/atolye.ts:174` (POST /) | `AtolyeTakip.tsx:230` | Yeni atölye kaydı | `Atolye` |
| `atolye-guncellendi` | `routes/atolye.ts:283` (PUT /:id) | `AtolyeTakip.tsx:246` | Atölye güncelleme | `Atolye` |
| `atolye-silindi` | `routes/atolye.ts:313` (DELETE /:id) | `AtolyeTakip.tsx:257` | Atölye silme | `{ id }` |

Diğer event'ler: `connect`, `connect_error` (standart Socket.IO).

**Notlar:**
- `app.get('io')` kullanımı 7 yerde (atolye 3, islemler 4).
- Hardcoded SOCKET_URL **2 yerde** (`Dashboard.tsx:113`, `AtolyeTakip.tsx:210`) — `import.meta.env.MODE === 'production' ? 'https://projecrm-production.up.railway.app' : 'http://localhost:5000'`.
- Socket.IO handshake'inde **auth/token yok** → public broadcast'i herkes dinleyebilir (Railway'e bağlanıp `socket.io-client` çalıştıran herkes).

---

## Genel kontrol notu — "auth?" değerleri

Bu raporda "Auth ❌" demek **route definition satırında** `authenticateToken` import edilmemiş ya da çağrılmamış demektir. Bazı route'lar `router.use(authenticateToken)` ile **tüm router seviyesinde** middleware uygulamış olabilir.

**Doğrulanmalı:**
- `islemler.ts`, `atolye.ts`, `karaliste.ts`, `bayiler.ts`, `markalar.ts`, `aksesuarlar.ts`, `montajlar.ts`, `teknisyenler.ts`, `locations.ts`, `printerSettings.ts` dosyalarında **dosya başında** `router.use(authenticateToken)` var mı?
- `req.user?.username` ile created_by atayan kod (islemler.ts:309, karaliste.ts:30, atolye.ts:131) **auth varsayar** → muhtemelen `router.use` ile veya app-level middleware ile token zorlanıyor.
- Eğer öyleyse "Auth ❌" işaretleri yanlış pozitif; **Phase 3 başında bu doğrulama yapılacak.**

> Önce bu doğrulama yapılmadan public CRUD'a "güvenlik açığı" demek hatalı olabilir. Yine de iki seviye birden (file + route) auth uygulanması daha güvenli pattern.

---

## Özet sayım

- **Toplam endpoint:** 75
- **Açıkça `authenticateToken` ile korunan endpoint:** 27 (admin 7, saha 14, urunler 4, + import satırları sayım dışı)
- **Login endpoint'i (public olması gereken):** 4 (user, bayi, admin, saha)
- **Public kalanlar (auth yok görünen):** ~44 (file-level `router.use` doğrulanmalı)
- **Socket event:** 7 named + 2 standart
