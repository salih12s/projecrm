import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  InputAdornment,
} from '@mui/material';
import { Search, PictureAsPdf } from '@mui/icons-material';
import { Islem } from '../types';
import { islemService } from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MusteriGecmisi: React.FC = () => {
  const { showSnackbar } = useSnackbar();
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState<Islem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchName.trim()) {
      showSnackbar('Lütfen müşteri adı girin!', 'warning');
      return;
    }

    setLoading(true);
    try {
      const allIslemler = await islemService.getAll();
      
      // Arama metnini ve kayıt adını temizle (boşluksuz, küçük harf)
      const cleanSearchName = searchName.toLowerCase().replace(/\s+/g, '');
      
      const filtered = allIslemler.filter((islem) => {
        const cleanIslemName = islem.ad_soyad.toLowerCase().replace(/\s+/g, '');
        return cleanIslemName.includes(cleanSearchName);
      });

      if (filtered.length === 0) {
        showSnackbar('Bu isimle kayıt bulunamadı!', 'info');
      } else {
        showSnackbar(`${filtered.length} kayıt bulundu!`, 'success');
      }

      setSearchResults(filtered);
    } catch (error) {
      console.error('Arama hatası:', error);
      showSnackbar('Arama yapılırken hata oluştu!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (searchResults.length === 0) {
      showSnackbar('PDF oluşturmak için önce arama yapın!', 'warning');
      return;
    }

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Türkçe karakter desteği için font ayarları
      doc.setLanguage("tr");
      
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
      
      searchResults.forEach((islem, index) => {
        // Yeni sayfa kontrolü
        if (startY > 250) {
          doc.addPage();
          startY = 20;
        }
        
        // Kayıt başlığı
        doc.setFillColor(13, 50, 130);
        doc.rect(14, startY, 182, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(
          `KAYIT ${index + 1} - ${islem.full_tarih ? new Date(islem.full_tarih).toLocaleDateString('tr-TR') : '-'}`,
          16,
          startY + 5
        );
        startY += 10;
        
        // Detay adres
        let detayAdres = '';
        if (islem.apartman_site) detayAdres += 'Apt: ' + islem.apartman_site + ' ';
        if (islem.blok_no) detayAdres += 'Blok: ' + islem.blok_no + ' ';
        if (islem.daire_no) detayAdres += 'Daire: ' + islem.daire_no;
        
        // Tablo verileri - Türkçe karakterler normalize edilmiş
        const tableData = [
          ['Musteri', normalizeTurkish(islem.ad_soyad)],
          ['Telefon', formatPhoneNumber(islem.cep_tel) + (islem.sabit_tel ? ' / ' + formatPhoneNumber(islem.sabit_tel) : '')],
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
          ['Durum', islem.is_durumu === 'tamamlandi' ? 'Tamamlandi' : 'Acik']
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
      showSnackbar('PDF başarıyla oluşturuldu!', 'success');
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      showSnackbar('PDF oluşturulurken hata oluştu!', 'error');
    }
  };

  const formatPhoneNumber = (phone: string | undefined): string => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
    }
    return phone;
  };

  // Türkçe karakterleri normalize et (PDF için)
  const normalizeTurkish = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
      .replace(/ü/g, 'u').replace(/Ü/g, 'U')
      .replace(/ş/g, 's').replace(/Ş/g, 'S')
      .replace(/ı/g, 'i').replace(/İ/g, 'I')
      .replace(/ö/g, 'o').replace(/Ö/g, 'O')
      .replace(/ç/g, 'c').replace(/Ç/g, 'C');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Müşteri Geçmişi
      </Typography>

      {/* Arama Alanı */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            label="Müşteri Adı Soyad"
            placeholder="Müşteri adını girin..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            sx={{ minWidth: 120, height: 56 }}
          >
            {loading ? 'Aranıyor...' : 'Ara'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={handleExportPDF}
            disabled={searchResults.length === 0}
            sx={{ minWidth: 140, height: 56 }}
          >
            PDF İndir
          </Button>
        </Box>
      </Paper>

      {/* Sonuçlar */}
      {searchResults.length > 0 && (
        <Paper>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6">
              Bulunan Kayıtlar ({searchResults.length})
            </Typography>
          </Box>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Tarih</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Müşteri</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Adres</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Telefon</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Ürün</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Marka</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Şikayet</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Teknisyen</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Yapılan İşlem</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Tutar</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Durum</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {searchResults.map((islem) => (
                  <TableRow key={islem.id} hover>
                    <TableCell>
                      {islem.full_tarih
                        ? new Date(islem.full_tarih).toLocaleDateString('tr-TR')
                        : '-'}
                    </TableCell>
                    <TableCell>{islem.ad_soyad}</TableCell>
                    <TableCell>
                      {islem.ilce} {islem.mahalle} {islem.cadde} {islem.sokak} No:{islem.kapi_no}
                    </TableCell>
                    <TableCell>{formatPhoneNumber(islem.cep_tel)}</TableCell>
                    <TableCell>{islem.urun}</TableCell>
                    <TableCell>{islem.marka}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="body2" noWrap>
                        {islem.sikayet}
                      </Typography>
                    </TableCell>
                    <TableCell>{islem.teknisyen_ismi || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="body2" noWrap>
                        {islem.yapilan_islem || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{islem.tutar ? `${islem.tutar} TL` : '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={islem.is_durumu === 'tamamlandi' ? 'Tamamlandı' : 'Açık'}
                        color={islem.is_durumu === 'tamamlandi' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Arama yapılmadıysa */}
      {searchResults.length === 0 && !loading && (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <Search sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Müşteri geçmişini görmek için ad soyad ile arama yapın
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default MusteriGecmisi;
