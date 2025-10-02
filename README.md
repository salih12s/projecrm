# CRM Projesi

Modern bir CRM (Müşteri İlişkileri Yönetimi) sistemi. React, Node.js, PostgreSQL ve TypeScript kullanılarak geliştirilmiştir.

## 🚀 Özellikler

- **Kullanıcı Yönetimi**: Kayıt ve giriş sistemi
- **Gerçek Zamanlı Güncellemeler**: Socket.IO ile canlı veri senkronizasyonu
- **Gelişmiş Filtreleme**: Tüm sütunlar üzerinden arama ve filtreleme
- **İş Durumu Takibi**: Açık ve tamamlanmış işleri takip etme
- **Yazdırma Özelliği**: Marka bazlı servis fişi yazdırma
- **Modern Arayüz**: Material-UI ile responsive tasarım

## 🛠️ Teknolojiler

### Backend
- Node.js
- Express.js
- PostgreSQL
- Socket.IO
- TypeScript
- JWT Authentication
- bcryptjs

### Frontend
- React 18
- TypeScript
- Material-UI (MUI)
- Vite
- React Router
- Axios
- Socket.IO Client

## 📋 Gereksinimler

- Node.js (v18 veya üzeri)
- PostgreSQL (v14 veya üzeri)
- npm veya yarn

## 🔧 Kurulum

### 1. Depoyu Klonlayın

```bash
git clone https://github.com/salih12s/projecrm.git
cd projecrm
```

### 2. Tüm Bağımlılıkları Yükleyin

```bash
npm run install:all
```

Bu komut root, backend ve frontend için tüm npm paketlerini yükler.

### 3. Backend Yapılandırması

Backend `.env` dosyasını yapılandırın (zaten mevcut):
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=12345
JWT_SECRET=your_jwt_secret_key_here_change_in_production
```

### 4. Veritabanı

PostgreSQL'in çalıştığından emin olun. Tablolar otomatik olarak oluşturulacaktır.

## 🚀 Çalıştırma

### Tek Komutla Başlatma (Önerilen)

```bash
npm run dev
```

Bu komut hem backend'i hem frontend'i aynı anda başlatır:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

### Manuel Başlatma

Backend'i ayrı başlatmak için:

```bash
npm run dev:backend
```

Frontend'i ayrı başlatmak için:

```bash
npm run dev:frontend
```

## 📱 Kullanım

1. **Kayıt Olun**: İlk kez kullanıyorsanız, kayıt olun
2. **Giriş Yapın**: Kullanıcı adı ve şifrenizle giriş yapın
3. **Yeni İşlem Ekle**: "Yeni İşlem" butonuna tıklayarak müşteri kaydı oluşturun
4. **Filtreleme**: Üst kısımdaki filtreler ile kayıtları arayın
5. **Düzenleme**: İşlemleri düzenleyin ve güncelleyin
6. **Yazdırma**: Her kayıt için yazdırma butonunu kullanın
7. **Durum Güncelleme**: İş tamamlandığında durumu güncelleyin

## 📊 Veritabanı Şeması

### Users Tablosu
- id (Primary Key)
- username (Unique)
- password (Hashed)
- created_at

### Islemler Tablosu
- id (Primary Key)
- full_tarih (Timestamp)
- ad_soyad
- ilce, mahalle, cadde, sokak
- kapi_no, apartman_site, blok_no, daire_no
- cep_tel, sabit_tel
- urun, marka
- sikayet
- teknisyen_ismi
- yapilan_islem
- tutar
- is_durumu (acik/tamamlandi)
- created_by
- updated_at

## 🔒 Güvenlik

- JWT token tabanlı kimlik doğrulama
- Bcrypt ile şifre hashleme
- Protected API endpoints
- CORS ayarları

## 📝 Geliştirme

### Backend Build

```bash
cd backend
npm run build
npm start
```

### Frontend Build

```bash
cd frontend
npm run build
npm run preview
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje özel bir projedir.

## 👤 İletişim

Proje Sahibi - [@salih12s](https://github.com/salih12s)

Proje Linki: [https://github.com/salih12s/projecrm](https://github.com/salih12s/projecrm)
