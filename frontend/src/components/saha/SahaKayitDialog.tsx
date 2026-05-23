import React, { useState, useEffect, useRef, memo } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Close, PhotoCamera } from '@mui/icons-material';
import { sahaService } from '../../services/saha.service';
import { SahaKayit, SahaKayitCreateDto } from '../../types';
import { useSnackbar } from '../../context/SnackbarContext';

interface Props {
  open: boolean;
  editingKayit: SahaKayit | null;
  initialPhotos: string[];
  onClose: () => void;
  onSaved: () => void;
  onPhotosCached: (id: number, photos: string[]) => void;
}

// Fotoğrafı sıkıştır (yüksek kalite koruyarak boyutu azalt)
const compressImage = (file: File, maxWidth = 2400, quality = 0.92): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fallbackReader = new FileReader();
    let fallbackBase64 = '';
    fallbackReader.onload = (e) => { fallbackBase64 = e.target?.result as string; };
    fallbackReader.readAsDataURL(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        if (fallbackBase64) resolve(fallbackBase64);
        else reject(new Error('Sıkıştırma zaman aşımı'));
      }, 10000);

      img.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
          const maxHeight = 3200;
          if (height > maxHeight) { width = (width * maxHeight) / height; height = maxHeight; }
          canvas.width = Math.floor(width);
          canvas.height = Math.floor(height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            try { resolve(canvas.toDataURL('image/jpeg', quality)); }
            catch { if (fallbackBase64) resolve(fallbackBase64); else reject(new Error('Canvas error')); }
          } else if (fallbackBase64) resolve(fallbackBase64);
          else reject(new Error('Canvas context not available'));
        } catch (err) {
          if (fallbackBase64) resolve(fallbackBase64); else reject(err);
        }
      };
      img.onerror = () => {
        clearTimeout(timeout);
        if (fallbackBase64) resolve(fallbackBase64); else reject(new Error('Image load error'));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => { if (fallbackBase64) resolve(fallbackBase64); else reject(new Error('Read error')); };
    reader.readAsDataURL(file);
  });
};

const SahaKayitDialog: React.FC<Props> = ({ open, editingKayit, initialPhotos, onClose, onSaved, onPhotosCached }) => {
  const [formIsim, setFormIsim] = useState('');
  const [formSoyisim, setFormSoyisim] = useState('');
  const [formNotlar, setFormNotlar] = useState('');
  const [formFotolar, setFormFotolar] = useState<string[]>([]);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { showSnackbar } = useSnackbar();

  // Dialog her açıldığında formu yeniden doldur
  useEffect(() => {
    if (!open) return;
    if (editingKayit) {
      setFormIsim(editingKayit.isim);
      setFormSoyisim(editingKayit.soyisim);
      setFormNotlar(editingKayit.notlar || '');
      setFormFotolar(initialPhotos || []);
    } else {
      setFormIsim('');
      setFormSoyisim('');
      setFormNotlar('');
      setFormFotolar([]);
    }
  }, [open, editingKayit, initialPhotos]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const maxPhotos = 5;
    if (formFotolar.length + files.length > maxPhotos) {
      showSnackbar(`Maksimum ${maxPhotos} fotoğraf yükleyebilirsiniz!`, 'warning');
      return;
    }
    const newPhotos: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        showSnackbar(`${file.name} dosyası 10MB'dan büyük, atlandı!`, 'warning');
        continue;
      }
      try {
        const compressedData = await compressImage(file, 2400, 0.92);
        newPhotos.push(compressedData);
      } catch {
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          newPhotos.push(base64);
        } catch {
          showSnackbar(`${file.name} yüklenemedi!`, 'warning');
        }
      }
    }
    if (newPhotos.length > 0) {
      setFormFotolar(prev => [...prev, ...newPhotos]);
      showSnackbar(`${newPhotos.length} fotoğraf yüklendi!`, 'success');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
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
        onPhotosCached(editingKayit.id, formFotolar);
        showSnackbar('Kayıt başarıyla güncellendi!', 'success');
      } else {
        await sahaService.createKayit(data);
        showSnackbar('Kayıt başarıyla eklendi!', 'success');
      }
      onSaved();
    } catch (error: any) {
      console.error('Kayıt kaydedilirken hata:', error);
      showSnackbar(error.response?.data?.message || 'Kayıt kaydedilirken hata oluştu!', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth keepMounted={false}>
      <DialogTitle>
        {editingKayit ? 'Kaydı Düzenle' : 'Yeni Kayıt Ekle'}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 3, p: 2, border: '2px dashed #ccc', borderRadius: 2, bgcolor: '#fafafa' }}>
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
                        style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid #ddd' }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemovePhoto(index)}
                        sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', padding: 0.3, '&:hover': { bgcolor: 'error.dark' } }}
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

            <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
            <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />

            {formFotolar.length < 5 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mt: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PhotoCamera />}
                  onClick={() => cameraInputRef.current?.click()}
                  sx={{ minWidth: 150, py: 1.5, fontSize: '1rem', fontWeight: 600 }}
                >
                  KAMERA AÇ
                </Button>
                <Button variant="outlined" onClick={() => fileInputRef.current?.click()} sx={{ minWidth: 120 }}>
                  Galeriden Seç
                </Button>
              </Box>
            )}
          </Box>

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
        <Button onClick={onClose}>İptal</Button>
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
  );
};

export default memo(SahaKayitDialog);
