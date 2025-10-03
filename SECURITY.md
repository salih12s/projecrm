# 🔐 GÜVENLİK DOKÜMANTASYONU

## Sistem Şifresi Güvenliği

### ⚠️ Önemli Güvenlik Önlemleri

#### 1. **Sistem Şifresi Koruması**

**Mevcut Şifre:** `TakipSistemi!123`

**Güvenlik Katmanları:**
- ✅ Şifre frontend'de saklanmaz
- ✅ Backend'de bcrypt ile hash'lenir
- ✅ Hash .env dosyasında saklanır
- ✅ .env dosyası .gitignore'a eklenmiş
- ✅ Her istek backend tarafından doğrulanır

---

### 🔧 Sistem Şifresi Değiştirme

#### Adım 1: Yeni Hash Oluşturma
```bash
cd backend
npx ts-node src/generateSystemPasswordHash.ts
```

Bu script sizden yeni şifreyi soracak ve hash oluşturacaktır.

#### Adım 2: .env Dosyasını Güncelleme
```bash
# backend/.env
SYSTEM_PASSWORD_HASH="yeni_hash_buraya"
```

#### Adım 3: Sunucuyu Yeniden Başlatma
```bash
# Backend'i yeniden başlat
npm run dev
```

---

### 🛡️ Diğer Güvenlik Önlemleri

#### 1. **Admin Girişi**
- ✅ İki aşamalı doğrulama
  - İlk aşama: Sistem şifresi
  - İkinci aşama: Kullanıcı adı + şifre (bcrypt)
- ✅ JWT token ile oturum yönetimi
- ✅ 24 saat token süresi

#### 2. **Bayi Girişi**
- ✅ Kullanıcı adı + şifre kontrolü
- ✅ JWT token ile oturum yönetimi
- ✅ Rol bazlı erişim kontrolü
- ⚠️ Basit şifre sistemi (plaintext - gelecekte bcrypt'e geçilebilir)

#### 3. **Veritabanı**
- ✅ Admin şifreleri bcrypt ile hash'leniyor
- ✅ PostgreSQL bağlantı bilgileri .env'de
- ✅ .env dosyası git'e dahil edilmemiş

#### 4. **Frontend**
- ✅ Hassas bilgiler frontend'de saklanmaz
- ✅ Tüm şifre kontrolleri backend'de
- ✅ JWT token localStorage'da
- ✅ Token geçersiz olunca otomatik logout

---

### 📋 Güvenlik Kontrol Listesi

**Üretim Ortamına Geçmeden Önce:**

- [ ] Sistem şifresini değiştir (varsayılan değil)
- [ ] JWT_SECRET'i güçlü bir değerle değiştir
- [ ] Database şifresini güçlü yap
- [ ] .env dosyasının git'e gitmediğini kontrol et
- [ ] HTTPS kullan (production)
- [ ] Rate limiting ekle (brute force saldırılara karşı)
- [ ] Bayi şifrelerini bcrypt ile hash'le
- [ ] CORS ayarlarını production için yapılandır
- [ ] SQL injection koruması kontrol et (parametrized queries kullanılıyor ✅)

---

### 🚨 Acil Durum Prosedürleri

#### Şifre Unutulduğunda:
1. Backend'de `generateSystemPasswordHash.ts` ile yeni hash oluştur
2. `.env` dosyasında `SYSTEM_PASSWORD_HASH` değerini güncelle
3. Backend'i yeniden başlat

#### Sistem Ele Geçirildiğinde:
1. Tüm şifreleri değiştir (sistem + admin + JWT secret)
2. Tüm oturumları sonlandır (JWT secret değiştirmek yeterli)
3. Database backup'ını geri yükle
4. Logları incele

---

### 📝 Notlar

- Sistem şifresi sadece admin girişi için gereklidir
- Bayi kullanıcıları sistem şifresi görmez
- Register işlemi için sistem şifresi gerekmez
- Şifre 10 kez yanlış girilse bile sistem kilitlenmez (gelecekte eklenebilir)

---

**Son Güncelleme:** 3 Ekim 2025
**Güvenlik Seviyesi:** Orta (Geliştirilmeye açık)
