import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  TextField,
  MenuItem,
  Grid,
  Button,
  Typography,
  Autocomplete,
  Chip,
} from '@mui/material';
import { FilterList, Clear } from '@mui/icons-material';
import { Islem, Montaj, Aksesuar } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface IslemFiltersProps {
  islemler: Islem[];
  onFilterChange: (filtered: Islem[]) => void;
  statusFilter?: 'all' | 'acik' | 'tamamlandi';
}

const filterFields = [
  { value: 'ad_soyad', label: 'Ad Soyad' },
  { value: 'ilce', label: 'İlçe' },
  { value: 'mahalle', label: 'Mahalle' },
  { value: 'cadde', label: 'Cadde' },
  { value: 'sokak', label: 'Sokak' },
  { value: 'kapi_no', label: 'Kapı No' },
  { value: 'apartman_site', label: 'Apartman/Site' },
  { value: 'blok_no', label: 'Blok No' },
  { value: 'daire_no', label: 'Daire No' },
  { value: 'sabit_tel', label: 'Sabit Tel' },
  { value: 'cep_tel', label: 'Cep Tel' },
  { value: 'urun', label: 'Ürün' },
  { value: 'marka', label: 'Marka' },
  { value: 'sikayet', label: 'Şikayet' },
  { value: 'teknisyen_ismi', label: 'Teknisyen İsmi' },
  { value: 'yapilan_islem', label: 'Yapılan İşlem' },
];

const IslemFilters: React.FC<IslemFiltersProps> = ({ islemler, onFilterChange, statusFilter = 'all' }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [selectedField, setSelectedField] = useState('ad_soyad');
  const [searchValue, setSearchValue] = useState('');
  const [isDurumuFilter, setIsDurumuFilter] = useState<string>('');
  const [filteredCount, setFilteredCount] = useState(0);
  
  // Montaj ve Aksesuar filtreleri (sadece admin için)
  const [montajlar, setMontajlar] = useState<Montaj[]>([]);
  const [aksesuarlar, setAksesuarlar] = useState<Aksesuar[]>([]);
  const [selectedMontajlar, setSelectedMontajlar] = useState<string[]>([]);
  const [selectedAksesuarlar, setSelectedAksesuarlar] = useState<string[]>([]);
  const [filteredTutar, setFilteredTutar] = useState<number>(0);

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
  }, [searchValue, isDurumuFilter, selectedMontajlar, selectedAksesuarlar, islemler, statusFilter]);

  const applyFilters = () => {
    let filtered = [...islemler];

    // StatsCard'dan gelen durum filtresi
    if (statusFilter !== 'all') {
      filtered = filtered.filter((islem) => islem.is_durumu === statusFilter);
    }

    // İş durumu filtresi (dropdown'dan)
    if (isDurumuFilter) {
      filtered = filtered.filter((islem) => islem.is_durumu === isDurumuFilter);
    }

    // Metin arama filtresi
    if (searchValue && selectedField) {
      filtered = filtered.filter((islem) => {
        const value = (islem as any)[selectedField];
        if (value) {
          return value.toString().toLowerCase().includes(searchValue.toLowerCase());
        }
        return false;
      });
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

  const handleClearFilters = () => {
    setSearchValue('');
    setIsDurumuFilter('');
    setSelectedMontajlar([]);
    setSelectedAksesuarlar([]);
    onFilterChange(islemler);
  };

  return (
    <Paper elevation={2} sx={{ p: 1.5, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <FilterList sx={{ mr: 0.5, fontSize: '1.2rem' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Filtreler</Typography>
      </Box>
      
      <Grid container spacing={1}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="İş Durumu"
            value={isDurumuFilter}
            onChange={(e) => setIsDurumuFilter(e.target.value)}
          >
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="acik">Açık İşler</MenuItem>
            <MenuItem value="tamamlandi">Tamamlanan İşler</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="Arama Alanı"
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
          >
            {filterFields.map((field) => (
              <MenuItem key={field.value} value={field.value}>
                {field.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Ara..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={`${filterFields.find(f => f.value === selectedField)?.label} ara...`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Button
            fullWidth
            size="small"
            variant="outlined"
            startIcon={<Clear sx={{ fontSize: '1rem' }} />}
            onClick={handleClearFilters}
            sx={{ height: '40px' }}
          >
            Temizle
          </Button>
        </Grid>

        {/* Montaj ve Aksesuar filtreleri - Sadece admin için */}
        {isAdmin && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete
                multiple
                size="small"
                options={montajlar.map(m => m.isim)}
                value={selectedMontajlar}
                onChange={(_, newValue) => setSelectedMontajlar(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Montaj Filtresi" placeholder="Montaj seçin..." />
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
                    />
                  ))
                }
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete
                multiple
                size="small"
                options={aksesuarlar.map(a => a.isim)}
                value={selectedAksesuarlar}
                onChange={(_, newValue) => setSelectedAksesuarlar(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Aksesuar Filtresi" placeholder="Aksesuar seçin..." />
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
                    />
                  ))
                }
              />
            </Grid>
          </>
        )}
      </Grid>

      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          Toplam {islemler.length} kayıttan {filteredCount} kayıt gösteriliyor
        </Typography>
        
        {/* Filtrelenmiş toplam tutar - Sadece admin için ve filtre aktifken */}
        {isAdmin && (selectedMontajlar.length > 0 || selectedAksesuarlar.length > 0) && (
          <Chip
            label={`Filtrelenmiş Tutar: ${filteredTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`}
            color="success"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>
    </Paper>
  );
};

export default IslemFilters;
