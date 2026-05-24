import React from 'react';
import { Box, Checkbox, FormControlLabel, FormGroup, Grid, Typography } from '@mui/material';

interface Props {
  sikayet: string;
  setSikayet: (value: string) => void;
}

const SikayetQuickSelect: React.FC<Props> = ({ sikayet, setSikayet }) => (
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
              checked={sikayet.toUpperCase().startsWith('MONTAJ')}
              onChange={(e) => {
                if (e.target.checked) {
                  setSikayet('MONTAJ');
                } else {
                  setSikayet('');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === ' ') {
                  e.preventDefault();
                  setSikayet(sikayet.toUpperCase().startsWith('MONTAJ') ? '' : 'MONTAJ');
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
              checked={sikayet.toUpperCase().startsWith('ARIZA')}
              onChange={(e) => {
                if (e.target.checked) {
                  setSikayet('ARIZA');
                } else {
                  setSikayet('');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === ' ') {
                  e.preventDefault();
                  setSikayet(sikayet.toUpperCase().startsWith('ARIZA') ? '' : 'ARIZA');
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
              checked={sikayet.toUpperCase().startsWith('DİĞER')}
              onChange={(e) => {
                if (e.target.checked) {
                  setSikayet('DİĞER');
                } else {
                  setSikayet('');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === ' ') {
                  e.preventDefault();
                  setSikayet(sikayet.toUpperCase().startsWith('DİĞER') ? '' : 'DİĞER');
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
);

export default SikayetQuickSelect;
