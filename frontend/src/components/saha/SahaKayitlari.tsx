import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  Chip,
  Alert,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Person,
  CalendarToday,
  FilterList,
  Refresh,
  ExpandMore,
  ExpandLess,
  Close,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  FullscreenExit,
  PhotoCamera,
} from '@mui/icons-material';
import { useSnackbar } from '../../context/SnackbarContext';
import { sahaService } from '../../services/api';
import { SahaKayit, SahaElemani } from '../../types';

// Lazy-loading thumbnail: yalnızca viewport'a girdiğinde ilk fotoğrafı backend'den çeker.
// Performansı korumak için IntersectionObserver ve ortak bir cache kullanır.
interface LazyThumbnailProps {
  kayitId: number;
  alt: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  objectFit?: 'cover' | 'contain';
  onClick?: () => void;
  thumbnailCache: Record<number, string | null>;
  setThumbnailCache: React.Dispatch<React.SetStateAction<Record<number, string | null>>>;
}

const LazyThumbnail: React.FC<LazyThumbnailProps> = ({
  kayitId, alt, width = '100%', height = 180, borderRadius = 0, objectFit = 'cover', onClick,
  thumbnailCache, setThumbnailCache,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const cached = thumbnailCache[kayitId];

  React.useEffect(() => {
    if (cached !== undefined) return; // zaten denendi
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      });
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [cached]);

  React.useEffect(() => {
    if (!visible || cached !== undefined || loading) return;
    setLoading(true);
    sahaService.getKayitThumbnail(kayitId)
      .then((data) => {
        setThumbnailCache((prev) => ({ ...prev, [kayitId]: data || null }));
      })
      .catch(() => {
        setThumbnailCache((prev) => ({ ...prev, [kayitId]: null }));
      })
      .finally(() => setLoading(false));
  }, [visible, cached, kayitId, loading, setThumbnailCache]);

  return (
    <Box
      ref={ref}
      onClick={onClick}
      sx={{
        width,
        height,
        borderRadius,
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        bgcolor: '#e3f2fd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        '&:hover': onClick ? { opacity: 0.9 } : undefined,
      }}
    >
      {cached ? (
        <img
          src={cached}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit }}
          loading="lazy"
        />
      ) : loading ? (
        <CircularProgress size={24} />
      ) : (
        <PhotoCamera sx={{ color: '#1976d2', fontSize: typeof height === 'number' && height < 80 ? 24 : 60 }} />
      )}
    </Box>
  );
};

