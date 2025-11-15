import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import { Islem } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface PrintEditorProps {
  open: boolean;
  onClose: () => void;
  islem: Islem;
}

interface Position {
  left: number;
  top: number;
}

interface FieldConfig {
  id: string;
  label: string;
  value: string;
  position: Position;
  isStatic?: boolean; // Sabit alan mı (MEFA TEKNİK gibi)
}

const formatPhoneNumber = (phone: string | undefined): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
};

const PrintEditor: React.FC<PrintEditorProps> = ({ open, onClose, islem }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const paperRef = useRef<HTMLDivElement>(null);

  // Varsayılan alan pozisyonları (mm cinsinden)
  const getDefaultFields = (): FieldConfig[] => {
    const fields: FieldConfig[] = [];
    
    // Sadece değerler, etiket yok
    if (islem.id) {
      fields.push({ id: 'servis_no', label: 'Servis No', value: islem.id.toString(), position: { left: 150, top: 10 } });
    }
    
    if (islem.full_tarih) {
      fields.push({ id: 'tarih', label: 'Tarih', value: new Date(islem.full_tarih).toLocaleDateString('tr-TR'), position: { left: 150, top: 15 } });
      fields.push({ id: 'saat', label: 'Saat', value: new Date(islem.full_tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), position: { left: 150, top: 20 } });
    }
    
    if (islem.ad_soyad) {
      fields.push({ id: 'ad_soyad', label: 'Ad Soyad', value: islem.ad_soyad, position: { left: 20, top: 35 } });
    }
    
    // Adres parçalarını ayrı ayrı ekle
    if (islem.ilce) {
      fields.push({ id: 'ilce', label: 'İlçe', value: islem.ilce.toUpperCase(), position: { left: 20, top: 42 } });
    }
    
    if (islem.mahalle) {
      fields.push({ id: 'mahalle', label: 'Mahalle', value: islem.mahalle.toUpperCase() + ' MAH.', position: { left: 20, top: 47 } });
    }
    
    if (islem.cadde) {
      fields.push({ id: 'cadde', label: 'Cadde', value: islem.cadde + ' Cad.', position: { left: 20, top: 52 } });
    }
    
    if (islem.sokak) {
      fields.push({ id: 'sokak', label: 'Sokak', value: islem.sokak + ' Sok.', position: { left: 20, top: 57 } });
    }
    
    if (islem.apartman_site) {
      fields.push({ id: 'apartman_site', label: 'Apartman/Site', value: islem.apartman_site, position: { left: 20, top: 62 } });
    }
    
    if (islem.kapi_no) {
      fields.push({ id: 'kapi_no', label: 'Kapı No', value: 'No:' + islem.kapi_no, position: { left: 20, top: 67 } });
    }
    
    if (islem.blok_no) {
      fields.push({ id: 'blok_no', label: 'Blok No', value: 'Blok:' + islem.blok_no, position: { left: 50, top: 67 } });
    }
    
    if (islem.daire_no) {
      fields.push({ id: 'daire_no', label: 'Daire No', value: 'D:' + islem.daire_no, position: { left: 80, top: 67 } });
    }
    
    if (islem.cep_tel) {
      fields.push({ id: 'cep_tel', label: 'Cep Tel', value: formatPhoneNumber(islem.cep_tel), position: { left: 20, top: 75 } });
    }
    
    if (islem.sabit_tel) {
      fields.push({ id: 'sabit_tel', label: 'Sabit Tel', value: formatPhoneNumber(islem.sabit_tel), position: { left: 20, top: 80 } });
    }
    
    if (islem.yedek_tel) {
      fields.push({ id: 'yedek_tel', label: 'Yedek Tel', value: formatPhoneNumber(islem.yedek_tel), position: { left: 20, top: 85 } });
    }
    
    if (islem.urun) {
      fields.push({ id: 'urun', label: 'Ürün', value: islem.urun, position: { left: 120, top: 35 } });
    }
    
    if (islem.marka) {
      fields.push({ id: 'marka', label: 'Marka', value: islem.marka, position: { left: 120, top: 42 } });
    }
    
    if (islem.sikayet) {
      fields.push({ id: 'sikayet', label: 'Şikayet', value: islem.sikayet, position: { left: 20, top: 95 } });
    }
    
    if (islem.teknisyen_ismi) {
      fields.push({ id: 'teknisyen', label: 'Teknisyen', value: islem.teknisyen_ismi, position: { left: 20, top: 105 } });
    }
    
    if (islem.yapilan_islem) {
      fields.push({ id: 'yapilan_islem', label: 'Yapılan İşlem', value: islem.yapilan_islem, position: { left: 20, top: 115 } });
    }
    
    if (islem.tutar) {
      fields.push({ id: 'tutar', label: 'Tutar', value: islem.tutar.toString() + ' TL', position: { left: 20, top: 125 } });
    }
    
    // MEFA TEKNİK alanları - her zaman ekle (ayrı ayrı)
    fields.push({ 
      id: 'mefa', 
      label: 'MEFA', 
      value: 'MEFA', 
      position: { left: 120, top: 5 }
    });
    
    fields.push({ 
      id: 'teknik', 
      label: 'TEKNİK', 
      value: 'TEKNİK', 
      position: { left: 145, top: 5 }
    });
    
    fields.push({ 
      id: 'mefa_telefon', 
      label: 'MEFA Telefon', 
      value: '0212 569 64 64', 
      position: { left: 120, top: 10 }
    });
    
    if (islem.is_durumu) {
      const durumText = islem.is_durumu === 'tamamlandi' ? 'Tamamlandı' : 'Açık';
      fields.push({ id: 'durum', label: 'Durum', value: durumText, position: { left: 20, top: 135 } });
    }

    return fields;
  };

  // Marka bazında kayıt anahtarı oluştur
  const getStorageKey = () => {
    const marka = islem.marka?.toLowerCase().trim() || 'default';
    return marka;
  };

  const [fields, setFields] = useState<FieldConfig[]>(getDefaultFields());
  const [isLoading, setIsLoading] = useState(true);

  // Veritabanından ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      const marka = getStorageKey();
      console.log('📥 Yükleniyor:', marka);
      try {
        const response = await api.get(`/printer-settings/${marka}`);
        console.log('📥 API Cevabı:', response.data);
        
        if (response.data && response.data.length > 0) {
          // Veritabanından kaydedilen DÜZENİ (layout) getirdik
          const savedLayout = response.data;
          console.log('✅ Kaydedilmiş düzen bulundu:', savedLayout);
          
          // Şu andaki verileri al (getDefaultFields() yanında da veri doldurulmakta)
          const currentFields = getDefaultFields();
          
          // SADECE kaydedilmiş alanları kullan (silinmiş olanları ekleme!)
          // Kaydedilen her alan için, mevcut değerleri bul ve birleştir
          const mergedFields = savedLayout.map((savedLayoutItem: any) => {
            const currentField = currentFields.find(f => f.id === savedLayoutItem.id);
            
            if (currentField) {
              // Kaydedilen koordinatları kullan, mevcut value'yu koru
              return {
                ...currentField,
                position: savedLayoutItem.position,
                label: savedLayoutItem.label,
                isStatic: savedLayoutItem.isStatic
              };
            }
            
            // Eğer alan artık varsayılan listede yoksa (eski kayıt), atla
            return null;
          }).filter((f: FieldConfig | null): f is FieldConfig => f !== null);
          
          console.log('✅ Birleştirilmiş alanlar:', mergedFields);
          setFields(mergedFields);
        } else {
          // Kaydedilmiş düzen yoksa varsayılanı kullan
          console.log('⚠️ Kaydedilmiş düzen bulunamadı, varsayılan kullanılıyor');
          setFields(getDefaultFields());
        }
      } catch (error: any) {
        console.error('❌ Yazıcı ayarları yükleme hatası:', error);
        console.error('Hata detayı:', error.response?.data);
        setFields(getDefaultFields());
      } finally {
        setIsLoading(false);
      }
    };
    
    if (open) {
      loadSettings();
    }
  }, [open, islem.marka]);

  // A4 kağıt boyutları (210mm x 297mm) - piksel olarak
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;
  const SCALE = 3; // 1mm = 3px gösterim için

  const mmToPx = (mm: number) => mm * SCALE;
  const pxToMm = (px: number) => px / SCALE;

  const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
    if (!isAdmin) {
      setSnackbar({
        open: true,
        message: 'Sadece admin kullanıcılar ayarları değiştirebilir!',
        severity: 'warning'
      });
      return;
    }
    
    setSelectedField(fieldId);
    setIsDragging(true);
    
    const field = fields.find(f => f.id === fieldId);
    if (field && paperRef.current) {
      const rect = paperRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - mmToPx(field.position.left),
        y: e.clientY - rect.top - mmToPx(field.position.top),
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedField || !paperRef.current) return;

    const rect = paperRef.current.getBoundingClientRect();
    const newLeft = pxToMm(e.clientX - rect.left - dragOffset.x);
    const newTop = pxToMm(e.clientY - rect.top - dragOffset.y);

    // Sınırları kontrol et
    const boundedLeft = Math.max(0, Math.min(A4_WIDTH_MM - 10, newLeft));
    const boundedTop = Math.max(0, Math.min(A4_HEIGHT_MM - 5, newTop));

    setFields(prev =>
      prev.map(field =>
        field.id === selectedField
          ? { ...field, position: { left: boundedLeft, top: boundedTop } }
          : field
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handlePositionChange = (fieldId: string, axis: 'left' | 'top', value: string) => {
    if (!isAdmin) {
      setSnackbar({
        open: true,
        message: 'Sadece admin kullanıcılar ayarları değiştirebilir!',
        severity: 'warning'
      });
      return;
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setFields(prev =>
      prev.map(field =>
        field.id === fieldId
          ? { ...field, position: { ...field.position, [axis]: numValue } }
          : field
      )
    );
  };

  const handleDeleteField = (fieldId: string) => {
    if (!isAdmin) {
      setSnackbar({
        open: true,
        message: 'Sadece admin kullanıcılar alanları silebilir!',
        severity: 'warning'
      });
      return;
    }
    
    setFields(prev => prev.filter(field => field.id !== fieldId));
    if (selectedField === fieldId) {
      setSelectedField(null);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      setSnackbar({
        open: true,
        message: 'Sadece admin kullanıcılar ayarları kaydedebilir!',
        severity: 'error'
      });
      return;
    }
    
    const marka = getStorageKey();
    try {
      // Sadece koordinatları kaydet (verileri değil!)
      // Her form için farklı veriler olacak, ama düzen aynı kalacak
      const layoutConfig = fields.map(f => ({
        id: f.id,
        label: f.label,
        position: f.position,
        isStatic: f.isStatic // Sabit alanlar (MEFA TEKNİK gibi)
      }));
      
      console.log('📝 Kaydedilecek düzen:', { marka, layoutConfig });
      
      const response = await api.post(`/printer-settings/${marka}`, layoutConfig);
      console.log('✅ Kaydedildi, sunucu cevabı:', response.data);
      
      setSnackbar({
        open: true,
        message: `"${islem.marka}" markası için şablon düzeni kaydedildi! Tüm işlemlerde bu düzen kullanılacak.`,
        severity: 'success'
      });
    } catch (error: any) {
      console.error('❌ Yazıcı ayarları kaydetme hatası:', error);
      console.error('Hata detayı:', error.response?.data);
      setSnackbar({
        open: true,
        message: 'Ayarlar kaydedilemedi! ' + (error.response?.data?.message || ''),
        severity: 'error'
      });
    }
  };

  const handleReset = async () => {
    if (!isAdmin) {
      setSnackbar({
        open: true,
        message: 'Sadece admin kullanıcılar ayarları sıfırlayabilir!',
        severity: 'error'
      });
      return;
    }
    
    const defaultFields = getDefaultFields();
    setFields(defaultFields);
    const marka = getStorageKey();
    
    try {
      await api.delete(`/printer-settings/${marka}`);
      setSnackbar({
        open: true,
        message: 'Varsayılan ayarlara sıfırlandı! Tüm bilgisayarlarda geçerli olacak.',
        severity: 'info'
      });
    } catch (error) {
      console.error('Yazıcı ayarları silme hatası:', error);
      setSnackbar({
        open: true,
        message: 'Ayarlar sıfırlandı ancak sunucudan silinemedi!',
        severity: 'warning'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Servis Formu</title>
          <style>
            @page { 
              size: A4; 
              margin: 0; 
            }
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
            }
            body { 
              font-family: 'Courier New', Courier, monospace;
              font-size: 18px;
              font-weight: 2000;
              color: #000;
              background: white;
              position: relative;
              width: 210mm;
              height: 297mm;
            }
            .item {
              position: absolute;
              font-weight: 900;
              font-family: 'Courier New', Courier, monospace;
            }
            .item-small {
              font-size: 15px;
              max-width: 170mm;
              white-space: normal;
              word-wrap: break-word;
              line-height: 1.2;
            }
            .item-normal {
              font-size: 15px;
              white-space: nowrap;
            }
          </style>
        </head>
        <body>
          ${fields.map(field => {
            const sizeClass = ['yapilan_islem', 'sikayet'].includes(field.id) ? 'item-small' : 'item-normal';
            const value = field.value || '';
            // MEFA TEKNİK alanlarını kalın ve mavi yap
            const staticStyle = field.isStatic ? 'font-weight: 900; color: #0D3282; font-size: 15px;' : '';
            return `<div class="item ${sizeClass}" style="left: ${field.position.left}mm; top: ${field.position.top}mm; ${staticStyle}">${value}</div>`;
          }).join('\n          ')}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">Yazdırma Şablonu Düzenle</Typography>
            <Typography variant="caption" color="primary" fontWeight="bold">
              Marka: {islem.marka || 'Bilinmiyor'} {isLoading && '(Yükleniyor...)'}
            </Typography>
            <Typography variant="caption" color="primary" fontWeight="bold">
              Marka: {islem.marka || 'Bilinmiyor'}
            </Typography>
          </Box>
          <Box>
            <Tooltip title={isAdmin ? "Varsayılana Sıfırla" : "Sadece admin sıfırlayabilir"}>
              <span>
                <IconButton onClick={handleReset} color="warning" disabled={!isAdmin}>
                  <RestartAltIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={isAdmin ? "Ayarları Kaydet" : "Sadece admin kaydedebilir"}>
              <span>
                <IconButton onClick={handleSave} color="primary" disabled={!isAdmin}>
                  <SaveIcon />
                </IconButton>
              </span>
            </Tooltip>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {isAdmin 
            ? `Alanları sürükleyerek konumlarını ayarlayın. Koordinatları manuel olarak da girebilirsiniz. Bu ayarlar sadece "${islem.marka}" markası için geçerlidir.`
            : 'Sadece admin kullanıcılar şablon ayarlarını değiştirebilir. Yazdırma işlemi yapabilirsiniz.'
          }
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {!isAdmin && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Bilgi:</strong> Sadece admin kullanıcılar yazdırma şablonunu düzenleyebilir. 
            Şablon "{islem.marka}" markası için kaydedilmiştir. Yazdırma işlemi yapabilirsiniz.
          </Alert>
        )}
        
        <Box display="flex" gap={2}>
          {/* Sol panel - A4 kağıt önizleme */}
          <Paper
            ref={paperRef}
            sx={{
              width: mmToPx(A4_WIDTH_MM),
              height: mmToPx(A4_HEIGHT_MM),
              position: 'relative',
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              cursor: isDragging ? 'grabbing' : 'default',
              flexShrink: 0,
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {fields.map((field) => (
              <Box
                key={field.id}
                sx={{
                  position: 'absolute',
                  left: mmToPx(field.position.left),
                  top: mmToPx(field.position.top),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  padding: '2px 4px',
                  backgroundColor: selectedField === field.id ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
                  border: selectedField === field.id ? '1px solid #1976d2' : '1px dashed transparent',
                  fontSize: ['yapilan_islem', 'sikayet'].includes(field.id) ? '12px' : '14px',
                  fontWeight: 900,
                  fontFamily: 'Courier New, Courier, monospace',
                  whiteSpace: ['yapilan_islem', 'sikayet'].includes(field.id) ? 'normal' : 'nowrap',
                  wordWrap: ['yapilan_islem', 'sikayet'].includes(field.id) ? 'break-word' : 'normal',
                  maxWidth: ['yapilan_islem', 'sikayet'].includes(field.id) ? mmToPx(170) : 'none',
                  lineHeight: ['yapilan_islem', 'sikayet'].includes(field.id) ? '1.2' : 'normal',
                  overflow: 'visible',
                  '&:hover': {
                    border: '1px dashed #1976d2',
                    '& .delete-btn': {
                      opacity: 1,
                    }
                  },
                }}
                title={field.label}
              >
                <Box
                  sx={{ cursor: isAdmin ? 'grab' : 'default' }}
                  onMouseDown={(e) => handleMouseDown(e, field.id)}
                >
                  {field.value || '(boş)'}
                </Box>
                {isAdmin && (
                  <IconButton
                    className="delete-btn"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteField(field.id);
                    }}
                    sx={{
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      padding: '2px',
                      minWidth: '20px',
                      minHeight: '20px',
                      '&:hover': {
                        backgroundColor: 'error.light',
                        color: 'white',
                      }
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: '14px' }} />
                  </IconButton>
                )}
              </Box>
            ))}
          </Paper>

          {/* Sağ panel - Koordinat ayarları */}
          <Box sx={{ flex: 1, overflow: 'auto', maxHeight: mmToPx(A4_HEIGHT_MM) }}>
            <Typography variant="subtitle2" gutterBottom>
              Alan Koordinatları (mm)
            </Typography>
            {selectedField && (
              <Paper sx={{ p: 2, mb: 2, backgroundColor: '#e3f2fd' }}>
                <Typography variant="subtitle2" color="primary">
                  Seçili: {fields.find(f => f.id === selectedField)?.label}
                </Typography>
              </Paper>
            )}
            <Box display="flex" flexDirection="column" gap={1}>
              {fields.map((field) => (
                <Paper
                  key={field.id}
                  sx={{
                    p: 1.5,
                    backgroundColor: selectedField === field.id ? '#e3f2fd' : '#fafafa',
                    border: selectedField === field.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                  }}
                  onClick={() => setSelectedField(field.id)}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="caption" fontWeight="bold">
                      {field.label}
                    </Typography>
                    <Tooltip title={isAdmin ? "Alanı Sil" : "Sadece admin silebilir"}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteField(field.id);
                          }}
                          disabled={!isAdmin}
                          sx={{
                            padding: '4px',
                            '&:hover': {
                              backgroundColor: 'error.light',
                              color: 'white',
                            }
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: '16px' }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                  <Box display="flex" gap={1} alignItems="center">
                    <TextField
                      size="small"
                      label="Sol (mm)"
                      type="number"
                      value={field.position.left.toFixed(1)}
                      onChange={(e) => handlePositionChange(field.id, 'left', e.target.value)}
                      sx={{ width: 100 }}
                      inputProps={{ step: 0.5 }}
                      disabled={!isAdmin}
                    />
                    <TextField
                      size="small"
                      label="Üst (mm)"
                      type="number"
                      value={field.position.top.toFixed(1)}
                      onChange={(e) => handlePositionChange(field.id, 'top', e.target.value)}
                      sx={{ width: 100 }}
                      inputProps={{ step: 0.5 }}
                      disabled={!isAdmin}
                    />
                    <Typography variant="caption" sx={{ flex: 1, fontSize: '11px' }}>
                      {field.value ? (
                        <>
                          {field.value.substring(0, 30)}{field.value.length > 30 ? '...' : ''}
                        </>
                      ) : '(Boş)'}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button onClick={handleSave} variant="outlined" startIcon={<SaveIcon />}>
          Ayarları Kaydet
        </Button>
        <Button onClick={handlePrint} variant="contained" startIcon={<PrintIcon />}>
          Yazdır
        </Button>
      </DialogActions>

      {/* Bildirim Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default PrintEditor;
