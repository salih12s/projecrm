# Phase 0 — Baseline (Refactor Öncesi Referans Noktası)

> Bu dosya refactor sürecine başlamadan önceki "çalışan, kabul edilmiş" durumu kayıt altına alır.
> Refactor sırasında herhangi bir kıyas (regression check) bu dosyaya bakılarak yapılır.

**Tarih:** 22 Mayıs 2026
**Dal (branch):** `refactor/phase-0-baseline`
**Baseline commit:** `1f7b5490fef06a78305ca7972b3943ebba8c563c`
**Önceki commit mesajı:** `Improve DB resilience and API retries`
**Stash kaydedildi:** `stash@{0}: On main: pre-refactor-stash-2026-05-22` (README.md, dist.zip, frontend-dist-hostinger.zip değişiklikleri)

---

## 1. Ortam

| Bileşen | Versiyon |
|---|---|
| OS | Windows (PowerShell 5.1) |
| Node.js | v24.4.1 |
| npm | 11.4.2 |
| node_modules | root ✅, backend ✅, frontend ✅ (kuruldu) |

---

## 2. Build & Type-Check Sonuçları

| Komut | Süre | Exit | Sonuç |
|---|---|---|---|
| `backend: npx tsc --noEmit` | 1.79 sn | 0 | ✅ 0 TS hatası |
| `backend: npm run build` | 2.05 sn | 0 | ✅ `dist/` = 300.1 KB, 180 dosya |
| `frontend: npx tsc --noEmit` | 3.68 sn | 0 | ✅ 0 TS hatası |
| `frontend: npm run build` | 19.08 sn | 0 | ✅ build başarılı (Vite raporu altta) |

### 2.1 Frontend Vite chunk raporu (taze çıktı)

```
dist/index.html                              0.40 kB | gzip:   0.28 kB
dist/assets/SahaKayitlari-LbEwrws4.js       16.70 kB | gzip:   5.45 kB
dist/assets/AdminPanel-CQ1Ql1lu.js          17.33 kB | gzip:   3.99 kB
dist/assets/purify.es-aGzT-_H7.js           22.15 kB | gzip:   8.67 kB
dist/assets/SahaPanel-BPHIn1Eg.js           29.03 kB | gzip:   9.51 kB
dist/assets/AtolyeTakip-CW_knLmP.js         46.24 kB | gzip:  10.27 kB
dist/assets/index.es-ChSiX3wE.js           150.49 kB | gzip:  51.45 kB
dist/assets/html2canvas.esm-CBrSDip1.js    201.42 kB | gzip:  48.03 kB
dist/assets/MusteriGecmisi-CR8OD4Y9.js     433.01 kB | gzip: 140.50 kB
dist/assets/index-W9Nsm0zU.js            1,104.22 kB | gzip: 346.44 kB   ⚠️ 500 KB üstü
```

**Refactor hedefleri (sadece referans, bu adımda dokunulmaz):**
- `index-W9Nsm0zU.js` ana bundle **1.08 MB** → Phase 4'te route-level lazy import + manualChunks ile bölünecek.
- `MusteriGecmisi-CR8OD4Y9.js` 433 KB → tek bir lazy component bu kadar büyük: html2canvas/pdf-lib içermesinden şüpheli.

### 2.2 Anomali: `dist/` temizlenmeden build alıyor