const SahaKayitlari: React.FC = () => {
  const [kayitlar, setKayitlar] = useState<SahaKayit[]>([]);
  const [sahaElemanlari, setSahaElemanlari] = useState<SahaElemani[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSahaElemani, setSelectedSahaElemani] = useState<number | ''>('');
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoCache, setPhotoCache] = useState<Record<number, string[]>>({});
  const [thumbnailCache, setThumbnailCache] = useState<Record<number, string | null>>({});
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [lastTouchCenter, setLastTouchCenter] = useState<{ x: number; y: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [todayFilter, setTodayFilter] = useState(false);
  const [globalStats, setGlobalStats] = useState<{ toplam: number; bugun: number }>({ toplam: 0, bugun: 0 });
  const pageSize = 50;
  const imageContainerRef = React.useRef<HTMLDivElement>(null);
  
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (page = 1) => {
    try {
      setLoading(true);
      const [kayitlarResponse, sahaElemanlariData] = await Promise.all([
        sahaService.getAllKayitlar({ page, limit: pageSize }),
        sahaService.getSahaElemanlari(),
      ]);
      setKayitlar(kayitlarResponse.data);
      setTotalRecords(kayitlarResponse.pagination.total);
      setTotalPages(kayitlarResponse.pagination.totalPages);
      setCurrentPage(kayitlarResponse.pagination.page);
      setGlobalStats(kayitlarResponse.stats);
      setSahaElemanlari(sahaElemanlariData);
    } catch (error: any) {
      console.error('Veriler yüklenirken hata:', error);
      showSnackbar('Veriler yüklenirken hata oluştu!', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fotoğrafları lazy load ile aç
  const handleOpenPhotos = async (kayitId: number) => {
    // Cache'de varsa direkt aç
    if (photoCache[kayitId]) {
      setSelectedImages(photoCache[kayitId]);
      setCurrentImageIndex(0);
      return;
    }

    try {
      setPhotoLoading(true);
      const fotoData = await sahaService.getKayitPhotos(kayitId);
      let fotolar: string[] = [];
      if (fotoData) {
        try {
          const parsed = JSON.parse(fotoData);
          fotolar = Array.isArray(parsed) ? parsed : [fotoData];
        } catch {
          fotolar = [fotoData];
        }
      }
      // Cache'e kaydet
      setPhotoCache(prev => ({ ...prev, [kayitId]: fotolar }));
      setSelectedImages(fotolar);
      setCurrentImageIndex(0);
    } catch (error) {
      console.error('Fotoğraflar yüklenirken hata:', error);
      showSnackbar('Fotoğraflar yüklenirken hata oluştu!', 'error');
    } finally {
      setPhotoLoading(false);
    }
  };

  const buildParams = (page: number, overrides?: { today?: boolean; search?: string; startDate?: string; endDate?: string; sahaElemaniId?: number | '' }) => {
    const params: any = { page, limit: pageSize };
    const s = overrides?.search !== undefined ? overrides.search : searchText;
    const sd = overrides?.startDate !== undefined ? overrides.startDate : startDate;
    const ed = overrides?.endDate !== undefined ? overrides.endDate : endDate;
    const se = overrides?.sahaElemaniId !== undefined ? overrides.sahaElemaniId : selectedSahaElemani;
    const td = overrides?.today !== undefined ? overrides.today : todayFilter;
    if (s) params.search = s;
    if (sd) params.startDate = sd;
    if (ed) params.endDate = ed;
    if (se) params.sahaElemaniId = se;
    if (td) params.today = true;
    return params;
  };

  const applyLoad = async (page: number, overrides?: { today?: boolean; search?: string; startDate?: string; endDate?: string; sahaElemaniId?: number | '' }) => {
    try {
      setLoading(true);
      const response = await sahaService.getAllKayitlar(buildParams(page, overrides));
      setKayitlar(response.data);
      setTotalRecords(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.page);
      setGlobalStats(response.stats);
    } catch (error: any) {
      console.error('Yükleme hatası:', error);
      showSnackbar(error?.response?.data?.message || 'Yükleme sırasında hata oluştu!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => applyLoad(1);
  const handlePageChange = (newPage: number) => applyLoad(newPage);

  const handleToggleToday = () => {
    const next = !todayFilter;
    setTodayFilter(next);
    applyLoad(1, { today: next });
  };

  const handleClearFilters = () => {
    setSearchText('');
    setStartDate('');
    setEndDate('');
    setSelectedSahaElemani('');
    setTodayFilter(false);
    applyLoad(1, { search: '', startDate: '', endDate: '', sahaElemaniId: '', today: false });
  };

  // İstatistikler
  const stats = {
    toplam: globalStats.toplam,
    bugun: globalStats.bugun,
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
        <Typography variant="h5" fontWeight={600} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, color: '#2C3E82' }}>
          Saha Kayıtları Görüntüleme
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant={todayFilter ? 'contained' : 'outlined'}
            size="small"
            color={todayFilter ? 'success' : 'primary'}
            onClick={handleToggleToday}
            sx={!todayFilter ? {
              borderColor: '#0D3282',
              color: '#0D3282',
              '&:hover': { borderColor: '#082052', bgcolor: 'rgba(13, 50, 130, 0.04)' },
            } : undefined}
          >
            BUGÜN ({globalStats.bugun})
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('cards')}
            sx={{
              bgcolor: viewMode === 'cards' ? '#0D3282' : 'transparent',
              borderColor: '#0D3282',
              color: viewMode === 'cards' ? 'white' : '#0D3282',
              '&:hover': {
                bgcolor: viewMode === 'cards' ? '#082052' : 'rgba(13, 50, 130, 0.04)',
                borderColor: '#082052',
              }
            }}
          >
            KARTLAR
          </Button>
          <Button
            variant={viewMode === 'table' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('table')}
            sx={{
              bgcolor: viewMode === 'table' ? '#0D3282' : 'transparent',
              borderColor: '#0D3282',
              color: viewMode === 'table' ? 'white' : '#0D3282',
              '&:hover': {
                bgcolor: viewMode === 'table' ? '#082052' : 'rgba(13, 50, 130, 0.04)',
                borderColor: '#082052',
              }
            }}
          >
            TABLO
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          <FilterList />
          <Typography variant="subtitle1" fontWeight={500}>Filtreler</Typography>
          <IconButton size="small" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        
        <Collapse in={showFilters}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Saha Elemanı</InputLabel>
                <Select
                  value={selectedSahaElemani}
                  label="Saha Elemanı"
                  onChange={(e) => setSelectedSahaElemani(e.target.value as number | '')}
                >
                  <MenuItem value="">Tümü</MenuItem>
                  {sahaElemanlari.map((se) => (
                    <MenuItem key={se.id} value={se.id}>
                      {se.ad_soyad || se.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
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
            <Grid item xs={6} sm={2}>
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
            <Grid item xs={6} sm={2}>
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
            <Grid item xs={12} sm={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  size="small"
                  fullWidth
                  sx={{ bgcolor: '#0D3282', '&:hover': { bgcolor: '#082052' } }}
                >
                  ARA
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
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
                  <Refresh />
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Chip 
          label={`Toplam: ${stats.toplam}`} 
          color="primary" 
          variant="outlined" 
        />
        <Chip 
          label={`Bugün: ${stats.bugun}`} 
          color="success" 
          variant={todayFilter ? 'filled' : 'outlined'}
          onClick={handleToggleToday}
          sx={{ cursor: 'pointer' }}
        />
        {(searchText || startDate || endDate || selectedSahaElemani || todayFilter) && (
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
          Henüz saha kaydı bulunmuyor.
        </Alert>
      ) : viewMode === 'cards' ? (
        /* Cards View */
        <Grid container spacing={2}>
          {kayitlar.map((kayit) => {
            const hasPhotos = (kayit as any).has_photos;
            
            return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={kayit.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}>
                {hasPhotos ? (
                  <Box sx={{ position: 'relative' }}>
                    <LazyThumbnail
                      kayitId={kayit.id}
                      alt={`${kayit.isim} ${kayit.soyisim}`}
                      height={180}
                      onClick={() => handleOpenPhotos(kayit.id)}
                      thumbnailCache={thumbnailCache}
                      setThumbnailCache={setThumbnailCache}
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
                      pointerEvents: 'none',
                    }}>
                      <PhotoCamera sx={{ fontSize: 16 }} />
                      <Typography variant="caption">Fotoğrafları Görüntüle</Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      height: 180,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#f5f5f5',
                    }}
                  >
                    <Person sx={{ fontSize: 60, color: '#ccc' }} />
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" gutterBottom>
                    {kayit.isim} {kayit.soyisim}
                  </Typography>
                  
                  <Chip 
                    label={kayit.saha_elemani_ad_soyad || kayit.saha_elemani_username} 
                    size="small" 
                    color="info"
                    sx={{ mb: 1 }}
                  />
                  
                  {kayit.notlar && (
                    <Tooltip title={kayit.notlar} arrow placement="top">
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, cursor: 'help' }}>
                        {kayit.notlar.length > 80 ? kayit.notlar.substring(0, 80) + '...' : kayit.notlar}
                      </Typography>
                    </Tooltip>
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
              </Card>
            </Grid>
          );
          })}
        </Grid>
      ) : (
        /* Table View */
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#0D3282' }}>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Fotoğraf</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>İsim Soyisim</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Saha Elemanı</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Notlar</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Tarih</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {kayitlar.map((kayit) => {
                const hasPhotos = (kayit as any).has_photos;
                
                return (
                <TableRow key={kayit.id} hover>
                  <TableCell>
                    {hasPhotos ? (
                      <LazyThumbnail
                        kayitId={kayit.id}
                        alt={`${kayit.isim} ${kayit.soyisim}`}
                        width={50}
                        height={50}
                        borderRadius={1}
                        onClick={() => handleOpenPhotos(kayit.id)}
                        thumbnailCache={thumbnailCache}
                        setThumbnailCache={setThumbnailCache}
                      />
                    ) : (
                      <Box sx={{ 
                        width: 50, 
                        height: 50, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: '#f5f5f5',
                        borderRadius: 1,
                      }}>
                        <Person sx={{ color: '#ccc' }} />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={500}>{kayit.isim} {kayit.soyisim}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={kayit.saha_elemani_ad_soyad || kayit.saha_elemani_username} 
                      size="small" 
                      color="info"
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Tooltip title={kayit.notlar || ''} arrow placement="top" disableHoverListener={!kayit.notlar}>
                      <Typography variant="body2" noWrap sx={{ cursor: kayit.notlar ? 'help' : 'default' }}>
                        {kayit.notlar || '-'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {new Date(kayit.created_at).toLocaleString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {!loading && kayitlar.length > 0 && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            size="small"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Önceki
          </Button>
          <Typography variant="body2">
            Sayfa {currentPage} / {totalPages} (Toplam: {totalRecords})
          </Typography>
          <Button
            variant="outlined"
            size="small"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Sonraki
          </Button>
        </Box>
      )}

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

      {/* Image Preview Dialog - Multiple Photos Support with Zoom + Mobile Touch */}
      <Dialog 
        open={selectedImages.length > 0} 
        onClose={() => { setSelectedImages([]); setZoomLevel(1); setIsFullscreen(false); setPanPosition({ x: 0, y: 0 }); setTransformOrigin({ x: 50, y: 50 }); }}
        maxWidth={isFullscreen ? false : "lg"}
        fullWidth={!isFullscreen}
        fullScreen={isFullscreen || window.innerWidth < 600}
        PaperProps={{
          sx: (isFullscreen || window.innerWidth < 600) ? { bgcolor: 'rgba(0,0,0,0.95)' } : {}
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          color: (isFullscreen || window.innerWidth < 600) ? 'white' : 'inherit',
          p: { xs: 1, sm: 2 },
        }}>
          <Typography variant="body1" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
            Fotoğraf {selectedImages.length > 1 ? `(${currentImageIndex + 1}/${selectedImages.length})` : ''}
          </Typography>
          <Box sx={{ display: 'flex', gap: { xs: 0, sm: 0.5 } }}>
            <IconButton
              size="small"
              onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
              disabled={zoomLevel <= 0.5}
              title="Küçült"
              sx={{ color: (isFullscreen || window.innerWidth < 600) ? 'white' : 'inherit' }}
            >
              <ZoomOut fontSize="small" />
            </IconButton>
            <Typography sx={{ display: 'flex', alignItems: 'center', minWidth: 40, justifyContent: 'center', fontSize: '0.8rem' }}>
              {Math.round(zoomLevel * 100)}%
            </Typography>
            <IconButton
              size="small"
              onClick={() => setZoomLevel(prev => Math.min(5, prev + 0.25))}
              disabled={zoomLevel >= 5}
              title="Büyült"
              sx={{ color: (isFullscreen || window.innerWidth < 600) ? 'white' : 'inherit' }}
            >
              <ZoomIn fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setIsFullscreen(prev => !prev)}
              title={isFullscreen ? 'Normal Mod' : 'Tam Ekran'}
              sx={{ color: (isFullscreen || window.innerWidth < 600) ? 'white' : 'inherit', display: { xs: 'none', sm: 'inline-flex' } }}
            >
              {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
            </IconButton>
            <IconButton
              size="small"
              onClick={() => { setSelectedImages([]); setZoomLevel(1); setIsFullscreen(false); setPanPosition({ x: 0, y: 0 }); setTransformOrigin({ x: 50, y: 50 }); }}
              title="Kapat"
              sx={{ color: (isFullscreen || window.innerWidth < 600) ? 'white' : 'inherit' }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', p: { xs: 0.5, sm: 1 } }}>
          {selectedImages.length > 0 && (
            <Box sx={{ textAlign: 'center', width: '100%' }}>
              <Box 
                ref={imageContainerRef}
                sx={{ 
                  overflow: 'hidden', 
                  maxHeight: (isFullscreen || window.innerWidth < 600) ? 'calc(100vh - 180px)' : '70vh',
                  minHeight: { xs: '50vh', sm: 'auto' },
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in',
                  userSelect: 'none',
                  position: 'relative',
                  touchAction: 'none',
                }}
                onWheel={(e) => {
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setTransformOrigin({ x, y });
                  
                  if (e.deltaY < 0) {
                    setZoomLevel(prev => Math.min(5, prev + 0.25));
                  } else {
                    setZoomLevel(prev => {
                      const newZoom = Math.max(1, prev - 0.25);
                      if (newZoom === 1) {
                        setPanPosition({ x: 0, y: 0 });
                        setTransformOrigin({ x: 50, y: 50 });
                      }
                      return newZoom;
                    });
                  }
                }}
                // Mouse events (desktop)
                onMouseDown={(e) => {
                  if (zoomLevel > 1) {
                    setIsPanning(true);
                    setStartPan({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
                  }
                }}
                onMouseMove={(e) => {
                  if (isPanning && zoomLevel > 1) {
                    setPanPosition({
                      x: e.clientX - startPan.x,
                      y: e.clientY - startPan.y
                    });
                  }
                }}
                onMouseUp={() => setIsPanning(false)}
                onMouseLeave={() => setIsPanning(false)}
                onClick={(e) => {
                  if (!isPanning) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    
                    if (zoomLevel === 1) {
                      setTransformOrigin({ x, y });
                      setZoomLevel(2);
                    } else if (zoomLevel >= 2) {
                      setZoomLevel(1);
                      setPanPosition({ x: 0, y: 0 });
                      setTransformOrigin({ x: 50, y: 50 });
                    }
                  }
                }}
                // Touch events (mobile pinch-to-zoom + pan)
                onTouchStart={(e) => {
                  if (e.touches.length === 2) {
                    e.preventDefault();
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    setLastTouchDistance(Math.hypot(dx, dy));
                    setLastTouchCenter({
                      x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                      y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
                    });
                  } else if (e.touches.length === 1 && zoomLevel > 1) {
                    setIsPanning(true);
                    setStartPan({ x: e.touches[0].clientX - panPosition.x, y: e.touches[0].clientY - panPosition.y });
                  }
                }}
                onTouchMove={(e) => {
                  if (e.touches.length === 2 && lastTouchDistance !== null) {
                    e.preventDefault();
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    const newDist = Math.hypot(dx, dy);
                    const scale = newDist / lastTouchDistance;
                    
                    setZoomLevel(prev => {
                      const newZoom = Math.min(5, Math.max(1, prev * scale));
                      if (newZoom === 1) {
                        setPanPosition({ x: 0, y: 0 });
                        setTransformOrigin({ x: 50, y: 50 });
                      }
                      return newZoom;
                    });
                    setLastTouchDistance(newDist);

                    // Pan while pinching
                    if (lastTouchCenter) {
                      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                      setPanPosition(prev => ({
                        x: prev.x + (cx - lastTouchCenter.x),
                        y: prev.y + (cy - lastTouchCenter.y),
                      }));
                      setLastTouchCenter({ x: cx, y: cy });
                    }
                  } else if (e.touches.length === 1 && isPanning && zoomLevel > 1) {
                    setPanPosition({
                      x: e.touches[0].clientX - startPan.x,
                      y: e.touches[0].clientY - startPan.y,
                    });
                  }
                }}
                onTouchEnd={(e) => {
                  if (e.touches.length < 2) {
                    setLastTouchDistance(null);
                    setLastTouchCenter(null);
                  }
                  if (e.touches.length === 0) {
                    setIsPanning(false);
                  }
                }}
              >
                <img 
                  src={selectedImages[currentImageIndex]} 
                  alt="Preview" 
                  draggable={false}
                  style={{ 
                    transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                    transformOrigin: `${transformOrigin.x}% ${transformOrigin.y}%`,
                    transition: isPanning ? 'none' : 'transform 0.2s ease',
                    maxWidth: '100%',
                    maxHeight: (isFullscreen || window.innerWidth < 600) ? 'calc(100vh - 180px)' : '70vh',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    imageRendering: zoomLevel > 1 ? 'high-quality' as any : 'auto',
                    WebkitBackfaceVisibility: 'hidden',
                    filter: zoomLevel > 1.5 ? 'contrast(1.02) saturate(1.02)' : 'none',
                  }} 
                />
              </Box>
              {selectedImages.length > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 1, sm: 2 }, mt: 1.5 }}>
                  <Button 
                    variant="outlined" 
                    size="small"
                    sx={{ color: (isFullscreen || window.innerWidth < 600) ? 'white' : 'inherit', borderColor: (isFullscreen || window.innerWidth < 600) ? 'rgba(255,255,255,0.5)' : 'inherit' }}
                    onClick={() => { setCurrentImageIndex((prev) => (prev - 1 + selectedImages.length) % selectedImages.length); setZoomLevel(1); setPanPosition({ x: 0, y: 0 }); setTransformOrigin({ x: 50, y: 50 }); }}
                  >
                    ← Önceki
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    sx={{ color: (isFullscreen || window.innerWidth < 600) ? 'white' : 'inherit', borderColor: (isFullscreen || window.innerWidth < 600) ? 'rgba(255,255,255,0.5)' : 'inherit' }}
                    onClick={() => { setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length); setZoomLevel(1); setPanPosition({ x: 0, y: 0 }); setTransformOrigin({ x: 50, y: 50 }); }}
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
                      onClick={() => { setCurrentImageIndex(idx); setZoomLevel(1); setPanPosition({ x: 0, y: 0 }); setTransformOrigin({ x: 50, y: 50 }); }}
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

export default SahaKayitlari;
