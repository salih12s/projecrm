import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Alert,
  Collapse,
} from '@mui/material';
import {
  PersonAdd,
  Block,
  CheckCircle,
  Delete,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { adminService } from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';

interface User {
  id: number;
  username: string;
  created_at: string;
  is_active: boolean;
  total_records: number;
}

interface UserRecord {
  id: number;
  full_tarih: string;
  ad_soyad: string;
  ilce: string;
  mahalle: string;
  cep_tel: string;
  urun: string;
  marka: string;
  sikayet: string;
  is_durumu: string;
  created_by: string;
  updated_at: string;
}

interface AtolyeRecord {
  id: number;
  teslim_durumu: string;
  bayi_adi: string;
  musteri_ad_soyad: string;
  tel_no: string;
  marka: string;
  kod: string;
  seri_no: string;
  sikayet: string;
  ozel_not: string;
  yapilan_islem: string;
  ucret: string;
  yapilma_tarihi: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userRecords, setUserRecords] = useState<{ [key: string]: UserRecord[] }>({});
  const [userAtolyeRecords, setUserAtolyeRecords] = useState<{ [key: string]: AtolyeRecord[] }>({});
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (error: any) {
      console.error('Kullanıcılar yüklenirken hata:', error);
      showSnackbar('Kullanıcılar yüklenirken hata oluştu!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) {
      showSnackbar('Kullanıcı adı ve şifre boş olamaz!', 'warning');
      return;
    }

    try {
      await adminService.createUser(newUsername, newPassword);
      showSnackbar('Kullanıcı başarıyla oluşturuldu!', 'success');
      setOpenCreateDialog(false);
      setNewUsername('');
      setNewPassword('');
      loadUsers();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Kullanıcı oluşturulurken hata oluştu!';
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleToggleUserStatus = async (id: number, currentStatus: boolean) => {
    try {
      await adminService.toggleUserStatus(id);
      showSnackbar(
        currentStatus ? 'Kullanıcı pasif edildi!' : 'Kullanıcı aktif edildi!',
        'success'
      );
      loadUsers();
    } catch (error: any) {
      showSnackbar('Durum değiştirilirken hata oluştu!', 'error');
    }
  };

  const handleDeleteUser = async (id: number, username: string) => {
    if (window.confirm(`${username} kullanıcısını silmek istediğinizden emin misiniz?`)) {
      try {
        await adminService.deleteUser(id);
        showSnackbar('Kullanıcı silindi!', 'success');
        loadUsers();
      } catch (error: any) {
        showSnackbar('Kullanıcı silinirken hata oluştu!', 'error');
      }
    }
  };

  const handleViewRecords = async (username: string) => {
    if (expandedUser === username) {
      setExpandedUser(null);
      return;
    }

    try {
      const [records, atolyeRecords] = await Promise.all([
        adminService.getUserRecords(username),
        adminService.getUserAtolyeRecords(username)
      ]);
      setUserRecords({ ...userRecords, [username]: records });
      setUserAtolyeRecords({ ...userAtolyeRecords, [username]: atolyeRecords });
      setExpandedUser(username);
    } catch (error: any) {
      showSnackbar('Kayıtlar yüklenirken hata oluştu!', 'error');
    }
  };

  if (loading) {
    return <Typography>Yükleniyor...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Kullanıcı Yönetimi
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setOpenCreateDialog(true)}
        >
          Yeni Kullanıcı Ekle
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Sistemdeki tüm kullanıcıları görüntüleyebilir, aktif/pasif yapabilir ve kayıtlarını inceleyebilirsiniz.
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#0D3282' }}>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Kullanıcı Adı</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Kayıt Tarihi</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Toplam Kayıt</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Durum</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <React.Fragment key={user.id}>
                <TableRow hover>
                  <TableCell>
                    <Typography fontWeight={500}>{user.username}</Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleString('tr-TR')}
                  </TableCell>
                  <TableCell>
                    <Chip label={user.total_records} color="primary" size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? 'Aktif' : 'Pasif'}
                      color={user.is_active ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Kayıtları Görüntüle">
                        <IconButton
                          size="small"
                          onClick={() => handleViewRecords(user.username)}
                          color="info"
                        >
                          {expandedUser === user.username ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={user.is_active ? 'Pasif Yap' : 'Aktif Yap'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                          color={user.is_active ? 'warning' : 'success'}
                        >
                          {user.is_active ? <Block /> : <CheckCircle />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
                
                {/* Kullanıcı Kayıtları */}
                <TableRow>
                  <TableCell colSpan={5} sx={{ p: 0 }}>
                    <Collapse in={expandedUser === user.username} timeout="auto" unmountOnExit>
                      <Box sx={{ bgcolor: '#f5f5f5', p: 2 }}>
                        {/* İşlemler Tablosu */}
                        <Typography variant="h6" gutterBottom sx={{ color: '#0D3282', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <PersonAdd sx={{ fontSize: '1.3rem' }} />
                          {user.username} - Ana Sayfa Kayıtları ({userRecords[user.username]?.length || 0} adet)
                        </Typography>
                        {userRecords[user.username] && userRecords[user.username].length > 0 ? (
                          <TableContainer component={Paper} sx={{ mt: 2, mb: 3, maxHeight: 400, overflow: 'auto' }}>
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
                                {userRecords[user.username].map((record) => (
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
                          {user.username} - Atölye Takip Kayıtları ({userAtolyeRecords[user.username]?.length || 0} adet)
                        </Typography>
                        {userAtolyeRecords[user.username] && userAtolyeRecords[user.username].length > 0 ? (
                          <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
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
                                {userAtolyeRecords[user.username].map((record) => (
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
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Kullanıcı Oluşturma Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Kullanıcı Adı"
            type="text"
            fullWidth
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Şifre"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>İptal</Button>
          <Button onClick={handleCreateUser} variant="contained">
            Oluştur
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPanel;
