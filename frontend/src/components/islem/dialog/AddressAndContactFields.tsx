import React from 'react';
import { Grid, TextField } from '@mui/material';
import { IslemUpdateDto } from '../../../types';
import { formatPhone as formatPhoneNumber } from '../../../utils/format';

interface Props {
  formData: IslemUpdateDto;
  handleChange: (field: keyof IslemUpdateDto) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AddressAndContactFields: React.FC<Props> = ({ formData, handleChange }) => (
  <>
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
        value={formatPhoneNumber(formData.yedek_tel || '')}
        onChange={handleChange('yedek_tel')}
        placeholder="0544 448 88 88"
      />
    </Grid>
  </>
);

export default AddressAndContactFields;
