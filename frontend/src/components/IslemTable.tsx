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
  const handlePrint = (islem: Islem) => {
    printIslem(islem);
  };

  // Sütun sırasını localStorage'dan yükle
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('islemTableColumnOrder');
    return saved ? JSON.parse(saved) : [
      'tarih', 'ad_soyad', 'ilce', 'mahalle', 'cadde', 'sokak', 'kapi_no',
      'cep_tel', 'urun', 'marka', 'yapilan_islem', 'teknisyen', 'tutar', 'durum'
    ];
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
      render: (islem) => <TableCell sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>{islem.cep_tel}</TableCell>,
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
      <Table size="small" sx={{ '& .MuiTableCell-root': { py: 0.5, px: 1 } }}>
        <TableHead>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="columns" direction="horizontal">
              {(provided) => (
                <TableRow 
                  sx={{ bgcolor: 'primary.main' }}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
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
                              fontSize: '0.8rem',
                              cursor: 'move',
                              userSelect: 'none',
                              bgcolor: snapshot.isDragging ? 'primary.dark' : 'primary.main',
                              py: 0.5,
                              px: 1,
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
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.8rem', py: 0.5, px: 1 }}>İşlemler</TableCell>
                </TableRow>
              )}
            </Droppable>
          </DragDropContext>
        </TableHead>
        <TableBody>
          {islemler.map((islem) => (
            <TableRow 
              key={islem.id} 
              hover
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(13, 50, 130, 0.04)',
                }
              }}
            >
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
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default IslemTable;
