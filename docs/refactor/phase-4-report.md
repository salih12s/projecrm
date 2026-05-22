# Phase 4 — Services / api.ts Split Raporu

**Tarih:** Phase 4 yürütmesi
**Branch:** `refactor/phase-0-baseline`
**Önceki commit:** `ff9d116` (Phase 3 structural refactor)

## 1. Hedef

`frontend/src/services/api.ts` (328 satır, tek dosya) içindeki servis nesnelerini
ayrı dosyalara taşıyıp `api.ts`'yi:
- Axios instance + interceptor + retry yardımcılarını içeren bir setup dosyası
- Yeni servis modüllerinden re-export yapan barrel

haline getirmek. **Davranış değiştirmemek**, **endpoint dokunmamak**,
**component importlarını kırmamak**.

## 2. Discovery — Plan ↔ Gerçek

`docs/refactor/services-api-split-plan.md` orijinal olarak 13 servisten bahsediyordu
(authService, islemService, adminService, sahaService, karalisteService, atolyeService,
bayiService, markaService, teknisyenService, montajService, aksesuarService,
urunService, locationService, printerSettingsService).

`services/api.ts` içeriği taranınca **sadece 5 servisin gerçekten export edildiği**
saptandı:

| Servis | Var mı? | Konum |
|---|---|---|
| authService | ✓ | api.ts |
| islemService | ✓ | api.ts |
| adminService | ✓ | api.ts |
| sahaService | ✓ | api.ts |
| karalisteService | ✓ | api.ts |
| atolyeService | ✗ | yok (componentler `api.get/post('/atolye/...')` ile direkt çağırıyor) |
| bayiService | ✗ | yok |
| markaService | ✗ | yok |
| teknisyenService | ✗ | yok |
| montajService | ✗ | yok |
| aksesuarService | ✗ | yok |
| urunService | ✗ | yok |
| locationService | ✗ | yok |
| printerSettingsService | ✗ | yok |

