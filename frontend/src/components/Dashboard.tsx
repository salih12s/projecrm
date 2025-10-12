import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { 
  Logout as LogoutIcon, 
  Add as AddIcon, 
  Download as DownloadIcon, 
  AccountCircle, 
  Settings as SettingsIcon,
  Home,
  Build,
  History,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { islemService } from '../services/api';
import { Islem } from '../types';
import { io } from 'socket.io-client';
import IslemTable from './IslemTable.tsx';
import IslemFilters from './IslemFilters.tsx';
import IslemDialog from './IslemDialog.tsx';
import Settings from './Settings';
import MusteriGecmisi from './MusteriGecmisi.tsx';
import AtolyeTakip from './AtolyeTakip.tsx';
import AdminPanel from './AdminPanel.tsx';
import { exportListToPDF } from '../utils/print.ts';
import Loading from './Loading';
import ErrorMessage from './ErrorMessage';
import StatsCards from './StatsCards';
import { useSnackbar } from '../context/SnackbarContext';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [islemler, setIslemler] = useState<Islem[]>([]);
  const [filteredIslemler, setFilteredIslemler] = useState<Islem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedIslem, setSelectedIslem] = useState<Islem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  // Bayi için tab değeri her zaman 0 (tek tab var)
  const [activeTab, setActiveTab] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; islem: Islem | null }>({ open: false, islem: null });
  
  const isBayi = user?.role === 'bayi';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    // Socket.IO bağlantısı - Production'da aynı domain, development'da localhost
    const SOCKET_URL = import.meta.env.MODE === 'production' 
      ? window.location.origin 
      : 'http://localhost:5000';
    
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO bağlantısı kuruldu');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO bağlantı hatası:', error);
    });

    newSocket.on('yeni-islem', (islem: Islem) => {
      if (islem && islem.id) {
        setIslemler((prev) => [islem, ...prev]);
        showSnackbar('Yeni işlem eklendi!', 'info');
      }
    });

    newSocket.on('islem-guncellendi', (updatedIslem: Islem) => {
      if (updatedIslem && updatedIslem.id) {
        setIslemler((prev) =>
          prev.map((islem) => (islem.id === updatedIslem.id ? updatedIslem : islem))
        );
        showSnackbar('İşlem güncellendi!', 'info');
      }
    });

    newSocket.on('islem-silindi', (id: number) => {
      if (id) {
        setIslemler((prev) => prev.filter((islem) => islem.id !== id));
        showSnackbar('İşlem silindi!', 'info');
      }
    });

    newSocket.on('islem-durum-degisti', (updatedIslem: Islem) => {
      if (updatedIslem && updatedIslem.id) {
        setIslemler((prev) =>
          prev.map((islem) => (islem.id === updatedIslem.id ? updatedIslem : islem))
        );
        showSnackbar('İş durumu güncellendi!', 'success');
      }
    });

    return () => {
      newSocket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadIslemler();
  }, []);

  const loadIslemler = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await islemService.getAll();
      setIslemler(data);
      setFilteredIslemler(data);
    } catch (error: any) {
      console.error('İşlemler yüklenirken hata:', error);
      setError(error.response?.data?.message || 'İşlemler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenDialog = (islem?: Islem) => {
    setSelectedIslem(islem || null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedIslem(null);
  };

  const handleSaveIslem = async () => {
    await loadIslemler();
    handleCloseDialog();
  };

  const handleDeleteIslem = async (id: number) => {
    if (window.confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
      try {
        await islemService.delete(id);
        setIslemler((prev) => prev.filter((islem) => islem.id !== id));
        showSnackbar('İşlem başarıyla silindi!', 'success');
      } catch (error) {
        console.error('İşlem silinirken hata:', error);
        showSnackbar('İşlem silinirken hata oluştu!', 'error');
      }
    }
  };

  const handleToggleDurum = async (islem: Islem) => {
    // Eğer açıktan tamamlandıya geçiyorsa onay iste
    if (islem.is_durumu === 'acik') {
      setConfirmDialog({ open: true, islem });
    } else {
      // Tamamlandıdan açığa geçiş (geri alma) direkt yapılabilir
      try {
        await islemService.updateDurum(islem.id, 'acik');
        showSnackbar('İş durumu açık olarak güncellendi!', 'success');
      } catch (error) {
        console.error('Durum güncellenirken hata:', error);
        showSnackbar('Durum güncellenirken hata oluştu!', 'error');
      }
    }
  };

  const handleConfirmTamamla = async () => {
    if (!confirmDialog.islem) return;
    
    try {
      await islemService.updateDurum(confirmDialog.islem.id, 'tamamlandi');
      showSnackbar('İş durumu tamamlandı olarak güncellendi!', 'success');
      setConfirmDialog({ open: false, islem: null });
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
      showSnackbar('Durum güncellenirken hata oluştu!', 'error');
    }
  };

  const handleCancelTamamla = () => {
    setConfirmDialog({ open: false, islem: null });
  };

  const handleExport = () => {
    exportListToPDF(filteredIslemler);
    showSnackbar(`${filteredIslemler.length} kayıt PDF'e aktarıldı!`, 'success');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutFromMenu = () => {
    handleMenuClose();
    handleLogout();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ bgcolor: '#2C3E82' }}>
        <Toolbar sx={{ minHeight: '48px !important', px: 2 }}>
          <Build sx={{ mr: 1, fontSize: '1.5rem' }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Teknik Servis - Ana Sayfa
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ mr: 2 }}>
            {new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </Typography>
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            sx={{ p: 0.5 }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
              <AccountCircle />
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem disabled>
              <AccountCircle sx={{ mr: 1 }} />
              {user?.username}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogoutFromMenu}>
              <LogoutIcon sx={{ mr: 1 }} />
              Çıkış Yap
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Navigation Tabs */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        {isBayi ? (
          <Tabs 
            value={0}
            sx={{
              minHeight: '42px',
              '& .MuiTab-root': {
                minHeight: '42px',
                py: 1,
                px: 3,
                fontSize: '0.85rem',
                textTransform: 'none',
              }
            }}
          >
            <Tab 
              icon={<Build sx={{ fontSize: '1.1rem' }} />} 
              iconPosition="start" 
              label="Atölye Takip" 
            />
          </Tabs>
        ) : (
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              minHeight: '42px',
              '& .MuiTab-root': {
                minHeight: '42px',
                py: 1,
                px: 3,
                fontSize: '0.85rem',
                textTransform: 'none',
              }
            }}
          >
            <Tab 
              icon={<Home sx={{ fontSize: '1.1rem' }} />} 
              iconPosition="start" 
              label="Ana Sayfa" 
            />
            <Tab 
              icon={<History sx={{ fontSize: '1.1rem' }} />} 
              iconPosition="start" 
              label="Müşteri Geçmişi" 
            />
            <Tab 
              icon={<Build sx={{ fontSize: '1.1rem' }} />} 
              iconPosition="start" 
              label="Atölye Takip" 
            />
            <Tab 
              icon={<SettingsIcon sx={{ fontSize: '1.1rem' }} />} 
              iconPosition="start" 
              label="Tanımlamalar" 
            />
            {isAdmin && (
              <Tab 
                icon={<AccountCircle sx={{ fontSize: '1.1rem' }} />} 
                iconPosition="start" 
                label="Kullanıcı Yönetimi" 
              />
            )}
          </Tabs>
        )}
      </Box>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {isBayi ? (
          // Bayi sadece Atölye Takip görür (activeTab her zaman 0)
          <AtolyeTakip />
        ) : (
          <>
            {/* Admin için tab kontrolü */}
            {activeTab === 0 ? (
              // Ana Sayfa Tab
              error ? (
                <ErrorMessage message={error} onRetry={loadIslemler} />
              ) : loading ? (
            <Loading message="İşlemler yükleniyor..." />
          ) : (
            <>
              <StatsCards islemler={islemler} />
              
              <IslemFilters
                islemler={islemler}
                onFilterChange={setFilteredIslemler}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  İşlemler
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExport}
                    size="large"
                    sx={{
                      color: '#d32f2f',
                      borderColor: '#d32f2f',
                      '&:hover': {
                        borderColor: '#9a0007',
                        bgcolor: 'rgba(211, 47, 47, 0.04)',
                      }
                    }}
                  >
                    PDF İndir
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    size="large"
                    sx={{ 
                      boxShadow: 2,
                      '&:hover': {
                        boxShadow: 4,
                      }
                    }}
                  >
                  Yeni İşlem Ekle
                </Button>
              </Box>
            </Box>

            <IslemTable
              islemler={filteredIslemler}
              loading={loading}
              onEdit={handleOpenDialog}
              onDelete={handleDeleteIslem}
              onToggleDurum={handleToggleDurum}
              isAdminMode={isAdmin}
            />
          </>
        )) : activeTab === 1 ? (
          // Müşteri Geçmişi Tab
          <MusteriGecmisi />
        ) : activeTab === 2 ? (
          // Atölye Takip Tab
          <AtolyeTakip />
        ) : activeTab === 3 ? (
          // Tanımlamalar Tab
          <Settings />
        ) : activeTab === 4 && isAdmin ? (
          // Kullanıcı Yönetimi (Sadece Admin)
          <AdminPanel />
        ) : (
          // Fallback
          <Settings />
        )}
          </>
        )}

        <IslemDialog
          open={openDialog}
          islem={selectedIslem}
          onClose={handleCloseDialog}
          onSave={handleSaveIslem}
        />

        {/* Tamamlama Onay Dialog */}
        <Dialog
          open={confirmDialog.open}
          onClose={handleCancelTamamla}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            İşlemi Tamamla
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <DialogContentText>
              Bu işlemi <strong>tamamlandı</strong> olarak işaretlemek istediğinizden emin misiniz?
              <br /><br />
              <strong>Uyarı:</strong> İşlem tamamlandı olarak işaretlendikten sonra düzenlenemeyecektir.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCancelTamamla} variant="outlined">
              İptal
            </Button>
            <Button onClick={handleConfirmTamamla} variant="contained" color="success" autoFocus>
              Tamamla
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Dashboard;
