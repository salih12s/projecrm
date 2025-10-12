# Ortam Yapılandırma Kılavuzu

## Nasıl Çalışır?

Proje **3 farklı modda** çalışabilir:

### 1. 🏠 Tam Local (Development)
**Backend:** Local PostgreSQL  
**Frontend:** Local Backend API  

**Kullanım:**
```bash
# Hiçbir değişiklik yapmadan
npm run dev
```

**Yapılandırma:**
- `backend/.env` → Local PostgreSQL
- `frontend/.env.development` → http://localhost:5000/api

---

### 2. 🌐 Tam Production (Railway)
**Backend:** Railway PostgreSQL  
**Frontend:** Aynı domain API (`/api`)  

**Kullanım:**
```bash
# Railway'e push et
git push
```

**Yapılandırma:**
- Railway Environment Variables
- `frontend/.env.production` → /api

---

### 3. 🔄 Hybrid (Local → Production API)
**Backend:** Local çalışıyor ama Production PostgreSQL kullanıyor  
**Frontend:** Local çalışıyor ama Production Backend API kullanıyor  

**Kullanım:**

#### Backend'i Production DB'ye bağla:
```bash
# backend/.env.local dosyasını düzenle
# Tüm satırların yorumunu kaldır
```

**backend/.env.local:**
```env
PORT=5000
DB_HOST=shortline.proxy.rlwy.net
DB_PORT=57463
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=JCkmPtfbpSjunXqKojeNiAUgLafMEwcG
JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.rpZ6vN8kE2Uq9xv4tS1aY7qfC3bD5nR0uL8mW4pK2sQ0tX9yH6jJ3lF5aG1oZ8rT
SYSTEM_PASSWORD_HASH="$2a$10$qj1B9p/u8Hk2I3hDmRe3KuTZ9LGsw6aQnh11gvIUI9uksdgGyNUNG"
NODE_ENV=development
```

#### Frontend'i Production API'ye bağla:
```bash
# frontend/.env.local dosyasını düzenle
```

**frontend/.env.local:**
```env
VITE_API_URL=https://your-railway-app.up.railway.app/api
```

**Sonra:**
```bash
npm run dev
```

---

## Dosya Öncelikleri

### Backend (.env dosyaları)
1. `.env.local` (En yüksek - Git'te yok)
2. `.env.development` veya `.env.production`
3. `.env` (Varsayılan)

### Frontend (.env dosyaları)
1. `.env.local` (En yüksek - Git'te yok)
2. `.env.development` (npm run dev)
3. `.env.production` (npm run build)

---

## Önemli Notlar

### ⚠️ .env.local Dosyaları
- **Git'e eklenmez** (`.gitignore`'da)
- Her geliştiricinin kendi ortamına özel
- Production bilgileri içerebilir
- Geçici testler için idealdir

### ⚠️ .env.production Dosyası
- **Git'e eklenmez** (güvenlik)
- Railway Environment Variables ile override edilir
- Yalnızca referans için kullanılır

### ✅ Güvenlik
- Hassas bilgiler `.env.local` ve `.env.production`'da
- Bu dosyalar Git'e eklenmez
- Railway'de Environment Variables kullan

---

## Hızlı Referans

| Senaryo | Backend | Frontend | Komut |
|---------|---------|----------|-------|
| Tam Local | .env | .env.development | `npm run dev` |
| Tam Production | Railway Env | .env.production | Railway auto-deploy |
| Local + Prod DB | .env.local | .env.development | `npm run dev` |
| Local + Prod API | .env | .env.local | `npm run dev` |

---

## Railway Deployment Kontrol Listesi

- [ ] GitHub repository'yi Railway'e bağla
- [ ] Environment Variables ekle (RAILWAY_DEPLOYMENT.md'ye bakın)
- [ ] Build başarılı mı kontrol et
- [ ] Database tabloları oluştu mu kontrol et
- [ ] Frontend doğru API'yi kullanıyor mu test et
- [ ] Login çalışıyor mu test et

---

## Sorun Giderme

### "API URL: undefined" hatası
Frontend `.env.development` veya `.env.local` dosyasını kontrol et.

### "Database connection error"
Backend `.env` dosyasındaki DB bilgilerini kontrol et.

### "CORS error" (Local → Production API)
Railway backend'inde CORS ayarlarını güncelle:
```typescript
cors({
  origin: ["http://localhost:5173", "https://your-railway-app.up.railway.app"]
})
```

### Railway'de "tsc not found"
✅ Düzeltildi: `typescript` artık `dependencies`'de
