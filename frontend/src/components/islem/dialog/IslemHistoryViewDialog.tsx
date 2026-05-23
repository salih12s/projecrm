import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Chip,
} from '@mui/material';
import { Islem } from '../../../types';
import { formatPhoneNumber } from '../table/islemTableUtils';

interface Props {
  open: boolean;
  onClose: () => void;
  customerName: string;
  customerHistory: Islem[];
  loading: boolean;
}

const HEADERS = [
  'Sıra', 'Tarih', 'İlçe', 'Mahalle', 'Cadde', 'Sokak', 'Kapı No',
  'Cep Tel', 'Ürün', 'Marka', 'Şikayet', 'Yapılan İşlem', 'Teknisyen', 'Tutar', 'Durum',
];

const IslemHistoryViewDialog: React.FC<Props> = ({
  open,
  onClose,
  customerName,
  customerHistory,
  loading,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Müşteri Geçmişi: {customerName}</Typography>
          <Typography variant="body2" color="text.secondary">
            Toplam {customerHistory.length} kayıt
          </Typography>
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
                  py: 0.5,
                  px: 1,
                  fontSize: '0.75rem',
                  borderRight: '1px solid #e0e0e0',
                  borderBottom: '1px solid #e0e0e0',
                  '&:last-child': { borderRight: 'none' },
                },
              }}
            >
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  {HEADERS.map((h) => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {customerHistory.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>{record.id}</TableCell>
                    <TableCell>
                      {record.full_tarih ? new Date(record.full_tarih).toLocaleDateString('tr-TR') : '-'}
                    </TableCell>
                    <TableCell>{record.ilce || '-'}</TableCell>
                    <TableCell>{record.mahalle || '-'}</TableCell>
                    <TableCell>{record.cadde || '-'}</TableCell>
                    <TableCell>{record.sokak || '-'}</TableCell>
                    <TableCell>{record.kapi_no || '-'}</TableCell>
                    <TableCell>{formatPhoneNumber(record.cep_tel)}</TableCell>
                    <TableCell>{record.urun || '-'}</TableCell>
                    <TableCell>{record.marka || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Tooltip title={record.sikayet || '-'} placement="top">
                        <span>{record.sikayet || '-'}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Tooltip title={record.yapilan_islem || '-'} placement="top">
                        <span>{record.yapilan_islem || '-'}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{record.teknisyen_ismi || '-'}</TableCell>
                    <TableCell>
                      {record.tutar ? `${Number(record.tutar).toLocaleString('tr-TR')} ₺` : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          record.is_durumu === 'acik'
                            ? 'Açık'
                            : record.is_durumu === 'parca_bekliyor'
                            ? 'Parça Bekliyor'
                            : record.is_durumu === 'iptal'
                            ? 'İptal'
                            : 'Tamamlandı'
                        }
                        color={
                          record.is_durumu === 'acik'
                            ? 'warning'
                            : record.is_durumu === 'parca_bekliyor'
                            ? 'info'
                            : record.is_durumu === 'iptal'
                            ? 'error'
                            : 'success'
                        }
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
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Kapat
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IslemHistoryViewDialog;
