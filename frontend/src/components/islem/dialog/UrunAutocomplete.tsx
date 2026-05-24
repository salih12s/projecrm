import React from 'react';
import { Autocomplete, Grid, TextField } from '@mui/material';

interface UrunOption {
  isim: string;
}

interface Props {
  urunler: UrunOption[];
  value: string;
  inputValue: string;
  setInputValue: (val: string) => void;
  onChange: (val: string) => void;
}

const UrunAutocomplete: React.FC<Props> = ({ urunler, value, inputValue, setInputValue, onChange }) => (
  <Grid item xs={12} sm={6}>
    <Autocomplete
      size="small"
      options={urunler.map(u => u.isim)}
      value={value || null}
      inputValue={inputValue}
      filterOptions={(options, state) => {
        if (!state.inputValue) return options;
        const filtered = options.filter(option =>
          option.toLocaleLowerCase('tr-TR').includes(state.inputValue.toLocaleLowerCase('tr-TR'))
        );
        return filtered;
      }}
      onChange={(_, newValue) => {
        onChange(newValue || '');
        setInputValue(newValue || '');
      }}
      onInputChange={(_, val, reason) => {
        if (reason === 'input') {
          const filtered = urunler.filter(urun =>
            urun.isim.toLocaleLowerCase('tr-TR').includes(val.toLocaleLowerCase('tr-TR'))
          );
          if (filtered.length === 1 && val.length > 0) {
            onChange(filtered[0].isim);
            setInputValue(filtered[0].isim);
          } else if (filtered.length > 1) {
            setInputValue(val);
          }
        } else if (reason === 'reset') {
          setInputValue(val);
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
                onChange(text);
                setInputValue(text);
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
          error={!value}
          helperText={!value ? 'Listeden bir ürün seçmelisiniz' : ''}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const popup = document.querySelector('[role="listbox"]');
              if (popup) {
                const highlighted = popup.querySelector('[data-focus="true"]') as HTMLElement;
                if (highlighted) {
                  const text = highlighted.textContent;
                  if (text && urunler.some(u => u.isim === text)) {
                    onChange(text);
                  }
                }
              }
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
);

export default UrunAutocomplete;
