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
  MenuItem,
  useMediaQuery,
  useTheme,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [teknisyenler, setTeknisyenler] = useState<Teknisyen[]>([]);
  const [markalar, setMarkalar] = useState<Marka[]>([]);
  const [montajlar, setMontajlar] = useState<Montaj[]>([]);
  const [aksesuarlar, setAksesuarlar] = useState<Aksesuar[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [ilceler, setIlceler] = useState<{ ilce_id: number; isim: string }[]>([]);
  const [mahalleler, setMahalleler] = useState<{ mahalle_id: number; isim: string }[]>([]);
  const [selectedIlceId, setSelectedIlceId] = useState<number | null>(null);
  const [selectedMontajlar, setSelectedMontajlar] = useState<number[]>([]);
  const [selectedAksesuarlar, setSelectedAksesuarlar] = useState<number[]>([]);
  const [existingRecord, setExistingRecord] = useState<Islem | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPhoneQuery, setShowPhoneQuery] = useState(false);
  const [showTamamlaConfirm, setShowTamamlaConfirm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [markaUyari, setMarkaUyari] = useState<string>(''); // Marka uyarı mesajı
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

  // Teknisyen, marka, montaj, aksesuar, ürün ve ilçe listelerini yükle
  useEffect(() => {
    const loadData = async () => {
      try {
        const [teknisyenResponse, markaResponse, montajResponse, aksesuarResponse, urunResponse, ilcelerResponse] = await Promise.all([
          api.get<Teknisyen[]>('/teknisyenler'),
          api.get<Marka[]>('/markalar'),
          api.get<Montaj[]>('/montajlar'),
          api.get<Aksesuar[]>('/aksesuarlar'),
          api.get<Urun[]>('/urunler'),
          api.get<{ ilce_id: number; isim: string }[]>('/ilceler'),
        ]);
        setTeknisyenler(teknisyenResponse.data);
        setMarkalar(markaResponse.data);
        setMontajlar(montajResponse.data);
        setAksesuarlar(aksesuarResponse.data);
        setUrunler(urunResponse.data);
        setIlceler(ilcelerResponse.data);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      }
    };
    if (open) {
      loadData();
    }
  }, [open]);

  // İlçe seçildiğinde mahalleleri yükle
  useEffect(() => {
    const loadMahalleler = async () => {
      if (selectedIlceId) {
        try {
          const response = await api.get<{ mahalle_id: number; isim: string }[]>(`/ilceler/${selectedIlceId}/mahalleler`);
          setMahalleler(response.data);
        } catch (error) {
          console.error('Mahalleler yüklenirken hata:', error);
        }
      } else {
        setMahalleler([]);
      }
    };
    loadMahalleler();
  }, [selectedIlceId]);

  // Montaj ve aksesuarlar yüklendikten sonra parse et
  useEffect(() => {
    if (islem && montajlar.length > 0 && aksesuarlar.length > 0) {
      parseYapilanIslem(islem.yapilan_islem || '');
    }
  }, [montajlar, aksesuarlar]);

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
        // İş durumunu o anki haliyle getir
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
      setMarkaUyari(''); // Marka uyarısını temizle
    }
  }, [islem, open]);

  // Tamamlama modalını otomatik aç
  useEffect(() => {
    if (open && openTamamlaModal && islem) {
      setShowTamamlaConfirm(true);
    }
  }, [open, openTamamlaModal, islem]);

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
      // Tüm text inputlar için büyük harf dönüşümü
      value = value.toLocaleUpperCase('tr-TR');
      setFormData({ ...formData, [field]: value });
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = cleanPhoneNumber(value);
    // Telefon numaraları için büyük harf dönüşümü YAPMA
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
    // Zorunlu alan kontrolü
    if (!formData.teknisyen_ismi || formData.teknisyen_ismi.trim() === '') {
      showSnackbar('Teknisyen İsmi alanı zorunludur!', 'error');
      return;
    }

    const yapilanIslemText = buildYapilanIslem();
    
    if (!yapilanIslemText || yapilanIslemText.trim() === '') {
      showSnackbar('Yapılan İşlem alanı zorunludur!', 'error');
      return;
    }

    // Tamamlama modalındaki bilgileri kaydet
    const updatedData = {
      ...formData,
      yapilan_islem: yapilanIslemText,
      // is_durumu formData'dan alınacak (kullanıcının seçtiği değer)
    };
    
    try {
      if (islem) {
        await islemService.update(islem.id, updatedData);
        const statusMessage = formData.is_durumu === 'tamamlandi' 
          ? 'İşlem başarıyla tamamlandı!' 
          : 'İşlem başarıyla güncellendi!';
        showSnackbar(statusMessage, 'success');
      }
      setShowTamamlaConfirm(false);
      onSave();
      onClose();
    } catch (error) {
      console.error('İşlem tamamlama hatası:', error);
      showSnackbar('İşlem güncellenemedi!', 'error');
    }
  };

  const handleCancelTamamla = () => {
    setShowTamamlaConfirm(false);
    // Ana dialogu da kapat
    onClose();
  };

  const handleSubmit = async () => {
    // Zorunlu alan kontrolü
    if (!formData.ad_soyad || formData.ad_soyad.trim() === '') {
      showSnackbar('Ad Soyad alanı zorunludur!', 'error');
      return;
    }
    
    if (!formData.ilce || formData.ilce.trim() === '') {
      showSnackbar('İlçe alanı zorunludur!', 'error');
      return;
    }
    
    // Cadde veya Sokak'tan en az biri dolu olmalı
    if ((!formData.cadde || formData.cadde.trim() === '') && (!formData.sokak || formData.sokak.trim() === '')) {
      showSnackbar('Cadde veya Sokak alanlarından en az biri doldurulmalıdır!', 'error');
      return;
    }
    
    // Kapı No zorunlu
    if (!formData.kapi_no || formData.kapi_no.trim() === '') {
      showSnackbar('Kapı No alanı zorunludur!', 'error');
      return;
    }
    
    // Daire No zorunlu
    if (!formData.daire_no || formData.daire_no.trim() === '') {
      showSnackbar('Daire No alanı zorunludur!', 'error');
      return;
    }
    
    // Cep Telefonu zorunlu
    if (!formData.cep_tel || formData.cep_tel.trim() === '') {
      showSnackbar('Cep Telefonu alanı zorunludur!', 'error');
      return;
    }
    
    if (!formData.urun || formData.urun.trim() === '') {
      showSnackbar('Ürün alanı zorunludur!', 'error');
      return;
    }
    
    if (!formData.marka || formData.marka.trim() === '') {
      showSnackbar('Marka alanı zorunludur!', 'error');
      return;
    }
    
    // Marka listeden seçilmiş olmalı
    if (!markalar.some(m => m.isim === formData.marka)) {
      showSnackbar('Lütfen marka listesinden geçerli bir seçim yapın! Gerekirse "DİĞER" seçeneğini kullanabilirsiniz.', 'error');
      setMarkaUyari('Lütfen listeden geçerli bir marka seçin!');
      return;
    }
    
    if (!formData.sikayet || formData.sikayet.trim() === '') {
      showSnackbar('Şikayet alanı zorunludur!', 'error');
      return;
    }
    
    // Form validasyonu - Ürün ve Marka kontrolü
    
    // Ürün kontrolü - tanımlı listede olmalı
    const urunExists = urunler.some(u => u.isim === formData.urun);
    if (!urunExists) {
      showSnackbar('Lütfen listeden bir ürün seçiniz! Sadece tanımlı ürünler kabul edilir.', 'error');
      return;
    }
    
    // Marka kontrolü - tanımlı listede olmalı
    const markaExists = markalar.some(m => m.isim === formData.marka);
    if (!markaExists) {
      showSnackbar('Lütfen listeden bir marka seçiniz! Sadece tanımlı markalar kabul edilir.', 'error');
      return;
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
          is_durumu: formData.is_durumu,
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
    <Dialog open={open && !showTamamlaConfirm} onClose={onClose} maxWidth="lg" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ py: 0.75, px: 2, fontSize: '1rem', fontWeight: 600 }}>{islem ? 'İşlem Düzenle' : 'Yeni İşlem Ekle'}</DialogTitle>
      <DialogContent sx={{ py: 0.5, px: 2, maxHeight: '80vh', overflowY: 'auto' }}>
        {/* Telefon Numarası Sorgusu (Sadece yeni kayıt için) */}
        {showPhoneQuery && !islem && (
          <Box sx={{ mt: 1, mb: 1 }}>
            <Alert severity="info" sx={{ mb: 1.5, py: 0.5 }}>
              <AlertTitle sx={{ fontSize: '0.875rem', mb: 0.5 }}>Telefon Numarası Sorgusu</AlertTitle>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                Lütfen müşterinin cep telefon numarasını girin. Daha önce kayıt varsa bilgileri getireceğiz.
              </Typography>
            </Alert>
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  autoFocus
                  label="Cep Telefonu"
                  value={formatPhoneNumber(phoneNumber)}
                  onChange={handlePhoneNumberChange}
                  placeholder="0544 448 88 88"
                  helperText={`${phoneNumber.length}/11 hane`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handlePhoneSubmit();
                    }
                  }}
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
            sx={{ mb: 1.5, mt: 1, py: 0.5 }}
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
            <AlertTitle sx={{ fontSize: '0.875rem', mb: 0.5 }}>Daha Önce Kayıt Bulundu!</AlertTitle>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              Bu telefon numarasıyla ({formatPhoneNumber(existingRecord.cep_tel)}) daha önce <strong>{existingRecord.ad_soyad}</strong> adına kayıt açılmış. 
              Önceki müşteri bilgilerini getirmek ister misiniz?
            </Typography>
          </Alert>
        )}

        {/* Form Alanları (Form gösterildiyse) */}
        {showForm && (
        <Grid container spacing={1} sx={{ mt: 0 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              size="small"
              label="Ad Soyad"
              value={formData.ad_soyad}
              onChange={handleChange('ad_soyad')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              size="small"
              options={ilceler}
              getOptionLabel={(option) => option.isim}
              value={ilceler.find(i => i.isim === formData.ilce) || null}
              filterOptions={(options, state) => {
                // Eğer input boşsa tüm seçenekleri göster
                if (!state.inputValue) return options;
                // Eğer input varsa filtrele
                const filtered = options.filter(option =>
                  option.isim.toLocaleLowerCase('tr-TR').includes(state.inputValue.toLocaleLowerCase('tr-TR'))
                );
                // Eşleşme yoksa boş liste döndür (hiçbir şey gösterme)
                return filtered;
              }}
              onChange={(_, newValue) => {
                setFormData({ ...formData, ilce: newValue?.isim || '', mahalle: '' });
                setSelectedIlceId(newValue?.ilce_id || null);
              }}
              onInputChange={(_, value, reason) => {
                // Kullanıcı yazarken filtrelenen seçenekleri kontrol et
                if (reason === 'input') {
                  const filtered = ilceler.filter(ilce => 
                    ilce.isim.toLocaleLowerCase('tr-TR').includes(value.toLocaleLowerCase('tr-TR'))
                  );
                  // Eğer tek bir seçenek kaldıysa otomatik seç (blur YAPMA - kullanıcı TAB ile geçecek)
                  if (filtered.length === 1 && value.length > 0) {
                    setFormData({ ...formData, ilce: filtered[0].isim, mahalle: '' });
                    setSelectedIlceId(filtered[0].ilce_id);
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
                  name="ilce"
                  required 
                  label="İlçe"
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault(); // Default davranışı engelle
                      // Eğer popup açıksa ve vurgulanan bir seçenek varsa onu seç
                      const popup = document.querySelector('[role="listbox"]');
                      if (popup) {
                        const highlighted = popup.querySelector('[data-focus="true"]') as HTMLElement;
                        if (highlighted) {
                          const text = highlighted.textContent;
                          const found = ilceler.find(i => i.isim === text);
                          if (found) {
                            setFormData({ ...formData, ilce: found.isim, mahalle: '' });
                            setSelectedIlceId(found.ilce_id);
                          }
                        }
                      }
                      // Her durumda mahalle alanına geç
                      setTimeout(() => {
                        const mahalleInput = document.querySelector('input[name="mahalle"]') as HTMLInputElement;
                        if (mahalleInput) {
                          mahalleInput.focus();
                        }
                      }, 100);
                    }
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              size="small"
              options={mahalleler}
              getOptionLabel={(option) => option.isim}
              value={mahalleler.find(m => m.isim === formData.mahalle) || null}
              filterOptions={(options, state) => {
                // Eğer input boşsa tüm seçenekleri göster
                if (!state.inputValue) return options;
                // Eğer input varsa filtrele
                const filtered = options.filter(option =>
                  option.isim.toLocaleLowerCase('tr-TR').includes(state.inputValue.toLocaleLowerCase('tr-TR'))
                );
                // Eşleşme yoksa boş liste döndür (hiçbir şey gösterme)
                return filtered;
              }}
              onChange={(_, newValue) => {
                setFormData({ ...formData, mahalle: newValue?.isim || '' });
              }}
              onInputChange={(_, value, reason) => {
                // Kullanıcı yazarken filtrelenen seçenekleri kontrol et
                if (reason === 'input') {
                  const filtered = mahalleler.filter(mahalle => 
                    mahalle.isim.toLocaleLowerCase('tr-TR').includes(value.toLocaleLowerCase('tr-TR'))
                  );
                  // Eğer tek bir seçenek kaldıysa otomatik seç (blur YAPMA - kullanıcı TAB ile geçecek)
                  if (filtered.length === 1 && value.length > 0) {
                    setFormData({ ...formData, mahalle: filtered[0].isim });
                  }
                  // Eğer hiç eşleşme yoksa formData'dan mahalle'yi temizleme (kullanıcı hala yazıyor olabilir)
                }
              }}
              autoHighlight
              selectOnFocus
              clearOnBlur={false}
              handleHomeEndKeys={false}
              disabled={!formData.ilce}
              renderInput={(params) => (
                <TextField 
                  {...params}
                  size="small"
                  name="mahalle"
                  label="Mahalle"
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault(); // Default davranışı engelle
                      // Eğer popup açıksa ve vurgulanan bir seçenek varsa onu seç
                      const popup = document.querySelector('[role="listbox"]');
                      if (popup) {
                        const highlighted = popup.querySelector('[data-focus="true"]') as HTMLElement;
                        if (highlighted) {
                          const text = highlighted.textContent;
                          const found = mahalleler.find(m => m.isim === text);
                          if (found) {
                            setFormData({ ...formData, mahalle: found.isim });
                          }
                        }
                      }
                      // Her durumda cadde alanına geç
                      setTimeout(() => {
                        const caddeInput = document.querySelector('input[name="cadde"]') as HTMLInputElement;
                        if (caddeInput) {
                          caddeInput.focus();
                        }
                      }, 100);
                    }
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              name="cadde"
              label="Cadde"
              value={formData.cadde}
              onChange={handleChange('cadde')}
              error={!formData.cadde && !formData.sokak}
              helperText={!formData.cadde && !formData.sokak ? "Cadde veya Sokak doldurulmalı" : ""}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              name="sokak"
              label="Sokak"
              value={formData.sokak}
              onChange={handleChange('sokak')}
              error={!formData.cadde && !formData.sokak}
              helperText={!formData.cadde && !formData.sokak ? "Cadde veya Sokak doldurulmalı" : ""}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              size="small"
              name="kapi_no"
              label="Kapı No"
              value={formData.kapi_no}
              onChange={handleChange('kapi_no')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              size="small"
              name="daire_no"
              label="Daire No"
              value={formData.daire_no}
              onChange={handleChange('daire_no')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Apartman/Site"
              value={formData.apartman_site}
              onChange={handleChange('apartman_site')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Blok No"
              value={formData.blok_no}
              onChange={handleChange('blok_no')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              size="small"
              label="Cep Telefonu"
              value={formatPhoneNumber(formData.cep_tel)}
              onChange={handleChange('cep_tel')}
              placeholder="0544 448 88 88"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Yedek Telefon"
              value={formatPhoneNumber(formData.yedek_tel)}
              onChange={handleChange('yedek_tel')}
              placeholder="0544 448 88 88"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              size="small"
              options={urunler.map(u => u.isim)}
              value={formData.urun || null}
              filterOptions={(options, state) => {
                // Eğer input boşsa tüm seçenekleri göster
                if (!state.inputValue) return options;
                // Eğer input varsa filtrele
                const filtered = options.filter(option =>
                  option.toLocaleLowerCase('tr-TR').includes(state.inputValue.toLocaleLowerCase('tr-TR'))
                );
                // Eşleşme yoksa boş liste döndür
                return filtered;
              }}
              onChange={(_, newValue) => {
                setFormData({ ...formData, urun: newValue || '' });
              }}
              onInputChange={(_, value, reason) => {
                // Kullanıcı yazarken filtrelenen seçenekleri kontrol et
                if (reason === 'input') {
                  const filtered = urunler.filter(urun => 
                    urun.isim.toLocaleLowerCase('tr-TR').includes(value.toLocaleLowerCase('tr-TR'))
                  );
                  // Eğer tek bir seçenek kaldıysa otomatik seç (otomatik geçiş YAPMA)
                  if (filtered.length === 1 && value.length > 0) {
                    setFormData({ ...formData, urun: filtered[0].isim });
                  }
                }
              }}
              onClose={(_, reason) => {
                if (reason === 'blur') {
                  const popup = document.querySelector('[role="listbox"]');
                  if (popup) {
                    const highlighted = popup.querySelector('[data-focus="true"]');
                    if (highlighted) {
                      const text = highlighted.textContent;
                      if (text && urunler.some(u => u.isim === text)) {
                        setFormData({ ...formData, urun: text });
                      }
                    }
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
                  name="urun"
                  fullWidth
                  required
                  size="small"
                  label="Ürün"
                  placeholder="Ürün ara ve seç..."
                  error={!formData.urun}
                  helperText={!formData.urun ? 'Listeden bir ürün seçmelisiniz' : ''}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault(); // Default davranışı engelle
                      // Eğer popup açıksa ve vurgulanan bir seçenek varsa onu seç
                      const popup = document.querySelector('[role="listbox"]');
                      if (popup) {
                        const highlighted = popup.querySelector('[data-focus="true"]') as HTMLElement;
                        if (highlighted) {
                          const text = highlighted.textContent;
                          if (text && urunler.some(u => u.isim === text)) {
                            setFormData({ ...formData, urun: text });
                          }
                        }
                      }
                      // Her durumda marka alanına geç
                      setTimeout(() => {
                        const markaInput = document.querySelector('input[name="marka"]') as HTMLInputElement;
                        if (markaInput) {
                          markaInput.focus();
                        }
                      }, 100);
                    }
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              size="small"
              options={markalar.map(m => m.isim)}
              value={formData.marka || null}
              filterOptions={(options, state) => {
                // Eğer input boşsa tüm seçenekleri göster
                if (!state.inputValue) return options;
                // Eğer input varsa filtrele
                const filtered = options.filter(option =>
                  option.toLocaleLowerCase('tr-TR').includes(state.inputValue.toLocaleLowerCase('tr-TR'))
                );
                // Eşleşme yoksa boş liste döndür
                return filtered;
              }}
              onChange={(_, newValue) => {
                setFormData({ ...formData, marka: newValue || '' });
                setMarkaUyari(''); // Seçim yapıldığında uyarıyı temizle
              }}
              onInputChange={(_, value, reason) => {
                // Kullanıcı yazarken filtrelenen seçenekleri kontrol et
                if (reason === 'input' && value.length > 2) {
                  const filtered = markalar.filter(marka => 
                    marka.isim.toLocaleLowerCase('tr-TR').includes(value.toLocaleLowerCase('tr-TR'))
                  );
                  // Eğer tek bir seçenek kaldıysa otomatik seç
                  if (filtered.length === 1) {
                    setFormData({ ...formData, marka: filtered[0].isim });
                    setMarkaUyari('');
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
                  fullWidth
                  required
                  size="small"
                  label="Marka"
                  placeholder="Marka ara ve seç..."
                  error={!formData.marka}
                  helperText={markaUyari || (!formData.marka ? 'Listeden bir marka seçmelisiniz' : '')}
                  FormHelperTextProps={{
                    sx: markaUyari ? { color: 'warning.main', fontWeight: 500 } : undefined
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault(); // Default davranışı engelle
                      // Eğer popup açıksa ve vurgulanan bir seçenek varsa onu seç
                      const popup = document.querySelector('[role="listbox"]');
                      if (popup) {
                        const highlighted = popup.querySelector('[data-focus="true"]') as HTMLElement;
                        if (highlighted) {
                          const text = highlighted.textContent;
                          if (text && markalar.some(m => m.isim === text)) {
                            setFormData({ ...formData, marka: text });
                            setMarkaUyari(''); // Uyarıyı temizle
                          }
                        }
                      }
                      // Her durumda şikayet alanına geç (textarea olabilir)
                      setTimeout(() => {
                        const sikayetInput = document.querySelector('textarea[name="sikayet"], input[name="sikayet"]') as HTMLInputElement | HTMLTextAreaElement;
                        if (sikayetInput) {
                          sikayetInput.focus();
                        }
                      }, 100);
                    }
                  }}
                />
              )}
            />
          </Grid>
          
          {/* Şikayet Hızlı Seçim */}
          <Grid item xs={12}>
            <Box sx={{ mb: 0.5 }}>
              <Typography variant="caption" sx={{ mb: 0.5, color: '#666', fontSize: '0.75rem', display: 'block' }}>
                Hızlı Seçim:
              </Typography>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
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
                        '&.Mui-checked': { color: '#0D3282' },
                        py: 0.5
                      }}
                    />
                  }
                  label="MONTAJ"
                  sx={{ mr: 2 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
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
                        '&.Mui-checked': { color: '#0D3282' },
                        py: 0.5
                      }}
                    />
                  }
                  label="ARIZA"
                  sx={{ mr: 2 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
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
                        '&.Mui-checked': { color: '#0D3282' },
                        py: 0.5
                      }}
                    />
                  }
                  label="DİĞER"
                  sx={{ mr: 2 }}
                />
              </FormGroup>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              size="small"
              name="sikayet"
              multiline
              rows={1}
              label="Şikayet"
              value={formData.sikayet}
              onChange={handleChange('sikayet')}
            />
          </Grid>
        </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1 }}>
        <Button onClick={onClose} size="small">İptal</Button>
        {showForm && (
          <Button onClick={handleSubmit} variant="contained" size="small">
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
        fullScreen={isMobile}
        disableEscapeKeyDown={false}
      >
        <DialogTitle sx={{ bgcolor: 'success.light', color: 'success.contrastText', py: 0.75, px: 2, fontSize: '1rem', fontWeight: 600 }}>
          İşlemi Tamamla
        </DialogTitle>
        <DialogContent sx={{ py: 1, px: 2, maxHeight: '75vh', overflowY: 'auto' }}>
          <Grid container spacing={1}>
            {/* Montaj ve Aksesuar Checkboxları - Daha kompakt */}
            <Grid item xs={12}>
              <Box sx={{ p: 0.5, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f9f9f9' }}>
                <Grid container spacing={0.5}>
                  {/* Montajlar */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 'bold', color: '#0D3282', display: 'block' }}>
                      Montaj
                    </Typography>
                    {montajlar.length > 0 ? (
                      <FormGroup>
                        {montajlar.map((montaj) => (
                          <FormControlLabel
                            key={montaj.id}
                            control={
                              <Checkbox
                                size="small"
                                checked={selectedMontajlar.includes(montaj.id)}
                                onChange={() => handleMontajChange(montaj.id)}
                                sx={{
                                  color: '#0D3282',
                                  '&.Mui-checked': { color: '#0D3282' },
                                  py: 0.25
                                }}
                              />
                            }
                            label={<Typography variant="body2">{montaj.isim}</Typography>}
                            sx={{ my: 0 }}
                          />
                        ))}
                      </FormGroup>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Montaj listesi boş
                      </Typography>
                    )}
                  </Grid>

                  {/* Aksesuarlar */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 'bold', color: '#0D8220', display: 'block' }}>
                      Aksesuarlar
                    </Typography>
                    {aksesuarlar.length > 0 ? (
                      <FormGroup>
                        {aksesuarlar.map((aksesuar) => (
                          <FormControlLabel
                            key={aksesuar.id}
                            control={
                              <Checkbox
                                size="small"
                                checked={selectedAksesuarlar.includes(aksesuar.id)}
                                onChange={() => handleAksesuarChange(aksesuar.id)}
                                sx={{
                                  color: '#0D8220',
                                  '&.Mui-checked': { color: '#0D8220' },
                                  py: 0.25
                                }}
                              />
                            }
                            label={<Typography variant="body2">{aksesuar.isim}</Typography>}
                            sx={{ my: 0 }}
                          />
                        ))}
                      </FormGroup>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Aksesuar listesi boş
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* Teknisyen İsmi - Zorunlu */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                size="small"
                freeSolo
                options={teknisyenler.map(t => t.isim)}
                value={formData.teknisyen_ismi || ''}
                onChange={(_, newValue) => {
                  setFormData({ ...formData, teknisyen_ismi: newValue || '' });
                }}
                inputValue={formData.teknisyen_ismi || ''}
                onInputChange={(_, newInputValue, reason) => {
                  setFormData({ ...formData, teknisyen_ismi: newInputValue || '' });
                  
                  // Kullanıcı yazarken filtrelenen seçenekleri kontrol et
                  if (reason === 'input') {
                    const filtered = teknisyenler.filter(tek => 
                      tek.isim.toLowerCase().includes(newInputValue.toLowerCase())
                    );
                    // Eğer tek bir seçenek kaldıysa otomatik seç
                    if (filtered.length === 1 && newInputValue.length > 0) {
                      setFormData({ ...formData, teknisyen_ismi: filtered[0].isim });
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
                    required
                    fullWidth
                    size="small"
                    label="Teknisyen İsmi"
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        const popup = document.querySelector('[role="listbox"]');
                        if (popup) {
                          const highlighted = popup.querySelector('[data-focus="true"]') as HTMLElement;
                          if (highlighted) {
                            e.preventDefault();
                            const text = highlighted.textContent;
                            if (text) {
                              setFormData({ ...formData, teknisyen_ismi: text });
                              setTimeout(() => {
                                (e.target as HTMLElement).blur();
                              }, 10);
                            }
                          }
                        }
                      }
                    }}
                  />
                )}
              />
            </Grid>

            {/* Tutar */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Tutar"
                type="number"
                value={formData.tutar}
                onChange={handleChange('tutar')}
                InputProps={{
                  endAdornment: 'TL',
                }}
              />
            </Grid>

            {/* Yapılan İşlem - Zorunlu */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                size="small"
                multiline
                rows={1}
                label="Yapılan İşlem"
                value={formData.yapilan_islem}
                onChange={handleChange('yapilan_islem')}
              />
            </Grid>

            {/* İş Durumu - En altta */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="İş Durumu"
                value={formData.is_durumu}
                onChange={handleChange('is_durumu')}
              >
                <MenuItem value="acik">Açık</MenuItem>
                <MenuItem value="parca_bekliyor">Parça Bekliyor</MenuItem>
                <MenuItem value="tamamlandi">Tamamlandı</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1 }}>
          <Button onClick={handleCancelTamamla} variant="outlined" size="small">
            İptal
          </Button>
          <Button onClick={handleConfirmTamamla} variant="contained" color="success" size="small" autoFocus>
            Tamamla
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default IslemDialog;
