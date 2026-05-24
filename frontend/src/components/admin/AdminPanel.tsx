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
  Tooltip,
  Alert,
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
import CreateUserDialog from './dialog/CreateUserDialog';
import CreateSahaElemaniDialog from './dialog/CreateSahaElemaniDialog';
import UserRecordsCollapse from './UserRecordsCollapse';
import SahaUserRecordsCollapse from './SahaUserRecordsCollapse';
import { UserRecord, AtolyeRecord } from './adminPanelTypes';

interface User {
  id: number;
  username: string;
  created_at: string;
  is_active: boolean;
  total_records: number;
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
                    <UserRecordsCollapse
                      open={expandedUser === user.username}
                      username={user.username}
                      records={userRecords[user.username]}
                      atolyeRecords={userAtolyeRecords[user.username]}
                    />
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
      )}

      {/* Kullanıcı Oluşturma Dialog */}
      <CreateUserDialog
        open={openCreateDialog}
        username={newUsername}
        password={newPassword}
        onUsernameChange={setNewUsername}
        onPasswordChange={setNewPassword}
        onClose={() => setOpenCreateDialog(false)}
        onSubmit={handleCreateUser}
      />

      {/* Saha Elemanı Oluşturma Dialog */}
      <CreateSahaElemaniDialog
        open={openSahaDialog}
        username={newSahaUsername}
        adSoyad={newSahaAdSoyad}
        password={newSahaPassword}
        onUsernameChange={setNewSahaUsername}
        onAdSoyadChange={setNewSahaAdSoyad}
        onPasswordChange={setNewSahaPassword}
        onClose={() => setOpenSahaDialog(false)}
        onSubmit={handleCreateSahaElemani}
      />
    </Box>
  );
};

export default AdminPanel;
