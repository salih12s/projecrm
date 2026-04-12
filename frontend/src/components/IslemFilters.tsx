import React, { useState, useEffect, useMemo, memo } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Autocomplete,
  Chip,
} from '@mui/material';
import debounce from 'lodash.debounce';
import { Islem, Montaj, Aksesuar, Teknisyen, Marka } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface IslemFiltersProps {
  islemler: Islem[];
  onFilterChange: (filtered: Islem[]) => void;
  statusFilter?: 'all' | 'acik' | 'parca_bekliyor' | 'tamamlandi' | 'iptal';
  dateFilter?: string;
  showTodayOnly?: boolean;
  showYazdirilmamis?: boolean; // Yazdırılmamış işler filtresi
  onAdminFiltersActive?: (active: boolean) => void; // Admin filtreleri aktif/pasif bildirimi
}

const AYLAR = [
  { value: 1, label: 'Ocak' },
  { value: 2, label: 'Şubat' },
  { value: 3, label: 'Mart' },
  { value: 4, label: 'Nisan' },
  { value: 5, label: 'Mayıs' },
  { value: 6, label: 'Haziran' },
  { value: 7, label: 'Temmuz' },
  { value: 8, label: 'Ağustos' },
  { value: 9, label: 'Eylül' },
  { value: 10, label: 'Ekim' },
  { value: 11, label: 'Kasım' },
  { value: 12, label: 'Aralık' },
];

