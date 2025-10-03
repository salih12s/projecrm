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
  Autocomplete,
  Alert,
  AlertTitle,
  Box,
} from '@mui/material';
import { Islem, IslemCreateDto, IslemUpdateDto, Teknisyen, Marka } from '../types';
import { islemService } from '../services/api';
import { api } from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';

// Telefon numarasını formatla: 0544 448 88 88
const formatPhoneNumber = (phone: string | undefined): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
};

// Formatlı telefonu temizle (sadece rakamlar)
const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

interface IslemDialogProps {
  open: boolean;
  islem: Islem | null;
  onClose: () => void;
  onSave: () => void;
}

const IslemDialog: React.FC<IslemDialogProps> = ({ open, islem, onClose, onSave }) => {
  const { showSnackbar } = useSnackbar();
  const [teknisyenler, setTeknisyenler] = useState<Teknisyen[]>([]);
  const [markalar, setMarkalar] = useState<Marka[]>([]);
  const [existingRecord, setExistingRecord] = useState<Islem | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPhoneQuery, setShowPhoneQuery] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showForm, setShowForm] = useState(false);
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

  // Teknisyen ve marka listelerini yükle
  useEffect(() => {
    const loadData = async () => {
      try {
        const [teknisyenResponse, markaResponse] = await Promise.all([
          api.get<Teknisyen[]>('/teknisyenler'),
          api.get<Marka[]>('/markalar'),
        ]);
        setTeknisyenler(teknisyenResponse.data);
        setMarkalar(markaResponse.data);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      }
    };
    if (open) {
      loadData();
    }
  }, [open]);

  useEffect(() => {
    if (islem) {
      // Düzenleme modu - formu direkt göster
      setShowForm(true);
      setShowPhoneQuery(false);
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
      // Yeni kayıt modu - önce telefon sorgusu göster
      setShowForm(false);
      setShowPhoneQuery(true);
      setPhoneNumber('');
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
      setShowConfirmDialog(false);
      setExistingRecord(null);
    }
  }, [islem, open]);

  const handleChange = (field: keyof IslemUpdateDto) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = e.target.value;
    
    // Telefon alanları için formatla
    if (field === 'cep_tel' || field === 'sabit_tel') {
      const cleaned = cleanPhoneNumber(value);
      // Sadece 11 hane kadar kabul et
      if (cleaned.length <= 11) {
        value = cleaned;
        setFormData({ ...formData, [field]: value });
      }
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = cleanPhoneNumber(value);
    if (cleaned.length <= 11) {
      setPhoneNumber(cleaned);
    }
  };

  const handlePhoneSubmit = async () => {
    if (phoneNumber.length !== 11) {
      showSnackbar('Lütfen 11 haneli telefon numarası girin!', 'warning');
      return;
    }

    try {
      const response = await islemService.getAll();
      const cleanedPhone = cleanPhoneNumber(phoneNumber);
      const existing = response.find((item: Islem) => cleanPhoneNumber(item.cep_tel) === cleanedPhone);
      
      if (existing) {
        // Eski kayıt bulundu - uyarı göster
        setExistingRecord(existing);
        setShowConfirmDialog(true);
        setShowPhoneQuery(false);
      } else {
        // Yeni kayıt - formu aç ve telefonu doldur
        setFormData({ ...formData, cep_tel: phoneNumber });
        setShowPhoneQuery(false);
        setShowForm(true);
        showSnackbar('Yeni müşteri kaydı açılıyor...', 'info');
      }
    } catch (error) {
      console.error('Kayıt kontrol hatası:', error);
      showSnackbar('Kayıt kontrolü yapılırken hata oluştu!', 'error');
    }
  };

  const handleUseExistingData = () => {
    if (existingRecord) {
      setFormData({
        ad_soyad: existingRecord.ad_soyad,
        ilce: existingRecord.ilce,
        mahalle: existingRecord.mahalle,
        cadde: existingRecord.cadde,
        sokak: existingRecord.sokak,
        kapi_no: existingRecord.kapi_no,
        apartman_site: existingRecord.apartman_site || '',
        blok_no: existingRecord.blok_no || '',
        daire_no: existingRecord.daire_no || '',
        sabit_tel: existingRecord.sabit_tel || '',
        cep_tel: existingRecord.cep_tel,
        urun: existingRecord.urun || '',
        marka: existingRecord.marka || '',
        sikayet: existingRecord.sikayet || '',
        teknisyen_ismi: existingRecord.teknisyen_ismi || '',
        yapilan_islem: existingRecord.yapilan_islem || '',
        tutar: existingRecord.tutar || 0,
        is_durumu: 'acik',
      });
      showSnackbar('Önceki kayıt bilgileri getirildi. Değişiklik yapabilir veya olduğu gibi kaydedebilirsiniz.', 'info');
    }
    setShowConfirmDialog(false);
    setShowForm(true);
  };

  const handleContinueWithNewData = () => {
    setFormData({ ...formData, cep_tel: phoneNumber });
    setShowConfirmDialog(false);
    setShowForm(true);
    setExistingRecord(null);
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
        // Yeni ekleme - tüm doldurulmuş alanları gönder
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
          teknisyen_ismi: formData.teknisyen_ismi,
          yapilan_islem: formData.yapilan_islem,
          tutar: formData.tutar,
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
        {/* Telefon Numarası Sorgusu (Sadece yeni kayıt için) */}
        {showPhoneQuery && !islem && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Telefon Numarası Sorgusu</AlertTitle>
              Lütfen müşterinin cep telefon numarasını girin. Daha önce kayıt varsa bilgileri getireceğiz.
            </Alert>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  required
                  autoFocus
                  label="Cep Telefonu"
                  value={formatPhoneNumber(phoneNumber)}
                  onChange={handlePhoneNumberChange}
                  placeholder="0544 448 88 88"
                  helperText={`${phoneNumber.length}/11 hane`}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handlePhoneSubmit}
                  disabled={phoneNumber.length !== 11}
                  sx={{ height: 56 }}
                >
                  Devam Et
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Uyarı Mesajı (Eski kayıt bulunduğunda) */}
        {showConfirmDialog && existingRecord && (
          <Alert 
            severity="warning" 
            sx={{ mb: 2, mt: 2 }}
            action={
              <>
                <Button color="inherit" size="small" onClick={handleUseExistingData}>
                  Evet, Bilgileri Getir
                </Button>
                <Button color="inherit" size="small" onClick={handleContinueWithNewData}>
                  Hayır, Devam Et
                </Button>
              </>
            }
          >
            <AlertTitle>Daha Önce Kayıt Bulundu!</AlertTitle>
            Bu telefon numarasıyla ({formatPhoneNumber(existingRecord.cep_tel)}) daha önce <strong>{existingRecord.ad_soyad}</strong> adına kayıt açılmış. 
            Önceki müşteri bilgilerini getirmek ister misiniz?
          </Alert>
        )}

        {/* Form Alanları (Form gösterildiyse) */}
        {showForm && (
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
              value={formatPhoneNumber(formData.cep_tel)}
              onChange={handleChange('cep_tel')}
              placeholder="0544 448 88 88"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Sabit Telefon"
              value={formatPhoneNumber(formData.sabit_tel)}
              onChange={handleChange('sabit_tel')}
              placeholder="0212 448 88 88"
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
            <Autocomplete
              freeSolo
              options={markalar.map(m => m.isim)}
              value={formData.marka || ''}
              onChange={(_, newValue) => {
                setFormData({ ...formData, marka: newValue || '' });
              }}
              inputValue={formData.marka || ''}
              onInputChange={(_, newInputValue) => {
                setFormData({ ...formData, marka: newInputValue || '' });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  required
                  label="Marka"
                />
              )}
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

          <Grid item xs={12} sm={6}>
            <Autocomplete
              freeSolo
              options={teknisyenler.map(t => t.isim)}
              value={formData.teknisyen_ismi || ''}
              onChange={(_, newValue) => {
                setFormData({ ...formData, teknisyen_ismi: newValue || '' });
              }}
              inputValue={formData.teknisyen_ismi || ''}
              onInputChange={(_, newInputValue) => {
                setFormData({ ...formData, teknisyen_ismi: newInputValue || '' });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Teknisyen İsmi"
                />
              )}
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

          {!isNewIslem && (
            <>
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
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        {showForm && (
          <Button onClick={handleSubmit} variant="contained">
            Kaydet
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default IslemDialog;
