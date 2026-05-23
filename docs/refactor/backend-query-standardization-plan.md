# Backend Query Standardization Plan

> Bu doküman sadece **planlamadır**. Bu phase'de hiçbir DB sorgusu değiştirilmedi.

## Mevcut Durum

`backend/src/db.ts` iki ayrı API export ediyor:

1. **`pool`** (default export) — `pg`'nin ham `Pool` örneği. `pool.query(...)` çağrıları doğrudan tek sefer çalışır, transient hata olursa retry yoktur.
2. **`query<T>(text, params?, retries = 2)`** (named export) — `pool.query`'yi saran, `isTransientDbError` filtreli, üstel olmayan (`300ms * (attempt+1)`) backoff'lu retry wrapper. Şu anda **sadece** `islemler.ts` ve `printerSettings.ts` bunu kullanıyor.

## Route Dosyalarındaki Dağılım

| Route               | `pool.query` çağrısı | `query()` wrapper çağrısı | Durum             |
| ------------------- | -------------------: | ------------------------: | ----------------- |
| `islemler.ts`       |                    0 |                        11 | ✅ Wrapper'da     |
| `printerSettings.ts`|                    0 |                         3 | ✅ Wrapper'da     |
| `karaliste.ts`      |                    6 |                         0 | ⏳ Migration adayı |
| `markalar.ts`       |                    4 |                         0 | ⏳                |
| `teknisyenler.ts`   |                    4 |                         0 | ⏳                |
| `montajlar.ts`      |                    4 |                         0 | ⏳                |
| `aksesuarlar.ts`    |                    4 |                         0 | ⏳                |
| `urunler.ts`        |                    4 |                         0 | ⏳                |
| `bayiler.ts`        |                    4 |                         0 | ⏳                |
| `atolye.ts`         |                    9 |                         0 | ⏳                |
| `saha.ts`           |                   19 |                         0 | ⏳                |
| `admin.ts`          |                   10 |                         0 | ⏳                |
| `auth.ts`           |                    4 |                         0 | ⏳ (riskli)       |
| `locations.ts`      |                    2 |                         0 | ⏳                |

> Notlar: `auth.ts`'in `query()` çağrısı sayımı, `bcrypt.compare(...)` gibi `query()` desenine benzeyen başka çağrılarla şişebilir; yukarıda yalnız `pool.query` net şekilde sayıldı.

## Tercih: Canonical API

`query()` wrapper canonical olacak. Gerekçeler:

- Transient `pg` hataları (`ECONNRESET`, `read ECONNRESET`, `too many clients`) için zaten doğrulanmış retry mantığı içeriyor.
- Tip parametresi (`<T extends QueryResultRow>`) sayesinde route içinde `<RowType>` ile satır şeması belirtilebilir.
- `pool` direkt erişim sadece **transaction** gereken yerlerde tutulmalı (`pool.connect()` ile client çekip `BEGIN/COMMIT` yapan blok yok şu anda; ileride gerekirse `pool` kullanılmaya devam edilebilir).

## Geçiş Sırası (önerilen)

Her adım ayrı bir küçük PR/commit:

1. **karaliste.ts** (6 çağrı, izole, basit CRUD) — pilot.
2. **markalar.ts / teknisyenler.ts / montajlar.ts / aksesuarlar.ts / urunler.ts** (her biri 4 çağrı, neredeyse aynı CRUD şablonu).
3. **bayiler.ts** (4 çağrı).
4. **atolye.ts** (9 çağrı, biraz daha karmaşık update path'leri).
5. **saha.ts** (19 çağrı — en büyük tek dosya, dikkatli).
6. **admin.ts** (10 çağrı, dikkatli — admin oluşturma/şifre değiştirme).
7. **auth.ts** (4 çağrı) — **en sona bırakılır** çünkü login akışına dokunmak en yüksek riskli.
8. **islemler.ts** zaten wrapper'da.
9. **locations.ts** (2 çağrı) ve **printerSettings.ts** sonradan tek adımda kapanır.

## Migration Tek Adım Kuralları

Bir route taşınırken:

- Çağrı içeriği (SQL metni, params dizisi) **birebir aynı** kalacak — sadece `pool.query(...)` → `query(...)` (ya da `pool.query<T>(...)` → `query<T>(...)`).
- `import pool from '../db';` ifadesine `import { query } from '../db';` eklenecek; transaction kullanılmıyorsa `pool` import'u kaldırılabilir, kullanılıyorsa ikisi de kalır.
- HTTP status kodları, response body alan adları, error mesajı dizileri **değişmeyecek**.
- Manuel smoke testi: o route'un en az 1 GET + 1 POST/PUT/DELETE akışı dev sunucusunda doğrulanır.
- TypeScript build + (varsa) jest testleri yeşil kalmalı.

## Yapılmayanlar (bilinçli olarak ertelendi)

- `pool.query` çağrılarının `query()` wrapper'a taşınması (bu phase yalnız plandır).
- `query()` wrapper'a request-context tagging (örn. trace-id) eklenmesi.
- Transaction helper'ı (`withTransaction(async client => ...)`).
- Slow query loglama / metric.
