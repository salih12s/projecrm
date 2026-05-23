import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Button, Typography, CircularProgress,
  TextField, Card, CardContent, Chip, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import { Block } from '@mui/icons-material';
import { Islem } from '../../../types';
import { formatPhoneNumber } from './islemTableUtils';

/**
 * CustomerHistoryDialog (Part 3 / P3.E3).
 *
 * Müşteri Geçmişi diyaloğu — mobil için kart listesi (tek arama kutusu),
 * masaüstü için 15 kolonlu tablo + filtre satırı. İçerik IslemTable
 * içindeki orijinal bloklarla birebir aynı.
 */

export interface CustomerHistoryFilters {
  sira: string;
  tarih: string;
  ilce: string;
  mahalle: string;
  cadde: string;
  sokak: string;
  kapi_no: string;
  cep_tel: string;
  urun: string;
  marka: string;
  sikayet: string;
  yapilan_islem: string;
  teknisyen: string;
  tutar: string;
  durum: string;
}

export interface CustomerHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  customerName: string;
  customerHistory: Islem[];
  filteredHistory: Islem[];
  loading: boolean;
  filters: CustomerHistoryFilters;
  onFilterChange: (field: keyof CustomerHistoryFilters, value: string) => void;
  onOpenKaraliste: () => void;
  isMobile: boolean;
}

