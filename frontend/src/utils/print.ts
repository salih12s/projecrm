import { Islem } from '../types';

export const printIslem = (islem: Islem) => {
  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Servis Fişi - ${islem.marka}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            color: #333;
            line-height: 1.6;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #1976d2;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .header h1 {
            color: #1976d2;
            margin: 0;
            font-size: 28px;
          }
          
          .header .marka {
            font-size: 24px;
            color: #666;
            margin-top: 10px;
          }
          
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          
          .section-title {
            background-color: #1976d2;
            color: white;
            padding: 8px 15px;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: bold;
            border-radius: 4px;
          }
          
          .info-row {
            display: flex;
            margin: 8px 0;
            border-bottom: 1px solid #eee;
            padding: 8px 0;
          }
          
          .info-label {
            font-weight: bold;
            width: 180px;
            color: #555;
          }
          
          .info-value {
            flex: 1;
            color: #333;
          }
          
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 2px solid #eee;
            padding-top: 20px;
          }
          
          .status {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
          }
          
          .status-acik {
            background-color: #fff3cd;
            color: #856404;
          }
          
          .status-tamamlandi {
            background-color: #d4edda;
            color: #155724;
          }
          
          @media print {
            button {
              display: none;
            }
            
            body {
              padding: 0;
            }
          }
          
          .print-button {
            background-color: #1976d2;
            color: white;
            border: none;
            padding: 12px 30px;
            font-size: 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 20px auto;
            display: block;
          }
          
          .print-button:hover {
            background-color: #1565c0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SERVİS FİŞİ</h1>
          <div class="marka">${islem.marka}</div>
        </div>

        <div class="section">
          <div class="section-title">Tarih ve Durum Bilgileri</div>
          <div class="info-row">
            <span class="info-label">Kayıt Tarihi:</span>
            <span class="info-value">${new Date(islem.full_tarih).toLocaleString('tr-TR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
          <div class="info-row">
            <span class="info-label">İş Durumu:</span>
            <span class="info-value">
              <span class="status status-${islem.is_durumu}">
                ${islem.is_durumu === 'acik' ? 'AÇIK İŞ' : 'TAMAMLANDI'}
              </span>
            </span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Müşteri Bilgileri</div>
          <div class="info-row">
            <span class="info-label">Ad Soyad:</span>
            <span class="info-value">${islem.ad_soyad}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cep Telefonu:</span>
            <span class="info-value">${islem.cep_tel}</span>
          </div>
          ${islem.sabit_tel ? `
          <div class="info-row">
            <span class="info-label">Sabit Telefon:</span>
            <span class="info-value">${islem.sabit_tel}</span>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Adres Bilgileri</div>
          <div class="info-row">
            <span class="info-label">İlçe:</span>
            <span class="info-value">${islem.ilce}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Mahalle:</span>
            <span class="info-value">${islem.mahalle}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cadde:</span>
            <span class="info-value">${islem.cadde}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Sokak:</span>
            <span class="info-value">${islem.sokak}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Kapı No:</span>
            <span class="info-value">${islem.kapi_no}</span>
          </div>
          ${islem.apartman_site ? `
          <div class="info-row">
            <span class="info-label">Apartman/Site:</span>
            <span class="info-value">${islem.apartman_site}</span>
          </div>
          ` : ''}
          ${islem.blok_no ? `
          <div class="info-row">
            <span class="info-label">Blok No:</span>
            <span class="info-value">${islem.blok_no}</span>
          </div>
          ` : ''}
          ${islem.daire_no ? `
          <div class="info-row">
            <span class="info-label">Daire No:</span>
            <span class="info-value">${islem.daire_no}</span>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Ürün ve Şikayet Bilgileri</div>
          <div class="info-row">
            <span class="info-label">Ürün:</span>
            <span class="info-value">${islem.urun}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Marka:</span>
            <span class="info-value"><strong>${islem.marka}</strong></span>
          </div>
          <div class="info-row">
            <span class="info-label">Şikayet:</span>
            <span class="info-value">${islem.sikayet}</span>
          </div>
        </div>

        ${islem.teknisyen_ismi || islem.yapilan_islem || islem.tutar ? `
        <div class="section">
          <div class="section-title">Servis Bilgileri</div>
          ${islem.teknisyen_ismi ? `
          <div class="info-row">
            <span class="info-label">Teknisyen:</span>
            <span class="info-value">${islem.teknisyen_ismi}</span>
          </div>
          ` : ''}
          ${islem.yapilan_islem ? `
          <div class="info-row">
            <span class="info-label">Yapılan İşlem:</span>
            <span class="info-value">${islem.yapilan_islem}</span>
          </div>
          ` : ''}
          ${islem.tutar ? `
          <div class="info-row">
            <span class="info-label">Tutar:</span>
            <span class="info-value"><strong>${islem.tutar} TL</strong></span>
          </div>
          ` : ''}
        </div>
        ` : ''}

        <div class="footer">
          <p>Bu belge ${new Date().toLocaleString('tr-TR')} tarihinde oluşturulmuştur.</p>
          <p>Fiş No: ${islem.id}</p>
        </div>

        <button class="print-button" onclick="window.print()">
          🖨️ YAZDIR
        </button>
      </body>
    </html>
  `;

  const printWindow = window.open('', '', 'width=800,height=900,left=200,top=50');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
  }
};

export const exportToExcel = (islemler: Islem[]) => {
  const headers = [
    'Tarih',
    'Ad Soyad',
    'İlçe',
    'Mahalle',
    'Cadde',
    'Sokak',
    'Kapı No',
    'Apartman/Site',
    'Blok No',
    'Daire No',
    'Cep Tel',
    'Sabit Tel',
    'Ürün',
    'Marka',
    'Şikayet',
    'Teknisyen',
    'Yapılan İşlem',
    'Tutar',
    'Durum'
  ];

  const rows = islemler.map(islem => [
    new Date(islem.full_tarih).toLocaleDateString('tr-TR'),
    islem.ad_soyad,
    islem.ilce,
    islem.mahalle,
    islem.cadde,
    islem.sokak,
    islem.kapi_no,
    islem.apartman_site || '',
    islem.blok_no || '',
    islem.daire_no || '',
    islem.cep_tel,
    islem.sabit_tel || '',
    islem.urun,
    islem.marka,
    islem.sikayet,
    islem.teknisyen_ismi || '',
    islem.yapilan_islem || '',
    islem.tutar || '',
    islem.is_durumu === 'acik' ? 'Açık' : 'Tamamlandı'
  ]);

  let csvContent = '\uFEFF'; // BOM for UTF-8
  csvContent += headers.join('\t') + '\n';
  rows.forEach(row => {
    csvContent += row.map(cell => `"${cell}"`).join('\t') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `islemler_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
