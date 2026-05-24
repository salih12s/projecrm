import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Islem } from '../../types';

export const formatPhoneNumber = (phone: string | undefined): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
};

// Türkçe karakterleri normalize et (PDF için)
export const normalizeTurkish = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C');
};

export const exportMusteriGecmisiPDF = (searchName: string, searchResults: Islem[]): void => {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Türkçe karakter desteği için font ayarları
  doc.setLanguage('tr');

  // Başlık
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MUSTERI GECMISI RAPORU', 105, 15, { align: 'center' });

  // Özet bilgiler
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Musteri: ${searchName}`, 14, 25);
  doc.text(`Toplam Kayit: ${searchResults.length}`, 14, 30);
  doc.text(`Tarih: ${new Date().toLocaleString('tr-TR')}`, 14, 35);

  // Her kayıt için
  let startY = 45;

  searchResults.forEach((islem) => {
    // Yeni sayfa kontrolü
    if (startY > 250) {
      doc.addPage();
      startY = 20;
    }

    // Kayıt başlığı - ID bazlı sıra
    const siraNo = islem.id;
    doc.setFillColor(13, 50, 130);
    doc.rect(14, startY, 182, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `SIRA ${siraNo} - ${islem.full_tarih ? new Date(islem.full_tarih).toLocaleDateString('tr-TR') : '-'}`,
      16,
      startY + 5
    );
    startY += 10;

    // Detay adres
    let detayAdres = '';
    if (islem.apartman_site) detayAdres += 'Apt: ' + islem.apartman_site + ' ';
    if (islem.blok_no) detayAdres += 'Blok: ' + islem.blok_no + ' ';
    if (islem.daire_no) detayAdres += 'Daire: ' + islem.daire_no;

    // Telefon bilgisi - yedek telefon varsa ekle
    let telefonBilgisi = formatPhoneNumber(islem.cep_tel);
    if (islem.sabit_tel) telefonBilgisi += ' / Sabit: ' + formatPhoneNumber(islem.sabit_tel);
    if (islem.yedek_tel) telefonBilgisi += ' / Yedek: ' + formatPhoneNumber(islem.yedek_tel);

    // Tablo verileri - Türkçe karakterler normalize edilmiş
    const tableData: string[][] = [
      ['Musteri', normalizeTurkish(islem.ad_soyad)],
      ['Telefon', telefonBilgisi],
      ['Adres', normalizeTurkish(`${islem.ilce}, ${islem.mahalle}, ${islem.cadde} ${islem.sokak} No:${islem.kapi_no}`)],
    ];

    if (detayAdres.trim()) {
      tableData.push(['Detay Adres', normalizeTurkish(detayAdres.trim())]);
    }

    tableData.push(
      ['Urun', normalizeTurkish(islem.urun)],
      ['Marka', normalizeTurkish(islem.marka)],
      ['Sikayet', normalizeTurkish(islem.sikayet)],
      ['Teknisyen', normalizeTurkish(islem.teknisyen_ismi || 'Atanmadi')],
      ['Yapilan Islem', normalizeTurkish(islem.yapilan_islem || '-')],
      ['Tutar', islem.tutar ? islem.tutar + ' TL' : '-'],
      ['Durum',
        islem.is_durumu === 'tamamlandi' ? 'Tamamlandi' :
          islem.is_durumu === 'parca_bekliyor' ? 'Parca Bekliyor' :
            islem.is_durumu === 'iptal' ? 'Iptal' :
              'Acik'
      ]
    );

    autoTable(doc, {
      startY: startY,
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: {
          cellWidth: 35,
          fontStyle: 'bold',
          fillColor: [245, 245, 245],
        },
        1: {
          cellWidth: 147,
        },
      },
      margin: { left: 14, right: 14 },
    });

    // Son tablonun bittiği yeri al
    const finalY = (doc as any).lastAutoTable?.finalY || startY;
    startY = finalY + 5;
  });

  // Sayfa numaraları
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Sayfa ${i} / ${pageCount}`, 105, 287, { align: 'center' });
  }

  // PDF'i indir
  const fileName = `musteri_gecmisi_${searchName.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`;
  doc.save(fileName);
};
