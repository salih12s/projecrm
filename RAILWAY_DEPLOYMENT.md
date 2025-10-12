# Railway Deployment Guide

## Database Bilgileri
Aşağıdaki değişkenleri Railway Environment Variables olarak ekleyin:

```
PORT=5000
DB_HOST=shortline.proxy.rlwy.net
DB_PORT=57463
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=JCkmPtfbpSjunXqKojeNiAUgLafMEwcG
JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.rpZ6vN8kE2Uq9xv4tS1aY7qfC3bD5nR0uL8mW4pK2sQ0tX9yH6jJ3lF5aG1oZ8rT
SYSTEM_PASSWORD_HASH=$2a$10$qj1B9p/u8Hk2I3hDmRe3KuTZ9LGsw6aQnh11gvIUI9uksdgGyNUNG
NODE_ENV=production
FRONTEND_URL=https://your-app-name.up.railway.app
```

**NOT:** Railway otomatik olarak `PORT` ve database bilgilerini sağlayabilir. Yukarıdaki değerler manuel override için.

## Railway Environment Variables Nasıl Eklenir

1. Railway Dashboard'a gidin
2. Projenizi seçin
3. **Variables** sekmesine tıklayın
4. Her bir değişkeni tek tek ekleyin:
   - Variable Name: `DB_HOST`
   - Value: `shortline.proxy.rlwy.net`
   - **Add** butonuna tıklayın
5. Tüm değişkenler için tekrarlayın

## Deployment Adımları

1. **GitHub'a push edin:**
   ```bash
   git add .
   git commit -m "Railway deployment configuration"
   git push
   ```

2. **Railway'de:**
   - GitHub repository'nizi bağlayın
   - Environment variables'ı yukardaki gibi ekleyin
   - Build & Deploy başlayacak

3. **Build Süreci:**
   - `npm ci` - Bağımlılıkları yükler
   - `npm run build` - Backend ve Frontend'i derler
   - `node index.js` - Uygulamayı başlatır

## Sorun Giderme

### TypeScript hatası
- ✅ Düzeltildi: `typescript` artık `dependencies`'de

### Database bağlantı hatası
- Environment variables'ların doğru eklendiğinden emin olun
- Railway PostgreSQL servisinin çalıştığını kontrol edin

### Port hatası
- Railway otomatik olarak `PORT` environment variable'ı sağlar
- Kodda `process.env.PORT || 5000` kullanıldığından sorun olmaz

## Database Tabloları

İlk deployment sonrası database tablolarını oluşturmak için:

```bash
# Railway CLI ile bağlanın veya
# PostgreSQL client kullanarak tabloları oluşturun
```

Backend server.ts dosyasında zaten tablo oluşturma fonksiyonları var, ilk çalıştırmada otomatik oluşturulacak.

## Frontend (Static Files)

Frontend build edilip `frontend/dist` klasörüne yerleştirilecek. Backend bu dosyaları serve edecek.

Backend `server.ts` dosyasına eklenmiş olmalı:

```javascript
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});
```