const filterInputSx = { '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.3, px: 0.3 } } as const;

const CustomerHistoryDialog: React.FC<CustomerHistoryDialogProps> = ({
  open, onClose, customerName, customerHistory, filteredHistory,
  loading, filters, onFilterChange, onOpenKaraliste, isMobile,
}) => {
  if (isMobile) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">Müşteri Geçmişi: {customerName}</Typography>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<Block />}
              onClick={onOpenKaraliste}
              sx={{ textTransform: 'none', fontSize: '0.7rem', ml: 1 }}
            >
              Karaliste
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : customerHistory.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              Bu müşteri için kayıt bulunamadı.
            </Typography>
          ) : (
            <>
              {/* Filtreleme Alanı - Mobil */}
              <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Ara... (Tarih, Ürün, Marka, Şikayet, vb.)"
                  value={filters.sikayet}
                  onChange={(e) => onFilterChange('sikayet', e.target.value)}
                  fullWidth
                  sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem' } }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filteredHistory.map((record) => {
                  const siraNo = record.id;
                  return (
                    <Card key={record.id} variant="outlined">
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                          Sıra #{siraNo} - {record.full_tarih ? new Date(record.full_tarih).toLocaleDateString('tr-TR') : '-'}
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
                          label={
                            record.is_durumu === 'acik' ? 'Açık' :
                            record.is_durumu === 'parca_bekliyor' ? 'Parça Bekliyor' :
                            record.is_durumu === 'iptal' ? 'İptal' :
                            'Tamamlandı'
                          }
                          size="small"
                          color={
                            record.is_durumu === 'acik' ? 'warning' :
                            record.is_durumu === 'iptal' ? 'error' :
                            'success'
                          }
                          sx={{ mt: 0.5 }}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop variant
  const headerCellSx = { color: 'white', fontWeight: 600, fontSize: '0.7rem' };

  const FILTER_COLS: Array<{
    key: keyof CustomerHistoryFilters;
    placeholder: string;
    width?: number | string;
    minWidth?: number | string;
  }> = [
    { key: 'sira',          placeholder: 'Sıra',      width: '50px' },
    { key: 'tarih',         placeholder: 'Tarih',     minWidth: '80px' },
    { key: 'ilce',          placeholder: 'İlçe',      minWidth: '80px' },
    { key: 'mahalle',       placeholder: 'Mahalle',   minWidth: '80px' },
    { key: 'cadde',         placeholder: 'Cadde',     minWidth: '80px' },
    { key: 'sokak',         placeholder: 'Sokak',     minWidth: '80px' },
    { key: 'kapi_no',       placeholder: 'Kapı',      width: '50px' },
    { key: 'cep_tel',       placeholder: 'Cep Tel',   minWidth: '90px' },
    { key: 'urun',          placeholder: 'Ürün',      minWidth: '80px' },
    { key: 'marka',         placeholder: 'Marka',     minWidth: '80px' },
    { key: 'sikayet',       placeholder: 'Şikayet',   minWidth: '100px' },
    { key: 'yapilan_islem', placeholder: 'Yapılan',   minWidth: '100px' },
    { key: 'teknisyen',     placeholder: 'Teknisyen', minWidth: '80px' },
    { key: 'tutar',         placeholder: 'Tutar',     width: '60px' },
    { key: 'durum',         placeholder: 'Durum',     minWidth: '80px' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Müşteri Geçmişi: {customerName}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<Block />}
              onClick={onOpenKaraliste}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
            >
              Karalisteye Ekle
            </Button>
            <Typography variant="body2" color="text.secondary">
              Toplam {customerHistory.length} kayıt
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : customerHistory.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            Bu müşteri için kayıt bulunamadı.
          </Typography>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table
              size="small"
              sx={{
                '& .MuiTableCell-root': {
                  py: 0.5, px: 1, fontSize: '0.75rem',
                  borderRight: '2px solid #e0e0e0',
                  borderBottom: '2px solid #e0e0e0',
                  '&:last-child': { borderRight: 'none' },
                },
              }}
            >
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={headerCellSx}>Sıra</TableCell>
                  <TableCell sx={headerCellSx}>Tarih</TableCell>
                  <TableCell sx={headerCellSx}>İlçe</TableCell>
                  <TableCell sx={headerCellSx}>Mahalle</TableCell>
                  <TableCell sx={headerCellSx}>Cadde</TableCell>
                  <TableCell sx={headerCellSx}>Sokak</TableCell>
                  <TableCell sx={headerCellSx}>Kapı No</TableCell>
                  <TableCell sx={headerCellSx}>Cep Tel</TableCell>
                  <TableCell sx={headerCellSx}>Ürün</TableCell>
                  <TableCell sx={headerCellSx}>Marka</TableCell>
                  <TableCell sx={headerCellSx}>Şikayet</TableCell>
                  <TableCell sx={headerCellSx}>Yapılan İşlem</TableCell>
                  <TableCell sx={headerCellSx}>Teknisyen</TableCell>
                  <TableCell sx={headerCellSx}>Tutar</TableCell>
                  <TableCell sx={headerCellSx}>Durum</TableCell>
                </TableRow>
                {/* Filter Row */}
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  {FILTER_COLS.map((col) => (
                    <TableCell key={col.key} sx={{ py: 0.2, px: 0.5 }}>
                      <TextField
                        size="small"
                        placeholder={col.placeholder}
                        value={filters[col.key]}
                        onChange={(e) => onFilterChange(col.key, e.target.value)}
                        sx={{
                          ...filterInputSx,
                          ...(col.width ? { width: col.width } : {}),
                          ...(col.minWidth ? { minWidth: col.minWidth } : {}),
                        }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredHistory.map((islem) => {
                  const siraNo = islem.id;
                  return (
                    <TableRow key={islem.id} hover>
                      <TableCell>{siraNo}</TableCell>
                      <TableCell>{islem.full_tarih ? new Date(islem.full_tarih).toLocaleDateString('tr-TR') : '-'}</TableCell>
                      <TableCell>{islem.ilce || '-'}</TableCell>
                      <TableCell>{islem.mahalle || '-'}</TableCell>
                      <TableCell>{islem.cadde || '-'}</TableCell>
                      <TableCell>{islem.sokak || '-'}</TableCell>
                      <TableCell>{islem.kapi_no || '-'}</TableCell>
                      <TableCell>{formatPhoneNumber(islem.cep_tel)}</TableCell>
                      <TableCell>{islem.urun || '-'}</TableCell>
                      <TableCell>{islem.marka || '-'}</TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Tooltip title={islem.sikayet || '-'} placement="top">
                          <span>{islem.sikayet || '-'}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Tooltip title={islem.yapilan_islem || '-'} placement="top">
                          <span>{islem.yapilan_islem || '-'}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{islem.teknisyen_ismi || '-'}</TableCell>
                      <TableCell>{islem.tutar ? `${Number(islem.tutar).toLocaleString('tr-TR')} ₺` : '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            islem.is_durumu === 'acik' ? 'Açık' :
                            islem.is_durumu === 'parca_bekliyor' ? 'Parça Bekliyor' :
                            islem.is_durumu === 'iptal' ? 'İptal' :
                            'Tamamlandı'
                          }
                          color={
                            islem.is_durumu === 'acik' ? 'warning' :
                            islem.is_durumu === 'parca_bekliyor' ? 'info' :
                            islem.is_durumu === 'iptal' ? 'error' :
                            'success'
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomerHistoryDialog;
