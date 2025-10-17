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
  const [filteredResults, setFilteredResults] = useState<Islem[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    sira: '',
    tarih: '',
    ad_soyad: '',
    ilce: '',
    mahalle: '',
    cadde: '',
    sokak: '',
    kapi_no: '',
    apartman_site: '',
    blok_no: '',
    daire_no: '',
    cep_tel: '',
    urun: '',
    marka: '',
    sikayet: '',
    yapilan_islem: '',
    teknisyen: '',
    tutar: '',
    durum: '',
  });

  // Apply filters whenever searchResults or filters change
  React.useEffect(() => {
    applyFilters();
  }, [searchResults, filters]);

  const applyFilters = () => {
    let filtered = [...searchResults];

    // ID bazlı sabit sıra filtresi (silince kaymasın)
    if (filters.sira) {
      filtered = filtered.filter((item) => {
        return item.id.toString().includes(filters.sira);
      });
    }

    // Filter by tarih
    if (filters.tarih) {
      filtered = filtered.filter((item) =>
        item.full_tarih ? new Date(item.full_tarih).toLocaleDateString('tr-TR').includes(filters.tarih) : false
      );
    }

    // Filter by ad_soyad
    if (filters.ad_soyad) {
      filtered = filtered.filter((item) =>
        (item.ad_soyad || '').toLowerCase().includes(filters.ad_soyad.toLowerCase())
      );
    }

    // Filter by ilce
    if (filters.ilce) {
      filtered = filtered.filter((item) =>
        (item.ilce || '').toLowerCase().includes(filters.ilce.toLowerCase())
      );
    }

    // Filter by mahalle
    if (filters.mahalle) {
      filtered = filtered.filter((item) =>
        (item.mahalle || '').toLowerCase().includes(filters.mahalle.toLowerCase())
      );
    }

    // Filter by cadde
    if (filters.cadde) {
      filtered = filtered.filter((item) =>
        (item.cadde || '').toLowerCase().includes(filters.cadde.toLowerCase())
      );
    }

    // Filter by sokak
    if (filters.sokak) {
      filtered = filtered.filter((item) =>
        (item.sokak || '').toLowerCase().includes(filters.sokak.toLowerCase())
      );
    }

    // Filter by kapi_no
    if (filters.kapi_no) {
      filtered = filtered.filter((item) =>
        (item.kapi_no || '').toLowerCase().includes(filters.kapi_no.toLowerCase())
      );
    }

    // Filter by apartman_site
    if (filters.apartman_site) {
      filtered = filtered.filter((item) =>
        (item.apartman_site || '').toLowerCase().includes(filters.apartman_site.toLowerCase())
      );
    }

    // Filter by blok_no
    if (filters.blok_no) {
      filtered = filtered.filter((item) =>
        (item.blok_no || '').toLowerCase().includes(filters.blok_no.toLowerCase())
      );
    }

    // Filter by daire_no
    if (filters.daire_no) {
      filtered = filtered.filter((item) =>
        (item.daire_no || '').toLowerCase().includes(filters.daire_no.toLowerCase())
      );
    }

    // Filter by cep_tel
    if (filters.cep_tel) {
      filtered = filtered.filter((item) =>
        (item.cep_tel || '').includes(filters.cep_tel.replace(/\D/g, ''))
      );
    }

    // Filter by urun
    if (filters.urun) {
      filtered = filtered.filter((item) =>
        (item.urun || '').toLowerCase().includes(filters.urun.toLowerCase())
      );
    }

    // Filter by marka
    if (filters.marka) {
      filtered = filtered.filter((item) =>
        (item.marka || '').toLowerCase().includes(filters.marka.toLowerCase())
      );
    }

    // Filter by sikayet
    if (filters.sikayet) {
      filtered = filtered.filter((item) =>
        (item.sikayet || '').toLowerCase().includes(filters.sikayet.toLowerCase())
      );
    }

    // Filter by yapilan_islem
    if (filters.yapilan_islem) {
      filtered = filtered.filter((item) =>
        (item.yapilan_islem || '').toLowerCase().includes(filters.yapilan_islem.toLowerCase())
      );
    }

    // Filter by teknisyen - teknisyen_ismi kullan
    if (filters.teknisyen) {
      filtered = filtered.filter((item) =>
        (item.teknisyen_ismi || '').toLowerCase().includes(filters.teknisyen.toLowerCase())
      );
    }

    // Filter by tutar
    if (filters.tutar) {
      filtered = filtered.filter((item) =>
        (item.tutar?.toString() || '').includes(filters.tutar)
      );
    }

    // Filter by durum - is_durumu kullan
    if (filters.durum) {
      const durumText = filters.durum.toLowerCase();
      filtered = filtered.filter((item) => {
        const label = item.is_durumu === 'tamamlandi' ? 'tamamlandı' : 
                      item.is_durumu === 'parca_bekliyor' ? 'parça bekliyor' :
                      item.is_durumu === 'iptal' ? 'iptal' :
                      'açık';
        return label.includes(durumText);
      });
    }

    setFilteredResults(filtered);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = async () => {
    if (!searchName.trim()) {
      showSnackbar('Lütfen müşteri adı girin!', 'warning');
      return;
    }

    setLoading(true);
    try {
      const fetchedIslemler = await islemService.getAll();
      
      // Arama metnini ve kayıt adını temizle (boşluksuz, küçük harf)
      const cleanSearchName = searchName.toLowerCase().replace(/\s+/g, '');
      
      const filtered = fetchedIslemler.filter((islem) => {
        const cleanIslemName = islem.ad_soyad.toLowerCase().replace(/\s+/g, '');
        return cleanIslemName.includes(cleanSearchName);
      });

      // ID bazlı sıralama (büyük ID en üstte - en yeni)
      filtered.sort((a, b) => b.id - a.id);

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
        const tableData = [
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
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
        Müşteri Geçmişi
      </Typography>

      {/* Arama Alanı */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2, 
          alignItems: { xs: 'stretch', sm: 'center' } 
        }}>
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
            fullWidth
            sx={{ minWidth: { sm: 120 }, height: 56, maxWidth: { sm: 120 } }}
          >
            {loading ? 'Aranıyor...' : 'Ara'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf sx={{ display: { xs: 'none', sm: 'block' } }} />}
            onClick={handleExportPDF}
            disabled={searchResults.length === 0}
            fullWidth
            sx={{ minWidth: { sm: 140 }, height: 56, maxWidth: { sm: 140 } }}
          >
            PDF İndir
          </Button>
        </Box>
      </Paper>

      {/* Sonuçlar */}
      {searchResults.length > 0 && (
        <Paper>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Bulunan Kayıtlar ({filteredResults.length} / {searchResults.length})
            </Typography>
          </Box>
          <TableContainer sx={{ maxHeight: 600, overflowX: 'auto' }}>
            <Table stickyHeader size="small" sx={{ 
              minWidth: 650,
              '& .MuiTableCell-root': {
                borderRight: '2px solid #e0e0e0',
                borderBottom: '2px solid #e0e0e0',
                '&:last-child': {
                  borderRight: 'none'
                }
              }
            }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white', fontSize: '0.7rem', py: 0.2, px: 0.2, width: '40px' }}>Sıra</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white', fontSize: '0.7rem', py: 0.2, px: 0.2, width: '75px' }}>Tarih</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white', fontSize: '0.7rem', py: 0.2, px: 0.2, width: '85px' }}>Müşteri</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white', fontSize: '0.7rem', py: 0.2, px: 0.2, width: '65px' }}>İlçe</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white', fontSize: '0.7rem', py: 0.2, px: 0.2, width: '75px' }}>Mahalle</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white', fontSize: '0.7rem', py: 0.2, px: 0.2, width: '65px' }}>Cadde</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white', fontSize: '0.7rem', py: 0.2, px: 0.2, width: '60px' }}>Sokak</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white', fontSize: '0.7rem', py: 0.2, px: 0.2, width: '45px' }}>Kapı</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white', fontSize: '0.7rem', py: 0.2, px: 0.2, width: '85px' }}>Telefon</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white', fontSize: '0.7rem', py: 0.2, px: 0.2, width: '55px' }}>Ürün</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white', fontSize: '0.7rem', py: 0.2, px: 0.2, width: '55px' }}>Marka</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white', fontSize: '0.7rem', py: 0.2, px: 0.2, width: '80px' }}>Şikayet</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white', fontSize: '0.7rem', py: 0.2, px: 0.2, width: '80px' }}>Yapılan</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white', fontSize: '0.7rem', py: 0.2, px: 0.2, width: '50px' }}>Tutar</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white', fontSize: '0.7rem', py: 0.2, px: 0.2, width: '75px' }}>Durum</TableCell>
                </TableRow>
                {/* Filter Row */}
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ py: 0.2, px: 0.2 }}>
                    <TextField
                      size="small"
                      placeholder="Sıra..."
                      value={filters.sira}
                      onChange={(e) => handleFilterChange('sira', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.2, px: 0.2 }, width: '40px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.2 }}>
                    <TextField
                      size="small"
                      placeholder="Tarih..."
                      value={filters.tarih}
                      onChange={(e) => handleFilterChange('tarih', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.2, px: 0.2 }, width: '75px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.2 }}>
                    <TextField
                      size="small"
                      placeholder="Müşteri..."
                      value={filters.ad_soyad}
                      onChange={(e) => handleFilterChange('ad_soyad', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.2, px: 0.2 }, width: '85px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.2 }}>
                    <TextField
                      size="small"
                      placeholder="İlçe..."
                      value={filters.ilce}
                      onChange={(e) => handleFilterChange('ilce', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.2, px: 0.2 }, width: '65px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.2 }}>
                    <TextField
                      size="small"
                      placeholder="Mahalle..."
                      value={filters.mahalle}
                      onChange={(e) => handleFilterChange('mahalle', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.2, px: 0.2 }, width: '75px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.2 }}>
                    <TextField
                      size="small"
                      placeholder="Cadde..."
                      value={filters.cadde}
                      onChange={(e) => handleFilterChange('cadde', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.2, px: 0.2 }, width: '65px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.2 }}>
                    <TextField
                      size="small"
                      placeholder="Sokak..."
                      value={filters.sokak}
                      onChange={(e) => handleFilterChange('sokak', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.2, px: 0.2 }, width: '60px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.2 }}>
                    <TextField
                      size="small"
                      placeholder="Kapı..."
                      value={filters.kapi_no}
                      onChange={(e) => handleFilterChange('kapi_no', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.2, px: 0.2 }, width: '45px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.2 }}>
                    <TextField
                      size="small"
                      placeholder="Tel..."
                      value={filters.cep_tel}
                      onChange={(e) => handleFilterChange('cep_tel', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.2, px: 0.2 }, width: '85px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.2 }}>
                    <TextField
                      size="small"
                      placeholder="Ürün..."
                      value={filters.urun}
                      onChange={(e) => handleFilterChange('urun', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.2, px: 0.2 }, width: '55px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.2 }}>
                    <TextField
                      size="small"
                      placeholder="Marka..."
                      value={filters.marka}
                      onChange={(e) => handleFilterChange('marka', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.2, px: 0.2 }, width: '55px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.2 }}>
                    <TextField
                      size="small"
                      placeholder="Şikayet..."
                      value={filters.sikayet}
                      onChange={(e) => handleFilterChange('sikayet', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.2, px: 0.2 }, width: '80px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.2 }}>
                    <TextField
                      size="small"
                      placeholder="Yapılan..."
                      value={filters.yapilan_islem}
                      onChange={(e) => handleFilterChange('yapilan_islem', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.2, px: 0.2 }, width: '80px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.2 }}>
                    <TextField
                      size="small"
                      placeholder="Tutar..."
                      value={filters.tutar}
                      onChange={(e) => handleFilterChange('tutar', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.2, px: 0.2 }, width: '50px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.2 }}>
                    <TextField
                      size="small"
                      placeholder="Durum..."
                      value={filters.durum}
                      onChange={(e) => handleFilterChange('durum', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.2, px: 0.2 }, width: '75px' }}
                    />
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredResults.map((islem) => {
                  // ID bazlı sabit sıra (silince kaymasın)
                  const siraNo = islem.id;
                  
                  return (
                  <TableRow key={islem.id} hover>
                    <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.3 }}>{siraNo}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.3 }}>
                      {islem.full_tarih
                        ? new Date(islem.full_tarih).toLocaleDateString('tr-TR')
                        : '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.3 }}>{islem.ad_soyad}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.3 }}>{islem.ilce || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.3 }}>{islem.mahalle || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.3 }}>{islem.cadde || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.3 }}>{islem.sokak || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.3 }}>{islem.kapi_no || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.3 }}>{formatPhoneNumber(islem.cep_tel)}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.3 }}>{islem.urun}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.3 }}>{islem.marka}</TableCell>
                    <TableCell sx={{ maxWidth: 150, fontSize: '0.7rem', py: 0.2, px: 0.3 }}>
                      <Typography variant="body2" noWrap title={islem.sikayet} sx={{ fontSize: '0.7rem' }}>
                        {islem.sikayet}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 150, fontSize: '0.7rem', py: 0.2, px: 0.3 }}>
                      <Typography variant="body2" noWrap title={islem.yapilan_islem || '-'} sx={{ fontSize: '0.7rem' }}>
                        {islem.yapilan_islem || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.3 }}>{islem.tutar ? `${islem.tutar} TL` : '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.3 }}>
                      <Chip
                        label={
                          islem.is_durumu === 'tamamlandi' ? 'Tamamlandı' : 
                          islem.is_durumu === 'parca_bekliyor' ? 'Parça Bekliyor' :
                          islem.is_durumu === 'iptal' ? 'İptal' :
                          'Açık'
                        }
                        color={
                          islem.is_durumu === 'tamamlandi' ? 'success' : 
                          islem.is_durumu === 'iptal' ? 'error' :
                          'warning'
                        }
                        size="small"
                        sx={{ fontSize: '0.65rem', height: '20px' }}
                      />
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Arama yapılmadıysa */}
      {searchResults.length === 0 && !loading && (
        <Paper sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
          <Search sx={{ fontSize: { xs: 60, sm: 80 }, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Müşteri geçmişini görmek için ad soyad ile arama yapın
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default MusteriGecmisi;
