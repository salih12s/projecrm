import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Chip,
  Alert,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Search,
  Delete,
  Edit,
  PhotoCamera,
  Close,
  Person,
  CalendarToday,
  FilterList,
  Refresh,
} from '@mui/icons-material';
import { useSnackbar } from '../context/SnackbarContext';
import { sahaService } from '../services/api';
import { SahaKayit, SahaKayitCreateDto } from '../types';
import { useAuth } from '../context/AuthContext';

const SahaPanel: React.FC = () => {
  const [kayitlar, setKayitlar] = useState<SahaKayit[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingKayit, setEditingKayit] = useState<SahaKayit | null>(null);
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Fotoğraf galeri state
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Form state
  const [formIsim, setFormIsim] = useState('');
  const [formSoyisim, setFormSoyisim] = useState('');
  const [formNotlar, setFormNotlar] = useState('');
  const [formFotolar, setFormFotolar] = useState<string[]>([]); // Birden fazla fotoğraf
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { showSnackbar } = useSnackbar();
  const { user } = useAuth();

  useEffect(() => {
    loadKayitlar();
  }, []);

  const loadKayitlar = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchText) params.search = searchText;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const data = await sahaService.getKayitlar(params);
      setKayitlar(data);
    } catch (error: any) {
      console.error('Kayıtlar yüklenirken hata:', error);
      showSnackbar('Kayıtlar yüklenirken hata oluştu!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadKayitlar();
  };

  const handleClearFilters = () => {
    setSearchText('');
    setStartDate('');
    setEndDate('');
    setTimeout(() => loadKayitlar(), 0);
  };

  const handleOpenDialog = (kayit?: SahaKayit) => {
    if (kayit) {
      setEditingKayit(kayit);
      setFormIsim(kayit.isim);
      setFormSoyisim(kayit.soyisim);
      setFormNotlar(kayit.notlar || '');
      // foto_data JSON array olarak saklanıyor
      try {
        const fotolar = kayit.foto_data ? JSON.parse(kayit.foto_data) : [];
        setFormFotolar(Array.isArray(fotolar) ? fotolar : [kayit.foto_data]);
      } catch {
        setFormFotolar(kayit.foto_data ? [kayit.foto_data] : []);
      }
    } else {
      setEditingKayit(null);
      setFormIsim('');
      setFormSoyisim('');
      setFormNotlar('');
      setFormFotolar([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingKayit(null);
    setFormIsim('');
    setFormSoyisim('');
    setFormNotlar('');
    setFormFotolar([]);
  };

  // Fotoğrafı daha iyi sıkıştır (daha küçük boyut ve kalite)
  const compressImage = (file: File, maxWidth: number = 600, quality: number = 0.4): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Önce dosyayı base64 olarak oku (fallback için)
      const fallbackReader = new FileReader();
      let fallbackBase64 = '';
      
      fallbackReader.onload = (fallbackEvent) => {
        fallbackBase64 = fallbackEvent.target?.result as string;
      };
      fallbackReader.readAsDataURL(file);
      
      // Asıl sıkıştırma işlemi
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        
        // Timeout ile sıkıştırma - 10 saniye içinde tamamlanmazsa fallback kullan
        const timeout = setTimeout(() => {
          console.warn('Sıkıştırma zaman aşımı, orijinal kullanılıyor');
          if (fallbackBase64) {
            resolve(fallbackBase64);
          } else {
            reject(new Error('Sıkıştırma zaman aşımı'));
          }
        }, 10000);
        
        img.onload = () => {
          clearTimeout(timeout);
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Oranı koru ve maxWidth'e göre küçült
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
            
            // Yükseklik de sınırla
            const maxHeight = 800;
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
            
            canvas.width = Math.floor(width);
            canvas.height = Math.floor(height);
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              try {
                const compressedData = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedData);
              } catch (canvasError) {
                console.warn('Canvas toDataURL hatası, orijinal kullanılıyor:', canvasError);
                if (fallbackBase64) {
                  resolve(fallbackBase64);
                } else {
                  reject(canvasError);
                }
              }
            } else {
              console.warn('Canvas context yok, orijinal kullanılıyor');
              if (fallbackBase64) {
                resolve(fallbackBase64);
              } else {
                reject(new Error('Canvas context not available'));
              }
            }
          } catch (error) {
            console.warn('Sıkıştırma hatası, orijinal kullanılıyor:', error);
            if (fallbackBase64) {
              resolve(fallbackBase64);
            } else {
              reject(error);
            }
          }
        };
        
        img.onerror = (error) => {
          clearTimeout(timeout);
          console.warn('Resim yüklenemedi, orijinal kullanılıyor:', error);
          // Resim yüklenemezse fallback kullan
          if (fallbackBase64) {
            resolve(fallbackBase64);
          } else {
            reject(error);
          }
        };
        
        img.src = e.target?.result as string;
      };
      
      reader.onerror = (error) => {
        console.warn('Dosya okunamadı, fallback deneniyor:', error);
        if (fallbackBase64) {
          resolve(fallbackBase64);
        } else {
          reject(error);
        }
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Maksimum 5 fotoğraf
    const maxPhotos = 5;
    if (formFotolar.length + files.length > maxPhotos) {
      showSnackbar(`Maksimum ${maxPhotos} fotoğraf yükleyebilirsiniz!`, 'warning');
      return;
    }

    const newPhotos: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Dosya boyutu kontrolü (10MB max - sıkıştırmadan önce)
      if (file.size > 10 * 1024 * 1024) {
        showSnackbar(`${file.name} dosyası 10MB'dan büyük, atlandı!`, 'warning');
        continue;
      }

      try {
        // Fotoğrafı sıkıştır (600px genişlik, %40 kalite)
        const compressedData = await compressImage(file, 600, 0.4);
        newPhotos.push(compressedData);
      } catch (error) {
        console.error('Fotoğraf sıkıştırma hatası:', error);
        // Sıkıştırma başarısız olursa, orijinal dosyayı base64 olarak dene
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          newPhotos.push(base64);
          console.log('Fallback: Orijinal fotoğraf kullanıldı');
        } catch (fallbackError) {
          console.error('Fallback da başarısız:', fallbackError);
          showSnackbar(`${file.name} yüklenemedi!`, 'warning');
        }
      }
    }

    if (newPhotos.length > 0) {
      setFormFotolar(prev => [...prev, ...newPhotos]);
      showSnackbar(`${newPhotos.length} fotoğraf yüklendi!`, 'success');
    }
    
    // Input'ları temizle (aynı dosyaları tekrar seçebilmek için)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormFotolar(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formIsim.trim() || !formSoyisim.trim()) {
      showSnackbar('İsim ve soyisim zorunludur!', 'warning');
      return;
    }

    try {
      setFormSubmitting(true);
      const data: SahaKayitCreateDto = {
        isim: formIsim.trim(),
        soyisim: formSoyisim.trim(),
        notlar: formNotlar.trim() || undefined,
        foto_data: formFotolar.length > 0 ? JSON.stringify(formFotolar) : undefined,
      };

      if (editingKayit) {
        await sahaService.updateKayit(editingKayit.id, data);
        showSnackbar('Kayıt başarıyla güncellendi!', 'success');
      } else {
        await sahaService.createKayit(data);
        showSnackbar('Kayıt başarıyla eklendi!', 'success');
      }

      handleCloseDialog();
      loadKayitlar();
    } catch (error: any) {
      console.error('Kayıt kaydedilirken hata:', error);
      showSnackbar(error.response?.data?.message || 'Kayıt kaydedilirken hata oluştu!', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (kayit: SahaKayit) => {
    if (!window.confirm(`${kayit.isim} ${kayit.soyisim} kaydını silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await sahaService.deleteKayit(kayit.id);
      showSnackbar('Kayıt başarıyla silindi!', 'success');
      loadKayitlar();
    } catch (error: any) {
      console.error('Kayıt silinirken hata:', error);
      showSnackbar('Kayıt silinirken hata oluştu!', 'error');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 3,
        gap: 2
      }}>
        <Box>
          <Typography variant="h5" fontWeight={600} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, color: '#2C3E82' }}>
            Saha Kayıtları
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hoşgeldin, {user?.ad_soyad || user?.username}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
            size="small"
            sx={{
              borderColor: '#0D3282',
              color: '#0D3282',
              '&:hover': {
                borderColor: '#082052',
                bgcolor: 'rgba(13, 50, 130, 0.04)',
              }
            }}
          >
            FİLTRELE
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ bgcolor: '#0D3282', '&:hover': { bgcolor: '#082052' } }}
          >
            YENİ KAYIT
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="İsim veya soyisim ara..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} sm={2.5}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Başlangıç"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} sm={2.5}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Bitiş"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  size="small"
                  sx={{ bgcolor: '#0D3282', '&:hover': { bgcolor: '#082052' } }}
                >
                  ARA
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  size="small"
                  startIcon={<Refresh />}
                  sx={{
                    borderColor: '#0D3282',
                    color: '#0D3282',
                    '&:hover': {
                      borderColor: '#082052',
                      bgcolor: 'rgba(13, 50, 130, 0.04)',
                    }
                  }}
                >
                  TEMİZLE
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Stats */}
      <Box sx={{ mb: 3 }}>
        <Chip 
          label={`Toplam: ${kayitlar.length} kayıt`} 
          color="primary" 
          variant="outlined" 
        />
      </Box>

      {/* Loading */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : kayitlar.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Henüz kayıt bulunmuyor. "Yeni Kayıt" butonuna tıklayarak ilk kaydınızı ekleyin.
        </Alert>
      ) : (
        /* Cards Grid */
        <Grid container spacing={2}>
          {kayitlar.map((kayit) => {
            // foto_data'yı parse et
            let fotolar: string[] = [];
            if (kayit.foto_data) {
              try {
                const parsed = JSON.parse(kayit.foto_data);
                fotolar = Array.isArray(parsed) ? parsed : [kayit.foto_data];
              } catch {
                fotolar = [kayit.foto_data];
              }
            }
            
            return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={kayit.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: fotolar.length > 0 ? 'pointer' : 'default',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
              onClick={() => {
                if (fotolar.length > 0) {
                  setSelectedImages(fotolar);
                  setCurrentImageIndex(0);
                }
              }}
              >
                {fotolar.length > 0 ? (
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={fotolar[0]}
                      alt={`${kayit.isim} ${kayit.soyisim}`}
                      sx={{ objectFit: 'cover' }}
                    />
                    {fotolar.length > 1 && (
                      <Chip 
                        label={`+${fotolar.length - 1}`} 
                        size="small"
                        sx={{ 
                          position: 'absolute', 
                          bottom: 8, 
                          right: 8, 
                          bgcolor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                        }} 
                      />
                    )}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      height: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#f5f5f5',
                    }}
                  >
                    <Person sx={{ fontSize: 80, color: '#ccc' }} />
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" gutterBottom>
                    {kayit.isim} {kayit.soyisim}
                  </Typography>
                  {kayit.notlar && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {kayit.notlar.length > 100 ? kayit.notlar.substring(0, 100) + '...' : kayit.notlar}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(kayit.created_at).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }} onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Düzenle">
                    <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenDialog(kayit); }}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sil">
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(kayit); }}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          );
          })}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingKayit ? 'Kaydı Düzenle' : 'Yeni Kayıt Ekle'}
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Photo Upload - Multiple Photos */}
            <Box sx={{ 
              textAlign: 'center', 
              mb: 3, 
              p: 2, 
              border: '2px dashed #ccc', 
              borderRadius: 2,
              bgcolor: '#fafafa',
            }}>
              {formFotolar.length > 0 ? (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {formFotolar.length}/5 fotoğraf yüklendi
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                    {formFotolar.map((foto, index) => (
                      <Box key={index} sx={{ position: 'relative', display: 'inline-block' }}>
                        <img 
                          src={foto} 
                          alt={`Preview ${index + 1}`} 
                          style={{ 
                            width: 80, 
                            height: 80, 
                            borderRadius: 8,
                            objectFit: 'cover',
                            border: '1px solid #ddd',
                          }} 
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemovePhoto(index)}
                          sx={{ 
                            position: 'absolute', 
                            top: -8, 
                            right: -8, 
                            bgcolor: 'error.main',
                            color: 'white',
                            padding: 0.3,
                            '&:hover': { bgcolor: 'error.dark' },
                          }}
                        >
                          <Close sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <>
                  <PhotoCamera sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Fotoğraf yüklemek için aşağıdaki butonları kullanın (maks. 5 adet)
                  </Typography>
                </>
              )}
              
              {/* Kamera input - capture="environment" ile arka kamerayı aç */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={cameraInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              {/* Galeri input - capture yok, galeriden seç */}
              <input
                type="file"
                accept="image/*"
                multiple
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              {formFotolar.length < 5 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mt: 1 }}>
                  {/* Kamera Aç Butonu - Öncelikli ve Büyük */}
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PhotoCamera />}
                    onClick={() => cameraInputRef.current?.click()}
                    sx={{ 
                      minWidth: 150,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    KAMERA AÇ
                  </Button>
                  
                  {/* Galeriden Seç Butonu */}
                  <Button
                    variant="outlined"
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ minWidth: 120 }}
                  >
                    Galeriden Seç
                  </Button>
                </Box>
              )}
            </Box>

            {/* Form Fields */}
            <TextField
              autoFocus
              fullWidth
              label="İsim"
              value={formIsim}
              onChange={(e) => setFormIsim(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Soyisim"
              value={formSoyisim}
              onChange={(e) => setFormSoyisim(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Notlar"
              value={formNotlar}
              onChange={(e) => setFormNotlar(e.target.value)}
              multiline
              rows={3}
              placeholder="Opsiyonel notlar..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={formSubmitting}
            sx={{ bgcolor: '#0D3282', '&:hover': { bgcolor: '#082052' } }}
          >
            {formSubmitting ? <CircularProgress size={20} /> : (editingKayit ? 'Güncelle' : 'Kaydet')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Gallery Dialog */}
      <Dialog 
        open={selectedImages.length > 0} 
        onClose={() => setSelectedImages([])}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Fotoğraflar {selectedImages.length > 1 ? `(${currentImageIndex + 1}/${selectedImages.length})` : ''}
          <IconButton
            onClick={() => setSelectedImages([])}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedImages.length > 0 && (
            <Box sx={{ textAlign: 'center' }}>
              <img 
                src={selectedImages[currentImageIndex]} 
                alt="Preview" 
                style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain' }} 
              />
              {selectedImages.length > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + selectedImages.length) % selectedImages.length)}
                  >
                    ← Önceki
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length)}
                  >
                    Sonraki →
                  </Button>
                </Box>
              )}
              {/* Thumbnails */}
              {selectedImages.length > 1 && (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2, flexWrap: 'wrap' }}>
                  {selectedImages.map((img, idx) => (
                    <Box 
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      sx={{ 
                        width: 60, 
                        height: 60, 
                        cursor: 'pointer',
                        border: idx === currentImageIndex ? '3px solid #0D3282' : '1px solid #ddd',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <img 
                        src={img} 
                        alt={`Thumb ${idx + 1}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SahaPanel;