Eksik 8 "servis" component-içi direkt `api.X(...)` çağrılarıyla yapılmış durumda.
Bu turda **scope dahilinde olmadığı için bunlara dokunulmadı** ("Componentlere
minimum dokun" kuralı).

## 3. Yapılan Değişiklikler

### 3.1 Oluşturulan dosyalar

| Dosya | İçerik | Bağımlılıklar |
|---|---|---|
| `frontend/src/services/auth.service.ts` | `authService` (verifySystemPassword, register, login, bayiLogin, adminLogin, logout, getCurrentUser) | `{ api } from './api'` |
| `frontend/src/services/islem.service.ts` | `islemService` (getAll, getStats, searchByPhone, searchByName, create, update, delete, updateDurum) | `{ api } from './api'`, types from `'../types'` |
| `frontend/src/services/admin.service.ts` | `adminService` (createUser, getUsers, toggleUserStatus, deleteUser, getUserRecords, getUserAtolyeRecords, getAllRecords) | `{ api } from './api'`, `Islem` from `'../types'` |
| `frontend/src/services/saha.service.ts` | `sahaService` (login, createSahaElemani, getSahaElemanlari, toggleSahaElemaniStatus, deleteSahaElemani, createKayit, getKayitlar, getKayit, updateKayit, deleteKayit, getAllKayitlar, getKayitPhotos, getKayitThumbnail, getUserKayitlar) | `{ api } from './api'`, types from `'../types'` |
| `frontend/src/services/karaliste.service.ts` | `karalisteService` (add, remove, checkPhone, checkAddress, getAll) | `{ api } from './api'` |

### 3.2 `api.ts` içinde kalanlar

- `axios` ve type importları (`AxiosError`, `InternalAxiosRequestConfig`)
- `API_URL` (env'den okuma — değişmedi)
- `console.log('API URL:', ...)` debug log — değişmedi
- `api = axios.create(...)` — baseURL, timeout=30000, Content-Type header **aynı**
- `RetryableAxiosConfig` type
- `RETRYABLE_GET_STATUS_CODES = new Set([500, 502, 503, 504])`
- `sleep(ms)`
- `shouldRetryGetRequest(error)` — GET, retry<2, status retryable veya ECONNABORTED
- **Request interceptor** — `localStorage.getItem('token')` → `Authorization: Bearer ...` (değişmedi)
- **Response interceptor** — 401 → logout + redirect `/login`; retry GET 500-504/ECONNABORTED max 2x with `500*retryCount` ms backoff (değişmedi)
- `export { api }` — `api` instance export'u korundu

### 3.3 Re-export yapısı

```ts
// api.ts sonunda:
export { api };
export { authService } from './auth.service';
export { islemService } from './islem.service';
export { adminService } from './admin.service';
export { sahaService } from './saha.service';
export { karalisteService } from './karaliste.service';
```

Bu sayede tüm mevcut component importları **kırılmadan** çalışmaya devam ediyor:

- `import { api } from '../../services/api'` ✓
- `import { authService, sahaService } from '../services/api'` ✓
- `import { islemService, karalisteService } from '../../services/api'` ✓
- `import { adminService, sahaService } from '../../services/api'` ✓

15 import sitesi tarandı, hiçbiri değiştirilmedi.

### 3.4 Componentlerde değişiklik

**Sıfır.** Hiçbir component dosyası bu phase'de düzenlenmedi.

## 4. Değişmeyen davranışlar

- ✓ Axios instance konfigürasyonu (baseURL, timeout, headers)
- ✓ Request interceptor — `Authorization: Bearer <token>` ekleme mantığı aynı
- ✓ Response interceptor — 401 logout + redirect mantığı aynı
- ✓ Retry mekanizması — GET only, retry<2, status set [500,502,503,504], ECONNABORTED, 500*n ms backoff
- ✓ `localStorage` `token` / `user` davranışı aynı (login, logout, 401)
- ✓ Tüm endpoint path'leri aynı (`/auth/...`, `/islemler/...`, `/admin/...`, `/saha/...`, `/karaliste/...`)
- ✓ Request/response payload formatları aynı
- ✓ Type imzaları aynı
- ✓ Servis nesne isimleri ve method isimleri aynı (`authService.login`, `islemService.getAll`, vb.)

## 5. Test sonuçları

| Test | Sonuç |
|---|---|
| `npx tsc --noEmit` (frontend) | ✓ PASS — hata/uyarı yok |
| `npm run build` (vite) | ✓ PASS — 22.74s, exit 0 |
| Backend | Dokunulmadı |

Vite output (özet):
- `dist/index.html` 0.40 kB
- ana chunk `index-C0BMdOz0.js` 1.103 MB (Phase 3 ile aynı seviye)
- Lazy chunks (AdminPanel, SahaPanel, AtolyeTakip, SahaKayitlari, MusteriGecmisi) korundu

Build uyarıları (Phase 3'ten gelen, Phase 4 kaynaklı değil):
- `Settings.tsx hem static hem dynamic import` (App.tsx + Dashboard.tsx)
- `chunks > 500kB` (refactor öncesinden beri mevcut)

## 6. Riskli noktalar

1. **Dairesel import (apparent)** — Her servis dosyası `./api`'den `api`'yi import ediyor;
   `api.ts` aynı dosyaları re-export ediyor. ESM live binding sayesinde sorun çıkmıyor
   (api instance, re-export değerlendirilmeden önce initialize ediliyor).
   tsc + build temiz geçti, runtime'da da çalışacak. **Yine de servis dosyalarının
   top-level body'sinde `api.X(...)` çağrısı YAPILMAMALI** — sadece method body
   içinde kullanılmalı. Şu an böyle, hepsi `async` method gövdesinde.

2. **Component-içi direkt `api.X()` çağrıları** — atolye, bayi, marka, teknisyen,
   montaj, aksesuar, urun, location, printerSettings endpoint'leri hâlâ
   componentlerde inline. Bu, plan dökümanının (`services-api-split-plan.md`)
   13 servis hedefiyle çelişiyor. Bu turda kapsam dışında bırakıldı.

3. **`export { api }` hâlâ public** — komponentler `api.get('/anything')` yapabiliyor.
   İdeal olan `api`'yi private yapıp her endpoint için servis fonksiyonu olması.
   Bu Phase 4 kuralı dışında — sonraki phase'e taşındı.

## 7. Sonraki adım önerisi

**Phase 5 — Domain Service Extraction (öneri):**
Componentlerde inline `api.X('/atolye/...')`, `api.X('/markalar/...')`,
`api.X('/teknisyenler/...')`, `api.X('/montajlar/...')`, `api.X('/aksesuarlar/...')`,
`api.X('/urunler/...')`, `api.X('/locations/...')`, `api.X('/bayiler/...')`,
`api.X('/printer-settings/...')` çağrılarını yeni servis modüllerine taşımak:

- `atolye.service.ts`
- `bayi.service.ts`
- `marka.service.ts`
- `teknisyen.service.ts`
- `montaj.service.ts`
- `aksesuar.service.ts`
- `urun.service.ts`
- `location.service.ts`
- `printerSettings.service.ts`

Bu komponente dokunmayı **gerektirir** — Phase 4 kapsamı dışındaydı, ayrı bir
phase olarak yapılmalı.

**Alternatif/Paralel:**
- Phase 1 hygiene değişikliklerini (`.gitignore`, `.env.example`, `vite.config.ts`,
  `print.ts.backup` silinmesi) ayrı bir commit olarak işle.
- Phase 2.5 security plan'ı (JWT secret rotation, env validation, helmet, rate limit)
  uygulamaya başla.

## 8. Commit önerisi

```
refactor(frontend): split services/api.ts into per-domain modules

- Extract authService → services/auth.service.ts
- Extract islemService → services/islem.service.ts
- Extract adminService → services/admin.service.ts
- Extract sahaService → services/saha.service.ts
- Extract karalisteService → services/karaliste.service.ts
- api.ts kept: axios instance, interceptors, retry helpers
- api.ts re-exports all 5 services so existing component imports
  (`from '../services/api'`) continue to work unchanged.

Behavior preserved: endpoints, payloads, token/localStorage,
401 redirect, GET retry policy (500/502/503/504/ECONNABORTED, max 2,
500*n ms backoff). Zero component file modifications.

tsc --noEmit: clean. vite build: 22.74s, exit 0.
```
