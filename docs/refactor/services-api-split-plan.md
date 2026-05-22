# services/api.ts Split Plan

**Statü:** Plan. Bu turda kod değişikliği yok.
**Mevcut:** `frontend/src/services/api.ts` (275 satır, tek dosya).
**Hedef Phase:** Phase 4.

---

## Hedef yapı

```
frontend/src/services/
├── api.ts                  # axios instance + interceptor (paylaşılan)
├── auth.service.ts         # login/register/bayiLogin/adminLogin/sahaLogin/logout/verifySystemPassword
├── islem.service.ts        # getIslemler, getStats, search, create, update, delete, changeStatus
├── atolye.service.ts       # getAll, getById, nextId, statusCounts, create, update, delete
├── saha.service.ts         # login, create user, list users, toggle, delete user, kayit CRUD, photos, all-kayitlar
├── admin.service.ts        # create-user, users list, toggle, delete, user-records, user-atolye-records, all-records
├── bayi.service.ts         # CRUD bayiler
├── reference.service.ts    # markalar, aksesuarlar, montajlar, teknisyenler, urunler, karaliste
├── printer.service.ts      # printer-settings CRUD
└── location.service.ts     # ilceler, mahalleler
```

---

## Kurallar
- **`api.ts`** sadece `axios.create(...)`, interceptor'lar ve `export const api` döner — endpoint method'u içermez.
- Her servis kendi alanındaki endpoint'leri export eder; başka servisi import etmez.
- Export isimleri **değişmez** (`authService`, `islemService`, vs.) — sadece kaynak dosya değişir.
- `services/index.ts` (yeni) tüm servisleri re-export eder; eski import path'leri (`import { islemService } from '../services/api'`) **opsiyonel olarak** index'e yönlendirilir veya tek tek güncellenir.

## Geçiş stratejisi (Phase 4)
1. `services/auth.service.ts` oluştur, içine `api.ts`'deki `authService`'i taşı; `api.ts`'den re-export et (`export { authService } from './auth.service'`).
2. Aynı pattern: islem → atolye → saha → admin → bayi → reference → printer → location.
3. Tüm taşıma bitince `api.ts` sadece axios instance + interceptor + re-export.
4. Component'lerdeki import'ları tek tek güncelle (`from '../services/api'` → `from '../services/islem.service'`).
5. Son aşamada `api.ts` re-export'larını kaldır.

## Bu turda yapılan
- **Hiçbir şey.** Sadece bu plan.

## Riskler
- Tip importları (`SahaKayit`, `IslemCreateDto` vs.) `types/index.ts` üzerinden geliyor — etkilenmez.
- Axios interceptor tek noktada kalmalı; her servisin kendi axios instance'ı OLMAYACAK.
- 401 hard-logout davranışı `api.ts`'de kalır.
