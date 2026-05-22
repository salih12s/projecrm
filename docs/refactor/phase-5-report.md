# Phase 5 — Domain Service Extraction Raporu

**Tarih:** Phase 5 yürütmesi
**Branch:** `refactor/phase-0-baseline`
**Önceki commit:** `973ef16` (Phase 4 — services/api.ts split)
**Bu phase'in commitleri:**
- `2d711d5` — group 1: reference + bayi + location
- *(group 2 commit hash — bu commit'ten sonra eklenecek)*

## 1. Hedef

Componentlerin içindeki inline `api.get/post/put/delete` çağrılarını domain
servislerine taşımak. Endpoint, payload, response davranışı, UI state, validation
ve loading davranışı **değişmeden** sadece API katmanını çekmek.

## 2. Discovery — Inline API Çağrı Envanteri

Phase 5 başında `frontend/src/components/**/*.{ts,tsx}` altında **34 inline
`api.X()` çağrısı** tespit edildi (6 dosyada):

| Dosya | Çağrı sayısı | Endpoint'ler |
|---|---|---|
| `components/settings/Settings.tsx` | 9 | `/teknisyenler`, `/markalar`, `/bayiler`, `/urunler`, `/montajlar`, `/aksesuarlar` GET + dinamik PUT/POST/DELETE |
| `components/settings/PrintEditor.tsx` | 3 | `/printer-settings/:marka` GET/POST/DELETE |
| `components/islem/IslemFilters.tsx` | 4 | `/montajlar`, `/aksesuarlar`, `/teknisyenler`, `/markalar` GET |
| `components/islem/IslemDialog.tsx` | 9 | `/teknisyenler`, `/markalar`, `/montajlar`, `/aksesuarlar`, `/urunler`, `/ilceler`, `/ilceler/:id/mahalleler` (3 site) GET |
| `components/atolye/AtolyeDialog.tsx` | 6 | `/atolye/next-id`, `/bayiler`, `/markalar`, `/atolye/:id`, `/atolye/:id` PUT, `/atolye` POST |
| `components/atolye/AtolyeTakip.tsx` | 3 | `/atolye/status-counts`, `/atolye?all=true`, `/atolye/:id` DELETE |

`context/`, `utils/`, `hooks/` altında inline `api.X()` çağrısı **yoktu**.

## 3. Oluşturulan Servis Dosyaları

Toplam **9 yeni servis dosyası**:

| Dosya | Sembol | Endpoint(ler) |
|---|---|---|
| `frontend/src/services/marka.service.ts` | `markaService` | GET/POST/PUT/DELETE `/markalar[/:id]` |
| `frontend/src/services/teknisyen.service.ts` | `teknisyenService` | GET/POST/PUT/DELETE `/teknisyenler[/:id]` |
| `frontend/src/services/montaj.service.ts` | `montajService` | GET/POST/PUT/DELETE `/montajlar[/:id]` |
| `frontend/src/services/aksesuar.service.ts` | `aksesuarService` | GET/POST/PUT/DELETE `/aksesuarlar[/:id]` |
| `frontend/src/services/urun.service.ts` | `urunService` | GET/POST/PUT/DELETE `/urunler[/:id]` |
| `frontend/src/services/bayi.service.ts` | `bayiService` | GET/POST/PUT/DELETE `/bayiler[/:id]` |
| `frontend/src/services/location.service.ts` | `locationService` | GET `/ilceler`, GET `/ilceler/:id/mahalleler` |
| `frontend/src/services/atolye.service.ts` | `atolyeService` | GET `/atolye/status-counts`, GET `/atolye?all=true`, GET `/atolye/next-id`, GET/PUT/DELETE `/atolye/:id`, POST `/atolye` |
| `frontend/src/services/printerSettings.service.ts` | `printerSettingsService` | GET/POST/DELETE `/printer-settings/:marka` |

**Servis method desenleri:**
- Tüm referans servisleri (`marka/teknisyen/montaj/aksesuar/urun/bayi`) ortak imza:
  `getAll(): Promise<T[]>`, `create({isim})`, `update(id, {isim})`, `delete(id)`
- `locationService`: `getIlceler()`, `getMahalleler(ilceId)` — `Ilce` ve `Mahalle`
  tipleri export ediliyor.
- `atolyeService`: `getStatusCounts()`, `getAll()`, `getNextId()`, `getById(id)`,
  `create(dto)`, `update(id, dto)`, `delete(id)` — Atolye/AtolyeCreateDto/AtolyeUpdateDto
  tipleri `'../types'`'ten alınıyor.
- `printerSettingsService`: `get(marka)`, `save(marka, layout)`, `delete(marka)` —
  layout şekli component tarafında tip'lendiği için service `any` kullanıyor (kasıtlı, davranış kayması yok).

Tüm metotlar `response.data`'yı **unwrap** edip değerin kendisini döndürüyor.
Bu, componentlerde `.data` erişimini kaldırarak okunabilirliği artırıyor ancak
endpoint/payload/response yapısı değişmiyor.

## 4. `api.ts` Re-Export Listesi

`api.ts` axios instance + request/response interceptor + retry yardımcılarını
korurken **14 servisin barrel'ı** haline geldi:

```ts
export { api };
export { authService } from './auth.service';
export { islemService } from './islem.service';
export { adminService } from './admin.service';
export { sahaService } from './saha.service';
export { karalisteService } from './karaliste.service';
export { markaService } from './marka.service';
export { teknisyenService } from './teknisyen.service';
export { montajService } from './montaj.service';
export { aksesuarService } from './aksesuar.service';
export { urunService } from './urun.service';
export { bayiService } from './bayi.service';
export { locationService } from './location.service';
export { atolyeService } from './atolye.service';
export { printerSettingsService } from './printerSettings.service';
```

Mevcut tüm component importları (`from '../../services/api'`) **kırılmadan**
çalışmaya devam ediyor.

## 5. Inline API Çağrıları Kaldırılan Componentler

| Component | Kaldırılan çağrı | Yerine konan |
|---|---|---|
| `Settings.tsx` | 9 inline çağrı (dinamik endpoint dispatch dahil) | `teknisyenService/markaService/bayiService/urunService/montajService/aksesuarService` `.getAll/.create/.update/.delete` — tab/type'a göre service map ile seçiliyor |
| `IslemFilters.tsx` | 4 (`Promise.all` referans yüklemesi) | `montajService/aksesuarService/teknisyenService/markaService` `.getAll()` |
| `IslemDialog.tsx` | 9 (referans data `Promise.all` + 3 mahalle yüklemesi + 1 ilçe) | `*Service.getAll()`, `locationService.getIlceler()`, `locationService.getMahalleler(ilceId)` |
| `AtolyeDialog.tsx` | 6 | `atolyeService.getNextId/getById/create/update`, `bayiService.getAll()`, `markaService.getAll()` |
| `AtolyeTakip.tsx` | 3 | `atolyeService.getStatusCounts/getAll/delete` |
| `PrintEditor.tsx` | 3 | `printerSettingsService.get/save/delete` |

**Doğrulama (Phase 5 sonu):**
- `grep "api\.(get|post|put|delete|patch)" frontend/src/components/**` → **0 match**
- `grep "import { api }" frontend/src/components/**` → **0 match**

Tüm componentlerden `api` ham instance'ına bağımlılık kaldırıldı. `api` artık
yalnızca `services/*.service.ts` modüllerinin iç kullanımında.

## 6. Davranışı Aynı Kalan Kritik Noktalar

- ✓ **Tüm endpoint path'leri** karakter karakter aynı (`/atolye?all=true` query string dahil).
- ✓ **Request payload'ları** aynı (`{ isim }` referans CRUD, `createDto/updateDto`
  atölye, `layoutConfig` printer-settings).
