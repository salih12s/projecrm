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
} from '@mui/material';
import {
  Edit,
  Delete,
  CheckCircle,
  Check,
  Print,
  DragIndicator,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Islem } from '../types';
import { printIslem } from '../utils/print.ts';

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
  loading: boolean;
  onEdit: (islem: Islem) => void;
  onDelete: (id: number) => void;
  onToggleDurum: (islem: Islem) => void;
}

interface ColumnConfig {
  id: string;
  label: string;
  render: (islem: Islem) => React.ReactNode;
}

const IslemTable: React.FC<IslemTableProps> = ({
  islemler,
  loading,
  onEdit,
  onDelete,
  onToggleDurum,
}) => {
  const [filteredIslemler, setFilteredIslemler] = useState<Islem[]>(islemler);
  
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

    // Sıra filtresi varsa, önce orijinal listedeki pozisyonları işaretle
    const originalIndices = new Map<number, number>();
    if (filters.sira) {
      islemler.forEach((item, index) => {
        originalIndices.set(item.id, index + 1);
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

    // Filter by sira - ORİJİNAL listedeki sıraya göre filtrele
    if (filters.sira) {
      filtered = filtered.filter((item) => {
        const originalSira = originalIndices.get(item.id);
        return originalSira?.toString() === filters.sira;
      });
    }

    setFilteredIslemler(filtered);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrint = (islem: Islem) => {
    printIslem(islem);
  };

  // Sütun sırasını localStorage'dan yükle
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('islemTableColumnOrder');
    const defaultOrder = [
      'tarih', 'ad_soyad', 'ilce', 'mahalle', 'cadde', 'sokak', 'kapi_no',
      'cep_tel', 'urun', 'marka', 'sikayet', 'yapilan_islem', 'teknisyen', 'tutar', 'durum'
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
        <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem', py: 0.5, px: 1 }}>
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
      render: (islem) => <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem', py: 0.5, px: 1 }}>{islem.ad_soyad}</TableCell>,
    },
    ilce: {
      id: 'ilce',
      label: 'İlçe',
      render: (islem) => <TableCell sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>{islem.ilce}</TableCell>,
    },
    mahalle: {
      id: 'mahalle',
      label: 'Mahalle',
      render: (islem) => <TableCell sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>{islem.mahalle}</TableCell>,
    },
    cadde: {
      id: 'cadde',
      label: 'Cadde',
      render: (islem) => <TableCell sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>{islem.cadde}</TableCell>,
    },
    sokak: {
      id: 'sokak',
      label: 'Sokak',
      render: (islem) => <TableCell sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>{islem.sokak}</TableCell>,
    },
    kapi_no: {
      id: 'kapi_no',
      label: 'Kapı No',
      render: (islem) => <TableCell sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>{islem.kapi_no}</TableCell>,
    },
    cep_tel: {
      id: 'cep_tel',
      label: 'Cep Tel',
      render: (islem) => <TableCell sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>{formatPhoneNumber(islem.cep_tel)}</TableCell>,
    },
    urun: {
      id: 'urun',
      label: 'Ürün',
      render: (islem) => <TableCell sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>{islem.urun}</TableCell>,
    },
    marka: {
      id: 'marka',
      label: 'Marka',
      render: (islem) => <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem', py: 0.5, px: 1 }}>{islem.marka}</TableCell>,
    },
    sikayet: {
      id: 'sikayet',
      label: 'Şikayet',
      render: (islem) => (
        <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', py: 0.5, px: 1 }}>
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
        <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', py: 0.5, px: 1 }}>
          <Tooltip title={islem.yapilan_islem || '-'}>
            <span>{islem.yapilan_islem || '-'}</span>
          </Tooltip>
        </TableCell>
      ),
    },
    teknisyen: {
      id: 'teknisyen',
      label: 'Teknisyen',
      render: (islem) => <TableCell sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>{islem.teknisyen_ismi || '-'}</TableCell>,
    },
    tutar: {
      id: 'tutar',
      label: 'Tutar',
      render: (islem) => (
        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 0.5, px: 1 }}>
          {islem.tutar ? `${Number(islem.tutar).toFixed(2)} TL` : '-'}
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

  return (
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
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.75rem', py: 0.3, px: 0.5 }}>
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
                              fontSize: '0.75rem',
                              cursor: 'move',
                              userSelect: 'none',
                              bgcolor: snapshot.isDragging ? 'primary.dark' : 'primary.main',
                              py: 0.3,
                              px: 0.5,
                              '&:hover': {
                                bgcolor: 'primary.dark',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                              <DragIndicator sx={{ fontSize: '0.9rem', opacity: 0.7 }} />
                              {column.label}
                            </Box>
                          </TableCell>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.75rem', py: 0.3, px: 0.5 }}>İşlemler</TableCell>
                </TableRow>
              )}
            </Droppable>
          </DragDropContext>
          {/* Filter Row */}
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell sx={{ py: 0.5, px: 0.5 }}>
              <TextField
                size="small"
                placeholder="Sıra..."
                value={filters.sira}
                onChange={(e) => handleFilterChange('sira', e.target.value)}
                sx={{
                  '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5, px: 0.5 },
                  width: '60px'
                }}
              />
            </TableCell>
            {columnOrder.map((columnId) => (
              <TableCell key={columnId} sx={{ py: 0.5, px: 0.5 }}>
                <TextField
                  size="small"
                  placeholder={`${columnConfigs[columnId].label}...`}
                  value={filters[columnId as keyof typeof filters] || ''}
                  onChange={(e) => handleFilterChange(columnId, e.target.value)}
                  sx={{
                    '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5, px: 0.5 },
                    minWidth: columnId === 'tarih' ? '90px' : 
                             columnId === 'cep_tel' ? '100px' : 
                             columnId === 'tutar' ? '70px' :
                             columnId === 'durum' ? '90px' : '100px'
                  }}
                />
              </TableCell>
            ))}
            <TableCell sx={{ py: 0.5, px: 0.5 }}></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredIslemler.map((islem) => {
            // Orijinal listedeki sırayı bul
            const originalIndex = islemler.findIndex(item => item.id === islem.id);
            const originalSira = originalIndex + 1;
            
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
              {/* Sıra No - ORİJİNAL SIRA */}
              <TableCell sx={{ fontWeight: 500, fontSize: '0.75rem', py: 0.3, px: 0.5 }}>
                {originalSira}
              </TableCell>
              {columnOrder.map((columnId) => {
                const column = columnConfigs[columnId];
                return <React.Fragment key={columnId}>{column.render(islem)}</React.Fragment>;
              })}
              <TableCell sx={{ py: 0.5, px: 1 }}>
                <Box sx={{ display: 'flex', gap: 0.3 }}>
                  <Tooltip title={islem.is_durumu === 'acik' ? 'Tamamla' : 'Tamamlandı'}>
                    <IconButton 
                      size="small" 
                      onClick={() => onToggleDurum(islem)}
                      sx={{ 
                        bgcolor: islem.is_durumu === 'acik' ? 'warning.light' : 'success.light',
                        width: 28,
                        height: 28,
                        '&:hover': {
                          bgcolor: islem.is_durumu === 'acik' ? 'warning.main' : 'success.main',
                        }
                      }}
                    >
                      <Check sx={{ color: 'white', fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Düzenle">
                    <IconButton 
                      size="small" 
                      onClick={() => onEdit(islem)}
                      sx={{ 
                        bgcolor: 'primary.light',
                        width: 28,
                        height: 28,
                        '&:hover': {
                          bgcolor: 'primary.main',
                        }
                      }}
                    >
                      <Edit sx={{ color: 'white', fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Yazdır">
                    <IconButton 
                      size="small" 
                      onClick={() => handlePrint(islem)}
                      sx={{ 
                        bgcolor: 'info.light',
                        width: 28,
                        height: 28,
                        '&:hover': {
                          bgcolor: 'info.main',
                        }
                      }}
                    >
                      <Print sx={{ color: 'white', fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sil">
                    <IconButton 
                      size="small" 
                      onClick={() => onDelete(islem.id)}
                      sx={{ 
                        bgcolor: 'error.light',
                        width: 28,
                        height: 28,
                        '&:hover': {
                          bgcolor: 'error.main',
                        }
                      }}
                    >
                      <Delete sx={{ color: 'white', fontSize: '1rem' }} />
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
  );
};

export default IslemTable;