`frontend/dist/` toplam **7394.8 KB / 32 dosya**, ama taze build sadece ~3.4 MB üretmeli. Yani `dist/` daha önceki build'in asset'lerini de barındırıyor (her dosyanın iki farklı hash'li kopyası var, ör. `index-W9Nsm0zU.js` ve `index-CkzMK1fB.js`). Vite normalde `outDir`'ı temizler ama `vite.config.ts` veya postbuild script (`copyFileSync('.htaccess', ...)`) bunu engelliyor olabilir.

**Aksiyon (Phase 2 — Repo hijyeni):** `vite.config.ts` içine `build.emptyOutDir: true` ekle veya build script'ine ön-temizlik koy.

---

## 3. Root `npm run build` — atlandı (gerekçe)

Root script `npx tsc -p backend/tsconfig.json && cd frontend && npm ci && npm run build` şeklinde; `npm ci` `frontend/node_modules`'ı **silip yeniden kurar** (Hostinger deploy için tasarlanmış). Backend ve frontend build'leri yukarıda ayrı ayrı başarıyla geçtiği için bu adım kaçınılabilir; eğer kanıt isteniyorsa ayrıca çalıştırılabilir.

---

## 4. Dev Server Smoke Test — atlandı (gerekçe)

`npm run dev` PostgreSQL bağlantısı ister; lokal `.env` dosyası ve çalışan PostgreSQL örneği olmadan başlatılamaz. Kullanıcının lokal DB ayarları agent'tan saklı.

**Kullanıcı tarafından doğrulanmalı:** `npm run dev` ile backend + frontend birlikte ayağa kalkıyor mu?

---

## 5. Kod Tabanı Metrikleri (baseline snapshot)

| Metrik | Değer |
|---|---|
| Backend TS dosyası | 45 |
| Backend toplam satır | 4.182 |
| Frontend TS/TSX dosyası | 28 |
| Frontend toplam satır | 13.873 |
| `console.*` (backend) | 85 |
| `console.*` (frontend) | 71 |
| `pool.query(...)` çağrısı | 74 |
| `query(...)` (db.ts retry sarmalayıcı) | 14 |
| `SELECT *` kullanımı | 28 |
| `(req as any)` cast'i | 10 |
| Toplam REST endpoint | **75** |

### 5.1 Endpoint dağılımı

```
admin.ts                  8 endpoint
aksesuarlar.ts            4
atolye.ts                 7
auth.ts                   4
bayiler.ts                4
islemler.ts               8
karaliste.ts              5
locations.ts              2
markalar.ts               4
montajlar.ts              4
printerSettings.ts        3
saha.ts                  14
teknisyenler.ts           4
urunler.ts                4
─────────────────────────────
TOPLAM                   75
```

### 5.2 Socket.IO event isimleri (refactor sırasında **değişmeyecek**)

```
atolye-guncellendi
atolye-silindi
islem-durum-degisti
islem-guncellendi
islem-silindi
yeni-atolye
yeni-islem
```

### 5.3 JWT_SECRET varsayılan değerleri (ÖNEMLİ — Phase 3 hedefi)

```
backend/src/middleware/auth.ts:22   process.env.JWT_SECRET || ''
backend/src/routes/admin.ts:36       process.env.JWT_SECRET || ''
backend/src/routes/auth.ts:70        process.env.JWT_SECRET || ''
backend/src/routes/auth.ts:114       process.env.JWT_SECRET || ''
backend/src/routes/saha.ts:44        process.env.JWT_SECRET || 'secret'   ← farklı varsayılan!
```

5 yerde JWT_SECRET kullanılıyor; biri `'secret'` fallback'i ile (saha.ts:44), diğer 4'ü boş string fallback. Bu Phase 3'te merkezîleştirilecek.

---

## 6. Git Durumu

- **Aktif dal:** `refactor/phase-0-baseline`
- **Çıkış noktası:** `main` (commit `1f7b549`)
- **Son 5 commit:**
  ```
  1f7b549 Improve DB resilience and API retries
  1ca464b fix: column filters respect active status/yazdirilmamis filters via refs
  c8d561c Fix input cursor behavior and add lazy saha thumbnails with notes tooltip
  14d26b7 perf(saha): pagination, today filter, dialog extract, DB indexes + search bugfix
  d54816d Karaliste sistemi, checkbox fix, admin filtreleme, performans optimizasyonu
  ```

---

## 7. Kullanıcının Manuel Doğrulaması Gereken Smoke Test'ler

> Agent bunları otomatik çalıştıramaz (tarayıcı, gerçek login, PDF/Excel görsel kontrolü gerektirir).
> Her satırı **canlı sistemde (crm-msssoft.com)** ya da **lokal dev'de** test ettikten sonra ✅/❌ doldur.

### A. Authentication & Roller
- [ ] A1. `/login` üzerinden **user** girişi çalışıyor
- [ ] A2. Aynı ekrandan **bayi** girişi çalışıyor
- [ ] A3. Admin paneline **admin** kullanıcısıyla erişim
- [ ] A4. Saha paneline **saha** kullanıcısıyla erişim
- [ ] A5. JWT 24 saat sonra otomatik logout → 401 → `/login`'e yönlendiriyor
- [ ] A6. Çıkış yapınca token siliniyor, korumalı sayfalar erişilemiyor

### B. İşlem (servis kaydı) akışı
- [ ] B1. Yeni işlem oluştur (zorunlu alanlar)
- [ ] B2. İşlem düzenle
- [ ] B3. İşlem sil (admin)
- [ ] B4. Durum güncelle (PATCH /durum)
- [ ] B5. Telefon ile ara (search-by-phone)
- [ ] B6. İsim ile ara (search-by-name)
- [ ] B7. Filtre kombinasyonları (~15 ILIKE)
- [ ] B8. Sayfalama
- [ ] B9. Sütun filtreleri "aktif durum/yazdırılmamış" filtreleriyle birlikte doğru çalışıyor
- [ ] B10. /stats endpoint dashboard'da doğru sayıları gösteriyor
- [ ] B11. created_by kullanıcı adı doğru atanıyor
- [ ] B12. VARCHAR truncation (kapi_no, blok_no, daire_no, sabit_tel, cep_tel, yedek_tel) işlem oluştururken hata atmıyor

### C. Müşteri geçmişi
- [ ] C1. Telefon numarasıyla geçmiş açılıyor
- [ ] C2. Tüm geçmiş kayıtlar listeleniyor (lazy chunk yüklemesi)

### D. Atölye takip
- [ ] D1. Yeni atölye kaydı oluştur
- [ ] D2. Atölye kaydı düzenle
- [ ] D3. Atölye kaydı sil
- [ ] D4. Note no'lu ve note no'suz kayıtlar
- [ ] D5. statusCounts 10 sn cache → güncel görünüyor
- [ ] D6. next-id race condition (aynı anda 2 kayıt) → henüz patlamadıysa baseline OK

### E. Saha
- [ ] E1. Saha kullanıcı login (`/saha/login`)
- [ ] E2. Saha kaydı oluştur (foto upload base64)
- [ ] E3. Saha kayıtları listesi (kendi)
- [ ] E4. Admin all-kayitlar
- [ ] E5. Thumbnail endpoint
- [ ] E6. Foto endpoint (full)

### F. Print / Export
- [ ] F1. PDF servis fişi yazdırma (pdf-lib + fontkit + Türkçe karakterler)
- [ ] F2. PrintEditor önizleme doğru
- [ ] F3. Yazıcı ayarları kaydet/yükle (printerSettings)
- [ ] F4. Excel export (xlsx) çalışıyor, kolonlar doğru
- [ ] F5. PDF "yazdırıldı" flag güncelleniyor

### G. Socket.IO (real-time)
- [ ] G1. Yeni işlem → diğer açık sekmelerde anında belirir (`yeni-islem`)
- [ ] G2. İşlem güncelleme → real-time yansır (`islem-guncellendi`)
- [ ] G3. İşlem silme → real-time düşer (`islem-silindi`)
- [ ] G4. Durum değişimi → (`islem-durum-degisti`)
- [ ] G5. Yeni atölye (`yeni-atolye`)
- [ ] G6. Atölye guncelleme/silme

### H. Admin paneli
- [ ] H1. Kullanıcı listesi
- [ ] H2. Kullanıcı oluştur
- [ ] H3. Aktif/pasif toggle
- [ ] H4. Kullanıcı sil
- [ ] H5. Kullanıcıya ait kayıtları görüntüle (user-records, user-atolye-records, all-records)

### I. Referans veri
- [ ] I1. Markalar CRUD
- [ ] I2. Ürünler CRUD
- [ ] I3. Aksesuarlar CRUD
- [ ] I4. Bayiler listesi (⚠️ şu an şifreleri plaintext döner — Phase 3'te düzelir)
- [ ] I5. İlçe / lokasyon listesi
- [ ] I6. Teknisyenler CRUD
- [ ] I7. Karaliste CRUD
- [ ] I8. Montajlar CRUD

---

## 8. Veritabanı Yedeği (kullanıcının yapması gereken)

Agent canlı DB'ye bağlanamaz. Refactor başlamadan önce **Railway dashboard üzerinden** PostgreSQL snapshot/backup alınmalı:

1. Railway → projecrm-production → PostgreSQL → "Backups" sekmesi → "Create backup"
2. Yedek tarihi: 22 Mayıs 2026
3. Yedek adı: `baseline-pre-refactor-2026-05-22`

**KVKK uyarısı:** DB dump dosyası gerçek müşteri verisi içerir → asla repoya commit etmeyin, asla anonim olmayan dump'ı paylaşmayın.

---

## 9. Baseline Onay (kullanıcı tarafından doldurulacak)

- [ ] Build'ler ✅ (otomatik onaylandı)
- [ ] Smoke test bölüm A-I tamamlandı
- [ ] Canlı DB yedeği alındı
- [ ] (Opsiyonel) `git tag -a baseline-pre-refactor-2026-05-22 -m "Phase 0 baseline" && git push origin baseline-pre-refactor-2026-05-22`

Yukarıdakiler tamamlandıktan sonra **Phase 1 — Repo Hijyeni**'ne geçilebilir.
