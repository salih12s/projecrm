import React from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { Islem } from '../../../types';
import { formatPhone as formatPhoneNumber } from '../../../utils/format';

interface Props {
  customerHistory: Islem[];
  historyLoading: boolean;
}

const CustomerHistoryTable: React.FC<Props> = ({ customerHistory, historyLoading }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main', fontWeight: 600 }}>
      Müşteri Geçmişi ({customerHistory.length} kayıt)
    </Typography>
    {historyLoading ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    ) : customerHistory.length === 0 ? (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        Bu müşteri için kayıt bulunamadı.
      </Typography>
    ) : (
      <TableContainer component={Paper} elevation={1} sx={{ maxHeight: 300, overflow: 'auto' }}>
        <Table size="small" stickyHeader sx={{
          '& .MuiTableCell-root': {
            py: 0.3,
            px: 0.5,
            fontSize: '0.65rem',
            borderRight: '1px solid #e0e0e0',
            whiteSpace: 'nowrap',
            '&:last-child': { borderRight: 'none' }
          }
        }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Sıra</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Tarih</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>İlçe</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Mahalle</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Apt/Site</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Blok</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Daire</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Cep Tel</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Yedek Tel</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Cadde</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Sokak</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Kapı</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Ürün</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Marka</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Şikayet</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Yapılan İşlem</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Teknisyen</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Tutar</TableCell>
              <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Durum</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customerHistory.map((record) => (
              <TableRow key={record.id} hover>
                <TableCell>
                  <Tooltip title={`Kayıt No: ${record.id}`} arrow>
                    <span>{record.id}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={record.full_tarih ? new Date(record.full_tarih).toLocaleDateString('tr-TR') : '-'} arrow>
                    <span>{record.full_tarih ? new Date(record.full_tarih).toLocaleDateString('tr-TR') : '-'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Tooltip title={record.ilce || '-'} arrow>
                    <span>{record.ilce || '-'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Tooltip title={record.mahalle || '-'} arrow>
                    <span>{record.mahalle || '-'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Tooltip title={record.apartman_site || '-'} arrow>
                    <span>{record.apartman_site || '-'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={record.blok_no || '-'} arrow>
                    <span>{record.blok_no || '-'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={record.daire_no || '-'} arrow>
                    <span>{record.daire_no || '-'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={formatPhoneNumber(record.cep_tel)} arrow>
                    <span>{formatPhoneNumber(record.cep_tel)}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={record.yedek_tel ? formatPhoneNumber(record.yedek_tel) : '-'} arrow>
                    <span>{record.yedek_tel ? formatPhoneNumber(record.yedek_tel) : '-'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Tooltip title={record.cadde || '-'} arrow>
                    <span>{record.cadde || '-'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Tooltip title={record.sokak || '-'} arrow>
                    <span>{record.sokak || '-'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={record.kapi_no || '-'} arrow>
                    <span>{record.kapi_no || '-'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Tooltip title={record.urun || '-'} arrow>
                    <span>{record.urun || '-'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Tooltip title={record.marka || '-'} arrow>
                    <span>{record.marka || '-'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Tooltip title={record.sikayet || '-'} arrow>
                    <span>{record.sikayet || '-'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Tooltip title={record.yapilan_islem || '-'} arrow>
                    <span>{record.yapilan_islem || '-'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Tooltip title={record.teknisyen_ismi || '-'} arrow>
                    <span>{record.teknisyen_ismi || '-'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={record.tutar ? `${Number(record.tutar).toLocaleString('tr-TR')} ₺` : '-'} arrow>
                    <span>{record.tutar ? `${Number(record.tutar).toLocaleString('tr-TR')} ₺` : '-'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      record.is_durumu === 'acik' ? 'Açık' :
                      record.is_durumu === 'parca_bekliyor' ? 'Parça Bek.' :
                      record.is_durumu === 'iptal' ? 'İptal' :
                      'Tamamlandı'
                    }
                    color={
                      record.is_durumu === 'acik' ? 'warning' :
                      record.is_durumu === 'parca_bekliyor' ? 'info' :
                      record.is_durumu === 'iptal' ? 'error' :
                      'success'
                    }
                    size="small"
                    sx={{ fontSize: '0.6rem', height: '18px' }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </Box>
);

export default CustomerHistoryTable;
