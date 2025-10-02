import { Islem } from '../types';

export const printIslem = (islem: Islem) => {
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
                <span class="info-value">${[islem.ilce, islem.mahalle, islem.cadde, islem.sokak, 'No:' + islem.kapi_no, islem.apartman_site, islem.blok_no ? 'Blok:' + islem.blok_no : '', islem.daire_no ? 'D:' + islem.daire_no : ''].filter(v => v && v !== 'No:' && v !== 'Blok:' && v !== 'D:').join(' ') || ''}</span>
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

        <div class="section-title" style="border: 1px solid #000; padding: 5px; margin-bottom: 0;">- SERVİS DURUMU: ${islem.is_durumu === 'tamamlandi' ? 'Arıza Giderildi' : 'Açık'} -</div>

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
  const headers = ['ID', 'Tarih', 'Müşteri', 'İlçe', 'Mahalle', 'Cadde', 'Sokak', 'Kapı No', 'Apartman/Site', 'Blok No', 'Daire No', 'Sabit Tel', 'Cep Tel', 'Ürün', 'Marka', 'Yapılan İşlem', 'Teknisyen', 'Tutar', 'Şikayet', 'Durum'];
  const rows = islemler.map(i => [i.id, i.full_tarih ? new Date(i.full_tarih).toLocaleString('tr-TR') : '', i.ad_soyad || '', i.ilce || '', i.mahalle || '', i.cadde || '', i.sokak || '', i.kapi_no || '', i.apartman_site || '', i.blok_no || '', i.daire_no || '', i.sabit_tel || '', i.cep_tel || '', i.urun || '', i.marka || '', i.yapilan_islem || '', i.teknisyen_ismi || '', i.tutar ? Number(i.tutar).toFixed(2) : '0.00', i.sikayet || '', i.is_durumu === 'acik' ? 'Açık' : 'Tamamlandı']);
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(c => typeof c === 'string' && (c.includes(',') || c.includes('"') || c.includes('\n')) ? `"${c.replace(/"/g, '""')}"` : c).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', `islemler_${new Date().toLocaleDateString('tr-TR')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