- ✓ **Response unwrap'i** servis tarafına alındı; component tarafı verinin kendisini
  alıyor — eski `response.data` erişimi `data` ile değişti, ancak değer aynı.
- ✓ **Axios interceptor** (request token + response 401/retry) — `api.ts` içinde
  değişmedi, tüm istekler hâlâ aynı global akıştan geçiyor.
- ✓ **Retry mekanizması** (GET 500/502/503/504/ECONNABORTED, max 2, 500*n ms backoff) — değişmedi.
- ✓ **Token / localStorage** davranışı — sadece `authService` ve `sahaService.login`
  içinde, dokunulmadı.
- ✓ **Snackbar / try-catch / loading state / form validation** componentlerde
  yerinde duruyor; sadece `await api.X(...)` satırları `await *Service.X(...)` ile değişti.
- ✓ **Caching:** `IslemDialog`'daki `localStorage.getItem('islemDialogData')` 5 dk
  TTL cache mantığı **aynen** korundu; cache miss durumunda servis çağrılarına geçiliyor.
- ✓ **Settings.tsx dinamik CRUD dispatch:** tab/type → endpoint string mantığı,
  tab/type → service object dispatch'ine dönüştürüldü. Aynı dallanma kuralları,
  aynı tab indeks-eşleştirmesi, aynı hata mesajları korundu.
- ✓ **AtolyeTakip status-counts parsing:** backend string/number döndürebildiği için
  `parseInt(String(...))` ile her iki tipi de güvenle handle edecek şekilde yazıldı
  (eski `parseInt(response.data.total)` davranışıyla eşdeğer).
