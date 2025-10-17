import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMontajlar, selectedAksesuarlar, islemler, statusFilter, dateFilter, showTodayOnly, showYazdirilmamis, startDate, endDate]);

  const applyFilters = () => {
    let filtered = [...islemler];

    // Tarih aralığı filtresi (Dashboard'dan gelen startDate ve endDate)
    if (startDate || endDate) {
      filtered = filtered.filter((islem) => {
        try {
          const islemDate = new Date(islem.full_tarih);
          islemDate.setHours(0, 0, 0, 0);
          
          if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(0, 0, 0, 0);
            return islemDate >= start && islemDate <= end;
          } else if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            return islemDate >= start;
          } else if (endDate) {
            const end = new Date(endDate);
            end.setHours(0, 0, 0, 0);
            return islemDate <= end;
          }
          return true;
        } catch (error) {
          console.error('❌ Tarih aralığı parse hatası:', islem.full_tarih, error);
          return false;
        }
      });
    }

    // Bugün alınan işler filtresi
    if (showTodayOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      console.log('🔍 Bugün filtresi aktif - Bugünün tarihi:', today);
      console.log('📋 Toplam işlem sayısı:', islemler.length);
      
      filtered = filtered.filter((islem) => {
        try {
          // full_tarih formatı: ISO string (2025-10-13T11:44:07.595Z)
          const islemDate = new Date(islem.full_tarih);
          islemDate.setHours(0, 0, 0, 0);
          
          const match = islemDate.getTime() === today.getTime();
          console.log('📅 İşlem:', islem.full_tarih, '➡️ Parse:', islemDate.toLocaleDateString(), 'Eşleşme:', match);
          return match;
        } catch (error) {
          console.error('❌ Tarih parse hatası:', islem.full_tarih, error);
          return false;
        }
      });
      
      console.log('✅ Filtrelenen işlem sayısı:', filtered.length);
    }

    // Tarih filtresi (Dashboard'dan gelen)
    if (dateFilter) {
      const selectedDate = new Date(dateFilter);
      selectedDate.setHours(0, 0, 0, 0);
      
      console.log('📅 Tarih filtresi aktif - Seçilen tarih:', selectedDate);
      
      filtered = filtered.filter((islem) => {
        try {
          // full_tarih formatı: ISO string (2025-10-13T11:44:07.595Z)
          const islemDate = new Date(islem.full_tarih);
          islemDate.setHours(0, 0, 0, 0);
          
          return islemDate.getTime() === selectedDate.getTime();
        } catch (error) {
          console.error('❌ Tarih parse hatası:', islem.full_tarih, error);
          return false;
        }
      });
      
      console.log('✅ Tarih filtresinden geçen işlem sayısı:', filtered.length);
    }

    // StatsCard'dan gelen durum filtresi
    if (statusFilter !== 'all') {
      filtered = filtered.filter((islem) => islem.is_durumu === statusFilter);
    }

    // Yazdırılmamış işler filtresi
    if (showYazdirilmamis) {
      filtered = filtered.filter((islem) => !islem.yazdirildi);
    }

    // Montaj filtresi (sadece admin için)
    if (isAdmin && selectedMontajlar.length > 0) {
      filtered = filtered.filter((islem) => {
        const yapilanIslem = (islem.yapilan_islem || '').toLowerCase();
        return selectedMontajlar.some(montaj => 
          yapilanIslem.includes(montaj.toLowerCase())
        );
      });
    }

    // Aksesuar filtresi (sadece admin için)
    if (isAdmin && selectedAksesuarlar.length > 0) {
      filtered = filtered.filter((islem) => {
        const yapilanIslem = (islem.yapilan_islem || '').toLowerCase();
        return selectedAksesuarlar.some(aksesuar => 
          yapilanIslem.includes(aksesuar.toLowerCase())
        );
      });
    }

    // Filtrelenmiş kayıtları sırala (en yeni en üstte - id'ye göre büyükten küçüğe)
    filtered.sort((a, b) => b.id - a.id);

    // Filtrelenmiş kayıtların toplam tutarını hesapla (sadece admin için)
    if (isAdmin) {
      const tutar = filtered.reduce((sum, i) => {
        const tutarVal = typeof i.tutar === 'number' ? i.tutar : parseFloat(String(i.tutar || 0));
        return sum + (isNaN(tutarVal) ? 0 : tutarVal);
      }, 0);
      setFilteredTutar(tutar);
    }

    setFilteredCount(filtered.length);
    onFilterChange(filtered);
  };



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

export default IslemFilters;
