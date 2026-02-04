import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  CardMedia,
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
} from '@mui/icons-material';
import { useSnackbar } from '../context/SnackbarContext';
import { sahaService } from '../services/api';
import { SahaKayit, SahaElemani } from '../types';

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
  const [transformOrigin, setTransformOrigin] = useState({ x: 50, y: 50 }); // yüzde olarak
  const [isPanning, setIsPanning] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const imageContainerRef = React.useRef<HTMLDivElement>(null);
  
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kayitlarData, sahaElemanlariData] = await Promise.all([
        sahaService.getAllKayitlar(),
        sahaService.getSahaElemanlari(),
      ]);
      setKayitlar(kayitlarData);
      setSahaElemanlari(sahaElemanlariData);
    } catch (error: any) {
      console.error('Veriler yüklenirken hata:', error);
      showSnackbar('Veriler yüklenirken hata oluştu!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchText) params.search = searchText;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedSahaElemani) params.sahaElemaniId = selectedSahaElemani;
      
      const data = await sahaService.getAllKayitlar(params);
      setKayitlar(data);
    } catch (error: any) {
      console.error('Arama yapılırken hata:', error);
      showSnackbar('Arama yapılırken hata oluştu!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchText('');
    setStartDate('');
    setEndDate('');
    setSelectedSahaElemani('');
    loadData();
  };

  // İstatistikler
  const stats = {
    toplam: kayitlar.length,
    bugun: kayitlar.filter(k => {
      const today = new Date().toDateString();
      return new Date(k.created_at).toDateString() === today;
    }).length,
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
        <Box sx={{ display: 'flex', gap: 1 }}>
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
          Henüz saha kaydı bulunmuyor.
        </Alert>
      ) : viewMode === 'cards' ? (
        /* Cards View */
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
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}>
                {fotolar.length > 0 ? (
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="180"
                      image={fotolar[0]}
                      alt={`${kayit.isim} ${kayit.soyisim}`}
                      sx={{ objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => { setSelectedImages(fotolar); setCurrentImageIndex(0); }}
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
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {kayit.notlar.length > 80 ? kayit.notlar.substring(0, 80) + '...' : kayit.notlar}
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
                <TableRow key={kayit.id} hover>
                  <TableCell>
                    {fotolar.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <img 
                          src={fotolar[0]} 
                          alt={`${kayit.isim} ${kayit.soyisim}`}
                          style={{ 
                            width: 50, 
                            height: 50, 
                            objectFit: 'cover', 
                            borderRadius: 4,
                            cursor: 'pointer',
                          }}
                          onClick={() => { setSelectedImages(fotolar); setCurrentImageIndex(0); }}
                        />
                        {fotolar.length > 1 && (
                          <Chip label={`+${fotolar.length - 1}`} size="small" />
                        )}
                      </Box>
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
                    <Typography variant="body2" noWrap title={kayit.notlar}>
                      {kayit.notlar || '-'}
                    </Typography>
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

      {/* Image Preview Dialog - Multiple Photos Support with Zoom */}
      <Dialog 
        open={selectedImages.length > 0} 
        onClose={() => { setSelectedImages([]); setZoomLevel(1); setIsFullscreen(false); setPanPosition({ x: 0, y: 0 }); setTransformOrigin({ x: 50, y: 50 }); }}
        maxWidth={isFullscreen ? false : "md"}
        fullScreen={isFullscreen}
        PaperProps={{
          sx: isFullscreen ? { bgcolor: 'rgba(0,0,0,0.95)' } : {}
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Fotoğraf {selectedImages.length > 1 ? `(${currentImageIndex + 1}/${selectedImages.length})` : ''}</span>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
              disabled={zoomLevel <= 0.5}
              title="Küçült"
            >
              <ZoomOut />
            </IconButton>
            <Typography sx={{ display: 'flex', alignItems: 'center', minWidth: 50, justifyContent: 'center' }}>
              {Math.round(zoomLevel * 100)}%
            </Typography>
            <IconButton
              onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
              disabled={zoomLevel >= 3}
              title="Büyült"
            >
              <ZoomIn />
            </IconButton>
            <IconButton
              onClick={() => setIsFullscreen(prev => !prev)}
              title={isFullscreen ? 'Normal Mod' : 'Tam Ekran'}
            >
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
            <IconButton
              onClick={() => { setSelectedImages([]); setZoomLevel(1); setIsFullscreen(false); setPanPosition({ x: 0, y: 0 }); setTransformOrigin({ x: 50, y: 50 }); }}
              title="Kapat"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
          {selectedImages.length > 0 && (
            <Box sx={{ textAlign: 'center', width: '100%' }}>
              <Box 
                ref={imageContainerRef}
                sx={{ 
                  overflow: 'hidden', 
                  maxHeight: isFullscreen ? 'calc(100vh - 200px)' : '60vh',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in',
                  userSelect: 'none',
                  position: 'relative',
                }}
                onWheel={(e) => {
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setTransformOrigin({ x, y });
                  
                  if (e.deltaY < 0) {
                    // Scroll up - zoom in
                    setZoomLevel(prev => Math.min(5, prev + 0.25));
                  } else {
                    // Scroll down - zoom out
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
                    maxHeight: isFullscreen ? 'calc(100vh - 200px)' : '60vh',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                  }} 
                />
              </Box>
              {selectedImages.length > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => { setCurrentImageIndex((prev) => (prev - 1 + selectedImages.length) % selectedImages.length); setZoomLevel(1); setPanPosition({ x: 0, y: 0 }); setTransformOrigin({ x: 50, y: 50 }); }}
                  >
                    ← Önceki
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => { setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length); setZoomLevel(1); setPanPosition({ x: 0, y: 0 }); setTransformOrigin({ x: 50, y: 50 }); }}
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
                      onClick={() => { setCurrentImageIndex(idx); setZoomLevel(1); setPanPosition({ x: 0, y: 0 }); setTransformOrigin({ x: 50, y: 50 }); }}
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

export default SahaKayitlari;
