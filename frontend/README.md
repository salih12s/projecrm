# ProjeCRM Frontend

ProjeCRM’in web arayüzü; teknik servis, atölye, saha ve yönetim ekipleri için rol bazlı çalışma alanları sunan React ve TypeScript uygulamasıdır.

## Ürün alanları

- Servis operasyon panosu ve yeni işlem formu
- Müşteri geçmişi ve PDF çıktısı
- Atölye takip tablosu ve kayıt ayrıntıları
- Merkezi teknisyen, ürün, marka ve bayi tanımları
- Fotoğraflı saha kayıtları
- Kullanıcı ve aktivite yönetimi
- Servis formu ve Excel çıktı araçları

## Arayüz yaklaşımı

- Yoğun operasyon verisi için filtrelenebilir ve sayfalanabilir tablolar
- Masaüstü operasyon ekranları ile mobil saha deneyiminin birlikte ele alınması
- Kullanıcı rolüne göre değişen navigasyon ve modül erişimi
- Durumları hızla ayırt etmek için sayaçlar ve renk kodları
- Ağır ekranlarda lazy-loading ve parçalı yükleme
- Arama alanlarında debounce ile dengeli ağ trafiği
- Socket.IO olaylarıyla sayfa yenilemeden veri güncelleme

## Kaynak düzeni

```text
src/
├── components/   Modül ve ekran bileşenleri
├── context/      Oturum ve uygulama bağlamları
├── hooks/        Ortak tablo ve gerçek zamanlı veri davranışları
├── services/     API istemci katmanı
├── types/        Uygulama veri modelleri
├── utils/        PDF, yazdırma ve yardımcı işlevler
└── constants/    Ortak arayüz sabitleri
```

Material UI bileşen sistemi, operasyon yoğunluğuna uygun özel tablo davranışları ve Türkçe çıktı araçları aynı ürün deneyiminde birleştirilmiştir.