const IslemFilters: React.FC<IslemFiltersProps> = ({ 
  islemler, 
  onFilterChange, 
  statusFilter = 'all', 
  dateFilter = '', 
  showTodayOnly = false, 
  showYazdirilmamis = false,
  onAdminFiltersActive
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [filteredCount, setFilteredCount] = useState(0);
  
  // Montaj ve Aksesuar filtreleri (sadece admin için)
  const [montajlar, setMontajlar] = useState<Montaj[]>([]);
  const [aksesuarlar, setAksesuarlar] = useState<Aksesuar[]>([]);
  const [selectedMontajlar, setSelectedMontajlar] = useState<string[]>([]);
  const [selectedAksesuarlar, setSelectedAksesuarlar] = useState<string[]>([]);
  const [filteredTutar, setFilteredTutar] = useState<number>(0);
  
  // Teknisyen filtresi (sadece admin için)
  const [teknisyenler, setTeknisyenler] = useState<Teknisyen[]>([]);
  const [selectedTeknisyenler, setSelectedTeknisyenler] = useState<string[]>([]);
  
  // Marka filtresi (sadece admin için)
  const [markaListesi, setMarkaListesi] = useState<Marka[]>([]);
  const [selectedMarkalar, setSelectedMarkalar] = useState<string[]>([]);
  
  // Ay filtresi (sadece admin için)
  const [selectedAy, setSelectedAy] = useState<number | null>(null);
  
  // Tarih aralığı filtreleri (sadece admin için Montaj/Aksesuar ile birlikte)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Montaj ve Aksesuarları yükle
  useEffect(() => {
    if (isAdmin) {
      loadMontajVeAksesuar();
    }
  }, [isAdmin]);

  const loadMontajVeAksesuar = async () => {
    try {
      const [montajResponse, aksesuarResponse, teknisyenResponse, markaResponse] = await Promise.all([
        api.get<Montaj[]>('/montajlar'),
        api.get<Aksesuar[]>('/aksesuarlar'),
        api.get<Teknisyen[]>('/teknisyenler'),
        api.get<Marka[]>('/markalar'),
      ]);
      setMontajlar(montajResponse.data);
      setAksesuarlar(aksesuarResponse.data);
      setTeknisyenler(teknisyenResponse.data);
      setMarkaListesi(markaResponse.data);
    } catch (error) {
      console.error('Filtre seçenekleri yükleme hatası:', error);
    }
  };

  // ⚡ PERFORMANS İYİLEŞTİRMESİ: useMemo ile filtreleme sonuçlarını cache'le
  // Bu sayede sadece bağımlılıklar değiştiğinde yeniden hesaplanır
  const filtered = useMemo(() => {
    let result = islemler;

    // Tarih aralığı filtresi
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : -Infinity;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
      
      result = result.filter((islem) => {
        try {
          const islemTime = new Date(islem.full_tarih).getTime();
          return islemTime >= start && islemTime <= end;
        } catch {
          return false;
        }
      });
    }

    // Bugün alınan işler filtresi - artık sunucu tarafında yapılıyor, client'da tekrar filtreleme
    // StatsCard'dan gelen durum filtresi - artık sunucu tarafında yapılıyor
    // Yazdırılmamış işler filtresi - artık sunucu tarafında yapılıyor

    // Montaj filtresi
    if (isAdmin && selectedMontajlar.length > 0) {
      result = result.filter((islem) => {
        const yapilanIslem = (islem.yapilan_islem || '').toLocaleLowerCase('tr-TR');
        return selectedMontajlar.some(montaj => 
          yapilanIslem.includes(montaj.toLocaleLowerCase('tr-TR'))
        );
      });
    }

    // Aksesuar filtresi
    if (isAdmin && selectedAksesuarlar.length > 0) {
      result = result.filter((islem) => {
        const yapilanIslem = (islem.yapilan_islem || '').toLocaleLowerCase('tr-TR');
        return selectedAksesuarlar.some(aksesuar => 
          yapilanIslem.includes(aksesuar.toLocaleLowerCase('tr-TR'))
        );
      });
    }

    // Teknisyen filtresi
    if (isAdmin && selectedTeknisyenler.length > 0) {
      result = result.filter((islem) => {
        const teknisyen = (islem.teknisyen_ismi || '').toLocaleLowerCase('tr-TR');
        return selectedTeknisyenler.some(tek => 
          teknisyen.includes(tek.toLocaleLowerCase('tr-TR'))
        );
      });
    }

    // Ay filtresi (client-side)
    if (isAdmin && selectedAy !== null) {
      result = result.filter((islem) => {
        try {
          const d = new Date(islem.full_tarih);
          return d.getMonth() + 1 === selectedAy;
        } catch {
          return false;
        }
      });
    }

    // Marka filtresi (client-side)
    if (isAdmin && selectedMarkalar.length > 0) {
      result = result.filter((islem) => {
        const marka = (islem.marka || '').toLocaleLowerCase('tr-TR');
        return selectedMarkalar.some(m => 
          marka.includes(m.toLocaleLowerCase('tr-TR'))
        );
      });
    }

    // Sıralama (en yeni en üstte)
    return [...result].sort((a, b) => b.id - a.id);
  }, [islemler, statusFilter, dateFilter, showTodayOnly, showYazdirilmamis, startDate, endDate, selectedMontajlar, selectedAksesuarlar, selectedTeknisyenler, selectedAy, selectedMarkalar, isAdmin]);

  // Filtrelenmiş tutar hesaplama (sadece admin için)
  const calculatedTutar = useMemo(() => {
    if (!isAdmin) return 0;
    return filtered.reduce((sum, i) => {
      const tutarVal = typeof i.tutar === 'number' ? i.tutar : parseFloat(String(i.tutar || 0));
      return sum + (isNaN(tutarVal) ? 0 : tutarVal);
    }, 0);
  }, [filtered, isAdmin]);

  // Parent'a filtrelenmiş listeyi gönder (debounced)
  // ⚡ PERFORMANS: onFilterChange çağrısını 300ms geciktir, hızlı filtre değişimlerinde gereksiz render'ları önle
  const debouncedFilterChange = useMemo(
    () => debounce((filteredList: Islem[]) => {
      onFilterChange(filteredList);
    }, 300),
    [onFilterChange]
  );

  useEffect(() => {
    setFilteredCount(filtered.length);
    setFilteredTutar(calculatedTutar);
    debouncedFilterChange(filtered);
    
    // Cleanup debounce on unmount
    return () => {
      debouncedFilterChange.cancel();
    };
  }, [filtered, calculatedTutar, debouncedFilterChange]);

  // Admin filtreleri aktif/pasif durumunu parent'a bildir
  useEffect(() => {
    if (onAdminFiltersActive) {
      const hasActiveFilters = selectedMontajlar.length > 0 || selectedAksesuarlar.length > 0 || selectedTeknisyenler.length > 0 || selectedMarkalar.length > 0 || selectedAy !== null || !!startDate || !!endDate;
      onAdminFiltersActive(hasActiveFilters);
    }
  }, [selectedMontajlar, selectedAksesuarlar, selectedTeknisyenler, selectedMarkalar, selectedAy, startDate, endDate, onAdminFiltersActive]);



  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
  
      {/* Montaj ve Aksesuar filtreleri - Sadece admin için */}
      {isAdmin && (
        <>
          <Autocomplete
            multiple
            size="small"
            options={montajlar.map(m => m.isim)}
            value={selectedMontajlar}
            onChange={(_, newValue) => setSelectedMontajlar(newValue)}
            renderInput={(params) => (
              <TextField 
                {...params} 
                placeholder="Montaj..." 
                sx={{ 
                  '& .MuiInputBase-root': { fontSize: '0.65rem' },
                  '& .MuiInputBase-input': { py: 0.5, px: 0.7 }
                }} 
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={index}
                  label={option}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontSize: '0.6rem', height: '16px' }}
                />
              ))
            }
            sx={{ width: '140px' }}
          />

          <Autocomplete
            multiple
            size="small"
            options={aksesuarlar.map(a => a.isim)}
            value={selectedAksesuarlar}
            onChange={(_, newValue) => setSelectedAksesuarlar(newValue)}
            renderInput={(params) => (
              <TextField 
                {...params} 
                placeholder="Aksesuar..." 
                sx={{ 
                  '& .MuiInputBase-root': { fontSize: '0.65rem' },
                  '& .MuiInputBase-input': { py: 0.5, px: 0.7 }
                }} 
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={index}
                  label={option}
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ fontSize: '0.6rem', height: '16px' }}
                />
              ))
            }
            sx={{ width: '140px' }}
          />
          
          {/* Teknisyen filtresi */}
          <Autocomplete
            multiple
            size="small"
            options={teknisyenler.map(t => t.isim)}
            value={selectedTeknisyenler}
            onChange={(_, newValue) => setSelectedTeknisyenler(newValue)}
            renderInput={(params) => (
              <TextField 
                {...params} 
                placeholder="Teknisyen..." 
                sx={{ 
                  '& .MuiInputBase-root': { fontSize: '0.65rem' },
                  '& .MuiInputBase-input': { py: 0.5, px: 0.7 }
                }} 
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={index}
                  label={option}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontSize: '0.6rem', height: '16px' }}
                />
              ))
            }
            sx={{ width: '150px' }}
          />

          {/* Ay filtresi */}
          <Autocomplete
            size="small"
            options={AYLAR}
            getOptionLabel={(option) => option.label}
            value={AYLAR.find(a => a.value === selectedAy) || null}
            onChange={(_, newValue) => setSelectedAy(newValue?.value || null)}
            renderInput={(params) => (
              <TextField 
                {...params} 
                placeholder="Ay..." 
                sx={{ 
                  '& .MuiInputBase-root': { fontSize: '0.65rem' },
                  '& .MuiInputBase-input': { py: 0.5, px: 0.7 }
                }} 
              />
            )}
            sx={{ width: '120px' }}
          />

          {/* Marka filtresi */}
          <Autocomplete
            multiple
            size="small"
            options={markaListesi.map(m => m.isim)}
            value={selectedMarkalar}
            onChange={(_, newValue) => setSelectedMarkalar(newValue)}
            renderInput={(params) => (
              <TextField 
                {...params} 
                placeholder="Marka..." 
                sx={{ 
                  '& .MuiInputBase-root': { fontSize: '0.65rem' },
                  '& .MuiInputBase-input': { py: 0.5, px: 0.7 }
                }} 
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={index}
                  label={option}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ fontSize: '0.6rem', height: '16px' }}
                />
              ))
            }
            sx={{ width: '140px' }}
          />

          {/* Tarih Aralığı Filtreleri - Montaj/Aksesuar için */}
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-end' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
              <Typography sx={{ fontSize: '0.6rem', color: '#0D3282', fontWeight: 600, lineHeight: 1 }}>
                Başlangıç Tarihi
              </Typography>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  fontSize: '0.65rem',
                  padding: '4px 6px',
                  border: '1px solid #0D3282',
                  borderRadius: '4px',
                  outline: 'none',
                  width: '115px',
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
              <Typography sx={{ fontSize: '0.6rem', color: '#0D3282', fontWeight: 600, lineHeight: 1 }}>
                Bitiş Tarihi
              </Typography>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  fontSize: '0.65rem',
                  padding: '4px 6px',
                  border: '1px solid #0D3282',
                  borderRadius: '4px',
                  outline: 'none',
                  width: '115px',
                }}
              />
            </Box>
            {(startDate || endDate) && (
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                sx={{ 
                  fontSize: '0.65rem', 
                  py: 0.3, 
                  px: 0.5, 
                  minWidth: 'auto',
                  color: '#2C3E82',
                }}
              >
                ✕
              </Button>
            )}
          </Box>
        </>
      )}
      
      {/* Kayıt sayısı ve tutar */}
      {(selectedMontajlar.length > 0 || selectedAksesuarlar.length > 0 || selectedTeknisyenler.length > 0 || selectedMarkalar.length > 0 || selectedAy !== null || startDate || endDate) && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {filteredCount}/{islemler.length}
          </Typography>
          
          {isAdmin && (selectedMontajlar.length > 0 || selectedAksesuarlar.length > 0 || selectedTeknisyenler.length > 0 || selectedMarkalar.length > 0 || selectedAy !== null) && (
            <Typography variant="caption" color="success.main" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
              {filteredTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

// ⚡ PERFORMANS: React.memo ile gereksiz re-render'ları önle
// Props değişmedikçe component yeniden render edilmeyecek
export default memo(IslemFilters);
