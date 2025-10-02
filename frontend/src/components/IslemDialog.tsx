import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
} from '@mui/material';
import { Islem, IslemCreateDto, IslemUpdateDto } from '../types';
import { islemService } from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';

interface IslemDialogProps {
  open: boolean;
  islem: Islem | null;
  onClose: () => void;
  onSave: () => void;
}

const IslemDialog: React.FC<IslemDialogProps> = ({ open, islem, onClose, onSave }) => {
  const { showSnackbar } = useSnackbar();
  const [formData, setFormData] = useState<IslemUpdateDto>({
    ad_soyad: '',
    ilce: '',
    mahalle: '',
    cadde: '',
    sokak: '',
    kapi_no: '',
    apartman_site: '',
    blok_no: '',
    daire_no: '',
    sabit_tel: '',
    cep_tel: '',
    urun: '',
    marka: '',
    sikayet: '',
    teknisyen_ismi: '',
    yapilan_islem: '',
    tutar: 0,
    is_durumu: 'acik',
  });

  useEffect(() => {
    if (islem) {
      setFormData({
        ad_soyad: islem.ad_soyad,
        ilce: islem.ilce,
        mahalle: islem.mahalle,
        cadde: islem.cadde,
        sokak: islem.sokak,
        kapi_no: islem.kapi_no,
        apartman_site: islem.apartman_site || '',
        blok_no: islem.blok_no || '',
        daire_no: islem.daire_no || '',
        sabit_tel: islem.sabit_tel || '',
        cep_tel: islem.cep_tel,
        urun: islem.urun,
        marka: islem.marka,
        sikayet: islem.sikayet,
        teknisyen_ismi: islem.teknisyen_ismi || '',
        yapilan_islem: islem.yapilan_islem || '',
        tutar: islem.tutar || 0,
        is_durumu: islem.is_durumu,
      });
    } else {
      setFormData({
        ad_soyad: '',
        ilce: '',
        mahalle: '',
        cadde: '',
        sokak: '',
        kapi_no: '',
        apartman_site: '',
        blok_no: '',
        daire_no: '',
        sabit_tel: '',
        cep_tel: '',
        urun: '',
        marka: '',
        sikayet: '',
        teknisyen_ismi: '',
        yapilan_islem: '',
        tutar: 0,
        is_durumu: 'acik',
      });
    }
  }, [islem, open]);

  const handleChange = (field: keyof IslemUpdateDto) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async () => {
    // Form validasyonu
    if (!formData.ad_soyad || !formData.ilce || !formData.mahalle || 
        !formData.cadde || !formData.sokak || !formData.kapi_no || 
        !formData.cep_tel || !formData.urun || !formData.marka || !formData.sikayet) {
      showSnackbar('Lütfen tüm zorunlu alanları doldurun!', 'warning');
      return;
    }

    try {
      if (islem) {
        // Güncelleme
        await islemService.update(islem.id, formData);
        showSnackbar('İşlem başarıyla güncellendi!', 'success');
      } else {
        // Yeni ekleme - sadece gerekli alanları gönder
        const createData: IslemCreateDto = {
          ad_soyad: formData.ad_soyad,
          ilce: formData.ilce,
          mahalle: formData.mahalle,
          cadde: formData.cadde,
          sokak: formData.sokak,
          kapi_no: formData.kapi_no,
          apartman_site: formData.apartman_site,
          blok_no: formData.blok_no,
          daire_no: formData.daire_no,
          sabit_tel: formData.sabit_tel,
          cep_tel: formData.cep_tel,
          urun: formData.urun,
          marka: formData.marka,
          sikayet: formData.sikayet,
        };
        await islemService.create(createData);
        showSnackbar('Yeni işlem başarıyla eklendi!', 'success');
      }
      onSave();
    } catch (error: any) {
      console.error('İşlem kaydedilirken hata:', error);
      showSnackbar(error.response?.data?.message || 'İşlem kaydedilirken hata oluştu!', 'error');
    }
  };

  const isNewIslem = !islem;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{islem ? 'İşlem Düzenle' : 'Yeni İşlem Ekle'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Ad Soyad"
              value={formData.ad_soyad}
              onChange={handleChange('ad_soyad')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="İlçe"
              value={formData.ilce}
              onChange={handleChange('ilce')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Mahalle"
              value={formData.mahalle}
              onChange={handleChange('mahalle')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Cadde"
              value={formData.cadde}
              onChange={handleChange('cadde')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Sokak"
              value={formData.sokak}
              onChange={handleChange('sokak')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Kapı No"
              value={formData.kapi_no}
              onChange={handleChange('kapi_no')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Apartman/Site"
              value={formData.apartman_site}
              onChange={handleChange('apartman_site')}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Blok No"
              value={formData.blok_no}
              onChange={handleChange('blok_no')}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Daire No"
              value={formData.daire_no}
              onChange={handleChange('daire_no')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Cep Telefonu"
              value={formData.cep_tel}
              onChange={handleChange('cep_tel')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Sabit Telefon"
              value={formData.sabit_tel}
              onChange={handleChange('sabit_tel')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Ürün"
              value={formData.urun}
              onChange={handleChange('urun')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Marka"
              value={formData.marka}
              onChange={handleChange('marka')}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              multiline
              rows={3}
              label="Şikayet"
              value={formData.sikayet}
              onChange={handleChange('sikayet')}
            />
          </Grid>

          {!isNewIslem && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teknisyen İsmi"
                  value={formData.teknisyen_ismi}
                  onChange={handleChange('teknisyen_ismi')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tutar"
                  type="number"
                  value={formData.tutar}
                  onChange={handleChange('tutar')}
                  InputProps={{
                    endAdornment: 'TL',
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Yapılan İşlem"
                  value={formData.yapilan_islem}
                  onChange={handleChange('yapilan_islem')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="İş Durumu"
                  value={formData.is_durumu}
                  onChange={handleChange('is_durumu')}
                >
                  <MenuItem value="acik">Açık</MenuItem>
                  <MenuItem value="tamamlandi">Tamamlandı</MenuItem>
                </TextField>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button onClick={handleSubmit} variant="contained">
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IslemDialog;
