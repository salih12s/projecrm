import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Autocomplete,
  Alert,
  AlertTitle,
  Box,
  FormControlLabel,
  Checkbox,
  Typography,
  FormGroup,
} from '@mui/material';
import { Islem, IslemCreateDto, IslemUpdateDto, Teknisyen, Marka, Montaj, Aksesuar, Urun } from '../types';
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
  openTamamlaModal?: boolean; // Tamamlama modalını direkt açmak için
}

const IslemDialog: React.FC<IslemDialogProps> = ({ open, islem, onClose, onSave, openTamamlaModal = false }) => {
  const { showSnackbar } = useSnackbar();
  const [teknisyenler, setTeknisyenler] = useState<Teknisyen[]>([]);
  const [markalar, setMarkalar] = useState<Marka[]>([]);
  const [montajlar, setMontajlar] = useState<Montaj[]>([]);
  const [aksesuarlar, setAksesuarlar] = useState<Aksesuar[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [selectedMontajlar, setSelectedMontajlar] = useState<number[]>([]);
  const [selectedAksesuarlar, setSelectedAksesuarlar] = useState<number[]>([]);
  const [existingRecord, setExistingRecord] = useState<Islem | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPhoneQuery, setShowPhoneQuery] = useState(false);
  const [showTamamlaConfirm, setShowTamamlaConfirm] = useState(false);
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
    yedek_tel: '',
    urun: '',
    marka: '',
    sikayet: '',
    teknisyen_ismi: '',
    yapilan_islem: '',
    tutar: 0,
    is_durumu: 'acik',
  });

  // Teknisyen, marka, montaj, aksesuar ve ürün listelerini yükle
  useEffect(() => {
    const loadData = async () => {
      try {
        const [teknisyenResponse, markaResponse, montajResponse, aksesuarResponse, urunResponse] = await Promise.all([
          api.get<Teknisyen[]>('/teknisyenler'),
          api.get<Marka[]>('/markalar'),
          api.get<Montaj[]>('/montajlar'),
          api.get<Aksesuar[]>('/aksesuarlar'),
          api.get<Urun[]>('/urunler'),
        ]);
        setTeknisyenler(teknisyenResponse.data);
        setMarkalar(markaResponse.data);
        setMontajlar(montajResponse.data);
        setAksesuarlar(aksesuarResponse.data);
        setUrunler(urunResponse.data);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      }
    };
    if (open) {
      loadData();
    }
  }, [open]);

  // Montaj ve aksesuarlar yüklendikten sonra parse et
  useEffect(() => {
    if (islem && montajlar.length > 0 && aksesuarlar.length > 0) {
      parseYapilanIslem(islem.yapilan_islem || '');
    }
  }, [montajlar, aksesuarlar]);

  // Tamamlama modalını otomatik aç
  useEffect(() => {
    if (open && openTamamlaModal && islem && islem.is_durumu === 'acik') {
      setShowTamamlaConfirm(true);
    }
  }, [open, openTamamlaModal, islem]);

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
        yedek_tel: islem.yedek_tel || '',
        urun: islem.urun,
        marka: islem.marka,
        sikayet: islem.sikayet,
        teknisyen_ismi: islem.teknisyen_ismi || '',
        yapilan_islem: islem.yapilan_islem || '',
        tutar: islem.tutar || 0,
        is_durumu: islem.is_durumu,
      });
      
      // Yapılan işlem alanından checkbox'ları otomatik işaretle
      parseYapilanIslem(islem.yapilan_islem || '');
    } else {
      // Yeni kayıt modu - önce telefon sorgusu göster
      setShowForm(false);
      setShowPhoneQuery(true);
      setPhoneNumber('');
      setSelectedMontajlar([]);
      setSelectedAksesuarlar([]);
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
        yedek_tel: '',
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

  // Yapılan işlem metninden montaj ve aksesuar ID'lerini çıkar
  const parseYapilanIslem = (yapilanIslem: string) => {
    if (!yapilanIslem || montajlar.length === 0 && aksesuarlar.length === 0) {
      setSelectedMontajlar([]);
      setSelectedAksesuarlar([]);
      return;
    }

    const selectedMontajIds: number[] = [];
    const selectedAksesuarIds: number[] = [];

    // "Davlumbaz, Klima montajı yapıldı + Karbon filtresi, X aksesuar"
    const parts = yapilanIslem.split('+').map(p => p.trim());

    parts.forEach(part => {
      // Montaj kısmı
      if (part.includes('montajı yapıldı')) {
        const montajText = part.replace('montajı yapıldı', '').trim();
        const montajIsimler = montajText.split(',').map(m => m.trim());
        
        montajIsimler.forEach(isim => {
          const montaj = montajlar.find(m => 
            m.isim.toLowerCase() === isim.toLowerCase()
          );
          if (montaj && !selectedMontajIds.includes(montaj.id)) {
            selectedMontajIds.push(montaj.id);
          }
        });
      } else {
        // Aksesuar kısmı
        const aksesuarIsimler = part.split(',').map(a => a.trim());
        aksesuarIsimler.forEach(isim => {
          const aksesuar = aksesuarlar.find(a => 
            a.isim.toLowerCase() === isim.toLowerCase()
          );
          if (aksesuar && !selectedAksesuarIds.includes(aksesuar.id)) {
            selectedAksesuarIds.push(aksesuar.id);
          }
        });
      }
    });

    setSelectedMontajlar(selectedMontajIds);
    setSelectedAksesuarlar(selectedAksesuarIds);
  };

  // Seçili montaj ve aksesuarlardan yapılan işlem metnini oluştur
  const buildYapilanIslem = () => {
    const parts: string[] = [];
    
    // Montajlar
    if (selectedMontajlar.length > 0) {
      const montajIsimler = selectedMontajlar
        .map(id => montajlar.find(m => m.id === id)?.isim)
        .filter(Boolean);
      if (montajIsimler.length > 0) {
        parts.push(`${montajIsimler.join(', ')} montajı yapıldı`);
      }
    }
    
    // Aksesuarlar
    if (selectedAksesuarlar.length > 0) {
      const aksesuarIsimler = selectedAksesuarlar
        .map(id => aksesuarlar.find(a => a.id === id)?.isim)
        .filter(Boolean);
      if (aksesuarIsimler.length > 0) {
        parts.push(aksesuarIsimler.join(', '));
      }
    }
    
    // Manuel yapılan işlem varsa ekle
    if (formData.yapilan_islem && formData.yapilan_islem.trim()) {
      parts.push(formData.yapilan_islem.trim());
    }
    
    return parts.join(' + ');
  };

  const handleChange = (field: keyof IslemUpdateDto) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = e.target.value;
    
    // Telefon alanları için formatla
    if (field === 'cep_tel' || field === 'sabit_tel' || field === 'yedek_tel') {
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
        yedek_tel: existingRecord.yedek_tel || '',
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

  // Montaj checkbox değişikliği
  const handleMontajChange = (montajId: number) => {
    const newSelected = selectedMontajlar.includes(montajId)
      ? selectedMontajlar.filter(id => id !== montajId)
      : [...selectedMontajlar, montajId];
    
    setSelectedMontajlar(newSelected);
    updateYapilanIslem(newSelected, selectedAksesuarlar);
  };

  // Aksesuar checkbox değişikliği
  const handleAksesuarChange = (aksesuarId: number) => {
    const newSelected = selectedAksesuarlar.includes(aksesuarId)
      ? selectedAksesuarlar.filter(id => id !== aksesuarId)
      : [...selectedAksesuarlar, aksesuarId];
    
    setSelectedAksesuarlar(newSelected);
    updateYapilanIslem(selectedMontajlar, newSelected);
  };

  // Yapılan İşlem alanını güncelle
  const updateYapilanIslem = (montajIds: number[], aksesuarIds: number[]) => {
    const parts: string[] = [];

    // Montajlar
    if (montajIds.length > 0) {
      const montajIsimler = montajIds
        .map(id => montajlar.find(m => m.id === id)?.isim)
        .filter(Boolean);
      if (montajIsimler.length > 0) {
        parts.push(montajIsimler.join(', ') + ' montajı yapıldı');
      }
    }

    // Aksesuarlar
    if (aksesuarIds.length > 0) {
      const aksesuarIsimler = aksesuarIds
        .map(id => aksesuarlar.find(a => a.id === id)?.isim)
        .filter(Boolean);
      if (aksesuarIsimler.length > 0) {
        parts.push(aksesuarIsimler.join(', '));
      }
    }

    setFormData(prev => ({
      ...prev,
      yapilan_islem: parts.join(' + ')
    }));
  };

  const handleConfirmTamamla = async () => {
    // Tamamlama modalındaki bilgileri kaydet ve işlemi tamamla
    const yapilanIslemText = buildYapilanIslem();
    const updatedData = {
      ...formData,
      yapilan_islem: yapilanIslemText,
      is_durumu: 'tamamlandi' as const,
    };
    
    try {
      if (islem) {
        await islemService.update(islem.id, updatedData);
        showSnackbar('İşlem başarıyla tamamlandı!', 'success');
      }
      setShowTamamlaConfirm(false);
      onSave();
      onClose();
    } catch (error) {
      console.error('İşlem tamamlama hatası:', error);
      showSnackbar('İşlem tamamlanamadı!', 'error');
    }
  };

  const handleCancelTamamla = () => {
    setShowTamamlaConfirm(false);
    // Ana dialogu da kapat
    onClose();
  };

  const handleSubmit = async () => {
    // Form validasyonu - Ürün ve Marka kontrolü
    
    // Ürün kontrolü - eğer doldurulmuşsa tanımlı listede olmalı
    if (formData.urun && formData.urun.trim() !== '') {
      const urunExists = urunler.some(u => u.isim === formData.urun);
      if (!urunExists) {
        showSnackbar('Lütfen sadece tanımlı ürünlerden seçim yapınız!', 'error');
        return;
      }
    }
    
    // Marka kontrolü - eğer doldurulmuşsa tanımlı listede olmalı
    if (formData.marka && formData.marka.trim() !== '') {
      const markaExists = markalar.some(m => m.isim === formData.marka);
      if (!markaExists) {
        showSnackbar('Lütfen sadece tanımlı markalardan seçim yapınız!', 'error');
        return;
      }
    }
    
    // Direkt kaydet (tamamlama kontrolü kaldırıldı)
    await saveIslem();
  };

  const saveIslem = async () => {
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
          yedek_tel: formData.yedek_tel,
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

  return (
    <>
    <Dialog open={open && !showTamamlaConfirm} onClose={onClose} maxWidth="md" fullWidth>
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
              label="Ad Soyad"
              value={formData.ad_soyad}
              onChange={handleChange('ad_soyad')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="İlçe"
              value={formData.ilce}
              onChange={handleChange('ilce')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Mahalle"
              value={formData.mahalle}
              onChange={handleChange('mahalle')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Cadde"
              value={formData.cadde}
              onChange={handleChange('cadde')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Sokak"
              value={formData.sokak}
              onChange={handleChange('sokak')}
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
              label="Kapı No"
              value={formData.kapi_no}
              onChange={handleChange('kapi_no')}
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
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Blok No"
              value={formData.blok_no}
              onChange={handleChange('blok_no')}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            {/* Boş alan - hizalama için */}
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Cep Telefonu"
              value={formatPhoneNumber(formData.cep_tel)}
              onChange={handleChange('cep_tel')}
              placeholder="0544 448 88 88"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Yedek Telefon"
              value={formatPhoneNumber(formData.yedek_tel)}
              onChange={handleChange('yedek_tel')}
              placeholder="0544 448 88 88"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={urunler.map(u => u.isim)}
              value={formData.urun || null}
              onChange={(_, newValue) => {
                setFormData({ ...formData, urun: newValue || '' });
              }}
              onInputChange={(event, _value, reason) => {
                // Sadece dropdown seçimlerine izin ver, yazı yazmayı engelle
                if (reason === 'input') {
                  event?.preventDefault();
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Ürün"
                  placeholder="Ürün seçiniz..."
                  onKeyDown={(e) => {
                    // Harf ve sayı tuşlarını engelle
                    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                      e.preventDefault();
                    }
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={markalar.map(m => m.isim)}
              value={formData.marka || null}
              onChange={(_, newValue) => {
                setFormData({ ...formData, marka: newValue || '' });
              }}
              onInputChange={(event, _value, reason) => {
                // Sadece dropdown seçimlerine izin ver, yazı yazmayı engelle
                if (reason === 'input') {
                  event?.preventDefault();
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Marka"
                  placeholder="Marka seçiniz..."
                  onKeyDown={(e) => {
                    // Harf ve sayı tuşlarını engelle
                    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                      e.preventDefault();
                    }
                  }}
                />
              )}
            />
          </Grid>
          
          {/* Şikayet Hızlı Seçim */}
          <Grid item xs={12}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                Hızlı Seçim:
              </Typography>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.sikayet === 'MONTAJ'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, sikayet: 'MONTAJ' });
                        } else {
                          setFormData({ ...formData, sikayet: '' });
                        }
                      }}
                      sx={{
                        color: '#0D3282',
                        '&.Mui-checked': { color: '#0D3282' }
                      }}
                    />
                  }
                  label="MONTAJ"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.sikayet === 'ARIZA'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, sikayet: 'ARIZA' });
                        } else {
                          setFormData({ ...formData, sikayet: '' });
                        }
                      }}
                      sx={{
                        color: '#0D3282',
                        '&.Mui-checked': { color: '#0D3282' }
                      }}
                    />
                  }
                  label="ARIZA"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.sikayet === 'DİĞER'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, sikayet: 'DİĞER' });
                        } else {
                          setFormData({ ...formData, sikayet: '' });
                        }
                      }}
                      sx={{
                        color: '#0D3282',
                        '&.Mui-checked': { color: '#0D3282' }
                      }}
                    />
                  }
                  label="DİĞER"
                />
              </FormGroup>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Şikayet"
              value={formData.sikayet}
              onChange={handleChange('sikayet')}
            />
          </Grid>
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

      {/* Tamamlama Dialog */}
      <Dialog
        open={showTamamlaConfirm}
        onClose={(_, reason) => {
          // Backdrop'a tıklamayı engelle - sadece İptal butonuyla kapanabilir
          if (reason !== 'backdropClick') {
            handleCancelTamamla();
          }
        }}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown={false}
      >
        <DialogTitle sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
          İşlemi Tamamla
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {/* Montaj ve Aksesuar Checkboxları */}
            {(montajlar.length > 0 || aksesuarlar.length > 0) && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f9f9f9' }}>
                  <Grid container spacing={2}>
                    {/* Montajlar */}
                    {montajlar.length > 0 && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#0D3282' }}>
                          Montaj
                        </Typography>
                        <FormGroup>
                          {montajlar.map((montaj) => (
                            <FormControlLabel
                              key={montaj.id}
                              control={
                                <Checkbox
                                  checked={selectedMontajlar.includes(montaj.id)}
                                  onChange={() => handleMontajChange(montaj.id)}
                                  sx={{
                                    color: '#0D3282',
                                    '&.Mui-checked': { color: '#0D3282' }
                                  }}
                                />
                              }
                              label={montaj.isim}
                            />
                          ))}
                        </FormGroup>
                      </Grid>
                    )}

                    {/* Aksesuarlar */}
                    {aksesuarlar.length > 0 && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#0D8220' }}>
                          Aksesuarlar
                        </Typography>
                        <FormGroup>
                          {aksesuarlar.map((aksesuar) => (
                            <FormControlLabel
                              key={aksesuar.id}
                              control={
                                <Checkbox
                                  checked={selectedAksesuarlar.includes(aksesuar.id)}
                                  onChange={() => handleAksesuarChange(aksesuar.id)}
                                  sx={{
                                    color: '#0D8220',
                                    '&.Mui-checked': { color: '#0D8220' }
                                  }}
                                />
                              }
                              label={aksesuar.isim}
                            />
                          ))}
                        </FormGroup>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Grid>
            )}

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
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelTamamla} variant="outlined">
            İptal
          </Button>
          <Button onClick={handleConfirmTamamla} variant="contained" color="success" autoFocus>
            Tamamla
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default IslemDialog;
