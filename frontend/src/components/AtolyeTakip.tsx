import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Chip,
  TextField,
  Tooltip,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { Atolye } from '../types';
import { api } from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';
import { useAuth } from '../context/AuthContext';
import AtolyeDialog from './AtolyeDialog.tsx';
import { io } from 'socket.io-client';

const AtolyeTakip: React.FC = () => {
  const [atolyeList, setAtolyeList] = useState<Atolye[]>([]);
  const [filteredList, setFilteredList] = useState<Atolye[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAtolyeId, setSelectedAtolyeId] = useState<number | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>(''); // Yeni state
  const { showSnackbar } = useSnackbar();
  const { user } = useAuth();
  
  const isBayi = user?.role === 'bayi';
  const bayiIsim = user?.bayiIsim || '';

  // Filter states
  const [filters, setFilters] = useState({
    sira: '',
    teslim_durumu: '',
    tarih: '',
    bayi_adi: '',
    musteri_ad_soyad: '',
    tel_no: '',
    marka: '',
    kod: '',
    seri_no: '',
    sikayet: '',
    ozel_not: '',
    yapilan_islem: '',
    ucret: '',
    yapilma_tarihi: '',
  });

  useEffect(() => {
    fetchAtolyeList();

    // Socket.IO bağlantısı - Gerçek zamanlı güncellemeler için
    const SOCKET_URL = import.meta.env.MODE === 'production' 
      ? 'https://projecrm-production.up.railway.app' 
      : 'http://localhost:5000';
    
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('AtolyeTakip: Socket.IO bağlantısı kuruldu');
    });

    newSocket.on('connect_error', (error) => {
      console.error('AtolyeTakip: Socket.IO bağlantı hatası:', error);
    });

    // Yeni atölye kaydı eklendiğinde
    newSocket.on('yeni-atolye', (atolye: Atolye) => {
      if (atolye && atolye.id) {
        // Bayi ise sadece kendi kayıtlarını ekle
        if (isBayi) {
          if (atolye.bayi_adi === bayiIsim) {
            setAtolyeList((prev) => [...prev, atolye]);
            showSnackbar('Yeni atölye kaydı eklendi!', 'info');
          }
        } else {
          setAtolyeList((prev) => [...prev, atolye]);
          showSnackbar('Yeni atölye kaydı eklendi!', 'info');
        }
      }
    });

    // Atölye kaydı güncellendiğinde
    newSocket.on('atolye-guncellendi', (updatedAtolyeRecord: Atolye) => {
      if (updatedAtolyeRecord && updatedAtolyeRecord.id) {
        setAtolyeList((prev) =>
          prev.map((atolye) => (atolye.id === updatedAtolyeRecord.id ? updatedAtolyeRecord : atolye))
        );
        showSnackbar('Atölye kaydı güncellendi!', 'info');
      }
    });

    // Atölye kaydı silindiğinde
    newSocket.on('atolye-silindi', (deletedId: number) => {
      if (deletedId) {
        setAtolyeList((prev) => prev.filter((atolye) => atolye.id !== deletedId));
        showSnackbar('Atölye kaydı silindi!', 'info');
      }
    });

    // Cleanup - component unmount olduğunda bağlantıyı kapat
    return () => {
      newSocket.disconnect();
    };
  }, [isBayi, bayiIsim]);

  // Apply filters whenever atolyeList or filters change
  useEffect(() => {
    applyFilters();
  }, [atolyeList, filters, activeStatusFilter]);

  const fetchAtolyeList = async () => {
    try {
      const response = await api.get('/atolye');
      let data = response.data;
      
      // Bayi ise sadece kendi kayıtlarını göster
      if (isBayi) {
        data = data.filter((item: Atolye) => item.bayi_adi === bayiIsim);
      }
      
      // En eski kayıtlar en üstte, en yeni kayıtlar en altta (id'ye göre küçükten büyüğe)
      const sortedData = data.sort((a: Atolye, b: Atolye) => a.id - b.id);
      setAtolyeList(sortedData);
    } catch (error) {
      showSnackbar('Atölye kayıtları yüklenirken hata oluştu', 'error');
    }
  };

  const applyFilters = () => {
    let filtered = [...atolyeList];

    // Quick status filter (butonlar ile)
    if (activeStatusFilter) {
      filtered = filtered.filter((item) => item.teslim_durumu === activeStatusFilter);
    }

    // Filter by teslim_durumu (text input)
    if (filters.teslim_durumu) {
      filtered = filtered.filter((item) =>
        getStatusLabel(item.teslim_durumu)
          .toLowerCase()
          .includes(filters.teslim_durumu.toLowerCase())
      );
    }

    // Filter by tarih (created_at)
    if (filters.tarih) {
      filtered = filtered.filter((item) =>
        formatDate(item.created_at).includes(filters.tarih)
      );
    }

    // Filter by bayi_adi
    if (filters.bayi_adi) {
      filtered = filtered.filter((item) =>
        item.bayi_adi.toLowerCase().includes(filters.bayi_adi.toLowerCase())
      );
    }

    // Filter by musteri_ad_soyad
    if (filters.musteri_ad_soyad) {
      filtered = filtered.filter((item) =>
        item.musteri_ad_soyad.toLowerCase().includes(filters.musteri_ad_soyad.toLowerCase())
      );
    }

    // Filter by tel_no
    if (filters.tel_no) {
      filtered = filtered.filter((item) =>
        item.tel_no.includes(filters.tel_no.replace(/\D/g, ''))
      );
    }

    // Filter by marka
    if (filters.marka) {
      filtered = filtered.filter((item) =>
        item.marka.toLowerCase().includes(filters.marka.toLowerCase())
      );
    }

    // Filter by kod
    if (filters.kod) {
      filtered = filtered.filter((item) =>
        (item.kod || '').toLowerCase().includes(filters.kod.toLowerCase())
      );
    }

    // Filter by seri_no
    if (filters.seri_no) {
      filtered = filtered.filter((item) =>
        (item.seri_no || '').toLowerCase().includes(filters.seri_no.toLowerCase())
      );
    }

    // Filter by sikayet
    if (filters.sikayet) {
      filtered = filtered.filter((item) =>
        item.sikayet.toLowerCase().includes(filters.sikayet.toLowerCase())
      );
    }

    // Filter by ozel_not
    if (filters.ozel_not) {
      filtered = filtered.filter((item) =>
        (item.ozel_not || '').toLowerCase().includes(filters.ozel_not.toLowerCase())
      );
    }

    // Filter by yapilan_islem
    if (filters.yapilan_islem) {
      filtered = filtered.filter((item) =>
        (item.yapilan_islem || '').toLowerCase().includes(filters.yapilan_islem.toLowerCase())
      );
    }

    // Filter by ucret
    if (filters.ucret) {
      filtered = filtered.filter((item) =>
        (item.ucret?.toString() || '').includes(filters.ucret)
      );
    }

    // Filter by yapilma_tarihi
    if (filters.yapilma_tarihi) {
      filtered = filtered.filter((item) =>
        item.yapilma_tarihi ? formatDate(item.yapilma_tarihi).includes(filters.yapilma_tarihi) : false
      );
    }

    // Filter by sira (son olarak, filtrelenmiş listeye göre)
    if (filters.sira) {
      filtered = filtered.filter((_item, index) => {
        const siraNo = (index + 1).toString();
        return siraNo.includes(filters.sira);
      });
    }

    setFilteredList(filtered);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    setSelectedAtolyeId(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: number) => {
    setSelectedAtolyeId(id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;

    try {
      await api.delete(`/atolye/${id}`);
      showSnackbar('Kayıt başarıyla silindi', 'success');
      fetchAtolyeList();
    } catch (error) {
      showSnackbar('Kayıt silinirken hata oluştu', 'error');
    }
  };

  const handleDialogClose = (refresh?: boolean) => {
    setDialogOpen(false);
    setSelectedAtolyeId(null);
    if (refresh) {
      fetchAtolyeList();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'teslim_edildi':
        return 'info'; // Mavi
      case 'beklemede':
        return 'warning';
      case 'siparis_verildi':
        return 'secondary'; // Mor
      case 'yapildi':
        return 'success';
      case 'fabrika_gitti':
        return 'default';
      case 'odeme_bekliyor':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'teslim_edildi':
        return 'Teslim Edildi';
      case 'beklemede':
        return 'Beklemede';
      case 'siparis_verildi':
        return 'Sipariş Verildi';
      case 'yapildi':
        return 'Yapıldı';
      case 'fabrika_gitti':
        return 'Fabrika Gitti';
      case 'odeme_bekliyor':
        return 'Ödeme Bekliyor';
      default:
        return status;
    }
  };

  const getRowBackgroundColor = (status: string) => {
    switch (status) {
      case 'teslim_edildi':
        return '#b3e5fc'; // Açık mavi
      case 'beklemede':
        return '#ffe0b2'; // Turuncu
      case 'siparis_verildi':
        return '#e1bee7'; // Mor
      case 'yapildi':
        return '#dcedc8'; // Yeşil
      case 'fabrika_gitti':
        return '#e0e0e0'; // Gri
      case 'odeme_bekliyor':
        return '#ffcdd2'; // Kırmızı
      default:
        return 'transparent';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
    }
    return phone;
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>Atölye Takip</h2>
            
            {/* Status Filter Buttons */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant={activeStatusFilter === '' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setActiveStatusFilter('')}
                sx={{
                  backgroundColor: activeStatusFilter === '' ? '#0D3282' : 'transparent',
                  color: activeStatusFilter === '' ? 'white' : '#0D3282',
                  borderColor: '#0D3282',
                  '&:hover': {
                    backgroundColor: activeStatusFilter === '' ? '#082052' : 'rgba(13, 50, 130, 0.1)',
                  },
                }}
              >
                Tümü
              </Button>
              <Button
                variant={activeStatusFilter === 'beklemede' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setActiveStatusFilter('beklemede')}
                sx={{
                  backgroundColor: activeStatusFilter === 'beklemede' ? '#ff9800' : 'transparent',
                  color: activeStatusFilter === 'beklemede' ? 'white' : '#ff9800',
                  borderColor: '#ff9800',
                  '&:hover': {
                    backgroundColor: activeStatusFilter === 'beklemede' ? '#f57c00' : 'rgba(255, 152, 0, 0.1)',
                  },
                }}
              >
                Beklemede
              </Button>
              <Button
                variant={activeStatusFilter === 'teslim_edildi' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setActiveStatusFilter('teslim_edildi')}
                sx={{
                  backgroundColor: activeStatusFilter === 'teslim_edildi' ? '#0288d1' : 'transparent',
                  color: activeStatusFilter === 'teslim_edildi' ? 'white' : '#0288d1',
                  borderColor: '#0288d1',
                  '&:hover': {
                    backgroundColor: activeStatusFilter === 'teslim_edildi' ? '#01579b' : 'rgba(2, 136, 209, 0.1)',
                  },
                }}
              >
                Teslim Edildi
              </Button>
              <Button
                variant={activeStatusFilter === 'siparis_verildi' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setActiveStatusFilter('siparis_verildi')}
                sx={{
                  backgroundColor: activeStatusFilter === 'siparis_verildi' ? '#9c27b0' : 'transparent',
                  color: activeStatusFilter === 'siparis_verildi' ? 'white' : '#9c27b0',
                  borderColor: '#9c27b0',
                  '&:hover': {
                    backgroundColor: activeStatusFilter === 'siparis_verildi' ? '#7b1fa2' : 'rgba(156, 39, 176, 0.1)',
                  },
                }}
              >
                Sipariş Verildi
              </Button>
              <Button
                variant={activeStatusFilter === 'yapildi' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setActiveStatusFilter('yapildi')}
                sx={{
                  backgroundColor: activeStatusFilter === 'yapildi' ? '#8bc34a' : 'transparent',
                  color: activeStatusFilter === 'yapildi' ? 'white' : '#8bc34a',
                  borderColor: '#8bc34a',
                  '&:hover': {
                    backgroundColor: activeStatusFilter === 'yapildi' ? '#689f38' : 'rgba(139, 195, 74, 0.1)',
                  },
                }}
              >
                Yapıldı
              </Button>
              <Button
                variant={activeStatusFilter === 'fabrika_gitti' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setActiveStatusFilter('fabrika_gitti')}
                sx={{
                  backgroundColor: activeStatusFilter === 'fabrika_gitti' ? '#9e9e9e' : 'transparent',
                  color: activeStatusFilter === 'fabrika_gitti' ? 'white' : '#9e9e9e',
                  borderColor: '#9e9e9e',
                  '&:hover': {
                    backgroundColor: activeStatusFilter === 'fabrika_gitti' ? '#757575' : 'rgba(158, 158, 158, 0.1)',
                  },
                }}
              >
                Fabrika Gitti
              </Button>
              <Button
                variant={activeStatusFilter === 'odeme_bekliyor' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setActiveStatusFilter('odeme_bekliyor')}
                sx={{
                  backgroundColor: activeStatusFilter === 'odeme_bekliyor' ? '#f44336' : 'transparent',
                  color: activeStatusFilter === 'odeme_bekliyor' ? 'white' : '#f44336',
                  borderColor: '#f44336',
                  '&:hover': {
                    backgroundColor: activeStatusFilter === 'odeme_bekliyor' ? '#d32f2f' : 'rgba(244, 67, 54, 0.1)',
                  },
                }}
              >
                Ödeme Bekliyor
              </Button>
            </Box>
          </Box>

          {!isBayi && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAdd}
              sx={{ backgroundColor: '#0D3282', '&:hover': { backgroundColor: '#082052' } }}
            >
              Yeni Kayıt
            </Button>
          )}
        </Box>

        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              {/* Filter Row */}
              <TableRow>
                <TableCell sx={{ width: '40px', padding: '3px', position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}>
                  <TextField
                    size="small"
                    placeholder="#"
                    value={filters.sira}
                    onChange={(e) => handleFilterChange('sira', e.target.value)}
                    sx={{ 
                      width: '100%', 
                      backgroundColor: 'white',
                      '& .MuiInputBase-input': { padding: '3px 4px', fontSize: '0.7rem' }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: '100px', padding: '3px', position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}>
                  <TextField
                    size="small"
                    placeholder="Durum..."
                    value={filters.teslim_durumu}
                    onChange={(e) => handleFilterChange('teslim_durumu', e.target.value)}
                    sx={{ 
                      width: '100%', 
                      backgroundColor: 'white',
                      '& .MuiInputBase-input': { padding: '3px 6px', fontSize: '0.75rem' }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: '85px', padding: '3px', position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}>
                  <TextField
                    size="small"
                    placeholder="Tarih..."
                    value={filters.tarih}
                    onChange={(e) => handleFilterChange('tarih', e.target.value)}
                    sx={{ 
                      width: '100%', 
                      backgroundColor: 'white',
                      '& .MuiInputBase-input': { padding: '3px 6px', fontSize: '0.75rem' }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: '100px', padding: '3px', position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}>
                  <TextField
                    size="small"
                    placeholder="Bayi..."
                    value={filters.bayi_adi}
                    onChange={(e) => handleFilterChange('bayi_adi', e.target.value)}
                    sx={{ 
                      width: '100%', 
                      backgroundColor: 'white',
                      '& .MuiInputBase-input': { padding: '3px 6px', fontSize: '0.75rem' }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: '120px', padding: '3px', position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}>
                  <TextField
                    size="small"
                    placeholder="Müşteri..."
                    value={filters.musteri_ad_soyad}
                    onChange={(e) => handleFilterChange('musteri_ad_soyad', e.target.value)}
                    sx={{ 
                      width: '100%', 
                      backgroundColor: 'white',
                      '& .MuiInputBase-input': { padding: '3px 6px', fontSize: '0.75rem' }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: '100px', padding: '3px', position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}>
                  <TextField
                    size="small"
                    placeholder="Telefon..."
                    value={filters.tel_no}
                    onChange={(e) => handleFilterChange('tel_no', e.target.value)}
                    sx={{ 
                      width: '100%', 
                      backgroundColor: 'white',
                      '& .MuiInputBase-input': { padding: '3px 6px', fontSize: '0.75rem' }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: '85px', padding: '3px', position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}>
                  <TextField
                    size="small"
                    placeholder="Marka..."
                    value={filters.marka}
                    onChange={(e) => handleFilterChange('marka', e.target.value)}
                    sx={{ 
                      width: '100%', 
                      backgroundColor: 'white',
                      '& .MuiInputBase-input': { padding: '3px 6px', fontSize: '0.75rem' }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: '75px', padding: '3px', position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}>
                  <TextField
                    size="small"
                    placeholder="Kod..."
                    value={filters.kod}
                    onChange={(e) => handleFilterChange('kod', e.target.value)}
                    sx={{ 
                      width: '100%', 
                      backgroundColor: 'white',
                      '& .MuiInputBase-input': { padding: '3px 6px', fontSize: '0.75rem' }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: '75px', padding: '3px', position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}>
                  <TextField
                    size="small"
                    placeholder="Seri..."
                    value={filters.seri_no}
                    onChange={(e) => handleFilterChange('seri_no', e.target.value)}
                    sx={{ 
                      width: '100%', 
                      backgroundColor: 'white',
                      '& .MuiInputBase-input': { padding: '3px 6px', fontSize: '0.75rem' }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: '120px', padding: '3px', position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}>
                  <TextField
                    size="small"
                    placeholder="Şikayet..."
                    value={filters.sikayet}
                    onChange={(e) => handleFilterChange('sikayet', e.target.value)}
                    sx={{ 
                      width: '100%', 
                      backgroundColor: 'white',
                      '& .MuiInputBase-input': { padding: '3px 6px', fontSize: '0.75rem' }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: '100px', padding: '3px', position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}>
                  <TextField
                    size="small"
                    placeholder="Not..."
                    value={filters.ozel_not}
                    onChange={(e) => handleFilterChange('ozel_not', e.target.value)}
                    sx={{ 
                      width: '100%', 
                      backgroundColor: 'white',
                      '& .MuiInputBase-input': { padding: '3px 6px', fontSize: '0.75rem' }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: '120px', padding: '3px', position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}>
                  <TextField
                    size="small"
                    placeholder="İşlem..."
                    value={filters.yapilan_islem}
                    onChange={(e) => handleFilterChange('yapilan_islem', e.target.value)}
                    sx={{ 
                      width: '100%', 
                      backgroundColor: 'white',
                      '& .MuiInputBase-input': { padding: '3px 6px', fontSize: '0.75rem' }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: '70px', padding: '3px', position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}>
                  <TextField
                    size="small"
                    placeholder="Ücret..."
                    value={filters.ucret}
                    onChange={(e) => handleFilterChange('ucret', e.target.value)}
                    sx={{ 
                      width: '100%', 
                      backgroundColor: 'white',
                      '& .MuiInputBase-input': { padding: '3px 6px', fontSize: '0.75rem' }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ width: '85px', padding: '3px', position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}>
                  <TextField
                    size="small"
                    placeholder="Tarih..."
                    value={filters.yapilma_tarihi}
                    onChange={(e) => handleFilterChange('yapilma_tarihi', e.target.value)}
                    sx={{ 
                      width: '100%', 
                      backgroundColor: 'white',
                      '& .MuiInputBase-input': { padding: '3px 6px', fontSize: '0.75rem' }
                    }}
                  />
                </TableCell>
                {!isBayi && <TableCell sx={{ width: '80px', padding: '3px', position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}></TableCell>}
              </TableRow>
              {/* Header Row */}
              <TableRow sx={{ backgroundColor: '#0D3282' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>Sıra</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>Teslim Durumu</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>Tarih</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>Bayi Adı</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>Müşteri</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>Tel No</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>Marka</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>Model</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>Seri No</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>Şikayet</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>Özel Not</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>Yapılan İşlem</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>Ücret</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>Yapılma Tarihi</TableCell>
                {!isBayi && <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>İşlemler</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredList.map((atolye) => {
                // Orijinal listedeki index'i bul
                const originalIndex = atolyeList.findIndex(item => item.id === atolye.id);
                const siraNo = originalIndex + 1;
                
                return (
                <TableRow 
                  key={atolye.id} 
                  hover
                  sx={{ 
                    backgroundColor: getRowBackgroundColor(atolye.teslim_durumu),
                    '&:hover': {
                      backgroundColor: getRowBackgroundColor(atolye.teslim_durumu),
                      filter: 'brightness(0.95)',
                    }
                  }}
                >
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>#{siraNo}</TableCell>
                  <TableCell sx={{ padding: '3px' }}>
                    <Chip
                      label={getStatusLabel(atolye.teslim_durumu)}
                      color={getStatusColor(atolye.teslim_durumu)}
                      size="small"
                      sx={{ 
                        fontSize: '0.65rem', 
                        height: '20px',
                        ...(atolye.teslim_durumu === 'siparis_verildi' && {
                          backgroundColor: '#9c27b0',
                          color: 'white'
                        })
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{formatDate(atolye.created_at)}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{atolye.bayi_adi}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{atolye.musteri_ad_soyad}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{formatPhoneNumber(atolye.tel_no)}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{atolye.marka}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{atolye.kod || '-'}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{atolye.seri_no || '-'}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Tooltip title={atolye.sikayet} placement="top" arrow>
                      <span>{atolye.sikayet}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Tooltip title={atolye.ozel_not || '-'} placement="top" arrow>
                      <span>{atolye.ozel_not || '-'}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Tooltip title={atolye.yapilan_islem || '-'} placement="top" arrow>
                      <span>{atolye.yapilan_islem || '-'}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{atolye.ucret ? `${atolye.ucret} ₺` : '-'}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{atolye.yapilma_tarihi ? formatDate(atolye.yapilma_tarihi) : '-'}</TableCell>
                  {!isBayi && (
                    <TableCell sx={{ padding: '3px' }}>
                      <IconButton size="small" onClick={() => handleEdit(atolye.id)} sx={{ mr: 0.5, padding: '3px' }}>
                        <Edit fontSize="small" sx={{ fontSize: '1rem' }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(atolye.id)} color="error" sx={{ padding: '3px' }}>
                        <Delete fontSize="small" sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
                );
              })}
              {filteredList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isBayi ? 14 : 15} align="center" sx={{ py: 3 }}>
                    {atolyeList.length === 0 ? 'Henüz kayıt bulunmamaktadır' : 'Filtreye uygun kayıt bulunamadı'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <AtolyeDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        atolyeId={selectedAtolyeId}
      />
    </Box>
  );
};

export default AtolyeTakip;
