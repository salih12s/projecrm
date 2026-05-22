# Security Backlog

**Statü:** Yapılmadı. Bu doküman Phase 2 envanterinde tespit edilen güvenlik bulgularının "sonra yapılacaklar" listesidir.
**Phase 3'te uygulama yok.** Phase 2.5 / 4 / sonrası için referans.
**Detay raporlar:**
- [phase-2-inventory.md](./phase-2-inventory.md)
- [env-security-audit.md](./env-security-audit.md)
- [api-contract.md](./api-contract.md)

---

## 1. Tracked env dosyaları
- `backend/.env.production`, `backend/.env.development`, `frontend/.env.production`, `frontend/.env.development` Git'te izleniyor.
- **Risk:** Production secret'ları (JWT_SECRET, DATABASE_URL, SYSTEM_PASSWORD_HASH muhtemelen) repo'da görünür.
- **Yapılacak:** (1) Secret rotation, (2) `git rm --cached` ile untrack, (3) `.gitignore` koruması doğrulanmalı (Phase 1'de eklendi), (4) opsiyonel: git history rewrite.
- **Bu turda:** Hiç. Phase 2.5'te K1+K2 onayı sonrası.

## 2. JWT_SECRET fallback sorunu
- 5 yerde fallback var: `''` x4 (middleware/auth.ts:22, admin.ts:36, auth.ts:70, auth.ts:114), `'secret'` x1 (saha.ts:44).
- **Risk:** Production'da JWT_SECRET set unutulursa imzasız token kabul edilir / saha tokenleri başka servislere geçer.
- **Yapılacak:** `backend/src/config/env.ts` merkez modülü; `JWT_SECRET` startup'ta fail-fast.
- **Bu turda:** Hiç. Phase 2.5 / C2 commit'i.

## 3. Public endpointler
- `router.use(authenticateToken)` hiçbir route'ta yok (grep doğrulandı).
- 75 endpoint'in ~44'ü auth gerektirmiyor (login'ler hariç): islemler, atolye, bayiler, karaliste, markalar, aksesuarlar, montajlar, teknisyenler, locations, printerSettings + auth/register.
- **Risk:** Müşteri/işlem/atölye verilerine anonim erişim.
- **Yapılacak:** Route dosyası başına `router.use(authenticateToken)` ekleme. Sıra (önerilen): markalar → aksesuarlar → montajlar → teknisyenler → urunler (zaten korumalı) → printer-settings → locations → bayiler → atolye → islemler → karaliste.
- **Bu turda:** Hiç. Phase 2.5 / M4.

## 4. Admin role guard eksikliği
- `authenticateToken` sadece imza doğrular; `req.user.role` kontrolü yok.
- Geçerli bir bayi/saha/user token'ıyla admin endpoint'leri kullanılabilir.
- **Yapılacak:** `requireRole('admin')` middleware. Pilot endpoint: `DELETE /api/admin/users/:id`.
- **Bu turda:** Hiç. Phase 2.5 / M2.

## 5. Bayi password plaintext / SELECT * riski
- `GET /api/bayiler` `SELECT *` → password kolonu API yanıtında plaintext.
- `POST /api/auth/bayi-login` (auth.ts:106) plaintext compare yapıyor.
- Yeni bayi default şifresi `'123456'` plaintext.
- **Yapılacak:**
  1. `bayiler.ts` `SELECT *` → explicit column list (password hariç).
  2. Lazy bcrypt migration login akışında: önce bcrypt.compare, fail ise plaintext compare, başarılıysa bcrypt'e güncelle.
  3. Yeni bayi oluştururken bcrypt hash.
- **Bu turda:** Hiç. Phase 2.5 / C3 + C4.

## 6. Socket.IO auth eksikliği
- `io.use(...)` handshake auth yok.
- Railway URL'ini bilen herkes 7 event'i (yeni-islem, islem-guncellendi, vs.) dinleyebilir.
- **Risk:** Müşteri verisi sızıntısı.
- **Yapılacak:** Frontend `io(url, { auth: { token } })`, backend `io.use((socket, next) => verifyToken(...))`.
- **Event isimleri DEĞİŞMEYECEK.**
- **Bu turda:** Hiç. Phase 3 sonu / Phase 4 / H2.

## 7. /register endpoint riski
- `POST /api/auth/register` korumasız.
- Frontend UI bunu çağırmıyor (Login.tsx'te register formu yok).
- `AuthContext.register` ve `authService.register` tanımlı ama hiç çağrılmıyor → dead frontend code.
- **Yapılacak:** Önce `verify-system-password` koruması → sonra frontend dead code temizliği → sonra endpoint kaldırma.
- **Bu turda:** Hiç. Phase 2.5 / M3.

## 8. CORS ve rate-limit konuları

### 8.1 CORS
- `server.ts:60` `process.env.NODE_ENV === 'production'` durumunda **her origin'e izin veriyor** (`callback(null, true)`).
- **Risk:** Production'da CSRF/cross-origin saldırılarına açık.
- **Yapılacak:** Production'da da `allowedOrigins` listesini uygulamak, NODE_ENV bypass'ını kaldırmak.

### 8.2 Rate-limit
- Hiçbir endpoint'te rate-limit yok.
- Login endpoint'leri (4 adet: user/admin/bayi/saha) brute-force'a açık.
- **Yapılacak:** `express-rate-limit` ile login endpoint'lerine örn. 10 deneme/dk koy; diğer write endpoint'lerine genel limit.
- **Bu turda:** Hiç. Phase 4.

### 8.3 Diğer ilgili konular (kayıt için)
- Helmet middleware yok (security headers).
- HTTP body size limit 50MB (foto upload için) — geçici DoS riski; ileride saha endpoint'ine özel ayrılmalı.
- `request body` log'larında müşteri telefonu/adresi düşüyor olabilir (Phase 2 console.* taraması).
- Socket.IO message size limit'i default; foto event'i yoksa risk düşük ama doğrulanmalı.
