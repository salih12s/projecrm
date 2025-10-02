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
} from '@mui/material';
import { Logout as LogoutIcon, Add as AddIcon, Download as DownloadIcon, AccountCircle } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { islemService } from '../services/api';
import { Islem } from '../types';
import { io } from 'socket.io-client';
import IslemTable from './IslemTable';
import IslemFilters from './IslemFilters';
import IslemDialog from './IslemDialog';
import { exportToExcel } from '../utils/print';
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

  useEffect(() => {
    // Socket.IO bağlantısı
    const newSocket = io('http://localhost:5000');

    newSocket.on('yeni-islem', (islem: Islem) => {
      setIslemler((prev) => [islem, ...prev]);
      showSnackbar('Yeni işlem eklendi!', 'info');
    });

    newSocket.on('islem-guncellendi', (updatedIslem: Islem) => {
      setIslemler((prev) =>
        prev.map((islem) => (islem.id === updatedIslem.id ? updatedIslem : islem))
      );
      showSnackbar('İşlem güncellendi!', 'info');
    });

    newSocket.on('islem-silindi', (id: number) => {
      setIslemler((prev) => prev.filter((islem) => islem.id !== id));
      showSnackbar('İşlem silindi!', 'info');
    });

    newSocket.on('islem-durum-degisti', (updatedIslem: Islem) => {
      setIslemler((prev) =>
        prev.map((islem) => (islem.id === updatedIslem.id ? updatedIslem : islem))
      );
      showSnackbar('İş durumu güncellendi!', 'success');
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
    try {
      const newDurum = islem.is_durumu === 'acik' ? 'tamamlandi' : 'acik';
      await islemService.updateDurum(islem.id, newDurum);
      showSnackbar(`İş durumu ${newDurum === 'acik' ? 'açık' : 'tamamlandı'} olarak güncellendi!`, 'success');
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
      showSnackbar('Durum güncellenirken hata oluştu!', 'error');
    }
  };

  const handleExport = () => {
    exportToExcel(filteredIslemler);
    showSnackbar(`${filteredIslemler.length} kayıt Excel'e aktarıldı!`, 'success');
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
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CRM Sistemi
          </Typography>
          <Button
            color="inherit"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{ mr: 1 }}
          >
            Excel İndir
          </Button>
          <Button
            color="inherit"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Yeni İşlem
          </Button>
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            sx={{ ml: 2 }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user?.username.charAt(0).toUpperCase()}
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

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {error ? (
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

            <IslemTable
              islemler={filteredIslemler}
              loading={loading}
              onEdit={handleOpenDialog}
              onDelete={handleDeleteIslem}
              onToggleDurum={handleToggleDurum}
            />
          </>
        )}

        <IslemDialog
          open={openDialog}
          islem={selectedIslem}
          onClose={handleCloseDialog}
          onSave={handleSaveIslem}
        />
      </Container>
    </Box>
  );
};

export default Dashboard;
