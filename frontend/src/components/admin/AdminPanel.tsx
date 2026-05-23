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
  Tabs,
  Tab,
} from '@mui/material';
import {
  PersonAdd,
  Block,
  CheckCircle,
  Delete,
  ExpandMore,
  ExpandLess,
  Engineering,
  People,
} from '@mui/icons-material';
import { adminService } from '../../services/admin.service';
import { sahaService } from '../../services/saha.service';
import { useSnackbar } from '../../context/SnackbarContext';
import { SahaElemani, SahaKayit } from '../../types';

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
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Saha elemanları state
  const [sahaElemanlari, setSahaElemanlari] = useState<SahaElemani[]>([]);
  const [sahaLoading, setSahaLoading] = useState(false);
  const [openSahaDialog, setOpenSahaDialog] = useState(false);
  const [newSahaUsername, setNewSahaUsername] = useState('');
  const [newSahaPassword, setNewSahaPassword] = useState('');
  const [newSahaAdSoyad, setNewSahaAdSoyad] = useState('');
  const [expandedSahaUser, setExpandedSahaUser] = useState<string | null>(null);
  const [sahaUserRecords, setSahaUserRecords] = useState<{ [key: string]: SahaKayit[] }>({});

  useEffect(() => {
    loadUsers();
    loadSahaElemanlari();
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

  const loadSahaElemanlari = async () => {
    try {
      setSahaLoading(true);
      const data = await sahaService.getSahaElemanlari();
      setSahaElemanlari(data);
    } catch (error: any) {
      console.error('Saha elemanları yüklenirken hata:', error);
    } finally {
      setSahaLoading(false);
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

  // Saha Elemanı Fonksiyonları
  const handleCreateSahaElemani = async () => {
    if (!newSahaUsername || !newSahaPassword) {
      showSnackbar('Kullanıcı adı ve şifre boş olamaz!', 'warning');
      return;
    }

    try {
      await sahaService.createSahaElemani(newSahaUsername, newSahaPassword, newSahaAdSoyad);
      showSnackbar('Saha elemanı başarıyla oluşturuldu!', 'success');
      setOpenSahaDialog(false);
      setNewSahaUsername('');
      setNewSahaPassword('');
      setNewSahaAdSoyad('');
      loadSahaElemanlari();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Saha elemanı oluşturulurken hata oluştu!';
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleToggleSahaStatus = async (id: number, currentStatus: boolean) => {
    try {
      await sahaService.toggleSahaElemaniStatus(id);
      showSnackbar(
        currentStatus ? 'Saha elemanı pasif edildi!' : 'Saha elemanı aktif edildi!',
        'success'
      );
      loadSahaElemanlari();
    } catch (error: any) {
      showSnackbar('Durum değiştirilirken hata oluştu!', 'error');
    }
  };

  const handleDeleteSahaElemani = async (id: number, username: string) => {
    if (window.confirm(`${username} saha elemanını silmek istediğinizden emin misiniz?`)) {
      try {
        await sahaService.deleteSahaElemani(id);
        showSnackbar('Saha elemanı silindi!', 'success');
        loadSahaElemanlari();
      } catch (error: any) {
        showSnackbar('Saha elemanı silinirken hata oluştu!', 'error');
      }
    }
  };

  const handleViewSahaRecords = async (username: string) => {
    if (expandedSahaUser === username) {
      setExpandedSahaUser(null);
      return;
    }

    try {
      const records = await sahaService.getUserKayitlar(username);
      setSahaUserRecords({ ...sahaUserRecords, [username]: records });
      setExpandedSahaUser(username);
    } catch (error: any) {
      showSnackbar('Kayıtlar yüklenirken hata oluştu!', 'error');
    }
  };

  if (loading) {
    return <Typography>Yükleniyor...</Typography>;
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<People />} iconPosition="start" label="Kullanıcılar" />
          <Tab icon={<Engineering />} iconPosition="start" label="Saha Elemanları" />
        </Tabs>
      </Paper>

      {/* Kullanıcılar Tab */}
      {activeTab === 0 && (
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
              Kullanıcı Yönetimi
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setOpenCreateDialog(true)}
              fullWidth
              sx={{ maxWidth: { sm: 200 } }}
            >
              Yeni Kullanıcı Ekle
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 3, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Sistemdeki tüm kullanıcıları görüntüleyebilir, aktif/pasif yapabilir ve kayıtlarını inceleyebilirsiniz.
          </Alert>

          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 650 }}>
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
        </>
      )}

      {/* Saha Elemanları Tab */}
      {activeTab === 1 && (
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
              onClick={() => setOpenSahaDialog(true)}
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
                                onClick={() => handleViewSahaRecords(se.username)}
                                color="info"
                              >
                                {expandedSahaUser === se.username ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={se.is_active ? 'Pasif Yap' : 'Aktif Yap'}>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleSahaStatus(se.id, se.is_active)}
                                color={se.is_active ? 'warning' : 'success'}
                              >
                                {se.is_active ? <Block /> : <CheckCircle />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Sil">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteSahaElemani(se.id, se.username)}
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
                          <Collapse in={expandedSahaUser === se.username} timeout="auto" unmountOnExit>
                            <Box sx={{ bgcolor: '#e3f2fd', p: 2 }}>
                              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Engineering sx={{ fontSize: '1.3rem' }} />
                                {se.ad_soyad || se.username} - Saha Kayıtları ({sahaUserRecords[se.username]?.length || 0} adet)
                              </Typography>
                              {sahaUserRecords[se.username] && sahaUserRecords[se.username].length > 0 ? (
                                <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
                                  <Table size="small" stickyHeader>
                                    <TableHead>
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#1976d2', color: 'white' }}>Fotoğraf</TableCell>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#1976d2', color: 'white' }}>İsim</TableCell>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#1976d2', color: 'white' }}>Soyisim</TableCell>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#1976d2', color: 'white' }}>Notlar</TableCell>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#1976d2', color: 'white' }}>Tarih</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {sahaUserRecords[se.username].map((record) => (
                                        <TableRow key={record.id} hover sx={{ '&:hover': { bgcolor: '#bbdefb' } }}>
                                          <TableCell>
                                            {record.foto_data ? (
                                              <img 
                                                src={record.foto_data} 
                                                alt={`${record.isim} ${record.soyisim}`}
                                                style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                                              />
                                            ) : (
                                              <Box sx={{ 
                                                width: 50, 
                                                height: 50, 
                                                bgcolor: '#f5f5f5', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                borderRadius: 1,
                                              }}>
                                                <PersonAdd sx={{ color: '#ccc' }} />
                                              </Box>
                                            )}
                                          </TableCell>
                                          <TableCell sx={{ fontWeight: 500 }}>{record.isim}</TableCell>
                                          <TableCell sx={{ fontWeight: 500 }}>{record.soyisim}</TableCell>
                                          <TableCell sx={{ maxWidth: 200 }}>
                                            <Typography variant="body2" noWrap title={record.notlar}>
                                              {record.notlar || '-'}
                                            </Typography>
                                          </TableCell>
                                          <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                            {new Date(record.created_at).toLocaleString('tr-TR', {
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
                                <Alert severity="info">Bu saha elemanının henüz kaydı yok.</Alert>
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
          )}
        </>
      )}

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

      {/* Saha Elemanı Oluşturma Dialog */}
      <Dialog open={openSahaDialog} onClose={() => setOpenSahaDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Saha Elemanı Oluştur</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Kullanıcı Adı"
            type="text"
            fullWidth
            value={newSahaUsername}
            onChange={(e) => setNewSahaUsername(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Ad Soyad (Opsiyonel)"
            type="text"
            fullWidth
            value={newSahaAdSoyad}
            onChange={(e) => setNewSahaAdSoyad(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Şifre"
            type="password"
            fullWidth
            value={newSahaPassword}
            onChange={(e) => setNewSahaPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSahaDialog(false)}>İptal</Button>
          <Button onClick={handleCreateSahaElemani} variant="contained" sx={{ bgcolor: '#0D3282' }}>
            Oluştur
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPanel;
