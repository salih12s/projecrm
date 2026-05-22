# Frontend Component Split Plan

**Statü:** Plan. Bu turda iç mantığa dokunulmadı, sadece klasör taşıması yapıldı (Phase 3).
**Hedef Phase:** Phase 5.

---

## IslemDialog.tsx (2403 satır)
**Mevcut sorumluluklar:**
- Müşteri bilgileri formu (ad, soyad, telefon, yedek tel, adres, il, ilçe, mahalle)
- Ürün/marka/model autocomplete
- Servis ve montaj seçimi
- Aksesuar çoklu seçimi
- Teknisyen seçimi
- Karaliste telefon/adres kontrolü
- Marka/aksesuar/teknisyen ekle alt-dialog'ları (3 ayrı)
- Form validation
- Print preview entry

**Önerilen bölünme:**
```
components/islem/IslemDialog/
├── IslemDialog.tsx              # ana shell + state hook'u
├── sections/
│   ├── MusteriSection.tsx       # ad/soyad/telefon/adres/il/ilçe/mahalle
│   ├── UrunSection.tsx          # marka/model/urun autocomplete
│   ├── IslemDetaySection.tsx    # servis/montaj/aksesuar/teknisyen
│   └── KaralisteCheckBanner.tsx # karaliste warning
├── dialogs/
│   ├── MarkaEkleDialog.tsx
│   ├── AksesuarEkleDialog.tsx
│   └── TeknisyenEkleDialog.tsx
└── hooks/
    ├── useIslemForm.ts          # form state + validation
    └── useKaralisteCheck.ts
```
**Risk:** Yüksek — form state'i tek state nesnesinde, parçalarken kayma olabilir. Önce snapshot test, sonra adım adım taşı.

---

## IslemTable.tsx (1789 satır)
**Mevcut sorumluluklar:**
- Sütun bazlı filtreler (~15 sütun)
- Sayfalama
- Sıralama (sortable columns)
- Virtualization (büyük listeler için)
- Satır seçimi (multi-select)
- Durum dropdown (inline edit)
- Action menu (edit/delete/print)

**Önerilen bölünme:**
```
components/islem/IslemTable/
├── IslemTable.tsx               # shell
├── IslemTableHeader.tsx         # sütun başlıkları + sıralama
├── IslemTableRow.tsx            # tek satır + action menu
├── IslemTableFooter.tsx         # pagination
├── ColumnFilters.tsx            # 15 filtre giriş alanı
└── hooks/
    ├── useIslemTableState.ts    # sort/page/select state
    └── useColumnFilters.ts
```
**Risk:** Yüksek — virtualization React.memo'ya bağlı; parçalarken referans equality bozulabilir.

---

## Dashboard.tsx (1134 satır)
**Mevcut sorumluluklar:**
- Tab paneli (İşlemler / Atölye / Saha / Admin / Müşteri Geçmişi)
- Header (kullanıcı menüsü, logout)
- Socket.IO bağlantısı + 4 listener (yeni-islem, islem-guncellendi, islem-silindi, islem-durum-degisti)
- Lazy load orchestration (6 lazy component)
- İstatistik refresh logic

**Önerilen bölünme:**
```
components/dashboard/Dashboard/
├── Dashboard.tsx                # routing shell
├── DashboardHeader.tsx          # üst bar + user menu
├── DashboardTabs.tsx            # tab bar
├── hooks/
│   └── useIslemSocket.ts        # 4 socket listener
└── (lazy import edilen komponentler kendi klasörlerinde kalır)
```
**Risk:** Orta — socket logic'i ayrı hook'a alınınca re-connect sıklığı değişmemeli.

---

## AtolyeTakip.tsx (1173 satır)
**Mevcut sorumluluklar:**
- Tab paneli
- Socket.IO bağlantısı + 3 listener (yeni-atolye, atolye-guncellendi, atolye-silindi)
- Atölye CRUD trigger
- Kanban-benzeri durum kolonları
- Filtre

**Önerilen bölünme:**
```
components/atolye/AtolyeTakip/
├── AtolyeTakip.tsx              # shell
├── AtolyeKanban.tsx             # 3-4 durum kolonu
├── AtolyeColumn.tsx             # tek kolon (durum bazlı)
├── AtolyeCard.tsx               # tek kart
└── hooks/
    └── useAtolyeSocket.ts
```
**Risk:** Orta — DnD kullanılıyorsa (@hello-pangea/dnd) drag context bütünlüğü korunmalı.

---

## SahaKayitlari.tsx (930 satır)
**Mevcut sorumluluklar:**
- Liste + filtre
- Pagination
- Thumbnail grid
- Foto detay dialog'u
- Saha elemanı seçimi

**Önerilen bölünme:**
```
components/saha/SahaKayitlari/
├── SahaKayitlari.tsx
├── SahaKayitRow.tsx
├── SahaFotoDialog.tsx
└── hooks/
    └── useSahaFotoLoader.ts
```
**Risk:** Düşük — DOM-bound state minimal.

---

## AdminPanel.tsx (776 satır)
**Mevcut sorumluluklar:**
- User CRUD
- Kayıt listele (user-records, atolye-records, all-records)
- 3-4 tab

**Önerilen bölünme:**
```
components/admin/AdminPanel/
├── AdminPanel.tsx
├── UsersTab.tsx
├── RecordsTab.tsx
└── SahaKayitlariTab.tsx
```
**Risk:** Düşük.

---

## PrintEditor.tsx (700 satır)
**Mevcut sorumluluklar:**
- Yazıcı kalibrasyonu (offset X/Y, font size, line height)
- PDF önizleme
- .ttf font yükleme (Türkçe karakter için)
- Şablon kaydetme/yükleme

**Önerilen bölünme:** **Yok / Phase 6+.**
**Risk:** 🔴 Çok yüksek — PDF görsel hizalama her detayda kırılabilir. Kullanıcı kuralı: **PDF/Excel/PrintEditor kodu Phase 4'e kadar dokunulmaz.**
**Bu turda:** İçi değişmedi, sadece klasör taşındı.

---

## MusteriGecmisi.tsx (648 satır)
**Mevcut sorumluluklar:**
- Müşteri telefonu/adı ile arama
- Geçmiş işlem listesi
- jspdf-autotable ile PDF export (433 KB bundle chunk)

**Önerilen bölünme:**
```
components/musteri/MusteriGecmisi/
├── MusteriGecmisi.tsx
├── MusteriSearchBar.tsx
├── MusteriIslemList.tsx
└── (PDF export jspdf-autotable dynamic import edilebilir — Phase 4 bundle optimization)
```
**Risk:** Orta — jspdf-autotable kolon sırası kullanıcı alışkanlığı.

---

## Genel kurallar
- **Bu turda hiç içe dokunulmadı; sadece dosyalar feature klasörlerine taşındı.**
- Bölünme adımları **birer commit** olacak; her commit sonrası tsc + build + manuel smoke test.
- Hook çıkarımları sırasında **prop drilling** yerine **context** veya **zustand** önerilebilir; ama bu Phase 5+ kararı.
- IslemDialog ve IslemTable bölünmesi öncesi **snapshot test veya manuel checklist** zorunlu.
