import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Autocomplete,
  Chip,
} from '@mui/material';
import { Clear } from '@mui/icons-material';
import { Islem, Montaj, Aksesuar } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface IslemFiltersProps {
  islemler: Islem[];
  onFilterChange: (filtered: Islem[]) => void;
  statusFilter?: 'all' | 'acik' | 'parca_bekliyor' | 'tamamlandi';
  dateFilter?: string;
  showTodayOnly?: boolean;
}

const IslemFilters: React.FC<IslemFiltersProps> = ({ islemler, onFilterChange, statusFilter = 'all', dateFilter = '', showTodayOnly = false }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [filteredCount, setFilteredCount] = useState(0);
  
  // Montaj ve Aksesuar filtreleri (sadece admin için)
  const [montajlar, setMontajlar] = useState<Montaj[]>([]);
  const [aksesuarlar, setAksesuarlar] = useState<Aksesuar[]>([]);
  const [selectedMontajlar, setSelectedMontajlar] = useState<string[]>([]);
  const [selectedAksesuarlar, setSelectedAksesuarlar] = useState<string[]>([]);
  const [filteredTutar, setFilteredTutar] = useState<number>(0);
  const [localDateFilter, setLocalDateFilter] = useState<string>('');

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
  }, [selectedMontajlar, selectedAksesuarlar, localDateFilter, islemler, statusFilter, dateFilter, showTodayOnly]);

  const applyFilters = () => {
    let filtered = [...islemler];

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

    // Yerel tarih filtresi (IslemFilters'daki tarih picker'dan)
    if (localDateFilter) {
      const selectedDate = new Date(localDateFilter);
      selectedDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter((islem) => {
        try {
          const islemDate = new Date(islem.full_tarih);
          islemDate.setHours(0, 0, 0, 0);
          
          return islemDate.getTime() === selectedDate.getTime();
        } catch (error) {
          console.error('❌ Tarih parse hatası:', islem.full_tarih, error);
          return false;
        }
      });
    }

    // StatsCard'dan gelen durum filtresi
    if (statusFilter !== 'all') {
      filtered = filtered.filter((islem) => islem.is_durumu === statusFilter);
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

  const handleClearDate = () => {
    setLocalDateFilter('');
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
      <TextField
        size="small"
        type="date"
        value={localDateFilter}
        onChange={(e) => setLocalDateFilter(e.target.value)}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          endAdornment: localDateFilter && (
            <Button 
              size="small" 
              onClick={handleClearDate}
              sx={{ minWidth: 'auto', p: 0.5 }}
            >
              <Clear sx={{ fontSize: '1rem' }} />
            </Button>
          )
        }}
        sx={{ 
          width: '150px',
          '& .MuiInputBase-root': { fontSize: '0.75rem' },
          '& .MuiInputBase-input': { py: 0.75, px: 1 }
        }}
      />

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
                  '& .MuiInputBase-root': { fontSize: '0.75rem' },
                  '& .MuiInputBase-input': { py: 0.75, px: 1 }
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
                  sx={{ fontSize: '0.7rem', height: '18px' }}
                />
              ))
            }
            sx={{ width: '180px' }}
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
                  '& .MuiInputBase-root': { fontSize: '0.75rem' },
                  '& .MuiInputBase-input': { py: 0.75, px: 1 }
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
                  sx={{ fontSize: '0.7rem', height: '18px' }}
                />
              ))
            }
            sx={{ width: '180px' }}
          />
        </>
      )}
      
      {/* Kayıt sayısı ve tutar */}
      {(selectedMontajlar.length > 0 || selectedAksesuarlar.length > 0 || localDateFilter) && (
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
