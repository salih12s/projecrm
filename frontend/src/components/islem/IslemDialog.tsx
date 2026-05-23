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
  useMediaQuery,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { Islem, IslemCreateDto, IslemUpdateDto } from '../../types';
import { islemService } from '../../services/islem.service';
import { karalisteService } from '../../services/karaliste.service';
import { locationService } from '../../services/location.service';
import { useSnackbar } from '../../context/SnackbarContext';
import { useReferenceData } from '../../hooks/useReferenceData';
import { formatPhone as formatPhoneNumber } from '../../utils/format';
import DuplicateRecordDialog from './dialog/DuplicateRecordDialog';
import IslemHistoryViewDialog from './dialog/IslemHistoryViewDialog';
import KaralisteWarningDialog from './dialog/KaralisteWarningDialog';
import TamamlaConfirmDialog from './dialog/TamamlaConfirmDialog';

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
  onHold?: (isOnHold: boolean, formData?: any) => void; // Bekleme durumu değiştiğinde Dashboard'ı bilgilendir
  restoreFormData?: any; // Beklemeden dönerken form verilerini geri yükle
  cloneFromRecord?: Islem; // Ad soyada çift tık ile klonlama için
}

const IslemDialog: React.FC<IslemDialogProps> = ({ open, islem, onClose, onSave, openTamamlaModal = false, onHold, restoreFormData, cloneFromRecord }) => {
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isCloneMode, setIsCloneMode] = useState(false); // Çift tıklama ile klonlama modu
  // Referans listeleri ortak hook ile yükleniyor (cache key/TTL legacy ile birebir aynı).
  const { teknisyenler, markalar, montajlar, aksesuarlar, urunler, ilceler } = useReferenceData({
    enabled: open,
    cache: { storageKey: 'islemDialogData', ttlMs: 5 * 60 * 1000 },
  });
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
  const [ilceInputValue, setIlceInputValue] = useState('');
  const [mahalleInputValue, setMahalleInputValue] = useState('');
  const [urunInputValue, setUrunInputValue] = useState('');
  const [markaInputValue, setMarkaInputValue] = useState('');
  const [teknisyenInputValue, setTeknisyenInputValue] = useState('');
  const [duplicateRecord, setDuplicateRecord] = useState<Islem | null>(null); // Duplicate kayıt için
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false); // Duplicate modal
  const [isOnHold, setIsOnHold] = useState(false); // Beklemeye alınma durumu
  const [usedExistingData, setUsedExistingData] = useState(false); // BİLGİLERİ GETİR kullanıldı mı?
  
  // Karaliste state'leri
  const [showKaralisteDialog, setShowKaralisteDialog] = useState(false);
  const [karalisteRecord, setKaralisteRecord] = useState<any>(null);
  const [karalisteType, setKaralisteType] = useState<'phone' | 'address'>('phone');
  const [pendingAfterKaraliste, setPendingAfterKaraliste] = useState<(() => void) | null>(null);
  
  // Müşteri Geçmişi Dialog state'leri
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<Islem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
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
    montaj: '',
    aksesuar: '',
    atolye: '',
    teknisyen_ismi: '',
    yapilan_islem: '',
    tutar: 0,
    is_durumu: 'acik',
  });

  // Teknisyen, marka, montaj, aksesuar, ürün ve ilçe listeleri artık useReferenceData hook'u
  // tarafından yönetiliyor (aynı 5 dk localStorage cache, aynı endpointler).

  // İlçe seçildiğinde mahalleleri yükle
  useEffect(() => {
    const loadMahalleler = async () => {
      if (selectedIlceId) {
        try {
          const data = await locationService.getMahalleler(selectedIlceId);
          setMahalleler(data);
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

  // İlçeler yüklendiğinde islem varsa ilçe ID'sini set et
  useEffect(() => {
    if (islem && ilceler.length > 0) {
      const ilce = ilceler.find(i => i.isim === islem.ilce);
      if (ilce) {
        setSelectedIlceId(ilce.ilce_id);
      }
    }
  }, [ilceler, islem]);

  useEffect(() => {
    if (islem) {
      // Düzenleme modu - formu direkt göster
      setShowForm(true);
      setShowPhoneQuery(false);
      setIlceInputValue(islem.ilce);
      setMahalleInputValue(islem.mahalle);
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
        // İş durumunu o anki haliyle getir (büyük harfse küçüğe çevir)
        is_durumu: (islem.is_durumu?.toLowerCase() as 'acik' | 'parca_bekliyor' | 'tamamlandi' | 'iptal') || 'acik',
      });
      
      // InputValue'leri de başlat
      setUrunInputValue(islem.urun);
      setMarkaInputValue(islem.marka);
      setTeknisyenInputValue(islem.teknisyen_ismi || '');
      
      // Yapılan işlem alanından checkbox'ları otomatik işaretle
      parseYapilanIslem(islem.yapilan_islem || '');
    } else {
      // Yeni kayıt modu - önce telefon sorgusu göster
      setShowForm(false);
      setShowPhoneQuery(true);
      setPhoneNumber('');
      setSelectedMontajlar([]);
      setSelectedAksesuarlar([]);
      setSelectedIlceId(null); // İlçeyi de reset et
      setMahalleler([]); // Mahalleleri temizle
      setIlceInputValue('');
      setMahalleInputValue('');
      setUrunInputValue('');
      setMarkaInputValue('');
      setTeknisyenInputValue('');
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
      setIsOnHold(false); // Bekleme durumunu sıfırla
    }
  }, [islem, open]);

  // Tamamlama modalını otomatik aç
  useEffect(() => {
    if (open && openTamamlaModal && islem) {
      setShowTamamlaConfirm(true);
    }
  }, [open, openTamamlaModal, islem]);

  // Çift tıklama ile klonlama modu
  useEffect(() => {
    if (cloneFromRecord && open && !islem) {
      setIsCloneMode(true);
      setShowPhoneQuery(false);
      setShowForm(true);
      
      // Sadece müşteri bilgilerini getir, tamamlama bilgileri boş
      setFormData({
        ad_soyad: cloneFromRecord.ad_soyad || '',
        ilce: cloneFromRecord.ilce || '',
        mahalle: cloneFromRecord.mahalle || '',
        cadde: cloneFromRecord.cadde || '',
        sokak: cloneFromRecord.sokak || '',
        kapi_no: cloneFromRecord.kapi_no || '',
        apartman_site: cloneFromRecord.apartman_site || '',
        blok_no: cloneFromRecord.blok_no || '',
        daire_no: cloneFromRecord.daire_no || '',
        sabit_tel: cloneFromRecord.sabit_tel || '',
        cep_tel: cloneFromRecord.cep_tel || '',
        yedek_tel: cloneFromRecord.yedek_tel || '',
        urun: cloneFromRecord.urun || '',
        marka: cloneFromRecord.marka || '',
        sikayet: cloneFromRecord.sikayet || '',
        teknisyen_ismi: '', // Tamamlama bilgisi - boş
        yapilan_islem: '', // Tamamlama bilgisi - boş
        tutar: 0, // Tamamlama bilgisi - boş
        montaj: '', // Tamamlama bilgisi - boş
        aksesuar: '', // Tamamlama bilgisi - boş
        atolye: cloneFromRecord.atolye || '',
        is_durumu: 'acik',
      });
      
      // İlçe ve mahalle set et
      if (cloneFromRecord.ilce) {
        setIlceInputValue(cloneFromRecord.ilce);
        const ilce = ilceler.find(i => i.isim === cloneFromRecord.ilce);
        if (ilce) {
          setSelectedIlceId(ilce.ilce_id);
        }
      }
      if (cloneFromRecord.mahalle) {
        setMahalleInputValue(cloneFromRecord.mahalle);
      }
      
      // Montaj ve aksesuar seçimlerini BOŞ bırak (tamamlama bilgileri)
      setSelectedMontajlar([]);
      setSelectedAksesuarlar([]);
    } else if (!cloneFromRecord) {
      setIsCloneMode(false);
    }
  }, [cloneFromRecord, open, islem, ilceler, montajlar, aksesuarlar]);

  // Dialog kapandığında bekleme durumunu sıfırla
  useEffect(() => {
    if (!open) {
      setIsOnHold(false);
      setUsedExistingData(false); // Flag'i sıfırla
    }
  }, [open]);

  // Beklemeden dönerken form verilerini geri yükle
  useEffect(() => {
    if (restoreFormData && open && !islem) {
      console.log('Form verileri geri yükleniyor:', restoreFormData);
      setFormData(restoreFormData);
      setShowForm(true);
      setShowPhoneQuery(false);
      // İlçe ve mahalle bilgilerini de set et
      if (restoreFormData.ilce) {
        setIlceInputValue(restoreFormData.ilce);
        // İlçe ID'sini bul
        const ilceItem = ilceler.find(i => i.isim === restoreFormData.ilce);
        if (ilceItem) {
          setSelectedIlceId(ilceItem.ilce_id);
        }
      }
      if (restoreFormData.mahalle) {
        setMahalleInputValue(restoreFormData.mahalle);
      }
    }
  }, [restoreFormData, open, islem, ilceler]);

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
  // NOT: updateYapilanIslem fonksiyonu zaten formData.yapilan_islem'i güncelliyor
  // Bu yüzden burada sadece formData.yapilan_islem'i döndürüyoruz
  const buildYapilanIslem = () => {
    // formData.yapilan_islem zaten updateYapilanIslem tarafından güncelleniyor
    // Checkbox'lar değiştiğinde otomatik olarak yapilan_islem alanı dolduruluyor
    return formData.yapilan_islem || '';
  };

  const handleChange = (field: keyof IslemUpdateDto) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const input = e.target;
    const rawValue = input.value;
    const cursorPos = input.selectionStart ?? rawValue.length;
    
    // Telefon alanları için formatla
    if (field === 'cep_tel' || field === 'sabit_tel' || field === 'yedek_tel') {
      const cleaned = cleanPhoneNumber(rawValue);
      // Sadece 11 hane kadar kabul et
      if (cleaned.length <= 11) {
        // Cursor'dan önceki digit sayısını hesapla
        const digitsBeforeCursor = rawValue.slice(0, cursorPos).replace(/\D/g, '').length;
        setFormData({ ...formData, [field]: cleaned });
        // Yeniden render sonrası cursor'u aynı digit pozisyonuna geri koy
        const formatted = formatPhoneNumber(cleaned);
        let newPos = 0;
        let digitCount = 0;
        while (newPos < formatted.length && digitCount < digitsBeforeCursor) {
          if (/\d/.test(formatted[newPos])) digitCount++;
          newPos++;
        }
        requestAnimationFrame(() => {
          try { input.setSelectionRange(newPos, newPos); } catch { /* noop */ }
        });
      }
    } else if (field === 'is_durumu') {
      // İş durumu için büyük harf dönüşümü YAPMA (küçük harf kalmalı)
      setFormData({ ...formData, [field]: rawValue as 'acik' | 'parca_bekliyor' | 'tamamlandi' | 'iptal' });
    } else if (field === 'yapilan_islem' || field === 'sikayet') {
      // yapilan_islem ve sikayet alanları için büyük harf dönüşümü YAPMA (cursor sorunu olmaması için)
      setFormData({ ...formData, [field]: rawValue });
    } else {
      // Tüm text inputlar için büyük harf dönüşümü
      const upperValue = rawValue.toLocaleUpperCase('tr-TR');
      setFormData({ ...formData, [field]: upperValue });
      // Uppercase sonrası cursor sona kaymasın — aynı pozisyonda kalsın
      requestAnimationFrame(() => {
        try { input.setSelectionRange(cursorPos, cursorPos); } catch { /* noop */ }
      });
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
      const cleanedPhone = cleanPhoneNumber(phoneNumber);
      const response = await islemService.searchByPhone(cleanedPhone);
      
      // 1. Karaliste kontrolü (telefon) - EN ÖNCE
      try {
        const karalisteResult = await karalisteService.checkPhone(cleanedPhone);
        if (karalisteResult.blacklisted) {
          setKaralisteRecord(karalisteResult.record);
          setKaralisteType('phone');
          setPendingAfterKaraliste(() => () => {
            // Karaliste onaylandıktan sonra duplicate + normal akışa devam et
            const incompleteRec = response.find((item: Islem) => 
              (cleanPhoneNumber(item.cep_tel) === cleanedPhone || cleanPhoneNumber(item.yedek_tel || '') === cleanedPhone) &&
              (item.is_durumu === 'acik' || item.is_durumu === 'parca_bekliyor')
            );
            if (incompleteRec) {
              setDuplicateRecord(incompleteRec);
              setShowDuplicateDialog(true);
              return;
            }
            const existingRec = response.find((item: Islem) => 
              cleanPhoneNumber(item.cep_tel) === cleanedPhone || 
              cleanPhoneNumber(item.yedek_tel || '') === cleanedPhone
            );
            if (existingRec) {
              setExistingRecord(existingRec);
              setShowConfirmDialog(true);
              setShowPhoneQuery(false);
            } else {
              setFormData((prev: any) => ({ ...prev, cep_tel: phoneNumber }));
              setShowPhoneQuery(false);
              setShowForm(true);
            }
          });
          setShowKaralisteDialog(true);
          setShowPhoneQuery(false);
          return;
        }
      } catch (err) {
        console.error('Karaliste kontrol hatası:', err);
      }

      // 2. Tamamlanmamış kayıt kontrolü (açık veya parça bekliyor)
      const incompleteRecord = response.find((item: Islem) => 
        (cleanPhoneNumber(item.cep_tel) === cleanedPhone || cleanPhoneNumber(item.yedek_tel || '') === cleanedPhone) &&
        (item.is_durumu === 'acik' || item.is_durumu === 'parca_bekliyor')
      );
      
      if (incompleteRecord) {
        setDuplicateRecord(incompleteRecord);
        setShowDuplicateDialog(true);
        setShowPhoneQuery(false);
        return;
      }
      
      // 3. Normal kayıt kontrolü (tamamlanmış kayıt)
      const existing = response.find((item: Islem) => 
        cleanPhoneNumber(item.cep_tel) === cleanedPhone || 
        cleanPhoneNumber(item.yedek_tel || '') === cleanedPhone
      );
      
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

  const handleUseExistingData = async () => {
    if (existingRecord) {
      try {
        // İlceler listesi yüklenmiş mi kontrol et
        if (!ilceler || ilceler.length === 0) {
          showSnackbar('Konum verileri yükleniyor, lütfen bekleyin...', 'info');
          return;
        }
        
        // Önce ilçeyi bul ve set et (mahalleler yüklensin diye)
        const ilce = ilceler.find(i => i.isim === existingRecord.ilce);
        if (ilce) {
          setSelectedIlceId(ilce.ilce_id);
          // Mahalleleri yükle ve tamamlanmasını bekle
          const data = await locationService.getMahalleler(ilce.ilce_id);
          setMahalleler(data);
        }
        
        // ✅ SADECE MÜŞTERİ BİLGİLERİNİ GETİR (tamamlama bilgileri BOŞ)
        setFormData({
          ad_soyad: existingRecord.ad_soyad || '',
          ilce: existingRecord.ilce || '',
          mahalle: existingRecord.mahalle || '',
          cadde: existingRecord.cadde || '',
          sokak: existingRecord.sokak || '',
          kapi_no: existingRecord.kapi_no || '',
          apartman_site: existingRecord.apartman_site || '',
          blok_no: existingRecord.blok_no || '',
          daire_no: existingRecord.daire_no || '',
          sabit_tel: existingRecord.sabit_tel || '',
          cep_tel: existingRecord.cep_tel || '',
          yedek_tel: existingRecord.yedek_tel || '',
          urun: existingRecord.urun || '',
          marka: existingRecord.marka || '',
          sikayet: existingRecord.sikayet || '',
          // TAMAMLAMA BİLGİLERİ BOŞ
          teknisyen_ismi: '',
          yapilan_islem: '',
          tutar: 0,
          montaj: '',
          aksesuar: '',
          atolye: '',
          is_durumu: 'acik',
        });
        
        // Montaj ve aksesuar seçimlerini temizle
        setSelectedMontajlar([]);
        setSelectedAksesuarlar([]);
        
        showSnackbar('Önceki kayıt bilgileri getirildi. Değişiklik yapabilir veya olduğu gibi kaydedebilirsiniz.', 'info');
        setUsedExistingData(true); // Mevcut kayıt kullanıldı, duplicate kontrolü yapma
        setShowConfirmDialog(false);
        setShowForm(true);
      } catch (error) {
        console.error('Bilgiler yüklenirken hata:', error);
        showSnackbar('Bilgiler yüklenirken hata oluştu!', 'error');
      }
    }
  };

  // Müşteri Geçmişi fonksiyonları
  const handleCloseHistoryDialog = () => {
    setHistoryDialogOpen(false);
    setCustomerHistory([]);
    setSelectedCustomerName('');
  };

  // showConfirmDialog açıldığında müşteri geçmişini otomatik yükle
  useEffect(() => {
    if (showConfirmDialog && existingRecord?.ad_soyad) {
      const loadHistory = async () => {
        setHistoryLoading(true);
        try {
          const customerIslemler = await islemService.searchByName(existingRecord.ad_soyad!);
          const sorted = customerIslemler.sort((a: Islem, b: Islem) => b.id - a.id);
          setCustomerHistory(sorted);
        } catch (error) {
          console.error('Müşteri geçmişi yüklenirken hata:', error);
          setCustomerHistory([]);
        } finally {
          setHistoryLoading(false);
        }
      };
      loadHistory();
    } else if (!showConfirmDialog) {
      setCustomerHistory([]);
    }
  }, [showConfirmDialog, existingRecord]);

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
    // İptal durumu değilse zorunlu alan kontrolü
    if (formData.is_durumu !== 'iptal') {
      if (!formData.teknisyen_ismi || formData.teknisyen_ismi.trim() === '') {
        showSnackbar('Teknisyen İsmi alanı zorunludur!', 'error');
        return;
      }

      // Manuel yapılan işlem kontrolü
      const manuelIslem = formData.yapilan_islem?.trim() || '';
      
      // Montaj ve aksesuar kontrolü
      const hasMontaj = selectedMontajlar.length > 0;
      const hasAksesuar = selectedAksesuarlar.length > 0;
      
      // En az biri dolu olmalı
      if (!manuelIslem && !hasMontaj && !hasAksesuar) {
        showSnackbar('Yapılan İşlem alanı veya Montaj/Aksesuar seçimi zorunludur!', 'error');
        return;
      }
    }

    // Tamamlama modalındaki bilgileri kaydet
    const yapilanIslemText = buildYapilanIslem();
    const updatedData = {
      ...formData,
      yapilan_islem: yapilanIslemText, // buildYapilanIslem her zaman güncel değeri döner
      // is_durumu formData'dan alınacak (kullanıcının seçtiği değer)
    };
    
    try {
      if (islem) {
        await islemService.update(islem.id, updatedData);
        const statusMessage = 
          formData.is_durumu === 'tamamlandi' ? 'İşlem başarıyla tamamlandı!' :
          formData.is_durumu === 'iptal' ? 'İşlem iptal edildi!' :
          'İşlem başarıyla güncellendi!';
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
    
    // Mahalle zorunlu
    if (!formData.mahalle || formData.mahalle.trim() === '') {
      showSnackbar('Mahalle alanı zorunludur!', 'error');
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
    
    // Yedek telefon girilmişse 11 hane olmalı
    const yedekTelCleaned = cleanPhoneNumber(formData.yedek_tel || '');
    if (yedekTelCleaned.length > 0 && yedekTelCleaned.length !== 11) {
      showSnackbar('Yedek telefon numarası 11 haneli olmalıdır!', 'error');
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
    
    // ✅ GÖREV 2: Yeni kayıt eklenirken duplicate kontrolü
    // Aynı telefon + ürün + marka + açık/parça bekliyor durumunda kayıt var mı kontrol et
    // "BİLGİLERİ GETİR" kullanıldıysa veya clone mode'daysa duplicate kontrolü yapma
    if (!islem && !usedExistingData && !isCloneMode) { // Sadece yeni kayıt eklerken, mevcut kayıt kullanılmadıysa ve clone mode değilse kontrol et
      try {
        const cleanedPhone = cleanPhoneNumber(formData.cep_tel);
        const allRecords = await islemService.searchByPhone(cleanedPhone);
        
        const foundDuplicate = allRecords.find((record: Islem) => 
          cleanPhoneNumber(record.cep_tel) === cleanedPhone &&
          record.urun === formData.urun &&
          record.marka === formData.marka &&
          (record.is_durumu === 'acik' || record.is_durumu === 'parca_bekliyor')
        );
          
          if (foundDuplicate) {
            // Tamamlanmamış aynı kayıt var - modal göster
            setDuplicateRecord(foundDuplicate);
            setShowDuplicateDialog(true);
            return; // Kaydetme, kullanıcı onay verirse devam edecek
          }
      } catch (error) {
        console.error('Duplicate kontrolü hatası:', error);
        // Hata olsa bile devam et
      }
    }
    
    // Karaliste adres kontrolü (yeni kayıt + güncelleme)
    if (!islem) {
      try {
        const adresResult = await karalisteService.checkAddress({
          mahalle: formData.mahalle,
          cadde: formData.cadde,
          sokak: formData.sokak,
          kapi_no: formData.kapi_no,
        });
        if (adresResult.blacklisted) {
          setKaralisteRecord(adresResult.record);
          setKaralisteType('address');
          setPendingAfterKaraliste(() => async () => {
            await saveIslem();
          });
          setShowKaralisteDialog(true);
          return;
        }
      } catch (err) {
        console.error('Karaliste adres kontrol hatası:', err);
      }
    }
    
    // Direkt kaydet
    await saveIslem();
  };

  // Duplicate dialog'dan mevcut kaydı getir - SADECE TAMAMLAMA BİLGİLERİ
  const handleLoadExistingRecord = () => {
    if (duplicateRecord) {
      // SADECE tamamlama bilgilerini getir, müşteri bilgileri mevcut kalacak
      setFormData(prev => ({
        ...prev, // Mevcut müşteri bilgilerini koru
        // TAMAMLAMA bilgilerini duplicateRecord'dan al
        montaj: duplicateRecord.montaj || '',
        aksesuar: duplicateRecord.aksesuar || '',
        teknisyen_ismi: duplicateRecord.teknisyen_ismi || duplicateRecord.teknisyen || '',
        atolye: duplicateRecord.atolye || '',
        is_durumu: duplicateRecord.is_durumu || 'acik',
        yapilan_islem: duplicateRecord.yapilan_islem || '',
        tutar: duplicateRecord.tutar || 0,
      }));
      
      // Montaj ve aksesuar seçimlerini de yükle
      if (duplicateRecord.montaj) {
        const montajIds = duplicateRecord.montaj.split(',').map(m => {
          const montaj = montajlar.find(mt => mt.isim === m.trim());
          return montaj?.id;
        }).filter((id): id is number => id !== undefined);
        setSelectedMontajlar(montajIds);
      }
      
      if (duplicateRecord.aksesuar) {
        const aksesuarIds = duplicateRecord.aksesuar.split(',').map(a => {
          const aksesuar = aksesuarlar.find(ak => ak.isim === a.trim());
          return aksesuar?.id;
        }).filter((id): id is number => id !== undefined);
        setSelectedAksesuarlar(aksesuarIds);
      }
      
      setShowDuplicateDialog(false); // Modal'ı kapat
      setUsedExistingData(true); // Mevcut kayıt bilgileri kullanıldı
      setShowTamamlaConfirm(true); // Direkt tamamlama dialogunu aç
    }
  };

  // Duplicate dialog'dan yeni kayıt oluştur - SADECE MÜŞTERİ BİLGİLERİ
  const handleContinueWithDuplicate = async () => {
    if (duplicateRecord) {
      // SADECE müşteri bilgileri gelir, tamamlama bilgileri BOŞ
      setFormData({
        ad_soyad: duplicateRecord.ad_soyad || '',
        cep_tel: duplicateRecord.cep_tel || '',
        yedek_tel: duplicateRecord.yedek_tel || '',
        sabit_tel: duplicateRecord.sabit_tel || '',
        ilce: duplicateRecord.ilce || '',
        mahalle: duplicateRecord.mahalle || '',
        cadde: duplicateRecord.cadde || '',
        sokak: duplicateRecord.sokak || '',
        kapi_no: duplicateRecord.kapi_no || '',
        apartman_site: duplicateRecord.apartman_site || '',
        blok_no: duplicateRecord.blok_no || '',
        daire_no: duplicateRecord.daire_no || '',
        urun: duplicateRecord.urun || '',
        marka: duplicateRecord.marka || '',
        sikayet: duplicateRecord.sikayet || '',
        // TAMAMLAMA bilgileri BOŞ
        montaj: '',
        aksesuar: '',
        teknisyen_ismi: '',
        atolye: '',
        is_durumu: 'acik',
        yapilan_islem: '',
        tutar: 0,
      });
      
      // Montaj ve aksesuar seçimlerini temizle
      setSelectedMontajlar([]);
      setSelectedAksesuarlar([]);
      
      // İlçe seçiliyse mahalle listesini yükle
      if (duplicateRecord.ilce) {
        const ilce = ilceler.find(i => i.isim === duplicateRecord.ilce);
        if (ilce) {
          setSelectedIlceId(ilce.ilce_id);
          // Mahalle listesini API'den yükle
          locationService.getMahalleler(ilce.ilce_id)
            .then(setMahalleler)
            .catch(err => console.error('Mahalle yükleme hatası:', err));
        }
      }
    }
    
    setUsedExistingData(true); // Mevcut kayıt kullanıldı, duplicate kontrolü yapma
    setShowDuplicateDialog(false);
    setDuplicateRecord(null);
    setShowForm(true);
  };

  // Duplicate dialog'dan iptal et - Her şeyi kapat
  const handleCancelDuplicate = () => {
    setShowDuplicateDialog(false);
    setDuplicateRecord(null);
    setShowForm(false);
    onClose(); // Ana dialog'u da kapat
  };

  const saveIslem = async () => {
    try {
      // Telefon numaralarını temizle (sadece rakamlar, max 20 karakter)
      const cleanedSabitTel = cleanPhoneNumber(formData.sabit_tel || '').slice(0, 20);
      const cleanedCepTel = cleanPhoneNumber(formData.cep_tel || '').slice(0, 20);
      const cleanedYedekTel = cleanPhoneNumber(formData.yedek_tel || '').slice(0, 20);
      
      if (islem) {
        // Güncelleme - telefon numaralarını temizle
        const updateData = {
          ...formData,
          sabit_tel: cleanedSabitTel,
          cep_tel: cleanedCepTel,
          yedek_tel: cleanedYedekTel,
          kapi_no: (formData.kapi_no || '').slice(0, 20),
          blok_no: (formData.blok_no || '').slice(0, 20),
          daire_no: (formData.daire_no || '').slice(0, 20),
        };
        await islemService.update(islem.id, updateData);
        showSnackbar('İşlem başarıyla güncellendi!', 'success');
      } else {
        // Yeni ekleme - tüm doldurulmuş alanları gönder
        const createData: IslemCreateDto = {
          ad_soyad: formData.ad_soyad,
          ilce: formData.ilce,
          mahalle: formData.mahalle,
          cadde: formData.cadde,
          sokak: formData.sokak,
          kapi_no: (formData.kapi_no || '').slice(0, 20),
          apartman_site: formData.apartman_site,
          blok_no: (formData.blok_no || '').slice(0, 20),
          daire_no: (formData.daire_no || '').slice(0, 20),
          sabit_tel: cleanedSabitTel,
          cep_tel: cleanedCepTel,
          yedek_tel: cleanedYedekTel,
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
    <Dialog 
      open={open && !showTamamlaConfirm && !isOnHold} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth 
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ py: 0.75, px: 2, fontSize: '1rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{islem ? 'İşlem Düzenle' : 'Yeni İşlem Ekle'}</span>
        {!islem && showForm && ( // Sadece yeni kayıt eklerken VE form görünürken göster
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setIsOnHold(true);
              onHold?.(true, formData); // Dashboard'a form verilerini gönder
            }}
            sx={{
              fontSize: '0.75rem',
              py: 0.3,
              px: 1,
              borderColor: 'warning.main',
              color: 'warning.main',
              '&:hover': {
                borderColor: 'warning.dark',
                bgcolor: 'warning.light',
              }
            }}
          >
            Beklemeye Al
          </Button>
        )}
      </DialogTitle>
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
          <Box sx={{ mt: 1 }}>
            <Alert 
              severity="warning" 
              sx={{ mb: 1.5, py: 0.5 }}
              action={
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Button color="inherit" size="small" onClick={handleUseExistingData}>
                    Bilgileri Getir ve Yeni Kayıt Aç
                  </Button>
                </Box>
              }
            >
              <AlertTitle sx={{ fontSize: '0.875rem', mb: 0.5 }}>Daha Önce Kayıt Bulundu!</AlertTitle>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                Bu telefon numarasıyla ({formatPhoneNumber(existingRecord.cep_tel)}) daha önce <strong>{existingRecord.ad_soyad}</strong> adına kayıt açılmış.
              </Typography>
            </Alert>

            {/* Müşteri Geçmişi Tablosu - Direkt Görünür */}
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main', fontWeight: 600 }}>
                Müşteri Geçmişi ({customerHistory.length} kayıt)
              </Typography>
              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : customerHistory.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                  Bu müşteri için kayıt bulunamadı.
                </Typography>
              ) : (
                <TableContainer component={Paper} elevation={1} sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <Table size="small" stickyHeader sx={{ 
                    '& .MuiTableCell-root': { 
                      py: 0.3, 
                      px: 0.5, 
                      fontSize: '0.65rem',
                      borderRight: '1px solid #e0e0e0',
                      whiteSpace: 'nowrap',
                      '&:last-child': { borderRight: 'none' }
                    } 
                  }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Sıra</TableCell>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Tarih</TableCell>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>İlçe</TableCell>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Mahalle</TableCell>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Apt/Site</TableCell>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Blok</TableCell>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Daire</TableCell>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Cep Tel</TableCell>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Yedek Tel</TableCell>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Cadde</TableCell>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Sokak</TableCell>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Kapı</TableCell>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Ürün</TableCell>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Marka</TableCell>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Şikayet</TableCell>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Yapılan İşlem</TableCell>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Teknisyen</TableCell>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Tutar</TableCell>
                        <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Durum</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customerHistory.map((record) => (
                        <TableRow key={record.id} hover>
                          <TableCell>
                            <Tooltip title={`Kayıt No: ${record.id}`} arrow>
                              <span>{record.id}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={record.full_tarih ? new Date(record.full_tarih).toLocaleDateString('tr-TR') : '-'} arrow>
                              <span>{record.full_tarih ? new Date(record.full_tarih).toLocaleDateString('tr-TR') : '-'}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Tooltip title={record.ilce || '-'} arrow>
                              <span>{record.ilce || '-'}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Tooltip title={record.mahalle || '-'} arrow>
                              <span>{record.mahalle || '-'}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Tooltip title={record.apartman_site || '-'} arrow>
                              <span>{record.apartman_site || '-'}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={record.blok_no || '-'} arrow>
                              <span>{record.blok_no || '-'}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={record.daire_no || '-'} arrow>
                              <span>{record.daire_no || '-'}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={formatPhoneNumber(record.cep_tel)} arrow>
                              <span>{formatPhoneNumber(record.cep_tel)}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={record.yedek_tel ? formatPhoneNumber(record.yedek_tel) : '-'} arrow>
                              <span>{record.yedek_tel ? formatPhoneNumber(record.yedek_tel) : '-'}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Tooltip title={record.cadde || '-'} arrow>
                              <span>{record.cadde || '-'}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Tooltip title={record.sokak || '-'} arrow>
                              <span>{record.sokak || '-'}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={record.kapi_no || '-'} arrow>
                              <span>{record.kapi_no || '-'}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Tooltip title={record.urun || '-'} arrow>
                              <span>{record.urun || '-'}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Tooltip title={record.marka || '-'} arrow>
                              <span>{record.marka || '-'}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Tooltip title={record.sikayet || '-'} arrow>
                              <span>{record.sikayet || '-'}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Tooltip title={record.yapilan_islem || '-'} arrow>
                              <span>{record.yapilan_islem || '-'}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Tooltip title={record.teknisyen_ismi || '-'} arrow>
                              <span>{record.teknisyen_ismi || '-'}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={record.tutar ? `${Number(record.tutar).toLocaleString('tr-TR')} ₺` : '-'} arrow>
                              <span>{record.tutar ? `${Number(record.tutar).toLocaleString('tr-TR')} ₺` : '-'}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={
                                record.is_durumu === 'acik' ? 'Açık' : 
                                record.is_durumu === 'parca_bekliyor' ? 'Parça Bek.' : 
                                record.is_durumu === 'iptal' ? 'İptal' :
                                'Tamamlandı'
                              }
                              color={
                                record.is_durumu === 'acik' ? 'warning' : 
                                record.is_durumu === 'parca_bekliyor' ? 'info' : 
                                record.is_durumu === 'iptal' ? 'error' :
                                'success'
                              }
                              size="small"
                              sx={{ fontSize: '0.6rem', height: '18px' }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Box>
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
              autoFocus
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              size="small"
              options={ilceler}
              getOptionLabel={(option) => option.isim}
              value={ilceler.find(i => i.isim === formData.ilce) || null}
              inputValue={ilceInputValue}
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
                setIlceInputValue(newValue?.isim || '');
              }}
              onInputChange={(_, value, reason) => {
                // Kullanıcı yazarken filtrelenen seçenekleri kontrol et
                if (reason === 'input') {
                  const filtered = ilceler.filter(ilce => 
                    ilce.isim.toLocaleLowerCase('tr-TR').includes(value.toLocaleLowerCase('tr-TR'))
                  );
                  
                  // Eğer eşleşme varsa ilk eşleşeni otomatik seç
                  if (filtered.length === 1 && value.length > 0) {
                    setFormData({ ...formData, ilce: filtered[0].isim, mahalle: '' });
                    setSelectedIlceId(filtered[0].ilce_id);
                    setIlceInputValue(filtered[0].isim); // Input'u tamamlanmış haliyle set et
                  } else if (filtered.length > 1) {
                    // Birden fazla eşleşme varsa input'u kullanıcının yazdığı ile güncel tut
                    setIlceInputValue(value);
                  } else if (filtered.length === 0) {
                    // Eşleşme yoksa input'u değiştirme, son geçerli değer kalsın
                    // Hiçbir şey yapma
                  }
                } else if (reason === 'reset') {
                  setIlceInputValue(value);
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
              key={selectedIlceId || 'no-ilce'}
              size="small"
              options={mahalleler}
              getOptionLabel={(option) => option.isim}
              value={mahalleler.find(m => m.isim === formData.mahalle) || null}
              inputValue={mahalleInputValue}
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
                setMahalleInputValue(newValue?.isim || '');
              }}
              onInputChange={(_, value, reason) => {
                // Kullanıcı yazarken filtrelenen seçenekleri kontrol et
                if (reason === 'input') {
                  const filtered = mahalleler.filter(mahalle => 
                    mahalle.isim.toLocaleLowerCase('tr-TR').includes(value.toLocaleLowerCase('tr-TR'))
                  );
                  
                  // Eğer eşleşme varsa ilk eşleşeni otomatik seç
                  if (filtered.length === 1 && value.length > 0) {
                    setFormData({ ...formData, mahalle: filtered[0].isim });
                    setMahalleInputValue(filtered[0].isim); // Input'u tamamlanmış haliyle set et
                  } else if (filtered.length > 1) {
                    // Birden fazla eşleşme varsa input'u kullanıcının yazdığı ile güncel tut
                    setMahalleInputValue(value);
                  } else if (filtered.length === 0) {
                    // Eşleşme yoksa input'u değiştirme, son geçerli değer kalsın
                    // Hiçbir şey yapma
                  }
                } else if (reason === 'reset') {
                  setMahalleInputValue(value);
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
              inputValue={urunInputValue}
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
                setUrunInputValue(newValue || '');
              }}
              onInputChange={(_, value, reason) => {
                // Kullanıcı yazarken filtrelenen seçenekleri kontrol et
                if (reason === 'input') {
                  const filtered = urunler.filter(urun => 
                    urun.isim.toLocaleLowerCase('tr-TR').includes(value.toLocaleLowerCase('tr-TR'))
                  );
                  
                  // Eğer eşleşme varsa ilk eşleşeni otomatik seç
                  if (filtered.length === 1 && value.length > 0) {
                    setFormData({ ...formData, urun: filtered[0].isim });
                    setUrunInputValue(filtered[0].isim); // Input'u tamamlanmış haliyle set et
                  } else if (filtered.length > 1) {
                    // Birden fazla eşleşme varsa input'u kullanıcının yazdığı ile güncel tut
                    setUrunInputValue(value);
                  } else if (filtered.length === 0) {
                    // Eşleşme yoksa input'u değiştirme, son geçerli değer kalsın
                  }
                } else if (reason === 'reset') {
                  setUrunInputValue(value);
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
                        setUrunInputValue(text);
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
              inputValue={markaInputValue}
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
                setMarkaInputValue(newValue || '');
                setMarkaUyari(''); // Seçim yapıldığında uyarıyı temizle
              }}
              onInputChange={(_, value, reason) => {
                // Kullanıcı yazarken filtrelenen seçenekleri kontrol et
                if (reason === 'input') {
                  const filtered = markalar.filter(marka => 
                    marka.isim.toLocaleLowerCase('tr-TR').includes(value.toLocaleLowerCase('tr-TR'))
                  );
                  
                  // Eğer eşleşme varsa ilk eşleşeni otomatik seç
                  if (filtered.length === 1 && value.length > 0) {
                    setFormData({ ...formData, marka: filtered[0].isim });
                    setMarkaInputValue(filtered[0].isim); // Input'u tamamlanmış haliyle set et
                    setMarkaUyari('');
                  } else if (filtered.length > 1) {
                    // Birden fazla eşleşme varsa input'u kullanıcının yazdığı ile güncel tut
                    setMarkaInputValue(value);
                  } else if (filtered.length === 0) {
                    // Eşleşme yoksa input'u değiştirme, son geçerli değer kalsın
                  }
                } else if (reason === 'reset') {
                  setMarkaInputValue(value);
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
                    if (e.key === 'Tab' && !e.shiftKey) {
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
                      // İlk checkbox'a (MONTAJ) geç
                      setTimeout(() => {
                        const firstCheckbox = document.querySelector('[data-checkbox="montaj"]') as HTMLElement;
                        if (firstCheckbox) {
                          firstCheckbox.focus();
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
                      checked={formData.sikayet.toUpperCase().startsWith('MONTAJ')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, sikayet: 'MONTAJ' });
                        } else {
                          setFormData({ ...formData, sikayet: '' });
                        }
                      }}
                      onKeyDown={(e) => {
                        // Space ile seçim yap ve bir sonraki elemana geç
                        if (e.key === ' ') {
                          e.preventDefault();
                          setFormData({ ...formData, sikayet: formData.sikayet.toUpperCase().startsWith('MONTAJ') ? '' : 'MONTAJ' });
                          // Sonraki checkbox'a focus
                          setTimeout(() => {
                            const nextCheckbox = document.querySelector('[data-checkbox="ariza"]') as HTMLElement;
                            nextCheckbox?.focus();
                          }, 50);
                        }
                      }}
                      inputProps={{ 
                        'data-checkbox': 'montaj',
                        tabIndex: 0
                      } as React.InputHTMLAttributes<HTMLInputElement>}
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
                      checked={formData.sikayet.toUpperCase().startsWith('ARIZA')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, sikayet: 'ARIZA' });
                        } else {
                          setFormData({ ...formData, sikayet: '' });
                        }
                      }}
                      onKeyDown={(e) => {
                        // Space ile seçim yap ve bir sonraki elemana geç
                        if (e.key === ' ') {
                          e.preventDefault();
                          setFormData({ ...formData, sikayet: formData.sikayet.toUpperCase().startsWith('ARIZA') ? '' : 'ARIZA' });
                          // Sonraki checkbox'a focus
                          setTimeout(() => {
                            const nextCheckbox = document.querySelector('[data-checkbox="diger"]') as HTMLElement;
                            nextCheckbox?.focus();
                          }, 50);
                        }
                      }}
                      inputProps={{ 
                        'data-checkbox': 'ariza',
                        tabIndex: 0
                      } as React.InputHTMLAttributes<HTMLInputElement>}
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
                      checked={formData.sikayet.toUpperCase().startsWith('DİĞER')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, sikayet: 'DİĞER' });
                        } else {
                          setFormData({ ...formData, sikayet: '' });
                        }
                      }}
                      onKeyDown={(e) => {
                        // Space ile seçim yap ve şikayet detay alanına geç
                        if (e.key === ' ') {
                          e.preventDefault();
                          setFormData({ ...formData, sikayet: formData.sikayet.toUpperCase().startsWith('DİĞER') ? '' : 'DİĞER' });
                          // Şikayet detay alanına focus
                          setTimeout(() => {
                            const sikayetField = document.querySelector('[name="sikayet-detay"]') as HTMLElement;
                            sikayetField?.focus();
                          }, 50);
                        }
                      }}
                      inputProps={{ 
                        'data-checkbox': 'diger',
                        tabIndex: 0
                      } as React.InputHTMLAttributes<HTMLInputElement>}
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
              name="sikayet-detay"
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
            {isCloneMode ? 'Yeni Kayıt Oluştur' : 'Kaydet'}
          </Button>
        )}
      </DialogActions>
    </Dialog>

      {/* Tamamlama Dialog */}
      <TamamlaConfirmDialog
        open={showTamamlaConfirm}
        isMobile={isMobile}
        montajlar={montajlar}
        aksesuarlar={aksesuarlar}
        teknisyenler={teknisyenler}
        selectedMontajlar={selectedMontajlar}
        selectedAksesuarlar={selectedAksesuarlar}
        formData={formData}
        teknisyenInputValue={teknisyenInputValue}
        setFormData={setFormData}
        setTeknisyenInputValue={setTeknisyenInputValue}
        handleMontajChange={handleMontajChange}
        handleAksesuarChange={handleAksesuarChange}
        handleChange={handleChange}
        onCancel={handleCancelTamamla}
        onConfirm={handleConfirmTamamla}
      />

      {/* Duplicate Kayıt Uyarı Modal */}
      <DuplicateRecordDialog
        open={showDuplicateDialog}
        duplicateRecord={duplicateRecord}
        onCancel={handleCancelDuplicate}
        onLoadExisting={handleLoadExistingRecord}
        onContinue={handleContinueWithDuplicate}
      />

      {/* Müşteri Geçmişi Dialog */}
      <IslemHistoryViewDialog
        open={historyDialogOpen}
        onClose={handleCloseHistoryDialog}
        customerName={selectedCustomerName}
        customerHistory={customerHistory}
        loading={historyLoading}
      />

      {/* Karaliste Uyarı Dialog */}
      <KaralisteWarningDialog
        open={showKaralisteDialog}
        karalisteType={karalisteType}
        karalisteRecord={karalisteRecord}
        onCancel={() => { setShowKaralisteDialog(false); setPendingAfterKaraliste(null); }}
        onContinue={() => { setShowKaralisteDialog(false); if (pendingAfterKaraliste) { pendingAfterKaraliste(); setPendingAfterKaraliste(null); } }}
      />
    </>
  );
};

export default IslemDialog;
