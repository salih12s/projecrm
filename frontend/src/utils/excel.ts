import * as XLSX from 'xlsx';
import { Islem } from '../types';

// Telefon numarasını formatla
const formatPhoneNumber = (phone: string | undefined): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
};

// Durum label'ı
const getDurumLabel = (durum: string): string => {
  switch (durum) {
    case 'acik':
      return 'Açık';
    case 'parca_bekliyor':
      return 'Parça Bekliyor';
    case 'tamamlandi':
      return 'Tamamlandı';
    case 'iptal':
      return 'İptal';
    default:
      return durum;
  }
};

export const exportToExcel = (islemler: Islem[]) => {
  // Excel için veri hazırlama - Tablodaki sütun sırasına göre
  const excelData = islemler.map((islem) => ({
    'Sıra': islem.id,
    'Tarih': islem.full_tarih ? new Date(islem.full_tarih).toLocaleDateString('tr-TR') : '-',
    'Ad Soyad': islem.ad_soyad || '-',
    'İlçe': islem.ilce || '-',
    'Mahalle': islem.mahalle || '-',
    'Apt/Site': islem.apartman_site || '-',
    'Blok': islem.blok_no || '-',
    'Daire': islem.daire_no || '-',
    'Cep Tel': formatPhoneNumber(islem.cep_tel) || '-',
    'Yedek': formatPhoneNumber(islem.yedek_tel) || '-',
    'Cadde': islem.cadde || '-',
    'Sokak': islem.sokak || '-',
    'Kapı': islem.kapi_no || '-',
    'Ürün': islem.urun || '-',
    'Marka': islem.marka || '-',
    'Şikayet': islem.sikayet || '-',
    'Yapılan İşlem': islem.yapilan_islem || '-',
    'Teknisyen': islem.teknisyen_ismi || '-',
    'Tutar': islem.tutar ? `${islem.tutar} ₺` : '-',
    'Durum': getDurumLabel(islem.is_durumu),
  }));

  // Worksheet oluştur
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Satır yüksekliklerini ayarla
  const rowHeights = [
    { hpx: 25 }, // Header row
    ...Array(excelData.length).fill({ hpx: 20 }), // Data rows
  ];
  worksheet['!rows'] = rowHeights;

  // Sütun genişliklerini ayarla (tablodaki sütun sırasına göre)
  const columnWidths = [
    { wch: 6 },  // Sıra
    { wch: 12 }, // Tarih
    { wch: 20 }, // Ad Soyad
    { wch: 12 }, // İlçe
    { wch: 15 }, // Mahalle
    { wch: 15 }, // Apt/Site
    { wch: 8 },  // Blok
    { wch: 8 },  // Daire
    { wch: 16 }, // Cep Tel
    { wch: 16 }, // Yedek
    { wch: 15 }, // Cadde
    { wch: 15 }, // Sokak
    { wch: 8 },  // Kapı
    { wch: 20 }, // Ürün
    { wch: 15 }, // Marka
    { wch: 35 }, // Şikayet
    { wch: 35 }, // Yapılan İşlem
    { wch: 15 }, // Teknisyen
    { wch: 12 }, // Tutar
    { wch: 15 }, // Durum
  ];
  worksheet['!cols'] = columnWidths;

  // Başlık satırı stilini ayarla
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    
    worksheet[cellAddress].s = {
      font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '0D3282' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
      border: {
        top: { style: 'medium', color: { rgb: 'e0e0e0' } },
        bottom: { style: 'medium', color: { rgb: 'e0e0e0' } },
        left: { style: 'medium', color: { rgb: 'e0e0e0' } },
        right: { style: 'medium', color: { rgb: 'e0e0e0' } },
      },
    };
  }

  // Data satırlarına border ve stil ekle
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { t: 's', v: '' };
      }
      
      if (!worksheet[cellAddress].s) {
        worksheet[cellAddress].s = {};
      }
      
      // Border
      worksheet[cellAddress].s.border = {
        top: { style: 'thin', color: { rgb: 'e0e0e0' } },
        bottom: { style: 'thin', color: { rgb: 'e0e0e0' } },
        left: { style: 'thin', color: { rgb: 'e0e0e0' } },
        right: { style: 'thin', color: { rgb: 'e0e0e0' } },
      };
      
      // Font
      worksheet[cellAddress].s.font = { sz: 10 };
      
      // Hizalama - Sıra ve Tutar kolonları sağa hizalı, diğerleri sola
      const isNumberColumn = col === 0 || col === 18; // Sıra ve Tutar
      worksheet[cellAddress].s.alignment = { 
        vertical: 'center',
        horizontal: isNumberColumn ? 'right' : 'left',
        wrapText: col === 15 || col === 16, // Şikayet ve Yapılan İşlem wrap olsun
      };
      
      // Zemin rengi - Satır satır farklı (zebra stripe)
      if (row % 2 === 0) {
        worksheet[cellAddress].s.fill = { fgColor: { rgb: 'F5F5F5' } };
      }
    }
  }

  // Workbook oluştur
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'İşlemler');

  // Dosya adı (tarih ile)
  const fileName = `Islemler_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.xlsx`;

  // Excel dosyasını indir
  XLSX.writeFile(workbook, fileName);
};
