# 🚀 Hostinger Deployment Kılavuzu

## 📋 Genel Bakış

Bu projede **frontend** Hostinger'da, **backend** Railway'de çalışacak şekilde yapılandırılmıştır.

### Mimari:
- **Frontend:** https://crm-msssoft.com (Hostinger)
- **Backend API:** https://projecrm-production.up.railway.app/api (Railway)
- **Database:** PostgreSQL (Railway)

---

## 🔧 Hostinger'a Deploy Adımları

### 1. Frontend Build

```bash
cd frontend
npm run build:hostinger
```

Bu komut:
- TypeScript derler
- Vite ile production build yapar
- `.htaccess` dosyasını `dist/` klasörüne kopyalar

### 2. Zip Oluştur

Build sonrası `frontend/dist` klasörü oluşur. Bu klasörü ziplemek için:

```bash
# PowerShell
cd c:\Users\salih\Desktop\projecrm\frontend
Compress-Archive -Path dist\* -DestinationPath ..\hostinger-frontend.zip -Force
```

### 3. Hostinger File Manager

1. **Hostinger'a giriş yap**
2. **File Manager'ı aç**
3. **public_html** klasörüne git
4. **Tüm eski dosyaları sil** (eğer varsa)
5. **ZIP yükle** butonuna tıkla
6. `hostinger-frontend.zip` dosyasını yükle
7. **Extract** (Aç) butonuna tıkla
8. Zip dosyasını sil

### 4. Dosya Yapısı Kontrolü

`public_html` klasöründe şunlar olmalı:

```
public_html/
├── .htaccess          ← Önemli! SPA routing için
├── index.html
├── vite.svg
└── assets/
    ├── index-xxxxx.js
    ├── index-xxxxx.css
    └── ... (diğer asset dosyaları)
```

---

## ⚙️ Önemli Ayarlar

### .htaccess Dosyası

`.htaccess` dosyası **otomatik olarak** `dist/` klasörüne kopyalanır. Bu dosya:

✅ **SPA Routing:** React Router'ın çalışması için tüm istekleri `index.html`'e yönlendirir
✅ **Gzip Compression:** JS/CSS dosyalarını sıkıştırır (hız artışı)
✅ **Browser Caching:** Static dosyaları cache'ler
✅ **Security Headers:** XSS, Clickjacking koruması

### API URL Yapılandırması

Frontend, production'da şu API URL'ini kullanır:

```
https://projecrm-production.up.railway.app/api
```

Bu ayar `frontend/.env.production` dosyasında:

```env
VITE_API_URL=https://projecrm-production.up.railway.app/api
```

---

## 🌐 Domain Ayarları

### Hostinger'da Domain Yönlendirme

1. **Hosting → Manage**
2. **Domain** sekmesi
3. `crm-msssoft.com` domain'ini seç
4. **Document Root:** `/public_html` olmalı

### SSL Sertifikası

Hostinger otomatik olarak **Let's Encrypt SSL** sağlar:

1. **SSL/TLS** sekmesine git
2. **Install SSL** tıkla
3. 5-10 dakika bekle
4. ✅ HTTPS aktif olacak

---

## 🔒 CORS Ayarları

Railway backend'de CORS zaten yapılandırılmış:

```typescript
// Allowed Origins
'https://crm-msssoft.com'
'https://www.crm-msssoft.com'
'https://projecrm-production.up.railway.app'
```

---

## 🧪 Test

Deploy sonrası test et:

### 1. Frontend Yükleme
```
https://crm-msssoft.com
```

**Beklenen:** Login sayfası açılmalı

### 2. API Bağlantısı

Tarayıcı Console'da (F12):

```
API URL: https://projecrm-production.up.railway.app/api
```

**Beklenen:** Console'da bu mesaj görünmeli

### 3. Login Test

Admin/User login yaparak test et:

- ✅ Login başarılı olmalı
- ✅ Dashboard açılmalı
- ✅ API çağrıları çalışmalı

---

## 🐛 Sorun Giderme

### Blank Page (Beyaz Sayfa)

**Sorun:** Sayfa boş görünüyor

**Çözüm:**
1. `.htaccess` dosyasının `public_html/` içinde olduğundan emin ol
2. Browser cache'i temizle (Ctrl+F5)
3. Hostinger File Manager'da dosya izinlerini kontrol et

### API Çağrıları Çalışmıyor

**Sorun:** Login yapamıyorum, 401/403 hatası

**Çözüm:**
1. Railway backend'in çalıştığını kontrol et
2. CORS ayarlarını kontrol et
3. Browser Console'da hata mesajlarını incele

### 404 Error on Refresh

**Sorun:** Sayfa refresh edilince 404 hatası

**Çözüm:**
1. `.htaccess` dosyasının olduğundan emin ol
2. Apache `mod_rewrite` modülünün aktif olduğunu kontrol et
3. Hostinger support'a danış

---

## 📊 Performans Optimizasyonu

### CDN (Opsiyonel)

Hostinger'ın **Cloudflare CDN** entegrasyonunu aktif et:

1. **Advanced → Cloudflare**
2. **Enable Cloudflare**
3. Cache ayarlarını yap

### Gzip Compression

`.htaccess` dosyasında zaten aktif! Kontrol et:

```bash
curl -H "Accept-Encoding: gzip" -I https://crm-msssoft.com
```

**Beklenen:** `Content-Encoding: gzip` header'ı görmeli

---

## 🔄 Güncelleme (Re-deploy)

Kod değişikliği yaptıktan sonra:

```bash
# 1. Frontend build
cd frontend
npm run build:hostinger

# 2. Zip oluştur
cd ..
Compress-Archive -Path frontend\dist\* -DestinationPath hostinger-frontend.zip -Force

# 3. Hostinger File Manager'da
# - Eski dosyaları sil
# - Yeni zip'i yükle ve extract et
```

---

## ✅ Deployment Checklist

- [ ] Frontend build başarılı (`npm run build:hostinger`)
- [ ] `.htaccess` dosyası `dist/` içinde
- [ ] Zip oluşturuldu
- [ ] Hostinger File Manager'da eski dosyalar silindi
- [ ] Yeni zip yüklendi ve extract edildi
- [ ] `https://crm-msssoft.com` açılıyor
- [ ] Login çalışıyor
- [ ] API çağrıları başarılı
- [ ] SSL aktif (https://)
- [ ] Console'da hata yok

---

## 📞 Destek

**Hostinger Support:**
- Live Chat: 7/24
- Email: support@hostinger.com

**Railway Support:**
- Discord: https://discord.gg/railway
- Docs: https://docs.railway.app

---

## 🎯 Özet

| Servis | Platform | URL |
|--------|----------|-----|
| Frontend | Hostinger | https://crm-msssoft.com |
| Backend | Railway | https://projecrm-production.up.railway.app |
| API Endpoint | Railway | https://projecrm-production.up.railway.app/api |
| Database | Railway PostgreSQL | shortline.proxy.rlwy.net:57463 |

**Başarılı deployment! 🎉**
