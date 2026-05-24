import React from 'react';
import { Grid, TextField, MenuItem } from '@mui/material';
import { AtolyeUpdateDto, AtolyeCreateDto } from '../../../types';

type FormState = AtolyeUpdateDto & AtolyeCreateDto;

interface StatusOption {
  value: string;
  label: string;
}

interface Props {
  formData: FormState;
  statusOptions: StatusOption[];
  handleChange: (field: string, value: any) => void;
}

const AtolyeEditOnlyFields: React.FC<Props> = ({ formData, statusOptions, handleChange }) => (
  <>
    {/* Teslim Durumu */}
    <Grid item xs={12} md={6}>
      <TextField
        select
        label="Teslim Durumu"
        fullWidth
        value={formData.teslim_durumu}
        onChange={(e) => handleChange('teslim_durumu', e.target.value)}
      >
        {statusOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </Grid>

    {/* Yapılan İşlem */}
    <Grid item xs={12} md={6}>
      <TextField
        label="Yapılan İşlem"
        fullWidth
        multiline
        rows={1}
        value={formData.yapilan_islem}
        onChange={(e) => handleChange('yapilan_islem', e.target.value)}
      />
    </Grid>

    {/* Note No */}
    <Grid item xs={12} md={6}>
      <TextField
        label="Note No"
        fullWidth
        value={formData.note_no}
        onChange={(e) => handleChange('note_no', e.target.value)}
      />
    </Grid>

    {/* Ücret */}
    <Grid item xs={12} md={6}>
      <TextField
        label="Ücret (₺)"
        fullWidth
        type="number"
        value={formData.ucret || ''}
        onChange={(e) =>
          handleChange('ucret', e.target.value ? parseFloat(e.target.value) : undefined)
        }
      />
    </Grid>

    {/* Yapılma Tarihi */}
    <Grid item xs={12} md={6}>
      <TextField
        label="Yapılma Tarihi"
        fullWidth
        type="date"
        InputLabelProps={{ shrink: true }}
        value={formData.yapilma_tarihi || ''}
        onChange={(e) => handleChange('yapilma_tarihi', e.target.value)}
      />
    </Grid>
  </>
);

export default AtolyeEditOnlyFields;
