import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Box,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  useMediaQuery,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Edit,
  Delete,
  CheckCircle,
  Check,
  Print,
  DragIndicator,
  History,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Islem } from '../types';
import PrintEditor from './PrintEditor';
import { islemService } from '../services/api';

// Telefon numarasını formatla: 0544 448 88 88
const formatPhoneNumber = (phone: string | undefined): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
};

interface IslemTableProps {
  islemler: Islem[];
  allIslemler?: Islem[]; // Tüm kayıtlar (global sıra hesabı için)
  loading: boolean;
  onEdit: (islem: Islem) => void;
  onDelete: (id: number) => void;
  onToggleDurum: (islem: Islem) => void;
  isAdminMode?: boolean; // Admin için tamamlanan işlemleri de düzenleme izni
}

interface ColumnConfig {
  id: string;
  label: string;
  render: (islem: Islem) => React.ReactNode;
}

const IslemTable: React.FC<IslemTableProps> = ({
  islemler,
  allIslemler,
  loading,
  onEdit,
  onDelete,
  onToggleDurum,
  isAdminMode = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Global sıra hesabı için kullanılacak liste
  const siraReferenceList = allIslemler || islemler;
  const [filteredIslemler, setFilteredIslemler] = useState<Islem[]>(islemler);
  const [printEditorOpen, setPrintEditorOpen] = useState(false);
  const [selectedIslemForPrint, setSelectedIslemForPrint] = useState<Islem | null>(null);
  
  // Müşteri Geçmişi Dialog states
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<Islem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  
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
    cep_tel: '',
    yedek_tel: '',
    urun: '',
    marka: '',
    sikayet: '',
    yapilan_islem: '',
    teknisyen: '',
    tutar: '',
    durum: '',
  });

  // Apply filters whenever islemler or filters change
  useEffect(() => {
    applyFilters();
  }, [islemler, filters]);

  const applyFilters = () => {
    let filtered = [...islemler];

    // Sıra filtresi varsa, önce GLOBAL listedeki pozisyonları işaretle (tersine çevrilmiş)
    const originalIndices = new Map<number, number>();
    if (filters.sira) {
      siraReferenceList.forEach((item, index) => {
        originalIndices.set(item.id, siraReferenceList.length - index);
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

    // Filter by cep_tel
    if (filters.cep_tel) {
      filtered = filtered.filter((item) =>
        (item.cep_tel || '').includes(filters.cep_tel.replace(/\D/g, ''))
      );
    }

    // Filter by yedek_tel
    if (filters.yedek_tel) {
      filtered = filtered.filter((item) =>
        (item.yedek_tel || '').includes(filters.yedek_tel.replace(/\D/g, ''))
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
        const label = item.is_durumu === 'tamamlandi' ? 'tamamlandı' : 'açık';
        return label.includes(durumText);
      });
    }

    // Filter by sira - GLOBAL sıraya göre filtrele (tüm kayıtlar bazında)
    if (filters.sira) {
      filtered = filtered.filter((item) => {
        const globalSira = originalIndices.get(item.id);
        return globalSira?.toString().includes(filters.sira);
      });
    }

    setFilteredIslemler(filtered);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrintClick = (islem: Islem) => {
    setSelectedIslemForPrint(islem);
    setPrintEditorOpen(true);
  };

  const handlePrintClose = () => {
    setPrintEditorOpen(false);
    setSelectedIslemForPrint(null);
  };

  const handleClosePrintEditor = () => {
    setPrintEditorOpen(false);
    setSelectedIslemForPrint(null);
  };

  // Müşteri Geçmişi fonksiyonları
  const handleOpenCustomerHistory = async (customerName: string) => {
    if (!customerName || customerName.trim() === '') {
      return;
    }

    setSelectedCustomerName(customerName);
    setHistoryDialogOpen(true);
    setHistoryLoading(true);

    try {
      const allIslemler = await islemService.getAll();
      // Müşteri adına göre filtrele ve tarihe göre sırala (en eski en üstte)
      const customerIslemler = allIslemler
        .filter(i => i.ad_soyad && i.ad_soyad.toLowerCase().includes(customerName.toLowerCase()))
        .sort((a, b) => {
          const dateA = a.full_tarih ? new Date(a.full_tarih).getTime() : 0;
          const dateB = b.full_tarih ? new Date(b.full_tarih).getTime() : 0;
          return dateA - dateB; // ASC - en eski en üstte, en yeni en altta
        });
      
      setCustomerHistory(customerIslemler);
    } catch (error) {
      console.error('Müşteri geçmişi yüklenirken hata:', error);
      setCustomerHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseHistoryDialog = () => {
    setHistoryDialogOpen(false);
    setCustomerHistory([]);
    setSelectedCustomerName('');
  };

  // Sütun sırasını localStorage'dan yükle
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('islemTableColumnOrder');
    const defaultOrder = [
      'tarih', 'ad_soyad', 'ilce', 'mahalle', 'cadde', 'sokak', 'kapi_no',
      'cep_tel', 'yedek_tel', 'urun', 'marka', 'sikayet', 'yapilan_islem', 'teknisyen', 'tutar', 'durum'
    ];
    
    if (saved) {
      const parsedOrder = JSON.parse(saved);
      // Eğer kaydedilen sütun sayısı varsayılan sütun sayısından farklıysa, varsayılanı kullan
      if (parsedOrder.length !== defaultOrder.length) {
        localStorage.removeItem('islemTableColumnOrder');
        return defaultOrder;
      }
      return parsedOrder;
    }
    return defaultOrder;
  });

  // Sütun konfigürasyonu
  const columnConfigs: Record<string, ColumnConfig> = {
    tarih: {
      id: 'tarih',
      label: 'Tarih',
      render: (islem) => (
        <TableCell sx={{ fontWeight: 500, fontSize: '0.7rem', py: 0.2, px: 0.4 }}>
          {islem.full_tarih ? new Date(islem.full_tarih).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }) : '-'}
        </TableCell>
      ),
    },
    ad_soyad: {
      id: 'ad_soyad',
      label: 'Ad Soyad',
      render: (islem) => <TableCell sx={{ fontWeight: 500, fontSize: '0.7rem', py: 0.2, px: 0.4 }}>{islem.ad_soyad || '-'}</TableCell>,
    },
    ilce: {
      id: 'ilce',
      label: 'İlçe',
      render: (islem) => <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.4 }}>{islem.ilce || '-'}</TableCell>,
    },
    mahalle: {
      id: 'mahalle',
      label: 'Mahalle',
      render: (islem) => <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.4 }}>{islem.mahalle || '-'}</TableCell>,
    },
    cadde: {
      id: 'cadde',
      label: 'Cadde',
      render: (islem) => <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.4 }}>{islem.cadde || '-'}</TableCell>,
    },
    sokak: {
      id: 'sokak',
      label: 'Sokak',
      render: (islem) => <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.4 }}>{islem.sokak || '-'}</TableCell>,
    },
    kapi_no: {
      id: 'kapi_no',
      label: 'Kapı No',
      render: (islem) => <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.4 }}>{islem.kapi_no || '-'}</TableCell>,
    },
    cep_tel: {
      id: 'cep_tel',
      label: 'Cep Tel',
      render: (islem) => <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.4 }}>{islem.cep_tel ? formatPhoneNumber(islem.cep_tel) : '-'}</TableCell>,
    },
    yedek_tel: {
      id: 'yedek_tel',
      label: 'Yedek Tel',
      render: (islem) => <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.4 }}>{islem.yedek_tel ? formatPhoneNumber(islem.yedek_tel) : '-'}</TableCell>,
    },
    urun: {
      id: 'urun',
      label: 'Ürün',
      render: (islem) => <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.4 }}>{islem.urun || '-'}</TableCell>,
    },
    marka: {
      id: 'marka',
      label: 'Marka',
      render: (islem) => <TableCell sx={{ fontWeight: 500, fontSize: '0.7rem', py: 0.2, px: 0.4 }}>{islem.marka || '-'}</TableCell>,
    },
    sikayet: {
      id: 'sikayet',
      label: 'Şikayet',
      render: (islem) => (
        <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.7rem', py: 0.2, px: 0.4 }}>
          <Tooltip title={islem.sikayet || '-'}>
            <span>{islem.sikayet || '-'}</span>
          </Tooltip>
        </TableCell>
      ),
    },
    yapilan_islem: {
      id: 'yapilan_islem',
      label: 'Yapılan İşlem',
      render: (islem) => (
        <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.7rem', py: 0.2, px: 0.4 }}>
          <Tooltip title={islem.yapilan_islem || '-'}>
            <span>{islem.yapilan_islem || '-'}</span>
          </Tooltip>
        </TableCell>
      ),
    },
    teknisyen: {
      id: 'teknisyen',
      label: 'Teknisyen',
      render: (islem) => <TableCell sx={{ fontSize: '0.7rem', py: 0.2, px: 0.4 }}>{islem.teknisyen_ismi || '-'}</TableCell>,
    },
    tutar: {
      id: 'tutar',
      label: 'Tutar',
      render: (islem) => (
        <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.2, px: 0.4 }}>
          {islem.tutar ? `${Number(islem.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺` : '-'}
        </TableCell>
      ),
    },
    durum: {
      id: 'durum',
      label: 'Durum',
      render: (islem) => (
        <TableCell sx={{ py: 0.5, px: 1 }}>
          {islem.is_durumu === 'acik' ? (
            <Chip
              label="Açık"
              color="warning"
              size="small"
              sx={{ fontWeight: 600, fontSize: '0.7rem', height: '22px' }}
            />
          ) : (
            <Chip
              icon={<CheckCircle sx={{ fontSize: '0.8rem' }} />}
              label="Tamamlandı"
              color="success"
              size="small"
              sx={{ fontWeight: 600, fontSize: '0.7rem', height: '22px' }}
            />
          )}
        </TableCell>
      ),
    },
  };

  // Sütun sırasını kaydet
  useEffect(() => {
    localStorage.setItem('islemTableColumnOrder', JSON.stringify(columnOrder));
  }, [columnOrder]);

  // Sütun sürükle-bırak işlemi
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(columnOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setColumnOrder(items);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  // Mobil görünüm - Card layout
  if (isMobile) {
    return (
      <>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredIslemler.map((islem) => {
            const originalIndex = siraReferenceList.findIndex(item => item.id === islem.id);
            const siraNo = siraReferenceList.length - originalIndex;

            return (
              <Card key={islem.id} elevation={2}>
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Chip 
                      label={`Sıra: ${siraNo}`} 
                      size="small" 
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip 
                      label={islem.is_durumu === 'acik' ? 'Açık' : 'Tamamlandı'}
                      size="small"
                      color={islem.is_durumu === 'acik' ? 'warning' : 'success'}
                    />
                  </Box>
                  
                  <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {islem.ad_soyad}
                  </Typography>
                  
                  <Grid container spacing={0.5} sx={{ fontSize: '0.75rem' }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Tarih:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {islem.full_tarih ? new Date(islem.full_tarih).toLocaleDateString('tr-TR') : '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">İlçe:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{islem.ilce || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Adres:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {[islem.mahalle, islem.cadde, islem.sokak, islem.kapi_no].filter(Boolean).join(', ') || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Cep Tel:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {formatPhoneNumber(islem.cep_tel)}
                      </Typography>
                    </Grid>
                    {islem.yedek_tel && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Yedek Tel:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {formatPhoneNumber(islem.yedek_tel)}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Ürün:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{islem.urun || '-'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Marka:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{islem.marka || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Şikayet:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{islem.sikayet || '-'}</Typography>
                    </Grid>
                    {islem.yapilan_islem && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Yapılan İşlem:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{islem.yapilan_islem}</Typography>
                      </Grid>
                    )}
                    {islem.teknisyen_ismi && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Teknisyen:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{islem.teknisyen_ismi}</Typography>
                      </Grid>
                    )}
                    {islem.tutar && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Tutar:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{islem.tutar} ₺</Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ justifyContent: 'space-around', py: 0.5 }}>
                  <Tooltip title={islem.is_durumu === 'acik' ? 'Tamamla' : (isAdminMode ? 'Durumu Değiştir (Admin)' : 'Tamamlandı')}>
                    <span>
                      <IconButton 
                        size="small" 
                        onClick={() => onToggleDurum(islem)}
                        disabled={!isAdminMode && islem.is_durumu === 'tamamlandi'}
                        sx={{ 
                          bgcolor: (islem.is_durumu === 'acik' || isAdminMode) ? 'success.light' : 'grey.300',
                        }}
                      >
                        <CheckCircle sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Düzenle">
                    <span>
                      <IconButton 
                        size="small" 
                        onClick={() => onEdit(islem)}
                        disabled={!isAdminMode && islem.is_durumu === 'tamamlandi'}
                        sx={{ bgcolor: 'primary.light' }}
                      >
                        <Edit sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Müşteri Geçmişi">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenCustomerHistory(islem.ad_soyad || '')}
                      disabled={!islem.ad_soyad}
                      sx={{ bgcolor: 'secondary.light' }}
                    >
                      <History sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Yazdır">
                    <IconButton 
                      size="small" 
                      onClick={() => handlePrintClick(islem)}
                      sx={{ bgcolor: 'info.light' }}
                    >
                      <Print sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sil">
                    <IconButton 
                      size="small" 
                      onClick={() => onDelete(islem.id)}
                      sx={{ bgcolor: 'error.light' }}
                    >
                      <Delete sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            );
          })}
        </Box>

        {/* Müşteri Geçmişi Dialog - Mobil için */}
        <Dialog 
          open={historyDialogOpen} 
          onClose={handleCloseHistoryDialog}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            Müşteri Geçmişi: {selectedCustomerName}
          </DialogTitle>
          <DialogContent>
            {historyLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : customerHistory.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                Bu müşteri için kayıt bulunamadı.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {customerHistory.map((record) => (
                  <Card key={record.id} variant="outlined">
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="primary">
                        {record.full_tarih ? new Date(record.full_tarih).toLocaleDateString('tr-TR') : '-'}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                        <strong>Ürün:</strong> {record.urun} - {record.marka}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        <strong>Şikayet:</strong> {record.sikayet}
                      </Typography>
                      {record.yapilan_islem && (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          <strong>Yapılan İşlem:</strong> {record.yapilan_islem}
                        </Typography>
                      )}
                      <Chip 
                        label={record.is_durumu === 'acik' ? 'Açık' : 'Tamamlandı'}
                        size="small"
                        color={record.is_durumu === 'acik' ? 'warning' : 'success'}
                        sx={{ mt: 0.5 }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Print Editor Dialog */}
        {selectedIslemForPrint && (
          <PrintEditor
            open={printEditorOpen}
            onClose={handlePrintClose}
            islem={selectedIslemForPrint}
          />
        )}
      </>
    );
  }

  // Masaüstü görünüm - Table layout
  return (
    <>
    <TableContainer component={Paper} elevation={3}>
      <Table size="small" sx={{ '& .MuiTableCell-root': { py: 0.3, px: 0.5, fontSize: '0.75rem' } }}>
        <TableHead>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="columns" direction="horizontal">
              {(provided) => (
                <TableRow 
                  sx={{ bgcolor: 'primary.main' }}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {/* Sıra No başlığı (draggable değil) */}
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.68rem', py: 0.15, px: 0.3 }}>
                    Sıra
                  </TableCell>
                  {columnOrder.map((columnId, index) => {
                    const column = columnConfigs[columnId];
                    return (
                      <Draggable key={columnId} draggableId={columnId} index={index}>
                        {(provided, snapshot) => (
                          <TableCell
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.68rem',
                              cursor: 'move',
                              userSelect: 'none',
                              bgcolor: snapshot.isDragging ? 'primary.dark' : 'primary.main',
                              py: 0.15,
                              px: 0.3,
                              '&:hover': {
                                bgcolor: 'primary.dark',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                              <DragIndicator sx={{ fontSize: '0.8rem', opacity: 0.7 }} />
                              {column.label}
                            </Box>
                          </TableCell>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.68rem', py: 0.15, px: 0.3 }}>İşlemler</TableCell>
                </TableRow>
              )}
            </Droppable>
          </DragDropContext>
          {/* Filter Row */}
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell sx={{ py: 0.3, px: 0.3 }}>
              <TextField
                size="small"
                placeholder="Sıra..."
                value={filters.sira}
                onChange={(e) => handleFilterChange('sira', e.target.value)}
                sx={{
                  '& .MuiInputBase-input': { fontSize: '0.68rem', py: 0.3, px: 0.3 },
                  width: '50px'
                }}
              />
            </TableCell>
            {columnOrder.map((columnId) => (
              <TableCell key={columnId} sx={{ py: 0.3, px: 0.3 }}>
                <TextField
                  size="small"
                  placeholder={`${columnConfigs[columnId].label}...`}
                  value={filters[columnId as keyof typeof filters] || ''}
                  onChange={(e) => handleFilterChange(columnId, e.target.value)}
                  sx={{
                    '& .MuiInputBase-input': { fontSize: '0.68rem', py: 0.3, px: 0.3 },
                    minWidth: columnId === 'tarih' ? '90px' : 
                             columnId === 'cep_tel' ? '100px' : 
                             columnId === 'yedek_tel' ? '100px' : 
                             columnId === 'tutar' ? '70px' :
                             columnId === 'durum' ? '90px' : '100px'
                  }}
                />
              </TableCell>
            ))}
            <TableCell sx={{ py: 0.3, px: 0.3 }}></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredIslemler.map((islem) => {
            // Global sıra hesabı - tüm kayıtlara göre (bayi/admin fark etmeksizin)
            const originalIndex = siraReferenceList.findIndex(item => item.id === islem.id);
            const originalSira = siraReferenceList.length - originalIndex;
            
            return (
            <TableRow 
              key={islem.id} 
              hover
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(13, 50, 130, 0.04)',
                }
              }}
            >
              {/* Sıra No - GLOBAL SIRA (TÜM KAYITLARA GÖRE) */}
              <TableCell sx={{ fontWeight: 500, fontSize: '0.68rem', py: 0.15, px: 0.3 }}>
                {originalSira}
              </TableCell>
              {columnOrder.map((columnId) => {
                const column = columnConfigs[columnId];
                return <React.Fragment key={columnId}>{column.render(islem)}</React.Fragment>;
              })}
              <TableCell sx={{ py: 0.2, px: 0.4 }}>
                <Box sx={{ display: 'flex', gap: 0.2 }}>
                  <Tooltip title={islem.is_durumu === 'acik' ? 'Tamamla' : (isAdminMode ? 'Tamamlandı' : 'Tamamlandı - Durum değiştirilemez')}>
                    <span>
                      <IconButton 
                        size="small" 
                        onClick={() => onToggleDurum(islem)}
                        disabled={!isAdminMode && islem.is_durumu === 'tamamlandi'}
                        sx={{ 
                          bgcolor: islem.is_durumu === 'acik' ? 'warning.light' : (isAdminMode ? 'success.light' : 'grey.300'),
                          width: 24,
                          height: 24,
                          '&:hover': {
                            bgcolor: islem.is_durumu === 'acik' ? 'warning.main' : (isAdminMode ? 'success.main' : 'grey.300'),
                          },
                          '&.Mui-disabled': {
                            bgcolor: 'grey.300',
                            opacity: 0.6,
                          }
                        }}
                      >
                        <Check sx={{ color: islem.is_durumu === 'acik' ? 'white' : (isAdminMode ? 'white' : 'grey.500'), fontSize: '0.85rem' }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={islem.is_durumu === 'acik' ? 'Düzenle' : (isAdminMode ? 'Düzenle (Admin)' : 'Tamamlanan işlem düzenlenemez')}>
                    <span>
                      <IconButton 
                        size="small" 
                        onClick={() => onEdit(islem)}
                        disabled={!isAdminMode && islem.is_durumu === 'tamamlandi'}
                        sx={{ 
                          bgcolor: (islem.is_durumu === 'acik' || isAdminMode) ? 'primary.light' : 'grey.300',
                          width: 24,
                          height: 24,
                          '&:hover': {
                            bgcolor: (islem.is_durumu === 'acik' || isAdminMode) ? 'primary.main' : 'grey.300',
                          },
                          '&.Mui-disabled': {
                            bgcolor: 'grey.300',
                            opacity: 0.6,
                          }
                        }}
                      >
                        <Edit sx={{ color: (islem.is_durumu === 'acik' || isAdminMode) ? 'white' : 'grey.500', fontSize: '0.85rem' }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Müşteri Geçmişi">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenCustomerHistory(islem.ad_soyad || '')}
                      disabled={!islem.ad_soyad}
                      sx={{ 
                        bgcolor: 'secondary.light',
                        width: 24,
                        height: 24,
                        '&:hover': {
                          bgcolor: 'secondary.main',
                        },
                        '&.Mui-disabled': {
                          bgcolor: 'grey.300',
                          opacity: 0.6,
                        }
                      }}
                    >
                      <History sx={{ color: 'white', fontSize: '0.85rem' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Yazdır">
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        setSelectedIslemForPrint(islem);
                        setPrintEditorOpen(true);
                      }}
                      sx={{ 
                        bgcolor: 'info.light',
                        width: 24,
                        height: 24,
                        '&:hover': {
                          bgcolor: 'info.main',
                        }
                      }}
                    >
                      <Print sx={{ color: 'white', fontSize: '0.85rem' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sil">
                    <IconButton 
                      size="small" 
                      onClick={() => onDelete(islem.id)}
                      sx={{ 
                        bgcolor: 'error.light',
                        width: 24,
                        height: 24,
                        '&:hover': {
                          bgcolor: 'error.main',
                        }
                      }}
                    >
                      <Delete sx={{ color: 'white', fontSize: '0.85rem' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>

    {/* Müşteri Geçmişi Dialog */}
    <Dialog 
      open={historyDialogOpen} 
      onClose={handleCloseHistoryDialog}
      maxWidth="xl"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Müşteri Geçmişi: {selectedCustomerName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Toplam {customerHistory.length} kayıt
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {historyLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : customerHistory.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            Bu müşteri için kayıt bulunamadı.
          </Typography>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small" sx={{ '& .MuiTableCell-root': { py: 0.5, px: 1, fontSize: '0.75rem' } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Sıra</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Tarih</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>İlçe</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Mahalle</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Cadde</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Sokak</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Kapı No</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Cep Tel</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Ürün</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Marka</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Şikayet</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Yapılan İşlem</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Teknisyen</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Tutar</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Durum</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customerHistory.map((islem, index) => (
                  <TableRow key={islem.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {islem.full_tarih ? new Date(islem.full_tarih).toLocaleDateString('tr-TR') : '-'}
                    </TableCell>
                    <TableCell>{islem.ilce || '-'}</TableCell>
                    <TableCell>{islem.mahalle || '-'}</TableCell>
                    <TableCell>{islem.cadde || '-'}</TableCell>
                    <TableCell>{islem.sokak || '-'}</TableCell>
                    <TableCell>{islem.kapi_no || '-'}</TableCell>
                    <TableCell>{formatPhoneNumber(islem.cep_tel)}</TableCell>
                    <TableCell>{islem.urun || '-'}</TableCell>
                    <TableCell>{islem.marka || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {islem.sikayet || '-'}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {islem.yapilan_islem || '-'}
                    </TableCell>
                    <TableCell>{islem.teknisyen_ismi || '-'}</TableCell>
                    <TableCell>
                      {islem.tutar ? `${Number(islem.tutar).toLocaleString('tr-TR')} ₺` : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={islem.is_durumu === 'acik' ? 'Açık' : 'Tamamlandı'}
                        color={islem.is_durumu === 'acik' ? 'warning' : 'success'}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: '20px' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>

    {/* Yazdırma Düzenleyici */}
    {selectedIslemForPrint && (
      <PrintEditor
        open={printEditorOpen}
        onClose={handleClosePrintEditor}
        islem={selectedIslemForPrint}
      />
    )}
    </>
  );
};

export default IslemTable;
