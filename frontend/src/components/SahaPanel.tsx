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
  ZoomIn,
  ZoomOut,
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
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoCache, setPhotoCache] = useState<Record<number, string[]>>({});
  const [galleryZoom, setGalleryZoom] = useState(1);
  const [galleryPan, setGalleryPan] = useState({ x: 0, y: 0 });
  const [galleryPanning, setGalleryPanning] = useState(false);
  const [galleryPanStart, setGalleryPanStart] = useState({ x: 0, y: 0 });
  const [lastTouchDist, setLastTouchDist] = useState<number | null>(null);
  const [lastTouchCenter, setLastTouchCenter] = useState<{ x: number; y: number } | null>(null);
  
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

  const handleOpenDialog = async (kayit?: SahaKayit) => {
    if (kayit) {
      setEditingKayit(kayit);
      setFormIsim(kayit.isim);
      setFormSoyisim(kayit.soyisim);
      setFormNotlar(kayit.notlar || '');
      // Fotoğrafları lazy load ile getir
      if (photoCache[kayit.id]) {
        setFormFotolar(photoCache[kayit.id]);
      } else if ((kayit as any).has_photos) {
        try {
          const fotoData = await sahaService.getKayitPhotos(kayit.id);
          let fotolar: string[] = [];
          if (fotoData) {
            try {
              const parsed = JSON.parse(fotoData);
              fotolar = Array.isArray(parsed) ? parsed : [fotoData];
            } catch {
              fotolar = [fotoData];
            }
          }
          setPhotoCache(prev => ({ ...prev, [kayit.id]: fotolar }));
          setFormFotolar(fotolar);
        } catch {
          setFormFotolar([]);
        }
      } else {
        setFormFotolar([]);
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

  // Fotoğrafı daha iyi sıkıştır (yüksek kalite koruyarak boyutu azalt)
  const compressImage = (file: File, maxWidth: number = 2400, quality: number = 0.92): Promise<string> => {
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
            const maxHeight = 3200;
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
        // Fotoğrafı sıkıştır (2400px genişlik, %92 kalite)
        const compressedData = await compressImage(file, 2400, 0.92);
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
            const hasPhotos = (kayit as any).has_photos;
            const fotoPreview = (kayit as any).foto_preview;
            
            const handleViewPhotos = async (e: React.MouseEvent) => {
              e.stopPropagation();
              if (!hasPhotos && !fotoPreview) return;
              if (photoCache[kayit.id]) {
                setSelectedImages(photoCache[kayit.id]);
                setCurrentImageIndex(0);
                return;
              }
              try {
                setPhotoLoading(true);
                const fotoData = await sahaService.getKayitPhotos(kayit.id);
                let fotolar: string[] = [];
                if (fotoData) {
                  try {
                    const parsed = JSON.parse(fotoData);
                    fotolar = Array.isArray(parsed) ? parsed : [fotoData];
                  } catch {
                    fotolar = [fotoData];
                  }
                }
                setPhotoCache(prev => ({ ...prev, [kayit.id]: fotolar }));
                setSelectedImages(fotolar);
                setCurrentImageIndex(0);
              } catch {
                showSnackbar('Fotoğraflar yüklenirken hata oluştu!', 'error');
              } finally {
                setPhotoLoading(false);
              }
            };
            
            return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={kayit.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: (hasPhotos || fotoPreview) ? 'pointer' : 'default',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
              onClick={handleViewPhotos}
              >
                {fotoPreview ? (
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={fotoPreview}
                      alt={`${kayit.isim} ${kayit.soyisim}`}
                      sx={{ objectFit: 'cover' }}
                    />
                    <Box sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.5,
                      py: 0.5,
                    }}>
                      <PhotoCamera sx={{ fontSize: 16 }} />
                      <Typography variant="caption">Fotoğrafları Görüntüle</Typography>
                    </Box>
                  </Box>
                ) : hasPhotos ? (
                  <Box 
                    sx={{ 
                      height: 200, 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: '#e3f2fd',
                      '&:hover': { bgcolor: '#bbdefb' },
                    }}
                  >
                    <PhotoCamera sx={{ fontSize: 60, color: '#1976d2' }} />
                    <Typography variant="caption" sx={{ mt: 1, color: '#1976d2', fontWeight: 500 }}>
                      Fotoğrafları Görüntüle
                    </Typography>
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

      {/* Photo Loading Overlay */}
      <Dialog 
        open={photoLoading} 
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'hidden' } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
          <CircularProgress sx={{ color: 'white' }} />
          <Typography sx={{ color: 'white', mt: 2 }}>Fotoğraflar yükleniyor...</Typography>
        </Box>
      </Dialog>

      {/* Image Gallery Dialog - Mobile Friendly with Pinch Zoom */}
      <Dialog 
        open={selectedImages.length > 0} 
        onClose={() => { setSelectedImages([]); setGalleryZoom(1); setGalleryPan({ x: 0, y: 0 }); }}
        maxWidth="lg"
        fullWidth
        fullScreen={window.innerWidth < 600}
        PaperProps={{
          sx: window.innerWidth < 600 ? { bgcolor: 'rgba(0,0,0,0.95)' } : {}
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: window.innerWidth < 600 ? 'white' : 'inherit',
          p: { xs: 1, sm: 2 },
        }}>
          <Typography variant="body1" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
            Fotoğraflar {selectedImages.length > 1 ? `(${currentImageIndex + 1}/${selectedImages.length})` : ''}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0, alignItems: 'center' }}>
            <IconButton
              size="small"
              onClick={() => setGalleryZoom(prev => Math.max(1, prev - 0.25))}
              disabled={galleryZoom <= 1}
              sx={{ color: window.innerWidth < 600 ? 'white' : 'inherit' }}
            >
              <ZoomOut fontSize="small" />
            </IconButton>
            <Typography sx={{ fontSize: '0.75rem', minWidth: 35, textAlign: 'center' }}>
              {Math.round(galleryZoom * 100)}%
            </Typography>
            <IconButton
              size="small"
              onClick={() => setGalleryZoom(prev => Math.min(5, prev + 0.25))}
              disabled={galleryZoom >= 5}
              sx={{ color: window.innerWidth < 600 ? 'white' : 'inherit' }}
            >
              <ZoomIn fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => { setSelectedImages([]); setGalleryZoom(1); setGalleryPan({ x: 0, y: 0 }); }}
              sx={{ color: window.innerWidth < 600 ? 'white' : 'inherit' }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ overflow: 'hidden', p: { xs: 0.5, sm: 1 } }}>
          {selectedImages.length > 0 && (
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  overflow: 'hidden',
                  maxHeight: window.innerWidth < 600 ? 'calc(100vh - 180px)' : '70vh',
                  minHeight: { xs: '50vh', sm: 'auto' },
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: galleryZoom > 1 ? (galleryPanning ? 'grabbing' : 'grab') : 'zoom-in',
                  userSelect: 'none',
                  touchAction: 'none',
                }}
                onWheel={(e) => {
                  e.preventDefault();
                  if (e.deltaY < 0) {
                    setGalleryZoom(prev => Math.min(5, prev + 0.25));
                  } else {
                    setGalleryZoom(prev => {
                      const nz = Math.max(1, prev - 0.25);
                      if (nz === 1) setGalleryPan({ x: 0, y: 0 });
                      return nz;
                    });
                  }
                }}
                onClick={() => {
                  if (!galleryPanning) {
                    if (galleryZoom === 1) {
                      setGalleryZoom(2);
                    } else {
                      setGalleryZoom(1);
                      setGalleryPan({ x: 0, y: 0 });
                    }
                  }
                }}
                onMouseDown={(e) => {
                  if (galleryZoom > 1) {
                    setGalleryPanning(true);
                    setGalleryPanStart({ x: e.clientX - galleryPan.x, y: e.clientY - galleryPan.y });
                  }
                }}
                onMouseMove={(e) => {
                  if (galleryPanning && galleryZoom > 1) {
                    setGalleryPan({ x: e.clientX - galleryPanStart.x, y: e.clientY - galleryPanStart.y });
                  }
                }}
                onMouseUp={() => setGalleryPanning(false)}
                onMouseLeave={() => setGalleryPanning(false)}
                // Touch events (mobile pinch-to-zoom + pan)
                onTouchStart={(e) => {
                  if (e.touches.length === 2) {
                    e.preventDefault();
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    setLastTouchDist(Math.hypot(dx, dy));
                    setLastTouchCenter({
                      x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                      y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
                    });
                  } else if (e.touches.length === 1 && galleryZoom > 1) {
                    setGalleryPanning(true);
                    setGalleryPanStart({ x: e.touches[0].clientX - galleryPan.x, y: e.touches[0].clientY - galleryPan.y });
                  }
                }}
                onTouchMove={(e) => {
                  if (e.touches.length === 2 && lastTouchDist !== null) {
                    e.preventDefault();
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    const newDist = Math.hypot(dx, dy);
                    const scale = newDist / lastTouchDist;
                    setGalleryZoom(prev => {
                      const nz = Math.min(5, Math.max(1, prev * scale));
                      if (nz === 1) setGalleryPan({ x: 0, y: 0 });
                      return nz;
                    });
                    setLastTouchDist(newDist);
                    if (lastTouchCenter) {
                      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                      setGalleryPan(prev => ({
                        x: prev.x + (cx - lastTouchCenter.x),
                        y: prev.y + (cy - lastTouchCenter.y),
                      }));
                      setLastTouchCenter({ x: cx, y: cy });
                    }
                  } else if (e.touches.length === 1 && galleryPanning && galleryZoom > 1) {
                    setGalleryPan({ x: e.touches[0].clientX - galleryPanStart.x, y: e.touches[0].clientY - galleryPanStart.y });
                  }
                }}
                onTouchEnd={(e) => {
                  if (e.touches.length < 2) { setLastTouchDist(null); setLastTouchCenter(null); }
                  if (e.touches.length === 0) setGalleryPanning(false);
                }}
              >
                <img 
                  src={selectedImages[currentImageIndex]} 
                  alt="Preview" 
                  draggable={false}
                  style={{ 
                    transform: `scale(${galleryZoom}) translate(${galleryPan.x / galleryZoom}px, ${galleryPan.y / galleryZoom}px)`,
                    transition: galleryPanning ? 'none' : 'transform 0.2s ease',
                    maxWidth: '100%', 
                    maxHeight: window.innerWidth < 600 ? 'calc(100vh - 180px)' : '70vh', 
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    imageRendering: 'auto',
                    WebkitBackfaceVisibility: 'hidden',
                  }} 
                />
              </Box>
              {selectedImages.length > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 1, sm: 2 }, mt: 1.5 }}>
                  <Button 
                    variant="outlined" 
                    size="small"
                    sx={{ color: window.innerWidth < 600 ? 'white' : 'inherit', borderColor: window.innerWidth < 600 ? 'rgba(255,255,255,0.5)' : 'inherit' }}
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev - 1 + selectedImages.length) % selectedImages.length); setGalleryZoom(1); setGalleryPan({ x: 0, y: 0 }); }}
                  >
                    ← Önceki
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    sx={{ color: window.innerWidth < 600 ? 'white' : 'inherit', borderColor: window.innerWidth < 600 ? 'rgba(255,255,255,0.5)' : 'inherit' }}
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length); setGalleryZoom(1); setGalleryPan({ x: 0, y: 0 }); }}
                  >
                    Sonraki →
                  </Button>
                </Box>
              )}
              {/* Thumbnails */}
              {selectedImages.length > 1 && (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1.5, flexWrap: 'wrap', pb: 1 }}>
                  {selectedImages.map((img, idx) => (
                    <Box 
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); setGalleryZoom(1); setGalleryPan({ x: 0, y: 0 }); }}
                      sx={{ 
                        width: { xs: 45, sm: 60 }, 
                        height: { xs: 45, sm: 60 }, 
                        cursor: 'pointer',
                        border: idx === currentImageIndex ? '3px solid #1976d2' : '1px solid rgba(255,255,255,0.3)',
                        borderRadius: 1,
                        overflow: 'hidden',
                        flexShrink: 0,
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
