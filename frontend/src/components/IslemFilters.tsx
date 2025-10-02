import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  TextField,
  MenuItem,
  Grid,
  Button,
  Typography,
} from '@mui/material';
import { FilterList, Clear } from '@mui/icons-material';
import { Islem } from '../types';

interface IslemFiltersProps {
  islemler: Islem[];
  onFilterChange: (filtered: Islem[]) => void;
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
];

const IslemFilters: React.FC<IslemFiltersProps> = ({ islemler, onFilterChange }) => {
  const [selectedField, setSelectedField] = useState('ad_soyad');
  const [searchValue, setSearchValue] = useState('');
  const [isDurumuFilter, setIsDurumuFilter] = useState<string>('');
  const [filteredCount, setFilteredCount] = useState(0);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, isDurumuFilter, islemler]);

  const applyFilters = () => {
    let filtered = [...islemler];

    // İş durumu filtresi
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

    setFilteredCount(filtered.length);
    onFilterChange(filtered);
  };

  const handleClearFilters = () => {
    setSearchValue('');
    setIsDurumuFilter('');
    onFilterChange(islemler);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterList sx={{ mr: 1 }} />
        <Typography variant="h6">Filtreler</Typography>
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
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
            label="Ara..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={`${filterFields.find(f => f.value === selectedField)?.label} ara...`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Clear />}
            onClick={handleClearFilters}
            sx={{ height: '56px' }}
          >
            Temizle
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Toplam {islemler.length} kayıttan {filteredCount} kayıt gösteriliyor
        </Typography>
      </Box>
    </Paper>
  );
};

export default IslemFilters;
