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
  Typography,
} from '@mui/material';
import { Edit, Add } from '@mui/icons-material';
import { Teknisyen, Marka, Bayi, Montaj, Aksesuar, Urun } from '../types';
import { api } from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [teknisyenler, setTeknisyenler] = useState<Teknisyen[]>([]);
  const [markalar, setMarkalar] = useState<Marka[]>([]);
  const [bayiler, setBayiler] = useState<Bayi[]>([]);
  const [montajlar, setMontajlar] = useState<Montaj[]>([]);
  const [aksesuarlar, setAksesuarlar] = useState<Aksesuar[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [editType, setEditType] = useState<'montaj' | 'aksesuar' | null>(null);
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
      } else if (tabValue === 2) {
        const response = await api.get('/bayiler');
        setBayiler(response.data);
      } else if (tabValue === 3) {
        const response = await api.get('/urunler');
        setUrunler(response.data);
      } else if (tabValue === 4) {
        // Montaj ve Aksesuarlar - iki tablo yan yana
        const montajResponse = await api.get('/montajlar');
        const aksesuarResponse = await api.get('/aksesuarlar');
        setMontajlar(montajResponse.data);
        setAksesuarlar(aksesuarResponse.data);
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
      let endpoint = '';
      if (tabValue === 0) endpoint = '/teknisyenler';
      else if (tabValue === 1) endpoint = '/markalar';
      else if (tabValue === 2) endpoint = '/bayiler';
      else if (tabValue === 3) endpoint = '/urunler';
      else if (tabValue === 4) {
        endpoint = editType === 'aksesuar' ? '/aksesuarlar' : '/montajlar';
      }
      
      if (editMode && currentId) {
        await api.put(`${endpoint}/${currentId}`, { isim: inputValue.trim() });
        showSnackbar('Başarıyla güncellendi', 'success');
      } else {
        await api.post(endpoint, { isim: inputValue.trim() });
        showSnackbar('Başarıyla eklendi', 'success');
      }
      
      setDialogOpen(false);
      setEditType(null);
      fetchData();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Bir hata oluştu';
      setError(message);
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
          <Tab label="Ürünler" />
          <Tab label="Montaj & Aksesuarlar" />
        </Tabs>

        <Box sx={{ mb: 2 }}>
          {tabValue === 4 ? (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setEditMode(false);
                  setCurrentId(null);
                  setInputValue('');
                  setError('');
                  setEditType('montaj');
                  setDialogOpen(true);
                }}
                sx={{ backgroundColor: '#0D3282', '&:hover': { backgroundColor: '#082052' } }}
              >
                Yeni Montaj Ekle
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setEditMode(false);
                  setCurrentId(null);
                  setInputValue('');
                  setError('');
                  setEditType('aksesuar');
                  setDialogOpen(true);
                }}
                sx={{ backgroundColor: '#0D8220', '&:hover': { backgroundColor: '#085210' } }}
              >
                Yeni Aksesuar Ekle
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAdd}
              sx={{ backgroundColor: '#0D3282', '&:hover': { backgroundColor: '#082052' } }}
            >
              {tabValue === 0 ? 'Yeni Teknisyen Ekle' : 
               tabValue === 1 ? 'Yeni Marka Ekle' : 
               tabValue === 2 ? 'Yeni Bayi Ekle' : 
               tabValue === 3 ? 'Yeni Ürün Ekle' : 
               'Yeni Ekle'}
            </Button>
          )}
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
                    <IconButton edge="end" onClick={() => handleEdit(tek.id, tek.isim)}>
                      <Edit />
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
                    <IconButton edge="end" onClick={() => handleEdit(marka.id, marka.isim)}>
                      <Edit />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )
          ) : tabValue === 2 ? (
            bayiler.length === 0 ? (
              <Alert severity="info">Henüz bayi eklenmedi</Alert>
            ) : (
              bayiler.map((bayi) => (
                <ListItem key={bayi.id} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}>
                  <ListItemText primary={bayi.isim} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleEdit(bayi.id, bayi.isim)}>
                      <Edit />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )
          ) : tabValue === 3 ? (
            urunler.length === 0 ? (
              <Alert severity="info">Henüz ürün eklenmedi</Alert>
            ) : (
              urunler.map((urun) => (
                <ListItem key={urun.id} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}>
                  <ListItemText primary={urun.isim} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleEdit(urun.id, urun.isim)}>
                      <Edit />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )
          ) : tabValue === 4 ? (
            <Box sx={{ display: 'flex', gap: 3 }}>
              {/* Montaj Listesi */}
              <Box sx={{ flex: 1 }}>
                <Paper elevation={2} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#0D3282', fontWeight: 'bold' }}>
                    Montaj
                  </Typography>
                  <List>
                    {montajlar.length === 0 ? (
                      <Alert severity="info">Henüz montaj eklenmedi</Alert>
                    ) : (
                      montajlar.map((montaj) => (
                        <ListItem key={montaj.id} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1, bgcolor: 'white' }}>
                          <ListItemText primary={montaj.isim} />
                          <ListItemSecondaryAction>
                            <IconButton 
                              edge="end" 
                              onClick={() => {
                                setEditType('montaj');
                                handleEdit(montaj.id, montaj.isim);
                              }}
                            >
                              <Edit />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))
                    )}
                  </List>
                </Paper>
              </Box>

              {/* Aksesuarlar Listesi */}
              <Box sx={{ flex: 1 }}>
                <Paper elevation={2} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#0D8220', fontWeight: 'bold' }}>
                    Aksesuarlar
                  </Typography>
                  <List>
                    {aksesuarlar.length === 0 ? (
                      <Alert severity="info">Henüz aksesuar eklenmedi</Alert>
                    ) : (
                      aksesuarlar.map((aksesuar) => (
                        <ListItem key={aksesuar.id} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1, bgcolor: 'white' }}>
                          <ListItemText primary={aksesuar.isim} />
                          <ListItemSecondaryAction>
                            <IconButton 
                              edge="end" 
                              onClick={() => {
                                setEditType('aksesuar');
                                handleEdit(aksesuar.id, aksesuar.isim);
                              }}
                            >
                              <Edit />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))
                    )}
                  </List>
                </Paper>
              </Box>
            </Box>
          ) : null}
        </List>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Düzenle' : 'Yeni Ekle'} - {
            tabValue === 0 ? 'Teknisyen' : 
            tabValue === 1 ? 'Marka' : 
            tabValue === 2 ? 'Bayi' : 
            tabValue === 3 ? 'Ürün' :
            editType === 'aksesuar' ? 'Aksesuar' : 'Montaj'
          }
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            label={
              tabValue === 0 ? 'Teknisyen İsmi' : 
              tabValue === 1 ? 'Marka İsmi' : 
              tabValue === 2 ? 'Bayi İsmi' : 
              editType === 'aksesuar' ? 'Aksesuar İsmi' : 'Montaj İsmi'
            }
            fullWidth
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogOpen(false);
            setEditType(null);
          }}>İptal</Button>
          <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: '#0D3282' }}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
