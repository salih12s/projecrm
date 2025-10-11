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
    const adresParcalari = [
      islem.ilce,
      islem.mahalle,
      islem.cadde,
      islem.sokak,
      islem.apartman_site,
      islem.kapi_no ? 'No:' + islem.kapi_no : '',
      islem.blok_no ? 'Blok:' + islem.blok_no : '',
      islem.daire_no ? 'D:' + islem.daire_no : ''
    ].filter(Boolean).join(' ');

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
    
    if (adresParcalari) {
      fields.push({ id: 'adres', label: 'Adres', value: adresParcalari, position: { left: 20, top: 42 } });
    }
    
    if (islem.cep_tel) {
      fields.push({ id: 'cep_tel', label: 'Cep Tel', value: formatPhoneNumber(islem.cep_tel), position: { left: 20, top: 49 } });
    }
    
    if (islem.sabit_tel) {
      fields.push({ id: 'sabit_tel', label: 'Sabit Tel', value: formatPhoneNumber(islem.sabit_tel), position: { left: 20, top: 56 } });
    }
    
    if (islem.yedek_tel) {
      fields.push({ id: 'yedek_tel', label: 'Yedek Tel', value: formatPhoneNumber(islem.yedek_tel), position: { left: 20, top: 63 } });
    }
    
    if (islem.urun) {
      fields.push({ id: 'urun', label: 'Ürün', value: islem.urun, position: { left: 120, top: 35 } });
    }
    
    if (islem.marka) {
      fields.push({ id: 'marka', label: 'Marka', value: islem.marka, position: { left: 120, top: 42 } });
    }
    
    if (islem.sikayet) {
      fields.push({ id: 'sikayet', label: 'Şikayet', value: islem.sikayet, position: { left: 20, top: 75 } });
    }
    
    if (islem.teknisyen_ismi) {
      fields.push({ id: 'teknisyen', label: 'Teknisyen', value: islem.teknisyen_ismi, position: { left: 20, top: 85 } });
    }
    
    if (islem.yapilan_islem) {
      fields.push({ id: 'yapilan_islem', label: 'Yapılan İşlem', value: islem.yapilan_islem, position: { left: 20, top: 95 } });
    }
    
    if (islem.tutar) {
      fields.push({ id: 'tutar', label: 'Tutar', value: islem.tutar.toString() + ' TL', position: { left: 20, top: 105 } });
    }
    
    if (islem.is_durumu) {
      const durumText = islem.is_durumu === 'tamamlandi' ? 'Tamamlandı' : 'Açık';
      fields.push({ id: 'durum', label: 'Durum', value: durumText, position: { left: 20, top: 115 } });
    }

    return fields;
  };

  // Marka bazında kayıt anahtarı oluştur
  const getStorageKey = () => {
    const marka = islem.marka?.toLowerCase().trim() || 'default';
    return `print_template_config_${marka}`;
  };

  const [fields, setFields] = useState<FieldConfig[]>(() => {
    const storageKey = getStorageKey();
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return getDefaultFields();
      }
    }
    return getDefaultFields();
  });

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

  const handleSave = () => {
    if (!isAdmin) {
      setSnackbar({
        open: true,
        message: 'Sadece admin kullanıcılar ayarları kaydedebilir!',
        severity: 'error'
      });
      return;
    }
    
    const storageKey = getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(fields));
    setSnackbar({
      open: true,
      message: `Şablon ayarları "${islem.marka}" markası için kaydedildi!`,
      severity: 'success'
    });
  };

  const handleReset = () => {
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
    const storageKey = getStorageKey();
    localStorage.removeItem(storageKey);
    setSnackbar({
      open: true,
      message: 'Varsayılan ayarlara sıfırlandı!',
      severity: 'info'
    });
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
              font-family: 'Courier New', monospace;
              font-size: 12px;
              color: #000;
              background: white;
              position: relative;
              width: 210mm;
              height: 297mm;
            }
            .item {
              position: absolute;
              white-space: nowrap;
            }
          </style>
        </head>
        <body>
          ${fields.map(field => {
            return `<div class="item" style="left: ${field.position.left}mm; top: ${field.position.top}mm;">${field.value}</div>`;
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

  useEffect(() => {
    // Değerler değiştiğinde (yeni islem geldiğinde) güncel değerleri yükle
    if (open) {
      const defaultFields = getDefaultFields();
      const storageKey = getStorageKey();
      const savedConfig = localStorage.getItem(storageKey);
      
      if (savedConfig) {
        try {
          const savedFields: FieldConfig[] = JSON.parse(savedConfig);
          // Sadece pozisyonları al, değerleri güncel tut
          setFields(defaultFields.map(df => {
            const savedField = savedFields.find(sf => sf.id === df.id);
            return savedField ? { ...df, position: savedField.position } : df;
          }));
        } catch {
          setFields(defaultFields);
        }
      } else {
        setFields(defaultFields);
      }
    }
  }, [open, islem]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">Yazdırma Şablonu Düzenle</Typography>
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
                  fontSize: '12px',
                  fontWeight: 'normal',
                  fontFamily: 'Courier New, monospace',
                  whiteSpace: 'nowrap',
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
                      {field.value.substring(0, 30)}{field.value.length > 30 ? '...' : ''}
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
