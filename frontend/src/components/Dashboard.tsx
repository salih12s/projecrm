import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
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
  CircularProgress,
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
  Close as CloseIcon,
  Engineering,
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
const SahaPanel = lazy(() => import('./SahaPanel.tsx'));
const SahaKayitlari = lazy(() => import('./SahaKayitlari.tsx'));
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const PAGE_SIZE = 100;
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedIslem, setSelectedIslem] = useState<Islem | null>(null);
  const [cloneFromRecord, setCloneFromRecord] = useState<Islem | null>(null); // Çift tıklama ile klonlama
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
  const [onHoldFormData, setOnHoldFormData] = useState<any[]>([]); // Beklemedeki formlar (array)
  const [activeHoldIndex, setActiveHoldIndex] = useState<number | null>(null); // Hangi hold form aktif
  const [shouldRestoreForm, setShouldRestoreForm] = useState(false); // Beklemeden dönülüyor mu?
  const [serverStats, setServerStats] = useState<any>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const columnFiltersRef = useRef<Record<string, string>>({});
  
  // Güvenli rol kontrolü - eğer user yoksa veya role tanımlı değilse en kısıtlı mod
  const isBayi = user?.role === 'bayi';
  const isAdmin = user?.role === 'admin';
  const isSaha = user?.role === 'saha';

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
        loadStats();
        showSnackbar('Yeni işlem eklendi!', 'info');
      }
    });

    newSocket.on('islem-guncellendi', (updatedIslem: Islem) => {
      if (updatedIslem && updatedIslem.id) {
        setIslemler((prev) =>
          prev.map((islem) => (islem.id === updatedIslem.id ? updatedIslem : islem))
        );
        loadStats();
        showSnackbar('İşlem güncellendi!', 'info');
      }
    });

    newSocket.on('islem-silindi', (id: number) => {
      if (id) {
        setIslemler((prev) => prev.filter((islem) => islem.id !== id));
        loadStats();
        showSnackbar('İşlem silindi!', 'info');
      }
    });

    newSocket.on('islem-durum-degisti', (updatedIslem: Islem) => {
      if (updatedIslem && updatedIslem.id) {
        setIslemler((prev) =>
          prev.map((islem) => (islem.id === updatedIslem.id ? updatedIslem : islem))
        );
        loadStats();
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
    loadStats();
  }, []);

  // Sunucu taraflı filtre parametrelerini oluştur
  const getServerFilters = (overrides?: { status?: string; todayOnly?: boolean; yazdirilmamisOnly?: boolean }) => {
    const s = overrides?.status ?? statusFilter;
    const t = overrides?.todayOnly ?? showTodayOnly;
    const y = overrides?.yazdirilmamisOnly ?? showYazdirilmamis;
    const params: any = {};
    if (s && s !== 'all') params.is_durumu = s;
    if (t) params.today = 'true';
    if (y) params.yazdirilmamis = 'true';
    
    // Kolon filtrelerini ekle (IslemTable'dan gelen)
    const cf = columnFiltersRef.current;
    for (const [key, value] of Object.entries(cf)) {
      if (!value) continue;
      if (key === 'teknisyen') params.teknisyen_ismi = value;
      else if (key === 'durum' || key === 'sira' || key === 'tarih') continue; // client-side kalacak
      else params[key] = value;
    }
    
    return params;
  };

  const loadIslemler = async (page = 1, append = false, overrides?: { status?: string; todayOnly?: boolean; yazdirilmamisOnly?: boolean }) => {
    try {
      if (page === 1) setLoading(true); else setLoadingMore(true);
      setError(null);
      const filters = { ...getServerFilters(overrides), page, limit: PAGE_SIZE };
      const response = await islemService.getAll(filters) as { data: Islem[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
      const newData = response.data.sort((a, b) => b.id - a.id);
      
      if (append) {
        setIslemler(prev => [...prev, ...newData]);
      } else {
        setIslemler(newData);
      }
      setCurrentPage(response.pagination.page);
      setTotalRecords(response.pagination.total);
      setHasMore(response.pagination.page < response.pagination.totalPages);
    } catch (error: any) {
      console.error('İşlemler yüklenirken hata:', error);
      setError(error.response?.data?.message || 'İşlemler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await islemService.getStats();
      setServerStats(data);
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadIslemler(currentPage + 1, true);
    }
  };

  // IslemTable kolon filtreleri değiştiğinde sunucudan yeniden çek
  const handleColumnFiltersChange = useCallback((filters: Record<string, string>) => {
    columnFiltersRef.current = filters;
    setColumnFilters({ ...filters });
  }, []);

  // Kolon filtreleri değiştiğinde debounced server-side arama
  useEffect(() => {
    const hasAnyFilter = Object.values(columnFilters).some(v => v);
    // İlk mount'ta çalışmasın
    if (!hasAnyFilter && Object.keys(columnFilters).length === 0) return;
    
    const timer = setTimeout(() => {
      loadIslemler(1, false);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenDialog = (islem?: Islem) => {
    setSelectedIslem(islem || null);
    setCloneFromRecord(null); // Klonlama modunu sıfırla
    setOpenDialog(true);
    setShouldRestoreForm(false); // Yeni işlem açılıyor, restore yapma
    // Bekleme verilerini temizleme - kart sol altta kalacak
  };

  // Çift tıklama ile klonlama
  const handleCloneRecord = (islem: Islem) => {
    setCloneFromRecord(islem);
    setSelectedIslem(null); // Düzenleme modu değil
    setOpenDialog(true);
    setShouldRestoreForm(false);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedIslem(null);
    setCloneFromRecord(null); // Klonlama modunu sıfırla
    setOpenTamamlaModal(false); // Tamamlama modalını kapat
    
    // Eğer beklemeye alınmış bir form açıldıysa ve iptal ediliyorsa, kartı da sil
    if (shouldRestoreForm && activeHoldIndex !== null) {
      clearOnHoldData(activeHoldIndex);
    }
    
    setShouldRestoreForm(false); // Restore bayrağını sıfırla
  };

  // Bekleme durumu değiştiğinde
  const handleHoldChange = (isOnHold: boolean, formData?: any, holdIndex?: number) => {
    if (isOnHold) {
      // Beklemeye alındığında form verilerini array'e ekle
      console.log('Beklemeye alınan form verileri:', formData);
      setOnHoldFormData(prev => [...prev, formData]); // Array'e ekle
      setOpenDialog(false); // Dialog'u kapat
      setSelectedIslem(null); // Seçili işlemi temizle
      setShouldRestoreForm(false); // Restore bayrağını sıfırla
    } else {
      // Beklemeden çıkıyorsa (karta tıklandı)
      if (holdIndex !== undefined && holdIndex !== null) {
        const selectedHoldData = onHoldFormData[holdIndex];
        console.log('Beklemeden çıkılan form verileri:', selectedHoldData);
        setActiveHoldIndex(holdIndex); // Hangi hold aktif
        setShouldRestoreForm(true); // Restore yapılacak
        setOpenDialog(true); // Dialog'u aç
      }
    }
  };

  // Bekleyen formu tamamen temizle (form kaydedildiğinde veya iptal edildiğinde)
  const clearOnHoldData = (holdIndex?: number) => {
    if (holdIndex !== undefined && holdIndex !== null) {
      // Belirli bir hold'u sil
      setOnHoldFormData(prev => prev.filter((_, i) => i !== holdIndex));
    } else {
      // Aktif olan hold'u sil
      if (activeHoldIndex !== null) {
        setOnHoldFormData(prev => prev.filter((_, i) => i !== activeHoldIndex));
        setActiveHoldIndex(null);
      }
    }
    setShouldRestoreForm(false);
  };

  // ⚡ PERFORMANS: Socket.IO zaten real-time güncelleme yapıyor, 
  // gereksiz loadIslemler() çağrısını kaldırdık
  const handleSaveIslem = async () => {
    handleCloseDialog();
    // Sadece beklemedeki form kaydedildiyse temizle
    if (shouldRestoreForm) {
      clearOnHoldData();
    }
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
    setShowTodayOnly(false);
    setShowYazdirilmamis(false);
    loadIslemler(1, false, { status: filter, todayOnly: false, yazdirilmamisOnly: false });
  }, []);

  const handleTodayFilter = useCallback(() => {
    const newValue = !showTodayOnly;
    setShowTodayOnly(newValue);
    if (newValue) {
      setStatusFilter('all');
      setShowYazdirilmamis(false);
    }
    loadIslemler(1, false, { status: 'all', todayOnly: newValue, yazdirilmamisOnly: false });
  }, [showTodayOnly]);

  const handleYazdirilmamisFilter = useCallback(() => {
    const newValue = !showYazdirilmamis;
    setShowYazdirilmamis(newValue);
    if (newValue) {
      setStatusFilter('all');
      setShowTodayOnly(false);
    }
    loadIslemler(1, false, { status: 'all', todayOnly: false, yazdirilmamisOnly: newValue });
  }, [showYazdirilmamis]);

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
      { label: 'Yönetim', icon: <AdminPanelSettings />, index: 4 },
      { label: 'Saha', icon: <Engineering />, index: 5 }
    ] : [])
  ];

  // ⚡ PERFORMANS: İşlem istatistiklerini sunucudan al - tüm veritabanını kapsar
  const stats = useMemo(() => {
    if (serverStats) {
      const toplamTutar = isAdmin ? islemler.reduce((sum, i) => {
        const tutar = typeof i.tutar === 'number' ? i.tutar : parseFloat(String(i.tutar || 0));
        return sum + (isNaN(tutar) ? 0 : tutar);
      }, 0) : 0;

      return {
        acikCount: parseInt(serverStats.acik) || 0,
        parcaBekleCount: parseInt(serverStats.parca_bekliyor) || 0,
        tamamlandiCount: parseInt(serverStats.tamamlandi) || 0,
        iptalCount: parseInt(serverStats.iptal) || 0,
        totalCount: parseInt(serverStats.total) || 0,
        bugunCount: parseInt(serverStats.bugun) || 0,
        yazdirilmamisCount: parseInt(serverStats.yazdirilmamis) || 0,
        toplamTutar
      };
    }
    return {
      acikCount: 0,
      parcaBekleCount: 0,
      tamamlandiCount: 0,
      iptalCount: 0,
      totalCount: 0,
      bugunCount: 0,
      yazdirilmamisCount: 0,
      toplamTutar: 0
    };
  }, [serverStats, islemler, isAdmin]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ bgcolor: '#2C3E82' }}>
        <Toolbar sx={{ minHeight: '48px !important', px: 2 }}>
          {/* Mobilde hamburger menu (sadece admin için, saha ve bayi hariç) */}
          {isMobile && !isBayi && !isSaha && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          {isSaha ? (
            <>
              <Engineering sx={{ mr: 1, fontSize: '1.5rem' }} />
              <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
                Saha Paneli
              </Typography>
            </>
          ) : (
            <>
              <Build sx={{ mr: 1, fontSize: '1.5rem' }} />
              <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
                Teknik Servis - Ana Sayfa
              </Typography>
            </>
          )}
          
          {/* Toplam Tutar - Header'da büyük ve belirgin */}
          {isAdmin && !isBayi && !isSaha && (
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

      {/* Mobile Drawer - Sadece Admin için (Bayi ve Saha hariç) */}
      {!isBayi && !isSaha && (
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

      {/* Navigation Tabs - Masaüstünde göster, mobilde gizle, Saha için gizle */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', display: { xs: 'none', sm: isSaha ? 'none' : 'block' } }}>
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
              value={0}
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
            {isAdmin && (
              <Tab 
                value={5}
                icon={<Engineering sx={{ fontSize: '1.1rem' }} />} 
                iconPosition="start" 
                label="Saha" 
              />
            )}
            {/* Normal kullanıcı (user) için Saha tab'ı */}
            {!isAdmin && !isBayi && !isSaha && (
              <Tab 
                value={5}
                icon={<Engineering sx={{ fontSize: '1.1rem' }} />} 
                iconPosition="start" 
                label="Saha" 
              />
            )}
          </Tabs>
        )}
      </Box>

      <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
        {isSaha ? (
          // Saha elemanı sadece SahaPanel görür
          <Suspense fallback={<Loading message="Yükleniyor..." />}>
            <SahaPanel />
          </Suspense>
        ) : isBayi ? (
          // Bayi sadece Atölye Takip görür
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
                    Yazdırılmamış iş: {stats.yazdirilmamisCount}
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
                    Bugün alınan iş: {stats.bugunCount}
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
              onClone={handleCloneRecord}
              onToggleDurum={handleToggleDurum}
              onDelete={handleDelete}
              isAdminMode={isAdmin}
              isBayi={isBayi}
              onFilteredChange={handleTableFilterChange}
              onColumnFiltersChange={handleColumnFiltersChange}
            />

            {/* Daha Fazla Yükle Butonu */}
            {hasMore && !loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  sx={{
                    px: 4,
                    py: 1,
                    borderColor: '#0D3282',
                    color: '#0D3282',
                    '&:hover': { bgcolor: 'rgba(13, 50, 130, 0.04)' },
                  }}
                >
                  {loadingMore ? (
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                  ) : null}
                  {loadingMore ? 'Yükleniyor...' : `Daha Fazla Yükle (${islemler.length} / ${totalRecords})`}
                </Button>
              </Box>
            )}
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
        ) : activeTab === 5 ? (
          // Saha Kayıtları (Admin ve Normal Kullanıcı) - Lazy loaded
          <Suspense fallback={<Loading />}>
            <SahaKayitlari />
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
          onHold={handleHoldChange}
          restoreFormData={shouldRestoreForm && activeHoldIndex !== null ? onHoldFormData[activeHoldIndex] : undefined}
          cloneFromRecord={cloneFromRecord || undefined}
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

        {/* Beklemedeki Formlar - Sol Alt Köşede Yan Yana Kartlar */}
        {onHoldFormData.length > 0 && !openDialog && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 16,
              left: 16,
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              maxWidth: '50vw',
              zIndex: 1300,
            }}
          >
            {onHoldFormData.map((holdData, index) => (
              <Box
                key={index}
                sx={{
                  bgcolor: 'warning.light',
                  border: '2px solid',
                  borderColor: 'warning.main',
                  borderRadius: 2,
                  boxShadow: 3,
                  transition: 'all 0.2s',
                  minWidth: 200,
                  maxWidth: 250,
                  position: 'relative',
                }}
              >
                {/* Kapatma Butonu */}
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    clearOnHoldData(index);
                  }}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: 'warning.main',
                    color: 'white',
                    width: 20,
                    height: 20,
                    zIndex: 1,
                    '&:hover': {
                      bgcolor: 'warning.dark',
                    }
                  }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>

                {/* Kart İçeriği - Tıklanabilir */}
                <Box
                  onClick={(e) => {
                    // Kapatma butonuna tıklandıysa işlem yapma
                    if ((e.target as HTMLElement).closest('button')) {
                      return;
                    }
                    handleHoldChange(false, undefined, index);
                  }}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'warning.dark', mb: 0.5 }}>
                    📋 Bekleyen Form {onHoldFormData.length > 1 && `(${index + 1})`}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {holdData.ad_soyad || 'İsimsiz'} - {holdData.cep_tel || 'Telefon yok'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                    {holdData.urun || 'Ürün belirtilmemiş'} {holdData.marka ? `- ${holdData.marka}` : ''}
                  </Typography>
                  <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'warning.dark', mt: 1, display: 'block' }}>
                    Tıklayarak devam edin
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;
