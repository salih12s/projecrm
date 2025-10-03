import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Autocomplete,
  MenuItem,
} from '@mui/material';
import { Atolye, AtolyeCreateDto, AtolyeUpdateDto, Bayi, Marka } from '../types';
import { api } from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';

interface AtolyeDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  atolyeId: number | null;
}

const STATUS_OPTIONS = [
  { value: 'beklemede', label: 'Beklemede' },
  { value: 'siparis_verildi', label: 'Sipariş Verildi' },
  { value: 'yapildi', label: 'Yapıldı' },
  { value: 'fabrika_gitti', label: 'Fabrika Gitti' },
  { value: 'odeme_bekliyor', label: 'Ödeme Bekliyor' },
  { value: 'teslim_edildi', label: 'Teslim Edildi' },
];

const AtolyeDialog: React.FC<AtolyeDialogProps> = ({ open, onClose, atolyeId }) => {
  const isEdit = atolyeId !== null;
  const { showSnackbar } = useSnackbar();

  const [bayiler, setBayiler] = useState<Bayi[]>([]);
  const [markalar, setMarkalar] = useState<Marka[]>([]);
  const [formData, setFormData] = useState<AtolyeUpdateDto & AtolyeCreateDto>({
    bayi_adi: '',
    musteri_ad_soyad: '',
    tel_no: '',
    marka: '',
    kod: '',
    seri_no: '',
    sikayet: '',
    ozel_not: '',
    yapilan_islem: '',
    ucret: undefined,
    yapilma_tarihi: undefined,
    teslim_durumu: 'beklemede',
  });

  useEffect(() => {
    fetchBayiler();
    fetchMarkalar();
    if (isEdit) {
      fetchAtolyeData();
    } else {
      resetForm();
    }
  }, [atolyeId, open]);

  const fetchBayiler = async () => {
    try {
      const response = await api.get('/bayiler');
      setBayiler(response.data);
    } catch (error) {
      showSnackbar('Bayiler yüklenirken hata oluştu', 'error');
    }
  };

  const fetchMarkalar = async () => {
    try {
      const response = await api.get('/markalar');
      setMarkalar(response.data);
    } catch (error) {
      showSnackbar('Markalar yüklenirken hata oluştu', 'error');
    }
  };

  const fetchAtolyeData = async () => {
    if (!atolyeId) return;
    try {
      const response = await api.get(`/atolye/${atolyeId}`);
      const data: Atolye = response.data;
      setFormData({
        bayi_adi: data.bayi_adi,
        musteri_ad_soyad: data.musteri_ad_soyad,
        tel_no: data.tel_no,
        marka: data.marka,
        kod: data.kod || '',
        seri_no: data.seri_no || '',
        sikayet: data.sikayet,
        ozel_not: data.ozel_not || '',
        yapilan_islem: data.yapilan_islem || '',
        ucret: data.ucret,
        yapilma_tarihi: data.yapilma_tarihi ? data.yapilma_tarihi.split('T')[0] : undefined,
        teslim_durumu: data.teslim_durumu,
      });
    } catch (error) {
      showSnackbar('Kayıt yüklenirken hata oluştu', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      bayi_adi: '',
      musteri_ad_soyad: '',
      tel_no: '',
      marka: '',
      kod: '',
      seri_no: '',
      sikayet: '',
      ozel_not: '',
      yapilan_islem: '',
      ucret: undefined,
      yapilma_tarihi: undefined,
      teslim_durumu: 'beklemede',
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      handleChange('tel_no', cleaned);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
    }
    return cleaned;
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.bayi_adi || !formData.musteri_ad_soyad || !formData.tel_no || 
        !formData.marka || !formData.sikayet) {
      showSnackbar('Lütfen zorunlu alanları doldurun', 'error');
      return;
    }

    if (formData.tel_no.length !== 11) {
      showSnackbar('Telefon numarası 11 haneli olmalıdır', 'error');
      return;
    }

    try {
      if (isEdit) {
        const updateDto: AtolyeUpdateDto = {
          ...formData,
          ucret: formData.ucret || undefined,
        };
        await api.put(`/atolye/${atolyeId}`, updateDto);
        showSnackbar('Kayıt başarıyla güncellendi', 'success');
      } else {
        const createDto: AtolyeCreateDto = {
          bayi_adi: formData.bayi_adi,
          musteri_ad_soyad: formData.musteri_ad_soyad,
          tel_no: formData.tel_no,
          marka: formData.marka,
          kod: formData.kod,
          seri_no: formData.seri_no,
          sikayet: formData.sikayet,
          ozel_not: formData.ozel_not,
        };
        await api.post('/atolye', createDto);
        showSnackbar('Kayıt başarıyla oluşturuldu', 'success');
      }
      onClose(true);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Bir hata oluştu';
      showSnackbar(message, 'error');
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose()} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Kaydı Düzenle' : 'Yeni Kayıt Ekle'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Bayi Adı - Autocomplete */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={bayiler.map((b) => b.isim)}
              value={formData.bayi_adi}
              onChange={(_, newValue) => handleChange('bayi_adi', newValue || '')}
              onInputChange={(_, newValue) => handleChange('bayi_adi', newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Bayi Adı *" fullWidth />
              )}
            />
          </Grid>

          {/* Müşteri Ad Soyad */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Müşteri Ad Soyad *"
              fullWidth
              value={formData.musteri_ad_soyad}
              onChange={(e) => handleChange('musteri_ad_soyad', e.target.value)}
            />
          </Grid>

          {/* Telefon No */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Telefon No *"
              fullWidth
              value={formatPhoneNumber(formData.tel_no)}
              onChange={handlePhoneChange}
              placeholder="0544 448 88 88"
            />
          </Grid>

          {/* Marka */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={markalar.map((m) => m.isim)}
              value={formData.marka}
              onChange={(_, newValue) => handleChange('marka', newValue || '')}
              onInputChange={(_, newValue) => handleChange('marka', newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Marka *" fullWidth />
              )}
            />
          </Grid>

          {/* Model */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Model"
              fullWidth
              value={formData.kod}
              onChange={(e) => handleChange('kod', e.target.value)}
            />
          </Grid>

          {/* Seri No */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Seri No"
              fullWidth
              value={formData.seri_no}
              onChange={(e) => handleChange('seri_no', e.target.value)}
            />
          </Grid>

          {/* Şikayet */}
          <Grid item xs={12}>
            <TextField
              label="Şikayet *"
              fullWidth
              multiline
              rows={2}
              value={formData.sikayet}
              onChange={(e) => handleChange('sikayet', e.target.value)}
            />
          </Grid>

          {/* Özel Not */}
          <Grid item xs={12}>
            <TextField
              label="Özel Not"
              fullWidth
              multiline
              rows={2}
              value={formData.ozel_not}
              onChange={(e) => handleChange('ozel_not', e.target.value)}
            />
          </Grid>

          {/* Edit Mode Only Fields */}
          {isEdit && (
            <>
              {/* Teslim Durumu */}
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Teslim Durumu"
                  fullWidth
                  value={formData.teslim_durumu}
                  onChange={(e) => handleChange('teslim_durumu', e.target.value)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Yapılan İşlem */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Yapılan İşlem"
                  fullWidth
                  value={formData.yapilan_islem}
                  onChange={(e) => handleChange('yapilan_islem', e.target.value)}
                />
              </Grid>

              {/* Ücret */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Ücret (₺)"
                  fullWidth
                  type="number"
                  value={formData.ucret || ''}
                  onChange={(e) => handleChange('ucret', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </Grid>

              {/* Yapılma Tarihi */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Yapılma Tarihi"
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.yapilma_tarihi || ''}
                  onChange={(e) => handleChange('yapilma_tarihi', e.target.value)}
                />
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()}>İptal</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{ backgroundColor: '#0D3282', '&:hover': { backgroundColor: '#082052' } }}
        >
          {isEdit ? 'Güncelle' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AtolyeDialog;
