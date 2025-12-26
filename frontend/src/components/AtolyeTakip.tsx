import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
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
  MenuItem,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
  TablePagination,
  CircularProgress,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { Atolye } from '../types';
import { api } from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';
import { useAuth } from '../context/AuthContext';
import AtolyeDialog from './AtolyeDialog.tsx';
import { io } from 'socket.io-client';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Static helper functions
const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (status) {
    case 'teslim_edildi': return 'info';
    case 'beklemede': return 'warning';
    case 'siparis_verildi': return 'secondary';
    case 'yapildi': return 'success';
    case 'fabrika_gitti': return 'default';
    case 'odeme_bekliyor': return 'error';
    default: return 'default';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'teslim_edildi': return 'Teslim Edildi';
    case 'beklemede': return 'Beklemede';
    case 'siparis_verildi': return 'Sipariş Verildi';
    case 'yapildi': return 'Yapıldı';
    case 'fabrika_gitti': return 'Fabrika Gitti';
    case 'odeme_bekliyor': return 'Ödeme Bekliyor';
    default: return status;
  }
};

const getRowBackgroundColor = (status: string): string => {
  switch (status) {
    case 'teslim_edildi': return '#b3e5fc';
    case 'beklemede': return '#ffe0b2';
    case 'siparis_verildi': return '#e1bee7';
    case 'yapildi': return '#dcedc8';
    case 'fabrika_gitti': return '#e0e0e0';
    case 'odeme_bekliyor': return '#ffcdd2';
    default: return 'transparent';
  }
};

const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return ''; }
};

const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
};

