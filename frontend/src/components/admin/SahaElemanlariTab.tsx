import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Block,
  CheckCircle,
  Delete,
  ExpandMore,
  ExpandLess,
  Engineering,
} from '@mui/icons-material';
import SahaUserRecordsCollapse from './SahaUserRecordsCollapse';
import { SahaElemani, SahaKayit } from '../../types';

interface Props {
  sahaElemanlari: SahaElemani[];
  sahaLoading: boolean;
  expandedSahaUser: string | null;
  sahaUserRecords: { [key: string]: SahaKayit[] };
  onOpenCreateDialog: () => void;
  onViewRecords: (username: string) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
  onDelete: (id: number, username: string) => void;
}

const SahaElemanlariTab: React.FC<Props> = ({
  sahaElemanlari,
  sahaLoading,
  expandedSahaUser,
  sahaUserRecords,
  onOpenCreateDialog,
  onViewRecords,
  onToggleStatus,
  onDelete,
}) => (
  <>
    <Box sx={{
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: 'space-between',
      alignItems: { xs: 'stretch', sm: 'center' },
      mb: 3,
      gap: 2
    }}>
      <Typography variant="h5" fontWeight={600} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
        Saha Elemanları Yönetimi
      </Typography>
      <Button
        variant="contained"
        startIcon={<Engineering />}
        onClick={onOpenCreateDialog}
        fullWidth
        sx={{ maxWidth: { sm: 220 }, bgcolor: '#0D3282', '&:hover': { bgcolor: '#082052' } }}
      >
        Yeni Saha Elemanı Ekle
      </Button>
    </Box>

    <Alert severity="info" sx={{ mb: 3, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
      Saha elemanlarını yönetebilir, ekleyebilir, aktif/pasif yapabilir ve kayıtlarını görüntüleyebilirsiniz.
    </Alert>

    {sahaLoading ? (
      <Typography>Yükleniyor...</Typography>
    ) : sahaElemanlari.length === 0 ? (
      <Alert severity="warning">Henüz saha elemanı bulunmuyor.</Alert>
    ) : (
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#1976d2' }}>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Kullanıcı Adı</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Ad Soyad</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Kayıt Tarihi</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Toplam Kayıt</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Durum</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sahaElemanlari.map((se) => (
              <React.Fragment key={se.id}>
                <TableRow hover>
                  <TableCell>
                    <Typography fontWeight={500}>{se.username}</Typography>
                  </TableCell>
                  <TableCell>{se.ad_soyad || '-'}</TableCell>
                  <TableCell>
                    {new Date(se.created_at).toLocaleString('tr-TR')}
                  </TableCell>
                  <TableCell>
                    <Chip label={se.total_records || 0} color="info" size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={se.is_active ? 'Aktif' : 'Pasif'}
                      color={se.is_active ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Kayıtları Görüntüle">
                        <IconButton
                          size="small"
                          onClick={() => onViewRecords(se.username)}
                          color="info"
                        >
                          {expandedSahaUser === se.username ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={se.is_active ? 'Pasif Yap' : 'Aktif Yap'}>
                        <IconButton
                          size="small"
                          onClick={() => onToggleStatus(se.id, se.is_active)}
                          color={se.is_active ? 'warning' : 'success'}
                        >
                          {se.is_active ? <Block /> : <CheckCircle />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton
                          size="small"
                          onClick={() => onDelete(se.id, se.username)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>

                {/* Saha Elemanı Kayıtları */}
                <TableRow>
                  <TableCell colSpan={6} sx={{ p: 0 }}>
                    <SahaUserRecordsCollapse
                      open={expandedSahaUser === se.username}
                      displayName={se.ad_soyad || se.username}
                      records={sahaUserRecords[se.username]}
                    />
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </>
);

export default SahaElemanlariTab;
