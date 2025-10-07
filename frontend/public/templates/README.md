# PDF Şablonları

Bu klasöre marka-specific PDF şablonlarını koyun.

## Siembra PDF Şablonu

1. **siembra-template.pdf** dosyasını bu klasöre koyun
2. PDF boş bir Siembra formu olmalı (imzalar, veriler olmadan sadece çerçeve)
3. Sistem otomatik olarak koordinatlara veri yazacak

## Koordinat Sistemi

PDF koordinat sistemi sol alt köşeden başlar (0,0).
A5 Landscape boyutu: 595.28pt (genişlik) x 419.53pt (yükseklik)

### Mevcut Koordinatlar (print.ts dosyasında):

- **Müşteri Adı**: x: 120, y: height - 150
- **Adres**: x: 350, y: height - 150  
- **Şikayet**: x: 120, y: height - 170
- **Telefon**: x: 120, y: height - 190
- **Ürün-Marka**: x: 200, y: height - 100
- **Tarih**: x: 350, y: height - 170
- **Teknisyen**: x: 100, y: 100

## Koordinatları Ayarlama

`frontend/src/utils/print.ts` dosyasındaki `printWithPdfTemplate` fonksiyonunda koordinatları değiştirin:

```typescript
firstPage.drawText(islem.ad_soyad, {
  x: 120,  // Sağa/sola kaydırmak için değiştirin
  y: height - 150,  // Yukarı/aşağı kaydırmak için değiştirin  
  size: 8,  // Font boyutu
});
```

## Test Etme

1. Siembra markası seçin
2. Yazdır butonuna tıklayın
3. PDF otomatik olarak koordinatlara veri yazılmış halde açılacak
4. Koordinatları kontrol edin ve gerekirse ayarlayın