// Memoized Table Row
interface AtolyeRowProps {
  atolye: Atolye;
  isBayi: boolean;
  isAdmin: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const AtolyeTableRow = memo(({ atolye, isBayi, isAdmin, onEdit, onDelete }: AtolyeRowProps) => (
  <TableRow 
    hover
    onDoubleClick={() => !isBayi && onEdit(atolye.id)}
    sx={{ 
      backgroundColor: getRowBackgroundColor(atolye.teslim_durumu),
      cursor: !isBayi ? 'pointer' : 'default',
      '&:hover': { backgroundColor: getRowBackgroundColor(atolye.teslim_durumu), filter: 'brightness(0.95)' }
    }}
  >
    <TableCell sx={{ padding: '3px', fontSize: '1rem', fontWeight: 'bold', textAlign: 'center' }}>{atolye.id}</TableCell>
    <TableCell sx={{ padding: '3px' }}>
      <Chip label={getStatusLabel(atolye.teslim_durumu)} color={getStatusColor(atolye.teslim_durumu)} size="small"
        sx={{ fontSize: '0.65rem', height: '20px', ...(atolye.teslim_durumu === 'siparis_verildi' && { backgroundColor: '#9c27b0', color: 'white' }) }} />
    </TableCell>
    <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{formatDate(atolye.kayit_tarihi || atolye.created_at)}</TableCell>
    <TableCell sx={{ padding: '3px', fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.bayi_adi}</TableCell>
    <TableCell sx={{ padding: '3px', fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.musteri_ad_soyad}</TableCell>
    <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{formatPhoneNumber(atolye.tel_no)}</TableCell>
    <TableCell sx={{ padding: '3px', fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.marka}</TableCell>
    <TableCell sx={{ padding: '3px', fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.kod || '-'}</TableCell>
    <TableCell sx={{ padding: '3px', fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.seri_no || '-'}</TableCell>
    <TableCell sx={{ padding: '3px', fontSize: '0.75rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
      <Tooltip title={atolye.sikayet || ''} placement="top" arrow enterDelay={500}><span>{atolye.sikayet}</span></Tooltip>
    </TableCell>
    <TableCell sx={{ padding: '3px', fontSize: '0.75rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
      <Tooltip title={atolye.ozel_not || '-'} placement="top" arrow enterDelay={500}><span>{atolye.ozel_not || '-'}</span></Tooltip>
    </TableCell>
    <TableCell sx={{ padding: '3px', fontSize: '0.75rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
      <Tooltip title={atolye.yapilan_islem || '-'} placement="top" arrow enterDelay={500}><span>{atolye.yapilan_islem || '-'}</span></Tooltip>
    </TableCell>
    <TableCell sx={{ padding: '3px', fontSize: '0.75rem', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
      <Tooltip title={atolye.note_no || '-'} placement="top" arrow enterDelay={500}><span>{atolye.note_no || '-'}</span></Tooltip>
    </TableCell>
    <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{atolye.ucret ? `${atolye.ucret} ₺` : '-'}</TableCell>
    <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{atolye.yapilma_tarihi ? formatDate(atolye.yapilma_tarihi) : '-'}</TableCell>
    {!isBayi && (
      <TableCell sx={{ padding: '3px' }}>
        <IconButton size="small" onClick={() => onEdit(atolye.id)} sx={{ mr: 0.5, padding: '3px' }}><Edit fontSize="small" sx={{ fontSize: '1rem' }} /></IconButton>
        {isAdmin && <IconButton size="small" onClick={() => onDelete(atolye.id)} color="error" sx={{ padding: '3px' }}><Delete fontSize="small" sx={{ fontSize: '1rem' }} /></IconButton>}
      </TableCell>
    )}
  </TableRow>
));
AtolyeTableRow.displayName = 'AtolyeTableRow';

// Status counts type
interface StatusCounts {
  total: number; beklemede: number; teslim_edildi: number; siparis_verildi: number; yapildi: number; fabrika_gitti: number; odeme_bekliyor: number;
}

const AtolyeTakip: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [atolyeList, setAtolyeList] = useState<Atolye[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAtolyeId, setSelectedAtolyeId] = useState<number | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useSnackbar();
  const { user } = useAuth();
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  
  // Status counts
  // @ts-ignore - Will be used for status badges later
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ total: 0, beklemede: 0, teslim_edildi: 0, siparis_verildi: 0, yapildi: 0, fabrika_gitti: 0, odeme_bekliyor: 0 });
  
  const isBayi = user?.role === 'bayi';
  const isAdmin = user?.role === 'admin';
  const bayiIsim = user?.bayiIsim || '';

  // Filter states
  const [filters, setFilters] = useState({
    sira: '', teslim_durumu: '', tarih: '', bayi_adi: '', musteri_ad_soyad: '', tel_no: '',
    marka: '', kod: '', seri_no: '', sikayet: '', ozel_not: '', yapilan_islem: '', note_no: '', ucret: '', yapilma_tarihi: '',
  });

  const debouncedFilters = useDebounce(filters, 300);
  const hasActiveFilters = useMemo(() => Object.values(filters).some(v => v !== '') || activeStatusFilter !== '', [filters, activeStatusFilter]);

  const fetchStatusCounts = useCallback(async () => {
    try {
      const response = await api.get('/atolye/status-counts');
      setStatusCounts({
        total: parseInt(response.data.total) || 0, beklemede: parseInt(response.data.beklemede) || 0,
        teslim_edildi: parseInt(response.data.teslim_edildi) || 0, siparis_verildi: parseInt(response.data.siparis_verildi) || 0,
        yapildi: parseInt(response.data.yapildi) || 0, fabrika_gitti: parseInt(response.data.fabrika_gitti) || 0,
        odeme_bekliyor: parseInt(response.data.odeme_bekliyor) || 0
      });
    } catch (error) { console.error('Status counts alınamadı:', error); }
  }, []);

  useEffect(() => {
    fetchAtolyeList();
    fetchStatusCounts();

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
        // Bayi ise sadece kendi kayıtlarını görüntülenen listeye ekle
        if (isBayi) {
          if (atolye.bayi_adi === bayiIsim) {
            setAtolyeList((prev) => [atolye, ...prev]);
            showSnackbar('Yeni atölye kaydı eklendi!', 'info');
          }
        } else {
          setAtolyeList((prev) => [atolye, ...prev]);
          showSnackbar('Yeni atölye kaydı eklendi!', 'info');
        }
      }
    });

    // Atölye kaydı güncellendiğinde
    newSocket.on('atolye-guncellendi', (updatedAtolyeRecord: Atolye) => {
      if (updatedAtolyeRecord && updatedAtolyeRecord.id) {
        // Görüntülenen listede güncelle
        setAtolyeList((prev) =>
          prev.map((atolye) => (atolye.id === updatedAtolyeRecord.id ? updatedAtolyeRecord : atolye))
        );
        showSnackbar('Atölye kaydı güncellendi!', 'info');
      }
    });

    // Atölye kaydı silindiğinde
    newSocket.on('atolye-silindi', (deletedId: number) => {
      if (deletedId) {
        // Görüntülenen listeden sil
        setAtolyeList((prev) => prev.filter((atolye) => atolye.id !== deletedId));
        showSnackbar('Atölye kaydı silindi!', 'info');
      }
    });

    // Cleanup - component unmount olduğunda bağlantıyı kapat
    return () => {
      newSocket.disconnect();
    };
  }, [isBayi, bayiIsim]);

  const fetchAtolyeList = useCallback(async () => {
    setLoading(true);
    try {
      // Filtre aktifse tüm veriyi çek (client-side filtreleme için)
      // Filtre yoksa pagination ile çek
      if (hasActiveFilters) {
        const response = await api.get('/atolye?all=true');
        const allData = response.data;
        const sortedAllData = allData.sort((a: Atolye, b: Atolye) => b.id - a.id);
        if (isBayi) {
          setAtolyeList(sortedAllData.filter((item: Atolye) => item.bayi_adi === bayiIsim));
        } else {
          setAtolyeList(sortedAllData);
        }
        setTotalCount(allData.length);
      } else {
        const response = await api.get(`/atolye?page=${page + 1}&limit=${rowsPerPage}`);
        if (response.data.pagination) {
          const { data, pagination } = response.data;
          if (isBayi) {
            setAtolyeList(data.filter((item: Atolye) => item.bayi_adi === bayiIsim));
          } else {
            setAtolyeList(data);
          }
          setTotalCount(pagination.totalCount);
        } else {
          // Eski format için fallback
          const allData = response.data;
          const sortedAllData = allData.sort((a: Atolye, b: Atolye) => b.id - a.id);
          if (isBayi) {
            setAtolyeList(sortedAllData.filter((item: Atolye) => item.bayi_adi === bayiIsim));
          } else {
            setAtolyeList(sortedAllData);
          }
          setTotalCount(allData.length);
        }
      }
    } catch (error) {
      showSnackbar('Atölye kayıtları yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  }, [isBayi, bayiIsim, showSnackbar, hasActiveFilters, page, rowsPerPage]);

  // useMemo ile filtrelemeyi optimize et - debounced filters kullan
  const filteredList = useMemo(() => {
    let filtered = [...atolyeList];

    // Quick status filter (butonlar ile)
    if (activeStatusFilter) {
      filtered = filtered.filter((item) => item.teslim_durumu === activeStatusFilter);
    }

    // Filter by teslim_durumu (select dropdown - exact match)
    if (debouncedFilters.teslim_durumu) {
      filtered = filtered.filter((item) => item.teslim_durumu === debouncedFilters.teslim_durumu);
    }

    // Filter by tarih (kayit_tarihi or created_at) - Ana sayfa mantığıyla
    if (debouncedFilters.tarih) {
      filtered = filtered.filter((item) => {
        const dateValue = item.kayit_tarihi || item.created_at;
        if (!dateValue) return false;
        try {
          return new Date(dateValue).toLocaleDateString('tr-TR').includes(debouncedFilters.tarih);
        } catch (error) {
          return false;
        }
      });
    }

    // Filter by bayi_adi
    if (debouncedFilters.bayi_adi) {
      filtered = filtered.filter((item) =>
        item.bayi_adi?.toLowerCase().includes(debouncedFilters.bayi_adi.toLowerCase())
      );
    }

    // Filter by musteri_ad_soyad
    if (debouncedFilters.musteri_ad_soyad) {
      filtered = filtered.filter((item) =>
        item.musteri_ad_soyad?.toLocaleLowerCase('tr-TR').includes(debouncedFilters.musteri_ad_soyad.toLocaleLowerCase('tr-TR'))
      );
    }

    // Filter by tel_no
    if (debouncedFilters.tel_no) {
      filtered = filtered.filter((item) =>
        item.tel_no?.includes(debouncedFilters.tel_no.replace(/\D/g, ''))
      );
    }

    // Filter by marka
    if (debouncedFilters.marka) {
      filtered = filtered.filter((item) =>
        item.marka?.toLowerCase().includes(debouncedFilters.marka.toLowerCase())
      );
    }

    // Filter by kod
    if (debouncedFilters.kod) {
      filtered = filtered.filter((item) =>
        (item.kod || '').toLowerCase().includes(debouncedFilters.kod.toLowerCase())
      );
    }

    // Filter by seri_no
    if (debouncedFilters.seri_no) {
      filtered = filtered.filter((item) =>
        (item.seri_no || '').toLowerCase().includes(debouncedFilters.seri_no.toLowerCase())
      );
    }

    // Filter by sikayet
    if (debouncedFilters.sikayet) {
      filtered = filtered.filter((item) =>
        item.sikayet?.toLowerCase().includes(debouncedFilters.sikayet.toLowerCase())
      );
    }

    // Filter by ozel_not
    if (debouncedFilters.ozel_not) {
      filtered = filtered.filter((item) =>
        (item.ozel_not || '').toLowerCase().includes(debouncedFilters.ozel_not.toLowerCase())
      );
    }

    // Filter by yapilan_islem
    if (debouncedFilters.yapilan_islem) {
      filtered = filtered.filter((item) =>
        (item.yapilan_islem || '').toLowerCase().includes(debouncedFilters.yapilan_islem.toLowerCase())
      );
    }

    // Filter by note_no
    if (debouncedFilters.note_no) {
      filtered = filtered.filter((item) =>
        (item.note_no || '').toLowerCase().includes(debouncedFilters.note_no.toLowerCase())
      );
    }

    // Filter by ucret
    if (debouncedFilters.ucret) {
      filtered = filtered.filter((item) =>
        (item.ucret?.toString() || '').includes(debouncedFilters.ucret)
      );
    }

    // Filter by yapilma_tarihi - Ana sayfa mantığıyla
    if (debouncedFilters.yapilma_tarihi) {
      filtered = filtered.filter((item) => {
        if (!item.yapilma_tarihi) return false;
        try {
          return new Date(item.yapilma_tarihi).toLocaleDateString('tr-TR').includes(debouncedFilters.yapilma_tarihi);
        } catch (error) {
          return false;
        }
      });
    }

    // Filter by sira (ID bazlı - kalıcı sıra numarası)
    if (debouncedFilters.sira) {
      filtered = filtered.filter((item) => {
        // Sıra numarası olarak ID kullanılıyor
        return item.id.toString().includes(debouncedFilters.sira);
      });
    }

    return filtered;
  }, [atolyeList, debouncedFilters, activeStatusFilter]);

  // Pagination handlers
  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Refetch when page/rowsPerPage changes
  useEffect(() => {
    if (!hasActiveFilters) {
      fetchAtolyeList();
    }
  }, [page, rowsPerPage, hasActiveFilters, fetchAtolyeList]);

  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0); // Filtre değişince sayfa 0'a dön
  }, []);

  const handleAdd = useCallback(() => {
    setSelectedAtolyeId(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((id: number) => {
    setSelectedAtolyeId(id);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;

    try {
      await api.delete(`/atolye/${id}`);
      showSnackbar('Kayıt başarıyla silindi', 'success');
      fetchAtolyeList();
    } catch (error) {
      showSnackbar('Kayıt silinirken hata oluştu', 'error');
    }
  }, [showSnackbar, fetchAtolyeList]);

  const handleDialogClose = useCallback((refresh?: boolean) => {
    setDialogOpen(false);
    setSelectedAtolyeId(null);
    if (refresh) {
      fetchAtolyeList();
    }
  }, [fetchAtolyeList]);

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

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return ''; // Invalid date
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  const formatPhoneNumber = (phone: string | null | undefined) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
    }
    return phone;
  };

  // Her durum için kayıt sayısını hesapla
  const getStatusCount = (status: string) => {
    if (status === 'all') {
      return atolyeList.length;
    }
    return atolyeList.filter(item => item.teslim_durumu === status).length;
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
                    backgroundColor: activeStatusFilter === '' ? '#0a2566' : 'rgba(13, 50, 130, 0.1)',
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.3,
                  py: 0.5,
                }}
              >
                <span>Tümü</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>({getStatusCount('all')})</span>
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
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.3,
                  py: 0.5,
                }}
              >
                <span>Beklemede</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>({getStatusCount('beklemede')})</span>
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
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.3,
                  py: 0.5,
                }}
              >
                <span>Teslim Edildi</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>({getStatusCount('teslim_edildi')})</span>
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
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.3,
                  py: 0.5,
                }}
              >
                <span>Sipariş Verildi</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>({getStatusCount('siparis_verildi')})</span>
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
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.3,
                  py: 0.5,
                }}
              >
                <span>Yapıldı</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>({getStatusCount('yapildi')})</span>
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
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.3,
                  py: 0.5,
                }}
              >
                <span>Fabrika Gitti</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>({getStatusCount('fabrika_gitti')})</span>
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
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.3,
                  py: 0.5,
                }}
              >
                <span>Ödeme Bekliyor</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>({getStatusCount('odeme_bekliyor')})</span>
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

        {/* Mobil görünüm - Card layout */}
        {isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {filteredList.map((atolye) => {
              // Kalıcı sıra numarası olarak ID kullan
              const siraNo = atolye.id;

              return (
                <Card 
                  key={atolye.id} 
                  elevation={2}
                  onDoubleClick={() => !isBayi && handleEdit(atolye.id)}
                  sx={{ cursor: !isBayi ? 'pointer' : 'default' }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip 
                        label={`Sıra: ${siraNo}`} 
                        size="small" 
                        color="primary"
                        sx={{ fontWeight: 700, fontSize: '0.875rem' }}
                      />
                      <Chip 
                        label={
                          atolye.teslim_durumu === 'beklemede' ? 'Beklemede' :
                          atolye.teslim_durumu === 'teslim_edildi' ? 'Teslim Edildi' :
                          atolye.teslim_durumu === 'siparis_verildi' ? 'Sipariş Verildi' :
                          atolye.teslim_durumu === 'yapildi' ? 'Yapıldı' :
                          atolye.teslim_durumu === 'fabrika_gitti' ? 'Fabrika Gitti' :
                          atolye.teslim_durumu === 'odeme_bekliyor' ? 'Ödeme Bekliyor' : '-'
                        }
                        size="small"
                        color={
                          atolye.teslim_durumu === 'beklemede' ? 'warning' :
                          atolye.teslim_durumu === 'teslim_edildi' ? 'info' :
                          atolye.teslim_durumu === 'siparis_verildi' ? 'secondary' :
                          atolye.teslim_durumu === 'yapildi' ? 'success' :
                          atolye.teslim_durumu === 'fabrika_gitti' ? 'default' :
                          atolye.teslim_durumu === 'odeme_bekliyor' ? 'error' : 'default'
                        }
                      />
                    </Box>
                    
                    <Grid container spacing={0.5} sx={{ fontSize: '0.75rem' }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Tarih:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {formatDate(atolye.kayit_tarihi || atolye.created_at) || '-'}
                        </Typography>
                      </Grid>
                      {!isBayi && atolye.bayi_adi && (
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Bayi:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.bayi_adi}</Typography>
                        </Grid>
                      )}
                      {atolye.musteri_ad_soyad && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">Müşteri:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                            {atolye.musteri_ad_soyad}
                          </Typography>
                        </Grid>
                      )}
                      {atolye.tel_no && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">Tel:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{atolye.tel_no}</Typography>
                        </Grid>
                      )}
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Marka:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.marka || '-'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Model:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.kod || '-'}</Typography>
                      </Grid>
                      {atolye.seri_no && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">Seri No:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.seri_no}</Typography>
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Şikayet:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.sikayet || '-'}</Typography>
                      </Grid>
                      {atolye.ozel_not && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">Özel Not:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.ozel_not}</Typography>
                        </Grid>
                      )}
                      {atolye.yapilan_islem && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">Yapılan İşlem:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.yapilan_islem}</Typography>
                        </Grid>
                      )}
                      {atolye.ucret && (
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Ücret:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{atolye.ucret} ₺</Typography>
                        </Grid>
                      )}
                      {atolye.yapilma_tarihi && (
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Yapılma Tarihi:</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                            {formatDate(atolye.yapilma_tarihi) || '-'}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                  
                  <Divider />
                  
                  <CardActions sx={{ justifyContent: 'flex-end', py: 0.5 }}>
                    {!isBayi && (
                      <Tooltip title="Düzenle">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEdit(atolye.id)}
                          sx={{ bgcolor: 'primary.light' }}
                        >
                          <Edit sx={{ fontSize: '1rem', color: 'white' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {isAdmin && (
                      <Tooltip title="Sil">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(atolye.id)}
                          sx={{ bgcolor: 'error.light' }}
                        >
                          <Delete sx={{ fontSize: '1rem', color: 'white' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        ) : (
          /* Masaüstü görünüm - Table layout */
          <>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
            <Table size="small" stickyHeader sx={{ 
              '& .MuiTableCell-root': { 
                borderRight: '1px solid rgba(0, 0, 0, 1)',
                borderBottom: '1px solid rgba(0, 0, 0, 1)'
              }
            }}>
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
                    select
                    size="small"
                    placeholder="Durum..."
                    value={filters.teslim_durumu}
                    onChange={(e) => handleFilterChange('teslim_durumu', e.target.value)}
                    sx={{ 
                      width: '100%', 
                      backgroundColor: 'white',
                      '& .MuiInputBase-input': { padding: '3px 6px', fontSize: '0.75rem' }
                    }}
                  >
                    <MenuItem value="">Tümü</MenuItem>
                    <MenuItem value="beklemede">Beklemede</MenuItem>
                    <MenuItem value="siparis_verildi">Sipariş Verildi</MenuItem>
                    <MenuItem value="yapildi">Yapıldı</MenuItem>
                    <MenuItem value="fabrika_gitti">Fabrika Gitti</MenuItem>
                    <MenuItem value="odeme_bekliyor">Ödeme Bekliyor</MenuItem>
                    <MenuItem value="teslim_edildi">Teslim Edildi</MenuItem>
                  </TextField>
                </TableCell>
                <TableCell sx={{ width: '85px', padding: '3px', position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}>
                  <TextField
                    size="small"
                    placeholder="GG.AA.YYYY"
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
                <TableCell sx={{ width: '80px', padding: '3px', position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}>
                  <TextField
                    size="small"
                    placeholder="Note..."
                    value={filters.note_no}
                    onChange={(e) => handleFilterChange('note_no', e.target.value)}
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
                    placeholder="GG.AA.YYYY"
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
                <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.875rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9, textAlign: 'center' }}>Sıra</TableCell>
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
                <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>Note No</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>Ücret</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>Yapılma Tarihi</TableCell>
                {!isBayi && <TableCell sx={{ color: 'white', fontWeight: 'bold', padding: '6px', fontSize: '0.75rem', position: 'sticky', top: 30, backgroundColor: '#0D3282', zIndex: 9 }}>İşlemler</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredList.map((atolye) => {
                // Kalıcı sıra numarası olarak ID kullan - silme işlemlerinde kayma olmaz
                const siraNo = atolye.id;
                
                return (
                <TableRow 
                  key={atolye.id} 
                  hover
                  onDoubleClick={() => !isBayi && handleEdit(atolye.id)}
                  sx={{ 
                    backgroundColor: getRowBackgroundColor(atolye.teslim_durumu),
                    cursor: !isBayi ? 'pointer' : 'default',
                    '&:hover': {
                      backgroundColor: getRowBackgroundColor(atolye.teslim_durumu),
                      filter: 'brightness(0.95)',
                    }
                  }}
                >
                  <TableCell sx={{ padding: '3px', fontSize: '1rem', fontWeight: 'bold', textAlign: 'center' }}>{siraNo}</TableCell>
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
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{formatDate(atolye.kayit_tarihi || atolye.created_at)}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.bayi_adi}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.musteri_ad_soyad}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{formatPhoneNumber(atolye.tel_no)}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.marka}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.kod || '-'}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.seri_no || '-'}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                    <Tooltip title={atolye.sikayet} placement="top" arrow>
                      <span>{atolye.sikayet}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                    <Tooltip title={atolye.ozel_not || '-'} placement="top" arrow>
                      <span>{atolye.ozel_not || '-'}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                    <Tooltip title={atolye.yapilan_islem || '-'} placement="top" arrow>
                      <span>{atolye.yapilan_islem || '-'}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                    <Tooltip title={atolye.note_no || '-'} placement="top" arrow>
                      <span>{atolye.note_no || '-'}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{atolye.ucret ? `${atolye.ucret} ₺` : '-'}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{atolye.yapilma_tarihi ? formatDate(atolye.yapilma_tarihi) : '-'}</TableCell>
                  {!isBayi && (
                    <TableCell sx={{ padding: '3px' }}>
                      <IconButton size="small" onClick={() => handleEdit(atolye.id)} sx={{ mr: 0.5, padding: '3px' }}>
                        <Edit fontSize="small" sx={{ fontSize: '1rem' }} />
                      </IconButton>
                      {isAdmin && (
                        <IconButton size="small" onClick={() => handleDelete(atolye.id)} color="error" sx={{ padding: '3px' }}>
                          <Delete fontSize="small" sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
                );
              })}
              {filteredList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isBayi ? 14 : 15} align="center" sx={{ py: 3 }}>
                    {loading ? <CircularProgress size={24} /> : (atolyeList.length === 0 ? 'Henüz kayıt bulunmamaktadır' : 'Filtreye uygun kayıt bulunamadı')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={hasActiveFilters ? filteredList.length : totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[25, 50, 100, 200]}
          labelRowsPerPage="Sayfa başına:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          sx={{ borderTop: '1px solid #e0e0e0' }}
        />
        </>
        )}
      </Paper>

      <AtolyeDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        atolyeId={selectedAtolyeId}
      />
    </Box>
  );
};

export default memo(AtolyeTakip);
