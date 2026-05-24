import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Collapse,
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { UserRecord, AtolyeRecord } from './adminPanelTypes';

interface Props {
  open: boolean;
  username: string;
  records: UserRecord[] | undefined;
  atolyeRecords: AtolyeRecord[] | undefined;
}

const UserRecordsCollapse: React.FC<Props> = ({ open, username, records, atolyeRecords }) => (
  <Collapse in={open} timeout="auto" unmountOnExit>
    <Box sx={{ bgcolor: '#f5f5f5', p: 2 }}>
      {/* İşlemler Tablosu */}
      <Typography variant="h6" gutterBottom sx={{ color: '#0D3282', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <PersonAdd sx={{ fontSize: '1.3rem' }} />
        {username} - Ana Sayfa Kayıtları ({records?.length || 0} adet)
      </Typography>
      {records && records.length > 0 ? (
        <TableContainer component={Paper} sx={{ mt: 2, mb: 3, maxHeight: 400, overflow: 'auto', overflowX: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: '#e0e0e0' }}>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white' }}>Tarih</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white' }}>Müşteri</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white' }}>İlçe</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white' }}>Mahalle</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white' }}>Telefon</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white' }}>Ürün</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white' }}>Marka</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white', minWidth: 200 }}>Şikayet</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white' }}>Durum</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#0D3282', color: 'white' }}>Son Güncelleme</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id} hover sx={{ '&:hover': { bgcolor: '#f0f7ff' } }}>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                    {new Date(record.full_tarih).toLocaleString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{record.ad_soyad}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{record.ilce}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{record.mahalle}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{record.cep_tel}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{record.urun}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{record.marka}</TableCell>
                  <TableCell sx={{
                    maxWidth: '300px',
                    fontSize: '0.85rem',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word'
                  }}>
                    {record.sikayet}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={record.is_durumu === 'acik' ? 'Açık' : 'Tamamlandı'}
                      color={record.is_durumu === 'acik' ? 'warning' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'text.secondary' }}>
                    {new Date(record.updated_at).toLocaleString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>Bu kullanıcının Ana Sayfa'da henüz kaydı yok.</Alert>
      )}

      {/* Atölye Kayıtları Tablosu */}
      <Typography variant="h6" gutterBottom sx={{ color: '#0D3282', display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 3 }}>
        <PersonAdd sx={{ fontSize: '1.3rem' }} />
        {username} - Atölye Takip Kayıtları ({atolyeRecords?.length || 0} adet)
      </Typography>
      {atolyeRecords && atolyeRecords.length > 0 ? (
        <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400, overflow: 'auto', overflowX: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: '#e0e0e0' }}>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#1976d2', color: 'white' }}>Oluşturma</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#1976d2', color: 'white' }}>Bayi</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#1976d2', color: 'white' }}>Müşteri</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#1976d2', color: 'white' }}>Telefon</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#1976d2', color: 'white' }}>Marka</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#1976d2', color: 'white' }}>Model</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#1976d2', color: 'white' }}>Seri No</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#1976d2', color: 'white', minWidth: 150 }}>Şikayet</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#1976d2', color: 'white', minWidth: 150 }}>Yapılan İşlem</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#1976d2', color: 'white' }}>Ücret</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#1976d2', color: 'white' }}>Teslim Durumu</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#1976d2', color: 'white' }}>Son Güncelleme</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {atolyeRecords.map((record) => (
                <TableRow key={record.id} hover sx={{ '&:hover': { bgcolor: '#e3f2fd' } }}>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                    {new Date(record.created_at).toLocaleString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{record.bayi_adi}</TableCell>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{record.musteri_ad_soyad}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{record.tel_no}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{record.marka}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{record.kod || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{record.seri_no || '-'}</TableCell>
                  <TableCell sx={{
                    maxWidth: '200px',
                    fontSize: '0.85rem',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word'
                  }}>
                    {record.sikayet}
                  </TableCell>
                  <TableCell sx={{
                    maxWidth: '200px',
                    fontSize: '0.85rem',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word'
                  }}>
                    {record.yapilan_islem || '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{record.ucret ? `${record.ucret} ₺` : '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={
                        record.teslim_durumu === 'beklemede' ? 'Beklemede' :
                        record.teslim_durumu === 'tamamlandi' ? 'Tamamlandı' :
                        record.teslim_durumu === 'teslim_edildi' ? 'Teslim Edildi' : 'Bilinmiyor'
                      }
                      color={
                        record.teslim_durumu === 'beklemede' ? 'warning' :
                        record.teslim_durumu === 'tamamlandi' ? 'info' :
                        record.teslim_durumu === 'teslim_edildi' ? 'success' : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'text.secondary' }}>
                    {new Date(record.updated_at).toLocaleString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info">Bu kullanıcının Atölye Takip'te henüz kaydı yok.</Alert>
      )}
    </Box>
  </Collapse>
);

export default UserRecordsCollapse;