- ✓ **PrintEditor console.log debug satırları** aynı sırada ve aynı içerikte korundu.
- ✓ **PDF/Excel kodu / PrintEditor template/layout işleme:** tek dokunuş üç API
  çağrısı (get/save/delete `/printer-settings/:marka`); layout config payload'ı,
  defaultFields üretimi, `getStorageKey`, snackbar mesajları, layout shape tamamen
  korundu.

## 7. Test Sonuçları

| Aşama | tsc | vite build |
|---|---|---|
| Group 1 (reference + bayi + location) | ✓ clean | ✓ 10.07 s exit 0 |
| Group 2 (atolye + printerSettings) | ✓ clean | ✓ 29.23 s exit 0 |

Build uyarıları: yalnızca Phase 3'ten kalan ve Phase 5 ile ilgisi olmayan
`Settings.tsx static+dynamic import` ve `chunk > 500 kB` uyarıları
(refactor öncesinden beri mevcut).

## 8. Riskli Alanlar

1. **PrinterSettings `any` tipi.** `printerSettingsService.get/save` payload
   tipini `any` tuttum çünkü layout şekli (FieldConfig[]) `PrintEditor.tsx`
   içinde yerel tipte; servise taşımak ek tip yer değişikliği gerektirirdi
   ve "Form state, validation değişmesin" kuralı kapsamında değildi.
   **İleri Phase:** `services/types.ts` veya `types/printerLayout.ts` altına
   layout tipini taşımak ve servisi tip'lemek.

2. **`AtolyeStatusCountsRaw` tipi.** Backend bu endpoint için string-encoded
   sayılar dönebildiği için tip `number | string`. Component zaten `parseInt`
   ile geçiyor — davranış aynı, ama backend tutarsızlığı bir refactor
   adayı (sonraki phase'lerde backend tarafında düzeltilebilir).

3. **Settings.tsx tab→service map'i.** Map artık 6 servisi runtime'da
   tutuyor. Yanlış tabValue/type girilirse `service = null` olur ve
   "Geçersiz sekme/tür" snackbar'ı gösterir — eskiden boş `endpoint = ''`
   ile `api.put('/' + id, ...)` çağrısı yapılıyordu (sessizce hatalı endpoint).
   Bu yeni davranış aslında **daha güvenli** ama bilinçli not edildi:
   teorik olarak yeni hata mesajları görülebilir.

4. **Servis layer dönüş tipinin unwrap edilmesi.** Servisler `T[]`, component
   eski `response.data` yerine doğrudan veriyi alıyor. `axios.get<T>()`
   override'ları kaldırılmış olsa da, çıktı şekli aynı.

5. **Servis-katmanı circular import (apparent).** Her servis `./api`'den `api`
   import ediyor, `api.ts` de servis dosyalarını re-export ediyor. ESM live
   binding ile çalışıyor (Phase 4'te de aynı yapı kullanılmıştı). tsc + build
   temiz.

## 9. Sonraki Önerilen Adım

**Phase 6 — Önerilen seçenekler:**

A. **Backend Security Bootstrap** (Phase 2.5 backlog'undan):
   - JWT secret rotation
   - `.env` validation (zod)
   - Helmet + rate-limit middleware
   - CORS sıkılaştırma

B. **Component Size & Split:**
   - `IslemDialog.tsx` (1000+ satır) → form bölümleri ayrı componentlere
   - `AtolyeTakip.tsx` → filtre/tablo/socket logic ayrıştırma

C. **Custom Hooks Extraction:**
   - `useReferenceData()` (teknisyen + marka + montaj + aksesuar + urun + ilçe
     yüklemesini 5 dk cache ile sarmalayan hook — şu an IslemDialog ve IslemFilters
     iki ayrı yerde aynı şeyi yapıyor).
   - `useAtolyeSocket()` — AtolyeTakip içindeki Socket.IO bağlantı/temizleme logic'i.

D. **Type Cleanup:**
   - `services/atolye.service.ts` `AtolyeStatusCountsRaw` tipi `types/`'a taşıma.
   - PrinterSettings layout tipini `types/`'a taşıma ve `any` tipini kaldırma.

**Önerim:** Phase 6 = Custom Hooks Extraction (C). Phase 5'ten doğal devam.
Sonra Phase 7 = Backend Security (A). Component Split (B) en sona.

## 10. Phase 1 Hygiene Notu

Bu phase'de **dokunulmadı**. Aşağıdaki dosyalar hâlâ unstaged:
- `M .gitignore`
- `M backend/.env.example`
- `M frontend/vite.config.ts`
- `?? frontend/.env.example`
- `D frontend/src/utils/print.ts.backup`

Bunlar ayrı bir "chore: phase 1 hygiene" commit'i ile temizlenmeli.
