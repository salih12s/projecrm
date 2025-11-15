import { Islem } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

// Telefon numarasını formatla
const formatPhoneNumber = (phone: string | undefined): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
};

// PDF şablonuna koordinatlarla veri yazma fonksiyonu
async function printWithPdfTemplate(islem: Islem, templateUrl: string) {
  try {
    // PDF şablonunu yükle
    const templateBytes = await fetch(templateUrl).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    // Fontkit'i kaydet (özel font desteği için gerekli)
    pdfDoc.registerFontkit(fontkit);
    
    // İlk sayfayı al
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Courier New font yükle (nokta vuruşlu yazıcılar için)
    const fontUrl = '/fonts/CourierNew-Regular.ttf';

    const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
    const font = await pdfDoc.embedFont(fontBytes);
    
    // Sayfa boyutları (A4: 595.28pt x 841.89pt)
    const { height } = firstPage.getSize();
    
    // Koordinatlara veri yaz - Siembra formuna göre ayarlandı
    // PDF koordinat sistemi: Sol alt köşe (0,0), height=841.89
    
    // SAĞ ÜST BÖLGESİ - MÜŞTERİ BİLGİLERİ
    
    // İsmi (sağ üst - "İsmi" satırı)
    if (islem.ad_soyad) {
      firstPage.drawText(islem.ad_soyad.toUpperCase(), {
        x: 365,
        y: height - 317,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    
    // Adresi (sağ üst - "Adresi" satırı)
    if (islem.ilce || islem.mahalle || islem.cadde) {
      const adresParcalari = [
        islem.ilce?.toUpperCase(),
        islem.mahalle ? islem.mahalle.toUpperCase() + ' MAH.' : '',
        islem.cadde ? islem.cadde + ' Cad.' : '',
        islem.sokak ? islem.sokak + ' Sok.' : '',
        islem.apartman_site,
        islem.kapi_no ? 'No:' + islem.kapi_no : '',
        islem.blok_no ? 'Blok:' + islem.blok_no : '',
        islem.daire_no ? 'D:' + islem.daire_no : ''
      ].filter(Boolean);
      const adres = adresParcalari.join(', ');
      firstPage.drawText(adres.substring(0, 60), {
        x: 365,
        y: height - 332,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    
    // Şikayeti (sağ üst - "Şikayeti" satırı)
    if (islem.sikayet) {
      firstPage.drawText(islem.sikayet.substring(0, 70), {
        x: 365,
        y: height - 347,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    
    // Mücaddat Tarihi (sağ üst - "Mücaddat Tarihi" satırı)
    if (islem.full_tarih) {
      const tarih = new Date(islem.full_tarih).toLocaleDateString('tr-TR');
      firstPage.drawText(tarih, {
        x: 365,
        y: height - 362,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    
    // Telefon (sağ üst - "Telefon" satırı)
    if (islem.cep_tel) {
      const telefon = formatPhoneNumber(islem.cep_tel) + 
        (islem.yedek_tel ? ' / ' + formatPhoneNumber(islem.yedek_tel) : '');
      firstPage.drawText(telefon, {
        x: 365,
        y: height - 376,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    
    // SOL ÜST BÖLGESİ - CİHAZ BİLGİLERİ
    
    // Cihazı - Model/Marka (sol üst - "Model-Marka/sı" satırı)
    if (islem.urun || islem.marka) {
      const cihaz = [islem.urun, islem.marka].filter(Boolean).join(' - ');
      firstPage.drawText(cihaz, {
        x: 180,
        y: height - 340,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    
    
    // Garanti Tarihi (sol üst - "Garanti Tarihi" satırı - boş kalabilir)
    // firstPage.drawText('', { x: 262, y: height - 310, size: 9, font: font, color: rgb(0, 0, 0) });
    
    // ALT BÖLGESİ - İMZA VE KONTROL
    
    // Teknisyen Adı, İmzası (sol alt - "Teknisyen Adı, İmzası")
    if (islem.teknisyen_ismi) {
      firstPage.drawText(islem.teknisyen_ismi.toUpperCase(), {
        x: 58,
        y: height - 532,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    
    // PDF'i kaydet ve indir
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Yeni pencerede aç ve yazdır
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  } catch (error) {
    console.error('PDF yazdırma hatası:', error);
    alert('PDF yazdırılırken bir hata oluştu. Lütfen tekrar deneyin.');
  }
}

export const printIslem = async (islem: Islem) => {
  // Siembra markası için PDF şablonu kullan
  if (islem.marka && (
    islem.marka.toLowerCase() === 'siembra' || 
    islem.marka.toUpperCase() === 'SİEMBRA' ||
    islem.marka.toUpperCase() === 'SIEMBRA'
  )) {
    // PDF şablon dosyasının yolu
    const templateUrl = '/templates/siembra-template.pdf';
    await printWithPdfTemplate(islem, templateUrl);
    return;
  }
  
  // Diğer markalar için HTML şablon kullan
  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Servis Formu</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 10px; }
          
          .header { border: 2px solid #000; padding: 10px; margin-bottom: 15px; }
          .header-top { display: flex; justify-content: space-between; border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
          .company-info { font-size: 10px; line-height: 1.4; }
          .company-name { font-weight: bold; font-size: 12px; margin-bottom: 3px; }
          .form-title { text-align: center; font-weight: bold; font-size: 14px; flex: 1; }
          .form-no { text-align: right; font-size: 10px; }
          
          .customer-device { display: flex; gap: 10px; margin-top: 10px; }
          .customer-section { flex: 1; border: 1px solid #000; padding: 8px; }
          .device-section { width: 200px; border: 1px solid #000; padding: 8px; }
          .section-title { font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 3px; font-size: 11px; }
          .info-row { display: flex; margin: 4px 0; font-size: 10px; }
          .info-label { font-weight: bold; min-width: 80px; }
          .info-value { flex: 1; border-bottom: 1px dotted #999; }
          
          .service-table { width: 100%; border-collapse: collapse; margin: 15px 0; border: 1px solid #000; }
          .service-table th, .service-table td { border: 1px solid #000; padding: 5px; text-align: left; font-size: 10px; }
          .service-table th { background-color: #f0f0f0; font-weight: bold; }
          
          .solution-section { border: 1px solid #000; padding: 8px; margin: 10px 0; }
          .solution-table { width: 100%; border-collapse: collapse; }
          .solution-table td { padding: 4px; font-size: 10px; border-bottom: 1px solid #ddd; }
          
          .notes { border: 1px solid #000; padding: 8px; margin: 10px 0; min-height: 60px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 30px; }
          .signature-box { text-align: center; width: 40%; }
          .signature-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 5px; font-size: 10px; }
          .footer { margin-top: 20px; font-size: 8px; line-height: 1.3; border-top: 1px solid #000; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-top">
            <div class="company-info">
              <div class="company-name">FMS TEKNİK SERVİS HİZMETLERİ</div>
              <div>GÜZELTEPE MAH KABAAĞAÇ SOKAK</div>
              <div>NO:11/A</div>
              <div>VERGİ DAİRESİ/NO: İVRİZ</div>
            </div>
            <div class="form-title">- SERVİS FORMU -</div>
            <div class="form-no">
              <div>Servis No: ${islem.id || '-'}</div>
              <div>Kayıt Tarihi: ${islem.full_tarih ? new Date(islem.full_tarih).toLocaleDateString('tr-TR') + ' ' + new Date(islem.full_tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
            </div>
          </div>
          
          <div class="customer-device">
            <div class="customer-section">
              <div class="section-title">- MÜŞTERİ BİLGİLERİ -</div>
              <div class="info-row">
                <span class="info-label">Taşıdı:</span>
                <span class="info-value">${islem.ad_soyad || ''}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Adres:</span>
                <span class="info-value">${[
                  islem.ilce?.toUpperCase(),
                  islem.mahalle ? islem.mahalle.toUpperCase() + ' MAH.' : '',
                  islem.cadde ? islem.cadde + ' Cad.' : '',
                  islem.sokak ? islem.sokak + ' Sok.' : '',
                  islem.apartman_site,
                  islem.kapi_no ? 'No:' + islem.kapi_no : '',
                  islem.blok_no ? 'Blok:' + islem.blok_no : '',
                  islem.daire_no ? 'D:' + islem.daire_no : ''
                ].filter(Boolean).join(' ') || ''}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Telefon:</span>
                <span class="info-value">${formatPhoneNumber(islem.cep_tel)}${islem.sabit_tel ? ' / Sabit: ' + formatPhoneNumber(islem.sabit_tel) : ''}${islem.yedek_tel ? ' / Yedek: ' + formatPhoneNumber(islem.yedek_tel) : ''}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Vergi Daire/No:</span>
                <span class="info-value"></span>
              </div>
              <div class="info-row">
                <span class="info-label">Operatör:</span>
                <span class="info-value">${islem.teknisyen_ismi || ''}</span>
              </div>
            </div>
            
            <div class="device-section">
              <div class="section-title">- CİHAZ BİLGİSİ -</div>
              <div class="info-row">
                <span class="info-label">Cihaz Türü:</span>
                <span class="info-value">${islem.urun || ''}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Cihaz Tipi:</span>
                <span class="info-value">${islem.marka || ''}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Cihaz Modeli:</span>
                <span class="info-value"></span>
              </div>
              <div class="info-row">
                <span class="info-label">Seri No:</span>
                <span class="info-value"></span>
              </div>
            </div>
          </div>
        </div>

        <div class="section-title" style="border: 1px solid #000; padding: 5px; margin-bottom: 0;">- SERVİS DURUMU: ${
          islem.is_durumu === 'tamamlandi' ? 'Arıza Giderildi' : 
          islem.is_durumu === 'iptal' ? 'İptal' : 
          'Açık'
        } -</div>

        <table class="service-table">
          <thead>
            <tr>
              <th style="width: 15%;">TARİH</th>
              <th style="width: 20%;">İŞLEM ADI</th>
              <th style="width: 65%;">AÇIKLAMA</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${islem.full_tarih ? new Date(islem.full_tarih).toLocaleDateString('tr-TR') + ' - ' + new Date(islem.full_tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}</td>
              <td>Arıza Giderildi</td>
              <td>Açıklama: ${islem.sikayet || ''}</td>
            </tr>
            <tr>
              <td>${islem.full_tarih ? new Date(islem.full_tarih).toLocaleDateString('tr-TR') + ' - ' + new Date(islem.full_tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}</td>
              <td>Serva Yönlendirildi</td>
              <td></td>
            </tr>
            <tr>
              <td>${islem.full_tarih ? new Date(islem.full_tarih).toLocaleDateString('tr-TR') + ' - ' + new Date(islem.full_tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}</td>
              <td>Servis İşlemi Gerçekleşti</td>
              <td>Açıklama: ${islem.yapilan_islem || ''}</td>
            </tr>
          </tbody>
        </table>

        <div class="solution-section">
          <div class="section-title">- ÇÖZÜM HARKETLERİ -</div>
          <table class="solution-table">
            <tr>
              <td style="width: 30%;"><strong>TARİHLİ, EDER</strong></td>
              <td style="width: 45%;"><strong>ÇÖZÜM ŞEKLİ:</strong></td>
              <td style="width: 25%; text-align: right;"><strong>TUTAR</strong></td>
            </tr>
            <tr>
              <td>${islem.full_tarih ? new Date(islem.full_tarih).toLocaleDateString('tr-TR') : ''}</td>
              <td>Fırma Teknik Taşıdı-Arazla(11157478)</td>
              <td style="text-align: right;">${islem.tutar ? Number(islem.tutar).toFixed(2) + ' TL' : '0.00 TL'}</td>
            </tr>
          </table>
        </div>

        <div class="notes">
          <div style="font-weight: bold; margin-bottom: 5px;">- NOTLAR -</div>
          <div style="font-size: 9px; line-height: 1.3;">
            1- YAPILAN İŞLEMLER İLE İLGİLİ SON VE USULUNCE HABERDAR OLDUĞUMU<br>
            2- CİHAZIN İLK KULLANIMDA VE GARANTİYE TABİ İSE GARANTİ SÜRESİNİ BEYANI ETTİĞİMİ<br>
            3- YAPILAN İKİNCİ EL ÜRÜNLERE YAPILAN<br>
            4- TESLİM ALINAN APARATLARIN İŞ GEREĞİ DEFORME OLDUĞU
          </div>
        </div>

        <div class="signatures">
          <div class="signature-box">
            <div>Müşteri İmzası:</div>
            <div class="signature-line">Birim Teknisyeni</div>
          </div>
          <div class="signature-box">
            <div>Yetkili İmzası:</div>
            <div class="signature-line">Firma Teknik Taşıdı</div>
          </div>
        </div>

        <div class="footer">
          Bu Servis Formu ${islem.full_tarih ? new Date(islem.full_tarih).toLocaleDateString('tr-TR') + ' - ' + new Date(islem.full_tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''} Tarihinde Oluşturulmuştur.
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  }
};

export const exportToExcel = (islemler: Islem[]) => {
  // Başlıklar
  const headers = [
    'Tarih',
    'Müşteri',
    'İlçe',
    'Mahalle',
    'Cadde',
    'Sokak',
    'Kapı No',
    'Cep Tel',
    'Ürün',
    'Marka',
    'Yapılan İşlem',
    'Teknisyen',
    'Tutar',
    'Şikayet',
    'Durum'
  ];

  // Satırlar
  const rows = islemler.map(i => {
    // Metinleri temizle
    const sikayetTemiz = (i.sikayet || '').replace(/[\t\n\r]/g, ' ').trim();
    const yapilan_islemTemiz = (i.yapilan_islem || '').replace(/[\t\n\r]/g, ' ').trim();
    
    return [
      i.full_tarih ? new Date(i.full_tarih).toLocaleDateString('tr-TR') : '',
      i.ad_soyad || '',
      i.ilce || '',
      i.mahalle || '',
      i.cadde || '',
      i.sokak || '',
      i.kapi_no || '',
      i.cep_tel || '',
      i.urun || '',
      i.marka || '',
      yapilan_islemTemiz,
      i.teknisyen_ismi || '',
      i.tutar || '',
      sikayetTemiz,
      i.is_durumu === 'acik' ? 'Açık' : 'Tamamlandı'
    ];
  });

  // CSV formatı - Virgül ile ayrılmış, tırnak içinde
  const csvContent = '\uFEFF' + [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\r\n');

  // Dosyayı indir
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const tarih = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
  const fileName = `islemler_${tarih}.csv`;
  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Liste için PDF Export
export const exportListToPDF = (islemler: Islem[]) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape (yatay) A4
  
  // Türkçe karakter desteği için font ayarı
  doc.setFont('courier');
  
  // Başlık
  doc.setFontSize(16);
  doc.setFont('courier', 'bold');
  const baslik = 'ISLEMLER LISTESI';
  doc.text(baslik, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
  
  // Tarih ve kayıt sayısı
  doc.setFontSize(10);
  doc.setFont('courier', 'normal');
  const tarihStr = new Date().toLocaleDateString('tr-TR') + ' ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  doc.text('Tarih: ' + tarihStr, 14, 25);
  doc.text('Toplam Kayit: ' + islemler.length, 14, 30);
  
  // Tablo verileri hazırla - Türkçe karakterleri düzelt
  const turkishCharFix = (str: string) => {
    if (!str) return '-';
    return str
      .replace(/İ/g, 'I')
      .replace(/ı/g, 'i')
      .replace(/Ğ/g, 'G')
      .replace(/ğ/g, 'g')
      .replace(/Ü/g, 'U')
      .replace(/ü/g, 'u')
      .replace(/Ş/g, 'S')
      .replace(/ş/g, 's')
      .replace(/Ö/g, 'O')
      .replace(/ö/g, 'o')
      .replace(/Ç/g, 'C')
      .replace(/ç/g, 'c');
  };
  
  // Liste en yeni en üstte olacak şekilde sıralansın (ID'ye göre azalan)
  const sortedIslemler = [...islemler].sort((a, b) => b.id - a.id);
  
  const tableData = sortedIslemler.map((islem, index) => [
    sortedIslemler.length - index, // Sıra (en yeni en üstte, büyük numara)
    islem.full_tarih ? new Date(islem.full_tarih).toLocaleDateString('tr-TR') : '-',
    turkishCharFix(islem.ad_soyad || ''),
    turkishCharFix(islem.ilce || ''),
    turkishCharFix(islem.mahalle ? islem.mahalle + ' Mah.' : ''),
    islem.cep_tel || '-',
    turkishCharFix(islem.urun || ''),
    turkishCharFix(islem.marka || ''),
    turkishCharFix((islem.sikayet || '').substring(0, 30) + ((islem.sikayet || '').length > 30 ? '...' : '')),
    turkishCharFix(islem.teknisyen_ismi || ''),
    islem.tutar ? islem.tutar + ' TL' : '-',
    islem.is_durumu === 'acik' ? 'Acik' : islem.is_durumu === 'parca_bekliyor' ? 'Parca Bekliyor' : islem.is_durumu === 'iptal' ? 'Iptal' : 'Tamamlandi',
    // Yeni alanlar
    turkishCharFix(islem.apartman_site || '-'),
    turkishCharFix(islem.blok_no || '-'),
    turkishCharFix(islem.daire_no || '-')
  ]);
  
  // AutoTable ile tablo oluştur
  autoTable(doc, {
    startY: 35,
    head: [[
      'Sira',
      'Tarih',
      'Musteri',
      'Ilce', 
      'Mahalle',
      'Telefon',
      'Urun',
      'Marka',
      'Sikayet',
      'Teknisyen',
      'Tutar',
      'Durum',
      'Apart/Site',
      'Blok',
      'Daire'
    ]],
    body: tableData,
    styles: {
      fontSize: 6,
      cellPadding: 1,
      halign: 'left',
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [13, 50, 130],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' }, // Sıra
      1: { cellWidth: 18 }, // Tarih
      2: { cellWidth: 24 }, // Müşteri
      3: { cellWidth: 18 }, // İlçe
      4: { cellWidth: 22 }, // Mahalle
      5: { cellWidth: 20 }, // Telefon
      6: { cellWidth: 16 }, // Ürün
      7: { cellWidth: 16 }, // Marka
      8: { cellWidth: 30 }, // Şikayet
      9: { cellWidth: 18 }, // Teknisyen
      10: { cellWidth: 15, halign: 'right' }, // Tutar
      11: { cellWidth: 16, halign: 'center' }, // Durum
      12: { cellWidth: 16 }, // Apart/Site
      13: { cellWidth: 8, halign: 'center' }, // Blok
      14: { cellWidth: 8, halign: 'center' }, // Daire
    },
    margin: { top: 35, left: 10, right: 10 },
    didDrawPage: function (data) {
      // Sayfa numarası
      const pageCount = (doc as any).internal.getNumberOfPages();
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.setFontSize(8);
      doc.text(
        'Sayfa ' + data.pageNumber + ' / ' + pageCount,
        pageSize.width / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    },
  });
  
  // PDF'i indir
  const tarih = new Date().toLocaleDateString('tr-TR').replace(/\./g, '_');
  doc.save(`islemler_${tarih}.pdf`);
};

