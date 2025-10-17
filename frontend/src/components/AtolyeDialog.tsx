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
  useMediaQuery,
  useTheme,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [bayiler, setBayiler] = useState<Bayi[]>([]);
  const [markalar, setMarkalar] = useState<Marka[]>([]);
  const [nextSiraNo, setNextSiraNo] = useState<number | null>(null);
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
    kayit_tarihi: new Date().toISOString().split('T')[0], // Bugünün tarihi
  });

  useEffect(() => {
    fetchBayiler();
    fetchMarkalar();
    if (isEdit) {
      fetchAtolyeData();
    } else {
      resetForm();
      fetchNextSiraNo();
    }
  }, [atolyeId, open]);

  const fetchNextSiraNo = async () => {
    try {
      const response = await api.get('/atolye');
      const allAtolyeList = response.data;
      setNextSiraNo(allAtolyeList.length + 1);
    } catch (error) {
      console.error('Sıra numarası alınamadı:', error);
    }
  };

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
      
      console.log('=== FRONTEND fetchAtolyeData ===');
      console.log('Backend\'den gelen kayit_tarihi:', data.kayit_tarihi);
      console.log('Typeof:', typeof data.kayit_tarihi);
      
      const processedDate = data.kayit_tarihi ? String(data.kayit_tarihi).substring(0, 10) : new Date().toISOString().substring(0, 10);
      console.log('Substring sonrası:', processedDate);
      console.log('================================');
      
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
        yapilma_tarihi: data.yapilma_tarihi ? String(data.yapilma_tarihi).substring(0, 10) : undefined,
        kayit_tarihi: processedDate,
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
      kayit_tarihi: new Date().toISOString().split('T')[0], // Bugünün tarihi
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
    // Bayi Adı VEYA Müşteri Adı kontrolü - en az biri dolu olmalı
    const hasBayi = formData.bayi_adi && formData.bayi_adi.trim() !== '';
    const hasMusteri = formData.musteri_ad_soyad && formData.musteri_ad_soyad.trim() !== '';
    
    if (!hasBayi && !hasMusteri) {
      showSnackbar('Bayi Adı veya Müşteri Ad Soyad alanlarından en az biri doldurulmalıdır!', 'error');
      return;
    }

    // Bayi kontrolü - eğer doldurulmuşsa tanımlı listede olmalı
    if (hasBayi) {
      const bayiExists = bayiler.some(b => b.isim === formData.bayi_adi);
      if (!bayiExists) {
        showSnackbar('Lütfen listeden bir bayi seçiniz! Sadece tanımlı bayiler kabul edilir.', 'error');
        return;
      }
    }

    // Marka zorunlu kontrolü
    if (!formData.marka || formData.marka.trim() === '') {
      showSnackbar('Marka alanı zorunludur!', 'error');
      return;
    }

    // Marka kontrolü - tanımlı listede olmalı
    const markaExists = markalar.some(m => m.isim === formData.marka);
    if (!markaExists) {
      showSnackbar('Lütfen listeden bir marka seçiniz! Sadece tanımlı markalar kabul edilir.', 'error');
      return;
    }

    // Model zorunlu kontrolü
    if (!formData.kod || formData.kod.trim() === '') {
      showSnackbar('Model alanı zorunludur!', 'error');
      return;
    }

    // Şikayet zorunlu kontrolü
    if (!formData.sikayet || formData.sikayet.trim() === '') {
      showSnackbar('Şikayet alanı zorunludur!', 'error');
      return;
    }

    // Özel Not zorunlu kontrolü
    if (!formData.ozel_not || formData.ozel_not.trim() === '') {
      showSnackbar('Özel Not alanı zorunludur!', 'error');
      return;
    }

    // Telefon kontrolü - eğer doldurulmuşsa 11 haneli olmalı
    if (formData.tel_no && formData.tel_no.length > 0 && formData.tel_no.length !== 11) {
      showSnackbar('Telefon numarası 11 haneli olmalıdır', 'error');
      return;
    }

    try {
      if (isEdit) {
        console.log('=== FRONTEND handleSubmit PUT ===');
        console.log('formData.kayit_tarihi:', formData.kayit_tarihi);
        
        // Tarihe 12:00:00 ekleyerek timezone kaymasını önle
        const kayitTarihiWithTime = formData.kayit_tarihi ? `${formData.kayit_tarihi}T12:00:00` : undefined;
        console.log('Timezone korumalı tarih:', kayitTarihiWithTime);
        console.log('=================================');
        
        const updateDto: AtolyeUpdateDto = {
          ...formData,
          kayit_tarihi: kayitTarihiWithTime,
          ucret: formData.ucret || undefined,
        };
        await api.put(`/atolye/${atolyeId}`, updateDto);
        showSnackbar('Kayıt başarıyla güncellendi', 'success');
      } else {
        console.log('=== FRONTEND handleSubmit POST ===');
        console.log('formData.kayit_tarihi:', formData.kayit_tarihi);
        
        // Tarihe 12:00:00 ekleyerek timezone kaymasını önle
        const kayitTarihiWithTime = formData.kayit_tarihi ? `${formData.kayit_tarihi}T12:00:00` : undefined;
        console.log('Timezone korumalı tarih:', kayitTarihiWithTime);
        console.log('==================================');
        
        const createDto: AtolyeCreateDto = {
          bayi_adi: formData.bayi_adi,
          musteri_ad_soyad: formData.musteri_ad_soyad,
          tel_no: formData.tel_no,
          marka: formData.marka,
          kod: formData.kod,
          seri_no: formData.seri_no,
          sikayet: formData.sikayet,
          ozel_not: formData.ozel_not,
          kayit_tarihi: kayitTarihiWithTime,
        };
        
        console.log('Backend\'e gönderilen createDto.kayit_tarihi:', createDto.kayit_tarihi);
        
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
    <Dialog open={open} onClose={() => onClose()} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <span>{isEdit ? 'Kaydı Düzenle' : 'Yeni Kayıt Ekle'}</span>
          <TextField
            type="date"
            size="small"
            value={
              formData.kayit_tarihi 
                ? (formData.kayit_tarihi.length > 10 ? formData.kayit_tarihi.substring(0, 10) : formData.kayit_tarihi)
                : new Date().toISOString().split('T')[0]
            }
            onChange={(e) => handleChange('kayit_tarihi', e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ width: '150px' }}
          />
        </div>
        {!isEdit && nextSiraNo && (
          <div style={{ 
            fontSize: '2rem', 
            fontWeight: 700, 
            color: '#0D3282',
            marginTop: '8px'
          }}>
            {nextSiraNo}
          </div>
        )}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Bayi Adı - Autocomplete */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={bayiler.map((b) => b.isim)}
              value={formData.bayi_adi || null}
              filterOptions={(options, state) => {
                if (!state.inputValue) return options;
                return options.filter(option =>
                  option.toLocaleLowerCase('tr-TR').includes(state.inputValue.toLocaleLowerCase('tr-TR'))
                );
              }}
              onChange={(_, newValue) => handleChange('bayi_adi', newValue || '')}
              onInputChange={(_, value, reason) => {
                if (reason === 'input') {
                  const filtered = bayiler.filter(bayi => 
                    bayi.isim.toLocaleLowerCase('tr-TR').includes(value.toLocaleLowerCase('tr-TR'))
                  );
                  if (filtered.length === 1 && value.length > 0) {
                    handleChange('bayi_adi', filtered[0].isim);
                  }
                }
              }}
              autoHighlight
              selectOnFocus
              clearOnBlur={false}
              handleHomeEndKeys={false}
              renderInput={(params) => (
                <TextField 
                  {...params}
                  name="bayi_adi"
                  label="Bayi Adı" 
                  fullWidth 
                  placeholder="Bayi ara ve seç..."
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const popup = document.querySelector('[role="listbox"]');
                      if (popup) {
                        const highlighted = popup.querySelector('[data-focus="true"]') as HTMLElement;
                        if (highlighted) {
                          const text = highlighted.textContent;
                          if (text && bayiler.some(b => b.isim === text)) {
                            handleChange('bayi_adi', text);
                          }
                        }
                      }
                      setTimeout(() => {
                        const musteriInput = document.querySelector('input[name="musteri_ad_soyad"]') as HTMLInputElement;
                        if (musteriInput) {
                          musteriInput.focus();
                        }
                      }, 100);
                    }
                  }}
                />
              )}
            />
          </Grid>

          {/* Müşteri Ad Soyad */}
          <Grid item xs={12} md={6}>
            <TextField
              name="musteri_ad_soyad"
              label="Müşteri Ad Soyad"
              fullWidth
              value={formData.musteri_ad_soyad}
              onChange={(e) => handleChange('musteri_ad_soyad', e.target.value)}
            />
          </Grid>

          {/* Telefon No */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Telefon No"
              fullWidth
              value={formatPhoneNumber(formData.tel_no)}
              onChange={handlePhoneChange}
              placeholder="0544 448 88 88"
            />
          </Grid>

          {/* Marka */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={markalar.map((m) => m.isim)}
              value={formData.marka || null}
              filterOptions={(options, state) => {
                if (!state.inputValue) return options;
                return options.filter(option =>
                  option.toLocaleLowerCase('tr-TR').includes(state.inputValue.toLocaleLowerCase('tr-TR'))
                );
              }}
              onChange={(_, newValue) => handleChange('marka', newValue || '')}
              onInputChange={(_, value, reason) => {
                if (reason === 'input' && value.length > 2) {
                  const filtered = markalar.filter(marka => 
                    marka.isim.toLocaleLowerCase('tr-TR').includes(value.toLocaleLowerCase('tr-TR'))
                  );
                  if (filtered.length === 1) {
                    handleChange('marka', filtered[0].isim);
                  }
                }
              }}
              autoHighlight
              selectOnFocus
              clearOnBlur={false}
              handleHomeEndKeys={false}
              renderInput={(params) => (
                <TextField 
                  {...params}
                  name="marka"
                  required
                  label="Marka" 
                  fullWidth 
                  placeholder="Marka ara ve seç..."
                  error={!formData.marka}
                  helperText={!formData.marka ? 'Listeden bir marka seçmelisiniz' : ''}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const popup = document.querySelector('[role="listbox"]');
                      if (popup) {
                        const highlighted = popup.querySelector('[data-focus="true"]') as HTMLElement;
                        if (highlighted) {
                          const text = highlighted.textContent;
                          if (text && markalar.some(m => m.isim === text)) {
                            handleChange('marka', text);
                          }
                        }
                      }
                      setTimeout(() => {
                        const modelInput = document.querySelector('input[name="model"]') as HTMLInputElement;
                        if (modelInput) {
                          modelInput.focus();
                        }
                      }, 100);
                    }
                  }}
                />
              )}
            />
          </Grid>

          {/* Model */}
          <Grid item xs={12} md={6}>
            <TextField
              name="model"
              required
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
              required
              label="Şikayet"
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
              required
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
