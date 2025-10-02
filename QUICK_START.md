# 🚀 Hızlı Başlangıç Kılavuzu

## Projeyi İlk Kez Kurulum

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/salih12s/projecrm.git
cd projecrm
```

### 2. Tüm Bağımlılıkları Yükleyin
```bash
npm run install:all
```

### 3. PostgreSQL'i Başlatın
PostgreSQL servisinin çalıştığından emin olun:
- Windows: PostgreSQL servisi otomatik başlar
- macOS: `brew services start postgresql`
- Linux: `sudo systemctl start postgresql`

### 4. Backend .env Dosyasını Kontrol Edin
`backend/.env` dosyasında PostgreSQL bilgilerinizi kontrol edin:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=12345
```

### 5. Projeyi Başlatın
```bash
npm run dev
```

Bu tek komut ile:
- ✅ Backend (http://localhost:5000) çalışır
- ✅ Frontend (http://localhost:5173) çalışır
- ✅ Veritabanı tabloları otomatik oluşturulur
- ✅ Socket.IO gerçek zamanlı bağlantı kurulur

## İlk Kullanım

1. Tarayıcınızda http://localhost:5173 adresini açın
2. "Kayıt Ol" sekmesine tıklayın
3. Yeni bir hesap oluşturun
4. Giriş yapın ve CRM'i kullanmaya başlayın!

## Komutlar

### Ana Komutlar
- `npm run dev` - Hem backend hem frontend'i başlatır (ÖNERİLEN)
- `npm run install:all` - Tüm bağımlılıkları yükler

### Ayrı Başlatma
- `npm run dev:backend` - Sadece backend'i başlatır
- `npm run dev:frontend` - Sadece frontend'i başlatır

### Backend Komutları
```bash
cd backend
npm run dev        # Development mode
npm run build      # TypeScript compile
npm start          # Production mode
```

### Frontend Komutları
```bash
cd frontend
npm run dev        # Development mode
npm run build      # Production build
npm run preview    # Preview production build
```

## Test

API testlerini çalıştırmak için:
```bash
.\test-api.ps1
```

## Sorun Giderme

### Port Zaten Kullanımda
Eğer "port already in use" hatası alırsanız:
- Backend için 5000 portunu kullanan programı kapatın
- Frontend için 5173 portunu kullanan programı kapatın

### PostgreSQL Bağlantı Hatası
1. PostgreSQL servisinin çalıştığından emin olun
2. `backend/.env` dosyasındaki bilgileri kontrol edin
3. PostgreSQL şifrenizin doğru olduğundan emin olun

### TypeScript Hataları
Eğer TypeScript derleme hataları alırsanız:
```bash
cd backend
npm install
cd ../frontend
npm install
```

### Node Modules Eksik
```bash
npm run install:all
```

## Üretim Ortamı

### Backend Production Build
```bash
cd backend
npm run build
npm start
```

### Frontend Production Build
```bash
cd frontend
npm run build
# dist/ klasörü oluşur, bunu web sunucunuzda host edin
```

## Önemli Notlar

- ✅ İlk çalıştırmada veritabanı tabloları otomatik oluşturulur
- ✅ Backend ve Frontend aynı anda çalışmalıdır
- ✅ PostgreSQL veritabanı kurulu ve çalışır olmalıdır
- ✅ Node.js v18 veya üzeri gereklidir
- ✅ npm v9 veya üzeri önerilir

## Proje Yapısı

```
projecrm/
├── backend/           # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── server.ts      # Ana sunucu
│   │   ├── routes/        # API rotaları
│   │   ├── middleware/    # Auth middleware
│   │   └── types/         # TypeScript tipleri
│   └── package.json
│
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/    # React bileşenleri
│   │   ├── context/       # State yönetimi
│   │   ├── services/      # API servisleri
│   │   └── utils/         # Yardımcı fonksiyonlar
│   └── package.json
│
├── package.json       # Root package (scripts)
└── README.md
```

## Yardım

Sorun yaşarsanız:
1. GitHub Issues: https://github.com/salih12s/projecrm/issues
2. README.md dosyasını okuyun
3. FEATURE_CHECKLIST.md dosyasında özellikleri kontrol edin
