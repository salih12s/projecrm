# 🛠️ ProjeCRM — Servis & Atölye Yönetim CRM'i

[![CI](https://github.com/salih12s/projecrm/actions/workflows/ci.yml/badge.svg)](https://github.com/salih12s/projecrm/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)

Beyaz eşya servis bayileri için tasarlanmış, gerçek zamanlı (Socket.IO) bir **CRM + Atölye + Saha Yönetimi** sistemi. Müşteri kaydı, ürün/marka kataloğu, teknisyen ve bayi paneli, karaliste, yazdırılabilir formlar, mobil uyumlu tablo ve PDF/Excel dışa aktarım gibi yetenekler içerir.

> **Üretimde kullanılan canlı bir projedir** — birden fazla servis bayisi tarafından günlük operasyonda çalışmaktadır.

---

## ✨ Öne Çıkan Özellikler

- 🔐 **Çok rollü kimlik doğrulama** — Admin / Bayi / Saha Elemanı / Teknisyen, JWT + bcrypt.
- ⚡ **Gerçek zamanlı senkronizasyon** — Socket.IO ile çoklu kullanıcı arasında anlık güncelleme.
- 📋 **İşlem (Servis Kayıt) yönetimi** — telefon ile otomatik mükerrer kayıt tespiti, müşteri geçmişi, karaliste uyarısı.
- 🏭 **Atölye takibi** — bayi + marka + model bazlı, durum (gelen/onarımda/tamamlandı) iş akışı.
- 🚚 **Saha modülü** — saha elemanları için fotoğraflı kayıt, galeri ve PDF rapor.
- 🖨️ **Dinamik yazdırma editörü** — özelleştirilebilir form şablonları (pdf-lib + jsPDF).
- 📊 **Excel & PDF dışa aktarım** — `xlsx` + `jspdf-autotable`.
- 🌐 **Lokasyon hiyerarşisi** — İl → İlçe → Mahalle Autocomplete + sunucu tarafı önbellek.
- 📱 **Tam responsive** — masaüstünde sanal tablo (react-window), mobilde kart görünümü.
- 🚫 **Karaliste** — kötü ödeyen müşterileri etiketleme + telefon eşleşmesiyle otomatik uyarı.
- ⚙️ **Performans** — kritik sütunlarda DB indeks migration'ları, debounced filter input, `useMemo` ile kolon konfigürasyonu, kod bölünmüş bundle.

---

## 🧱 Tech Stack

| Katman | Teknoloji |
|---|---|
| **Frontend** | React 18 · TypeScript 5 (strict) · Vite 5 · MUI 5 · @hello-pangea/dnd · react-window · axios · Socket.IO Client |
| **Backend** | Node.js 20 · Express 4 · TypeScript · PostgreSQL (pg) · Socket.IO · JWT · bcrypt · multer · compression |
| **DB** | PostgreSQL 15 (Railway / local) |
| **Tooling** | ESLint · Prettier · concurrently · ts-node-dev · pdf-lib · jspdf-autotable · xlsx |
| **Deploy** | Backend: Railway · Frontend: Hostinger (statik) |

---

## 🏗️ Mimari

```
┌─────────────────┐         ┌──────────────────┐         ┌────────────────┐
│  React + Vite   │ ◀────▶  │  Express + TS    │ ◀────▶  │  PostgreSQL    │
│  (Hostinger)    │  HTTPS  │  (Railway)       │   pg    │  (Railway)     │
│                 │ ◀────▶  │  Socket.IO       │         └────────────────┘
└─────────────────┘   WS    └──────────────────┘
        ▲                            │
        │                            ▼
   JWT Auth                   bcrypt hash + JWT
```

- **REST API**: `/api/auth`, `/api/islemler`, `/api/atolye`, `/api/saha`, `/api/karaliste`, `/api/locations`, `/api/markalar`, `/api/urunler`, `/api/teknisyenler`, `/api/bayiler`, `/api/admin`, `/api/printerSettings`.
- **WebSocket**: Yeni kayıt / güncelleme / durum değişikliği olaylarını ilgili kullanıcılara (admin & bayi) anında broadcast eder.
- **Migrations**: `backend/src/migrations/*.sql` SQL dosyaları, ilk açılışta `createTables.ts` ile otomatik uygulanır.

---

## 📁 Klasör Yapısı

```
projecrm/
├─ backend/
│  ├─ src/
│  │  ├─ server.ts              # Express + Socket.IO entry
│  │  ├─ db.ts                  # PG havuzu
│  │  ├─ routes/                # auth, islemler, atolye, saha, karaliste, ...
│  │  ├─ middleware/auth.ts     # JWT doğrulama
│  │  ├─ migrations/*.sql       # şema migration'ları
│  │  └─ types/                 # paylaşılan TS tipleri
│  └─ tsconfig.json
├─ frontend/
│  ├─ src/
│  │  ├─ App.tsx · main.tsx
│  │  ├─ components/
│  │  │  ├─ islem/{IslemDialog, IslemTable, dialog/*, table/*}
│  │  │  ├─ atolye/{AtolyeTakip, AtolyeDialog, dialog/*}
│  │  │  ├─ admin/{AdminPanel, UsersTab, SahaElemanlariTab, ...}
│  │  │  ├─ saha/                # saha kayıtları + galeri
│  │  │  └─ settings/PrintEditor.tsx
│  │  ├─ services/               # axios servisleri
│  │  ├─ context/                # Auth + Socket context'leri
│  │  ├─ utils/                  # print, excel, format
│  │  └─ constants/
│  └─ vite.config.ts
├─ docs/                          # mimari notlar
├─ .github/workflows/ci.yml       # CI pipeline
└─ package.json                   # `concurrently` ile mono komutlar
```

---

## 🚀 Hızlı Başlangıç

### Önkoşullar
- Node.js 20+
- PostgreSQL 15+
- npm 10+

### 1) Klonla & bağımlılıkları yükle
```bash
git clone https://github.com/salih12s/projecrm.git
cd projecrm
npm run install:all
```

### 2) Ortam dosyalarını oluştur
```bash
cp backend/.env.example  backend/.env.development
cp frontend/.env.example frontend/.env.development
```
`backend/.env.development` içinde kendi PostgreSQL bilgilerini ve **kendi** `JWT_SECRET`'ını gir. Sistem şifre hash'ini şu komutla üret:
```bash
cd backend
npx ts-node src/generateSystemPasswordHash.ts
```

### 3) PostgreSQL'i başlat ve tabloları kur
İlk `npm run dev` çalıştırmasında migration'lar otomatik uygulanır. Manuel:
```bash
cd backend
npx ts-node src/createTables.ts
```

### 4) Geliştirme modunda çalıştır
```bash
npm run dev
```
- Backend → http://localhost:5000
- Frontend → http://localhost:5173

### 5) Production build
```bash
npm run build
```

---

## 🧪 Kalite & Doğrulama

```bash
# TypeScript tip kontrolü
cd frontend && npx tsc --noEmit
cd backend  && npx tsc --noEmit

# Lint & format
npm run lint
npm run format:check

# Build
npm run build
```

CI pipeline her PR'da: `tsc --noEmit` (her iki paket) + `vite build` + `eslint .` çalıştırır.

---

## 🔐 Güvenlik

- Tüm şifreler **bcryptjs** (cost 10) ile hash'lenir.
- API'ler **JWT bearer** ile korunur (`backend/src/middleware/auth.ts`).
- Production'da **CORS allow-list** + **HTTPS** zorunlu.
- `compression` ile yanıtlar gzip'lenir.
- `.env*` dosyaları repo'ya **dahil değildir** — `.env.example` dosyalarını şablon olarak kullanın.
- Kullanıcı rolleri (admin / bayi / saha / teknisyen) sunucu tarafında her endpoint'te ayrıca doğrulanır.

---

## 📦 Önemli Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Backend + Frontend'i `concurrently` ile başlatır |
| `npm run dev:backend` | Yalnız backend (ts-node-dev) |
| `npm run dev:frontend` | Yalnız frontend (Vite) |
| `npm run build` | Backend tsc compile + Frontend Vite build |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm run install:all` | Kök + backend + frontend bağımlılıkları |

---

## 🧭 Yol Haritası

- [ ] Vitest + supertest ile entegrasyon testleri
- [ ] OpenAPI / Swagger dokümantasyonu
- [ ] Helmet + rate-limit middleware
- [ ] Docker Compose (postgres + backend + nginx)
- [ ] i18n (TR/EN)
- [ ] PWA (offline ilk yükleme)

---

## 📊 Refactor Notları

Büyük tek-dosya bileşenler atomik commit'lerle alt-parçalara bölündü; ayrıntılar için bkz. [REFACTOR_RAPORU.md](REFACTOR_RAPORU.md).

| Bileşen | Önce | Sonra | Δ |
|---|---:|---:|---:|
| `IslemDialog.tsx` | 1935 | 1187 | −38.7 % |
| `IslemTable.tsx` | 1273 | 831 | −34.7 % |
| `AtolyeDialog.tsx` | 558 | 433 | −22.4 % |
| `AdminPanel.tsx` | 777 | 283 | −63.6 % |

---

## 📄 Lisans

[MIT](LICENSE) © 2024–2026 Salih Saydam

---

## 🙏 Teşekkürler

`@hello-pangea/dnd`, `react-window`, `pdf-lib`, `jspdf-autotable`, `xlsx`, MUI, Vite, Express, Socket.IO topluluklarına.
