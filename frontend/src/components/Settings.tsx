import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { Teknisyen, Marka, Bayi } from '../types';
import { api } from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [teknisyenler, setTeknisyenler] = useState<Teknisyen[]>([]);
  const [markalar, setMarkalar] = useState<Marka[]>([]);
  const [bayiler, setBayiler] = useState<Bayi[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    fetchData();
  }, [tabValue]);

  const fetchData = async () => {
    try {
      if (tabValue === 0) {
        const response = await api.get('/teknisyenler');
        setTeknisyenler(response.data);
      } else if (tabValue === 1) {
        const response = await api.get('/markalar');
        setMarkalar(response.data);
      } else {
        const response = await api.get('/bayiler');
        setBayiler(response.data);
      }
    } catch (err) {
      showSnackbar('Veri yüklenirken hata oluştu', 'error');
    }
  };

  const handleAdd = () => {
    setEditMode(false);
    setCurrentId(null);
    setInputValue('');
    setError('');
    setDialogOpen(true);
  };

  const handleEdit = (id: number, name: string) => {
    setEditMode(true);
    setCurrentId(id);
    setInputValue(name);
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!inputValue.trim()) {
      setError('İsim alanı boş bırakılamaz');
      return;
    }

    try {
      const endpoint = tabValue === 0 ? '/teknisyenler' : tabValue === 1 ? '/markalar' : '/bayiler';
      
      if (editMode && currentId) {
        await api.put(`${endpoint}/${currentId}`, { isim: inputValue.trim() });
        showSnackbar('Başarıyla güncellendi', 'success');
      } else {
        await api.post(endpoint, { isim: inputValue.trim() });
        showSnackbar('Başarıyla eklendi', 'success');
      }
      
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Bir hata oluştu';
      setError(message);
      showSnackbar(message, 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Silmek istediğinize emin misiniz?')) return;

    try {
      const endpoint = tabValue === 0 ? '/teknisyenler' : tabValue === 1 ? '/markalar' : '/bayiler';
      await api.delete(`${endpoint}/${id}`);
      showSnackbar('Başarıyla silindi', 'success');
      fetchData();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Silme hatası';
      showSnackbar(message, 'error');
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="Teknisyenler" />
          <Tab label="Markalar" />
          <Tab label="Bayiler" />
        </Tabs>

        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAdd}
            sx={{ backgroundColor: '#0D3282', '&:hover': { backgroundColor: '#082052' } }}
          >
            {tabValue === 0 ? 'Yeni Teknisyen Ekle' : tabValue === 1 ? 'Yeni Marka Ekle' : 'Yeni Bayi Ekle'}
          </Button>
        </Box>

        <List>
          {tabValue === 0 ? (
            teknisyenler.length === 0 ? (
              <Alert severity="info">Henüz teknisyen eklenmedi</Alert>
            ) : (
              teknisyenler.map((tek) => (
                <ListItem key={tek.id} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}>
                  <ListItemText primary={tek.isim} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleEdit(tek.id, tek.isim)} sx={{ mr: 1 }}>
                      <Edit />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(tek.id)} color="error">
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )
          ) : tabValue === 1 ? (
            markalar.length === 0 ? (
              <Alert severity="info">Henüz marka eklenmedi</Alert>
            ) : (
              markalar.map((marka) => (
                <ListItem key={marka.id} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}>
                  <ListItemText primary={marka.isim} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleEdit(marka.id, marka.isim)} sx={{ mr: 1 }}>
                      <Edit />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(marka.id)} color="error">
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )
          ) : (
            bayiler.length === 0 ? (
              <Alert severity="info">Henüz bayi eklenmedi</Alert>
            ) : (
              bayiler.map((bayi) => (
                <ListItem key={bayi.id} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}>
                  <ListItemText primary={bayi.isim} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleEdit(bayi.id, bayi.isim)} sx={{ mr: 1 }}>
                      <Edit />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(bayi.id)} color="error">
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )
          )}
        </List>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Düzenle' : 'Yeni Ekle'} - {tabValue === 0 ? 'Teknisyen' : tabValue === 1 ? 'Marka' : 'Bayi'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            label={tabValue === 0 ? 'Teknisyen İsmi' : tabValue === 1 ? 'Marka İsmi' : 'Bayi İsmi'}
            fullWidth
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>İptal</Button>
          <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: '#0D3282' }}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
