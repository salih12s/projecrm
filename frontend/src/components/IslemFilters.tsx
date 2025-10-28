import React, { useState, useEffect, useMemo, memo } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Autocomplete,
  Chip,
} from '@mui/material';
import { Islem, Montaj, Aksesuar } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface IslemFiltersProps {
  islemler: Islem[];
  onFilterChange: (filtered: Islem[]) => void;
  statusFilter?: 'all' | 'acik' | 'parca_bekliyor' | 'tamamlandi' | 'iptal';
  dateFilter?: string;
  showTodayOnly?: boolean;
  showYazdirilmamis?: boolean; // Yazdırılmamış işler filtresi
}

const IslemFilters: React.FC<IslemFiltersProps> = ({ 
  islemler, 
  onFilterChange, 
  statusFilter = 'all', 
  dateFilter = '', 
  showTodayOnly = false, 
  showYazdirilmamis = false
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
      const [montajResponse, aksesuarResponse] = await Promise.all([
        api.get<Montaj[]>('/montajlar'),
        api.get<Aksesuar[]>('/aksesuarlar'),
      ]);
      setMontajlar(montajResponse.data);
      setAksesuarlar(aksesuarResponse.data);
    } catch (error) {
      console.error('Montaj/Aksesuar yükleme hatası:', error);
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

    // Bugün alınan işler filtresi
    if (showTodayOnly) {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const todayEnd = new Date().setHours(23, 59, 59, 999);
      
      result = result.filter((islem) => {
        try {
          const islemTime = new Date(islem.full_tarih).getTime();
          return islemTime >= todayStart && islemTime <= todayEnd;
        } catch {
          return false;
        }
      });
    }

    // Tarih filtresi (Dashboard'dan gelen)
    if (dateFilter) {
      const selectedStart = new Date(dateFilter).setHours(0, 0, 0, 0);
      const selectedEnd = new Date(dateFilter).setHours(23, 59, 59, 999);
      
      result = result.filter((islem) => {
        try {
          const islemTime = new Date(islem.full_tarih).getTime();
          return islemTime >= selectedStart && islemTime <= selectedEnd;
        } catch {
          return false;
        }
      });
    }

    // StatsCard'dan gelen durum filtresi
    if (statusFilter !== 'all') {
      result = result.filter((islem) => islem.is_durumu === statusFilter);
    }

    // Yazdırılmamış işler filtresi
    if (showYazdirilmamis) {
      result = result.filter((islem) => !islem.yazdirildi);
    }

    // Montaj filtresi
    if (isAdmin && selectedMontajlar.length > 0) {
      result = result.filter((islem) => {
        const yapilanIslem = (islem.yapilan_islem || '').toLowerCase();
        return selectedMontajlar.some(montaj => 
          yapilanIslem.includes(montaj.toLowerCase())
        );
      });
    }

    // Aksesuar filtresi
    if (isAdmin && selectedAksesuarlar.length > 0) {
      result = result.filter((islem) => {
        const yapilanIslem = (islem.yapilan_islem || '').toLowerCase();
        return selectedAksesuarlar.some(aksesuar => 
          yapilanIslem.includes(aksesuar.toLowerCase())
        );
      });
    }

    // Sıralama (en yeni en üstte)
    return [...result].sort((a, b) => b.id - a.id);
  }, [islemler, statusFilter, dateFilter, showTodayOnly, showYazdirilmamis, startDate, endDate, selectedMontajlar, selectedAksesuarlar, isAdmin]);

  // Filtrelenmiş tutar hesaplama (sadece admin için)
  const calculatedTutar = useMemo(() => {
    if (!isAdmin) return 0;
    return filtered.reduce((sum, i) => {
      const tutarVal = typeof i.tutar === 'number' ? i.tutar : parseFloat(String(i.tutar || 0));
      return sum + (isNaN(tutarVal) ? 0 : tutarVal);
    }, 0);
  }, [filtered, isAdmin]);

  // Parent'a filtrelenmiş listeyi gönder
  useEffect(() => {
    setFilteredCount(filtered.length);
    setFilteredTutar(calculatedTutar);
    onFilterChange(filtered);
  }, [filtered, calculatedTutar, onFilterChange]);



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
      {(selectedMontajlar.length > 0 || selectedAksesuarlar.length > 0 || startDate || endDate) && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {filteredCount}/{islemler.length}
          </Typography>
          
          {isAdmin && (selectedMontajlar.length > 0 || selectedAksesuarlar.length > 0) && (
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
