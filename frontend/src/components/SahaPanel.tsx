import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  InputAdornment,
  Chip,
  Alert,
  Tooltip,
  CircularProgress,
  Pagination,
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
  Today,
} from '@mui/icons-material';
import { useSnackbar } from '../context/SnackbarContext';
import { sahaService } from '../services/api';
import { SahaKayit } from '../types';
import { useAuth } from '../context/AuthContext';
import SahaKayitDialog from './SahaKayitDialog';

const PAGE_SIZE = 50;

const SahaPanel: React.FC = () => {
  const [kayitlar, setKayitlar] = useState<SahaKayit[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingKayit, setEditingKayit] = useState<SahaKayit | null>(null);
  const [dialogInitialPhotos, setDialogInitialPhotos] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [todayFilter, setTodayFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Pagination + stats
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalStats, setTotalStats] = useState<{ toplam: number; bugun: number }>({ toplam: 0, bugun: 0 });

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

  const { showSnackbar } = useSnackbar();
  const { user } = useAuth();

  const loadKayitlar = useCallback(async (page = 1, overrides?: { search?: string; startDate?: string; endDate?: string; today?: boolean }) => {
    try {
      setLoading(true);
      const params: any = { page, limit: PAGE_SIZE };
      const s = overrides?.search !== undefined ? overrides.search : searchText;
      const sd = overrides?.startDate !== undefined ? overrides.startDate : startDate;
      const ed = overrides?.endDate !== undefined ? overrides.endDate : endDate;
      const td = overrides?.today !== undefined ? overrides.today : todayFilter;
      if (s) params.search = s;
      if (sd) params.startDate = sd;
      if (ed) params.endDate = ed;
      if (td) params.today = true;
      const resp = await sahaService.getKayitlar(params);
      setKayitlar(resp.data);
      setCurrentPage(resp.pagination.page);
      setTotalPages(resp.pagination.totalPages);
      setTotalRecords(resp.pagination.total);
      setTotalStats(resp.stats);
    } catch (error: any) {
      console.error('Kayıtlar yüklenirken hata:', error);
      showSnackbar(error?.response?.data?.message || 'Kayıtlar yüklenirken hata oluştu!', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchText, startDate, endDate, todayFilter, showSnackbar]);

  useEffect(() => {
    loadKayitlar(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    loadKayitlar(1);
  };

  const handleClearFilters = () => {
    setSearchText('');
    setStartDate('');
    setEndDate('');
    setTodayFilter(false);
    loadKayitlar(1, { search: '', startDate: '', endDate: '', today: false });
  };

  const handleToggleToday = () => {
    const next = !todayFilter;
    setTodayFilter(next);
    loadKayitlar(1, { today: next });
  };

  const handleOpenDialog = async (kayit?: SahaKayit) => {
    if (kayit) {
      setEditingKayit(kayit);
      if (photoCache[kayit.id]) {
        setDialogInitialPhotos(photoCache[kayit.id]);
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
          setDialogInitialPhotos(fotolar);
        } catch {
          setDialogInitialPhotos([]);
        }
      } else {
        setDialogInitialPhotos([]);
      }
    } else {
      setEditingKayit(null);
      setDialogInitialPhotos([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setEditingKayit(null);
    setDialogInitialPhotos([]);
  }, []);

  const handleDialogSaved = useCallback(() => {
    setOpenDialog(false);
    setEditingKayit(null);
    setDialogInitialPhotos([]);
    loadKayitlar(currentPage);
  }, [loadKayitlar, currentPage]);

  const handlePhotosCached = useCallback((id: number, photos: string[]) => {
    setPhotoCache(prev => ({ ...prev, [id]: photos }));
  }, []);

  const handleDelete = async (kayit: SahaKayit) => {
    if (!window.confirm(`${kayit.isim} ${kayit.soyisim} kaydını silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await sahaService.deleteKayit(kayit.id);
      showSnackbar('Kayıt başarıyla silindi!', 'success');
      loadKayitlar(currentPage);
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
            variant={todayFilter ? 'contained' : 'outlined'}
            startIcon={<Today />}
            onClick={handleToggleToday}
            size="small"
            color={todayFilter ? 'success' : 'primary'}
            sx={!todayFilter ? {
              borderColor: '#0D3282',
              color: '#0D3282',
              '&:hover': { borderColor: '#082052', bgcolor: 'rgba(13, 50, 130, 0.04)' }
            } : undefined}
          >
            BUGÜN
          </Button>
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
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label={`Toplam Kayıtlarım: ${totalStats.toplam}`}
          color="primary"
          variant="outlined"
        />
        <Chip
          label={`Bugünkü Kayıtlarım: ${totalStats.bugun}`}
          color="success"
          variant={todayFilter ? 'filled' : 'outlined'}
          onClick={handleToggleToday}
          sx={{ cursor: 'pointer' }}
        />
        {(searchText || startDate || endDate || todayFilter) && (
          <Chip
            label={`Filtreli Sonuç: ${totalRecords}`}
            color="info"
            variant="outlined"
          />
        )}
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

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, value) => loadKayitlar(value)}
            color="primary"
            size="medium"
          />
        </Box>
      )}

      {/* Add/Edit Dialog (extracted for performance) */}
      <SahaKayitDialog
        open={openDialog}
        editingKayit={editingKayit}
        initialPhotos={dialogInitialPhotos}
        onClose={handleCloseDialog}
        onSaved={handleDialogSaved}
        onPhotosCached={handlePhotosCached}
      />

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
