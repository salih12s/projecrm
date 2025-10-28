import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
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
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
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
  Menu as MenuIcon,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { islemService } from '../services/api';
import { Islem } from '../types';
import { io } from 'socket.io-client';
import IslemTable from './IslemTable.tsx';
import IslemFilters from './IslemFilters.tsx';
import IslemDialog from './IslemDialog.tsx';
// ⚡ PERFORMANS: Büyük componentleri lazy loading ile yükle
// Bu sayede initial bundle size küçülür, sayfa daha hızlı açılır
const Settings = lazy(() => import('./Settings'));
const MusteriGecmisi = lazy(() => import('./MusteriGecmisi.tsx'));
const AtolyeTakip = lazy(() => import('./AtolyeTakip.tsx'));
const AdminPanel = lazy(() => import('./AdminPanel.tsx'));
import { exportToExcel } from '../utils/excel.ts';
import Loading from './Loading';
import ErrorMessage from './ErrorMessage';
import { useSnackbar } from '../context/SnackbarContext';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [islemler, setIslemler] = useState<Islem[]>([]);
  const [filteredIslemler, setFilteredIslemler] = useState<Islem[]>([]);
  const [tableFilteredIslemler, setTableFilteredIslemler] = useState<Islem[]>([]); // IslemTable'dan gelen filtrelenmiş liste
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedIslem, setSelectedIslem] = useState<Islem | null>(null);
  const [openTamamlaModal, setOpenTamamlaModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'acik' | 'parca_bekliyor' | 'tamamlandi' | 'iptal'>('all');
  const [showTodayOnly, setShowTodayOnly] = useState(false); // Bugün alınan işler
  const [showYazdirilmamis, setShowYazdirilmamis] = useState(false); // Yazdırılmamış işler filtresi
  // Bayi için tab değeri her zaman 0 (tek tab var)
  const [activeTab, setActiveTab] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; islem: Islem | null }>({ open: false, islem: null });
  
  // Güvenli rol kontrolü - eğer user yoksa veya role tanımlı değilse en kısıtlı mod
  const isBayi = user?.role === 'bayi';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    // Socket.IO bağlantısı - Backend Railway'de, frontend Hostinger'da
    const SOCKET_URL = import.meta.env.MODE === 'production' 
      ? 'https://projecrm-production.up.railway.app' 
      : 'http://localhost:5000';
    
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling'], // WebSocket önce, polling fallback
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
      // En yeni kayıtlar en üstte (id'ye göre büyükten küçüğe sırala)
      const sortedData = data.sort((a, b) => b.id - a.id);
      setIslemler(sortedData);
      setFilteredIslemler(sortedData);
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
    setOpenTamamlaModal(false); // Tamamlama modalını kapat
  };

  // ⚡ PERFORMANS: Socket.IO zaten real-time güncelleme yapıyor, 
  // gereksiz loadIslemler() çağrısını kaldırdık
  const handleSaveIslem = async () => {
    handleCloseDialog();
    // Socket.IO 'yeni-islem' veya 'islem-guncellendi' eventi ile otomatik güncellenecek
  };

  const handleToggleDurum = async (islem: Islem) => {
    // Her durumda tamamlama modalını aç (admin isterse durumu değiştirebilir)
    setSelectedIslem(islem);
    setOpenTamamlaModal(true); // Tamamlama modalını aktif et
    setOpenDialog(true);
    // Dialog içinde tamamlama modalı otomatik açılacak
    // Admin isterse iş durumunu "açık" yapabilir, isterse "tamamlandı" bırakabilir
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

  const handleDelete = async (islem: Islem) => {
    if (!window.confirm(`"${islem.ad_soyad}" müşterisine ait işlemi silmek istediğinize emin misiniz?`)) {
      return;
    }
    
    try {
      await islemService.delete(islem.id);
      showSnackbar('İşlem başarıyla silindi!', 'success');
      // ⚡ PERFORMANS: Socket.IO 'islem-silindi' eventi ile otomatik güncellenecek
      // loadIslemler() çağrısına gerek yok
    } catch (error) {
      console.error('İşlem silinirken hata:', error);
      showSnackbar('İşlem silinirken hata oluştu!', 'error');
    }
  };

  const handleCancelTamamla = () => {
    setConfirmDialog({ open: false, islem: null });
  };

  const handleExport = () => {
    // IslemTable'dan gelen filtrelenmiş listeyi kullan (kolon filtreleri dahil)
    const listToExport = tableFilteredIslemler.length > 0 ? tableFilteredIslemler : filteredIslemler;
    exportToExcel(listToExport);
    showSnackbar(`${listToExport.length} kayıt Excel'e aktarıldı!`, 'success');
  };
  
  // ⚡ PERFORMANS: useCallback ile fonksiyonu cache'le, her render'da yeni fonksiyon oluşturma
  const handleTableFilterChange = useCallback((filtered: Islem[]) => {
    setTableFilteredIslemler(filtered);
  }, []);

  const handleStatusFilterClick = useCallback((filter: 'all' | 'acik' | 'parca_bekliyor' | 'tamamlandi' | 'iptal') => {
    setStatusFilter(filter);
    // Diğer filtreleri kapat
    setShowTodayOnly(false);
    setShowYazdirilmamis(false);
  }, []);

  const handleTodayFilter = useCallback(() => {
    setShowTodayOnly(prev => {
      const newValue = !prev;
      // Eğer aktif edildiyse diğerlerini kapat
      if (newValue) {
        setStatusFilter('all');
        setShowYazdirilmamis(false);
      }
      return newValue;
    });
  }, []);

  const handleYazdirilmamisFilter = useCallback(() => {
    setShowYazdirilmamis(prev => {
      const newValue = !prev;
      // Eğer aktif edildiyse diğerlerini kapat
      if (newValue) {
        setStatusFilter('all');
        setShowTodayOnly(false);
      }
      return newValue;
    });
  }, []);

  const handleClearDateFilters = () => {
    setShowTodayOnly(false);
    setShowYazdirilmamis(false);
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

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleDrawerNavigation = (tabIndex: number) => {
    setActiveTab(tabIndex);
    setMobileDrawerOpen(false);
  };

  // Kullanıcı rolüne göre menü öğeleri
  const menuItems = [
    { label: 'Ana Sayfa', icon: <Home />, index: 0 },
    { label: 'Müşteri Geçmişi', icon: <History />, index: 1 },
    { label: 'Atölye Takip', icon: <Build />, index: 2 },
    ...(isAdmin ? [
      { label: 'Tanımlamalar', icon: <SettingsIcon />, index: 3 },
      { label: 'Yönetim', icon: <AdminPanelSettings />, index: 4 }
    ] : [])
  ];

  // ⚡ PERFORMANS: İşlem istatistiklerini useMemo ile cache'le
  // Her render'da yeniden hesaplamak yerine sadece islemler değişince hesapla
  const stats = useMemo(() => {
    const acikCount = islemler.filter(i => i.is_durumu === 'acik').length;
    const parcaBekleCount = islemler.filter(i => i.is_durumu === 'parca_bekliyor').length;
    const tamamlandiCount = islemler.filter(i => i.is_durumu === 'tamamlandi').length;
    const iptalCount = islemler.filter(i => i.is_durumu === 'iptal').length;
    const totalCount = islemler.length;
    
    const toplamTutar = isAdmin ? islemler.reduce((sum, i) => {
      const tutar = typeof i.tutar === 'number' ? i.tutar : parseFloat(String(i.tutar || 0));
      return sum + (isNaN(tutar) ? 0 : tutar);
    }, 0) : 0;

    return {
      acikCount,
      parcaBekleCount,
      tamamlandiCount,
      iptalCount,
      totalCount,
      toplamTutar
    };
  }, [islemler, isAdmin]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ bgcolor: '#2C3E82' }}>
        <Toolbar sx={{ minHeight: '48px !important', px: 2 }}>
          {/* Mobilde hamburger menu (sadece admin için) */}
          {isMobile && !isBayi && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Build sx={{ mr: 1, fontSize: '1.5rem' }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
            Teknik Servis - Ana Sayfa
          </Typography>
          
          {/* Toplam Tutar - Header'da büyük ve belirgin */}
          {isAdmin && !isBayi && (
            <Typography 
              variant="h6" 
              sx={{ 
                ml: 2,
                fontWeight: 700, 
                fontSize: { xs: '0.85rem', sm: '1rem' },
                color: '#fff',
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                border: '2px solid rgba(255, 255, 255, 0.5)'
              }}
            >
             TOPLAM TUTAR: {stats.toplamTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
            </Typography>
          )}
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
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

      {/* Mobile Drawer - Sadece Admin için */}
      {!isBayi && (
        <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={handleDrawerToggle}
          sx={{
            '& .MuiDrawer-paper': {
              width: 240,
            },
          }}
        >
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.index}
                selected={activeTab === item.index}
                onClick={() => handleDrawerNavigation(item.index)}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'rgba(44, 62, 130, 0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: activeTab === item.index ? '#2C3E82' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Drawer>
      )}

      {/* Navigation Tabs - Masaüstünde göster, mobilde gizle */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', display: { xs: 'none', sm: 'block' } }}>
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
              value={0}
              icon={<Home sx={{ fontSize: '1.1rem' }} />} 
              iconPosition="start" 
              label="Ana Sayfa" 
            />
            <Tab 
              value={1}
              icon={<History sx={{ fontSize: '1.1rem' }} />} 
              iconPosition="start" 
              label="Müşteri Geçmişi" 
            />
            <Tab 
              value={2}
              icon={<Build sx={{ fontSize: '1.1rem' }} />} 
              iconPosition="start" 
              label="Atölye Takip" 
            />
            {isAdmin && (
              <Tab 
                value={3}
                icon={<SettingsIcon sx={{ fontSize: '1.1rem' }} />} 
                iconPosition="start" 
                label="Tanımlamalar" 
              />
            )}
            {isAdmin && (
              <Tab 
                value={4}
                icon={<AdminPanelSettings sx={{ fontSize: '1.1rem' }} />} 
                iconPosition="start" 
                label="Yönetim" 
              />
            )}
          </Tabs>
        )}
      </Box>

      <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
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
              {/* Tablo Başlığı ve Filtreler */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, flexWrap: 'nowrap', overflowX: 'auto' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.9rem', mr: 0.5 }}>
                    İşlemler
                  </Typography>
                  
                  {/* İstatistik Butonları */}
                  <Button
                    variant={statusFilter === 'all' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => handleStatusFilterClick('all')}
                    sx={{
                      fontSize: '0.6rem',
                      py: 0.25,
                      px: 0.6,
                      minWidth: 'auto',
                      bgcolor: statusFilter === 'all' ? '#0D3282' : 'transparent',
                      color: statusFilter === 'all' ? '#fff' : '#0D3282',
                      borderColor: '#0D3282',
                      '&:hover': {
                        bgcolor: statusFilter === 'all' ? '#0a2461' : 'rgba(13, 50, 130, 0.04)',
                      }
                    }}
                  >
                    Toplam: {stats.totalCount}
                  </Button>
                  
                  <Button
                    variant={statusFilter === 'acik' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => handleStatusFilterClick('acik')}
                    sx={{
                      fontSize: '0.6rem',
                      py: 0.25,
                      px: 0.6,
                      minWidth: 'auto',
                      bgcolor: statusFilter === 'acik' ? '#ed6c02' : 'transparent',
                      color: statusFilter === 'acik' ? '#fff' : '#ed6c02',
                      borderColor: '#ed6c02',
                      '&:hover': {
                        bgcolor: statusFilter === 'acik' ? '#e65100' : 'rgba(237, 108, 2, 0.04)',
                      }
                    }}
                  >
                    Açık: {stats.acikCount}
                  </Button>
                  
                  <Button
                    variant={statusFilter === 'parca_bekliyor' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => handleStatusFilterClick('parca_bekliyor')}
                    sx={{
                      fontSize: '0.6rem',
                      py: 0.25,
                      px: 0.6,
                      minWidth: 'auto',
                      bgcolor: statusFilter === 'parca_bekliyor' ? '#1976d2' : 'transparent',
                      color: statusFilter === 'parca_bekliyor' ? '#fff' : '#1976d2',
                      borderColor: '#1976d2',
                      '&:hover': {
                        bgcolor: statusFilter === 'parca_bekliyor' ? '#1565c0' : 'rgba(25, 118, 210, 0.04)',
                      }
                    }}
                  >
                    Parça Bekliyor: {stats.parcaBekleCount}
                  </Button>
                  
                  <Button
                    variant={statusFilter === 'tamamlandi' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => handleStatusFilterClick('tamamlandi')}
                    sx={{
                      fontSize: '0.6rem',
                      py: 0.25,
                      px: 0.6,
                      minWidth: 'auto',
                      bgcolor: statusFilter === 'tamamlandi' ? '#2e7d32' : 'transparent',
                      color: statusFilter === 'tamamlandi' ? '#fff' : '#2e7d32',
                      borderColor: '#2e7d32',
                      '&:hover': {
                        bgcolor: statusFilter === 'tamamlandi' ? '#1b5e20' : 'rgba(46, 125, 50, 0.04)',
                      }
                    }}
                  >
                    Tamamlanan: {stats.tamamlandiCount}
                  </Button>

                  <Button
                    variant={statusFilter === 'iptal' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => handleStatusFilterClick('iptal')}
                    sx={{
                      fontSize: '0.6rem',
                      py: 0.25,
                      px: 0.6,
                      minWidth: 'auto',
                      bgcolor: statusFilter === 'iptal' ? '#d32f2f' : 'transparent',
                      color: statusFilter === 'iptal' ? '#fff' : '#d32f2f',
                      borderColor: '#d32f2f',
                      '&:hover': {
                        bgcolor: statusFilter === 'iptal' ? '#c62828' : 'rgba(211, 47, 47, 0.04)',
                      }
                    }}
                  >
                    İptal: {stats.iptalCount}
                  </Button>

                  {/* Yazdırılmamış İşler Filtresi */}
                  <Button
                    variant={showYazdirilmamis ? 'contained' : 'outlined'}
                    size="small"
                    onClick={handleYazdirilmamisFilter}
                    sx={{
                      fontSize: '0.6rem',
                      py: 0.25,
                      px: 0.6,
                      minWidth: 'auto',
                      bgcolor: showYazdirilmamis ? '#9c27b0' : 'transparent',
                      color: showYazdirilmamis ? '#fff' : '#9c27b0',
                      borderColor: '#9c27b0',
                      '&:hover': {
                        bgcolor: showYazdirilmamis ? '#7b1fa2' : 'rgba(156, 39, 176, 0.04)',
                      }
                    }}
                  >
                    Yazdırılmamış iş: {islemler.filter(i => !i.yazdirildi).length}
                  </Button>
                  
                  {/* Bugün Alınan İşler - Daha küçük */}
                  <Button
                    variant={showTodayOnly ? 'contained' : 'outlined'}
                    size="small"
                    onClick={handleTodayFilter}
                    sx={{
                      fontSize: '0.6rem',
                      py: 0.25,
                      px: 0.6,
                      minWidth: 'auto',
                      color: showTodayOnly ? '#fff' : '#2C3E82',
                      borderColor: '#2C3E82',
                      bgcolor: showTodayOnly ? '#2C3E82' : 'transparent',
                      '&:hover': {
                        borderColor: '#1a2850',
                        bgcolor: showTodayOnly ? '#1a2850' : 'rgba(44, 62, 130, 0.04)',
                      }
                    }}
                  >
                    Bugün alınan iş: {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return islemler.filter(islem => {
                        const islemDate = new Date(islem.full_tarih);
                        islemDate.setHours(0, 0, 0, 0);
                        return islemDate.getTime() === today.getTime();
                      }).length;
                    })()}
                  </Button>
                  
                  {showTodayOnly && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={handleClearDateFilters}
                      sx={{ 
                        fontSize: '0.65rem', 
                        py: 0.3, 
                        px: 0.5, 
                        minWidth: 'auto',
                        color: '#2C3E82',
                      }}
                    >
                      ✕
                    </Button>
                  )}
                </Box>

                {/* Filtreler - Sağ taraf */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <IslemFilters
                    islemler={islemler}
                    onFilterChange={setFilteredIslemler}
                    statusFilter={statusFilter}
                    dateFilter=""
                    showTodayOnly={showTodayOnly}
                    showYazdirilmamis={showYazdirilmamis}
                  />
                  
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon sx={{ fontSize: '1rem' }} />}
                    onClick={handleExport}
                    size="small"
                    sx={{
                      fontSize: '0.65rem',
                      py: 0.4,
                      px: 0.8,
                      color: '#0D3282',
                      borderColor: '#0D3282',
                      '&:hover': {
                        borderColor: '#0a2461',
                        bgcolor: 'rgba(13, 50, 130, 0.04)',
                      }
                    }}
                  >
                    Excel İndir
                  </Button>
                  <Button
                      variant="contained"
                      startIcon={<AddIcon sx={{ fontSize: '1rem' }} />}
                      onClick={() => handleOpenDialog()}
                      size="small"
                      sx={{ 
                        fontSize: '0.65rem',
                        py: 0.4,
                        px: 0.8,
                        boxShadow: 2,
                        '&:hover': {
                          boxShadow: 4,
                        }
                      }}
                    >
                      Yeni İşlem
                    </Button>
                  </Box>
                </Box>

              <IslemTable
              islemler={filteredIslemler}
              loading={loading}
              onEdit={handleOpenDialog}
              onToggleDurum={handleToggleDurum}
              onDelete={handleDelete}
              isAdminMode={isAdmin}
              isBayi={isBayi}
              onFilteredChange={handleTableFilterChange}
            />
          </>
        )) : activeTab === 1 ? (
          // Müşteri Geçmişi Tab - Lazy loaded
          <Suspense fallback={<Loading />}>
            <MusteriGecmisi />
          </Suspense>
        ) : activeTab === 2 ? (
          // Atölye Takip Tab - Lazy loaded
          <Suspense fallback={<Loading />}>
            <AtolyeTakip />
          </Suspense>
        ) : activeTab === 3 ? (
          // Tanımlamalar Tab - Lazy loaded
          <Suspense fallback={<Loading />}>
            <Settings />
          </Suspense>
        ) : activeTab === 4 && isAdmin ? (
          // Kullanıcı Yönetimi (Sadece Admin) - Lazy loaded
          <Suspense fallback={<Loading />}>
            <AdminPanel />
          </Suspense>
        ) : (
          // Fallback
          <Suspense fallback={<Loading />}>
            <Settings />
          </Suspense>
        )}
          </>
        )}

        <IslemDialog
          open={openDialog}
          islem={selectedIslem}
          onClose={handleCloseDialog}
          onSave={handleSaveIslem}
          openTamamlaModal={openTamamlaModal}
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
