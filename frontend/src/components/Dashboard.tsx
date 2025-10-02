import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import { Logout as LogoutIcon, Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { islemService } from '../services/api';
import { Islem } from '../types';
import { io, Socket } from 'socket.io-client';
import IslemTable from './IslemTable';
import IslemFilters from './IslemFilters';
import IslemDialog from './IslemDialog';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [islemler, setIslemler] = useState<Islem[]>([]);
  const [filteredIslemler, setFilteredIslemler] = useState<Islem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedIslem, setSelectedIslem] = useState<Islem | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Socket.IO bağlantısı
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('yeni-islem', (islem: Islem) => {
      setIslemler((prev) => [islem, ...prev]);
    });

    newSocket.on('islem-guncellendi', (updatedIslem: Islem) => {
      setIslemler((prev) =>
        prev.map((islem) => (islem.id === updatedIslem.id ? updatedIslem : islem))
      );
    });

    newSocket.on('islem-silindi', (id: number) => {
      setIslemler((prev) => prev.filter((islem) => islem.id !== id));
    });

    newSocket.on('islem-durum-degisti', (updatedIslem: Islem) => {
      setIslemler((prev) =>
        prev.map((islem) => (islem.id === updatedIslem.id ? updatedIslem : islem))
      );
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    loadIslemler();
  }, []);

  const loadIslemler = async () => {
    try {
      setLoading(true);
      const data = await islemService.getAll();
      setIslemler(data);
      setFilteredIslemler(data);
    } catch (error) {
      console.error('İşlemler yüklenirken hata:', error);
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
      } catch (error) {
        console.error('İşlem silinirken hata:', error);
      }
    }
  };

  const handleToggleDurum = async (islem: Islem) => {
    try {
      const newDurum = islem.is_durumu === 'acik' ? 'tamamlandi' : 'acik';
      await islemService.updateDurum(islem.id, newDurum);
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CRM Sistemi - Hoş geldin {user?.username}
          </Typography>
          <Button
            color="inherit"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Yeni İşlem
          </Button>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
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
